// src/controllers/intervention.controller.js
// CRUD interventions/maintenances du shop_manager.
// Sécurisé par : protect → authorizeRoles → ownership → validate.
// Les notifications Socket.io sont déléguées au notification.service.

import { Intervention } from '../models/Intervention.model.js';
import User from '../models/user.model.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  notifyNewIntervention,
  notifyInterventionReassigned,
  notifyInterventionStatusUpdate,
  notifyReportSubmitted,
} from '../services/notification.service.js';
import { sendInterventionToWhatsApp } from '../services/whatsapp.service.js';

// ── POST /api/interventions ───────────────────────────────────────────────────
/**
 * Crée une intervention et l'assigne à un technicien.
 * Le middleware verifyTechnicianOwnership a déjà validé la propriété.
 */
export const createIntervention = async (req, res) => {
  let { kitId, title, description, type, priority, scheduledDate, assignedTo } = req.body;

  try {
    // ── Auto-assignation au technicien senior de la zone si non fourni ──────────
    // Permet à la page SmartKitDetails (qui ne transmet pas assignedTo) de créer
    // une intervention pointée vers le technicien senior ("senior bro") de la zone.
    if (!assignedTo) {
      const zone = req.user?.zone;
      const seniorTech = await User.findOne({
        role: 'technician',
        seniority: 'senior',
        status: 'active',
        ...(zone ? { zone } : {}),
      }).select('_id');
      if (!seniorTech) {
        return sendError(res, "Aucun technicien senior disponible pour cette zone", [], 422);
      }
      assignedTo = seniorTech._id.toString();
    }

    const intervention = await Intervention.create({
      kitId,
      title,
      description,
      type: type || 'maintenance',
      priority: priority || 'Moyenne',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      assignedTo,
      createdBy: req.user._id,
    });

    const populated = await Intervention.findById(intervention._id)
      .populate('assignedTo', 'nom prenom identifier zone whatsapp seniority')
      .populate('createdBy', 'nom prenom identifier')
      .lean();

    // ── Notification temps réel au technicien ────────────────────────────────
    notifyNewIntervention(assignedTo, populated);

    // ── Envoi WhatsApp (message + intervention) au technicien pointé ─────────
    const whatsapp = await sendInterventionToWhatsApp(populated.assignedTo, populated);

    const responseData = { ...populated, whatsappLink: whatsapp.link, whatsappSent: whatsapp.sent };

    return sendSuccess(res, 'Intervention créée et technicien notifié', responseData, 201);
  } catch (error) {
    console.error('[Intervention Controller] createIntervention error:', error.message);
    return sendError(res, `Erreur lors de la création: ${error.message}`, [], 500);
  }
};

// ── GET /api/interventions ────────────────────────────────────────────────────
/**
 * Récupère les interventions selon le rôle :
 * - shop_manager : voit toutes les interventions qu'il a créées
 * - technician : voit uniquement les interventions qui lui sont assignées
 */
export const getInterventions = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const { kitId, status } = req.query || {};

    let filter = {};

    if (role === 'shop_manager') {
      filter.createdBy = userId;
    } else if (role === 'technician') {
      // Si kitId est spécifié (scan du kit), le technicien consulte l'historique de ce kit
      // incluant les rapports précédents des autres techniciens
      if (kitId) {
        filter.kitId = kitId;
      } else {
        filter.assignedTo = userId;
      }
    }

    // Filtres optionnels
    if (kitId && role !== 'technician') filter.kitId = kitId;
    if (status) filter.status = status;

    const interventions = await Intervention.find(filter)
      .populate('assignedTo', 'nom prenom identifier seniority zone')
      .populate('createdBy', 'nom prenom identifier')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Interventions récupérées', interventions);
  } catch (error) {
    console.error('[Intervention Controller] getInterventions error:', error.message);
    return sendError(res, `Erreur lors de la récupération: ${error.message}`, [], 500);
  }
};

// ── PATCH /api/interventions/:id/status ───────────────────────────────────────
/**
 * Met à jour le statut d'une intervention.
 * - shop_manager : peut modifier le statut des interventions qu'il a créées
 * - technician : peut passer "En cours" / "Terminée" les interventions qui lui sont assignées
 */
export const updateInterventionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { role, _id: userId } = req.user;

  try {
    let filter = { _id: id };

    if (role === 'shop_manager') {
      filter.createdBy = userId;
    } else if (role === 'technician') {
      filter.assignedTo = userId;
      // Technicien ne peut qu'avancer le statut : "En cours" ou "Terminée"
      if (!['En cours', 'Terminée'].includes(status)) {
        return sendError(res, 'Un technicien ne peut que passer en "En cours" ou "Terminée"', [], 403);
      }
    }

    const intervention = await Intervention.findOne(filter);

    if (!intervention) {
      return sendError(res, 'Intervention introuvable ou accès non autorisé', [], 404);
    }

    intervention.status = status;
    if (status === 'Terminée') {
      intervention.completedAt = new Date();
    }
    await intervention.save();

    const populated = await Intervention.findById(intervention._id)
      .populate('assignedTo', 'nom prenom identifier zone')
      .populate('createdBy', 'nom prenom identifier')
      .lean();

    // Notifier le shop_manager quand un technicien met à jour le statut
    if (role === 'technician' && populated.createdBy?._id) {
      notifyInterventionStatusUpdate(populated.createdBy._id.toString(), populated);
    }

    return sendSuccess(res, `Statut mis à jour: ${status}`, populated);
  } catch (error) {
    console.error('[Intervention Controller] updateInterventionStatus error:', error.message);
    return sendError(res, `Erreur lors de la mise à jour: ${error.message}`, [], 500);
  }
};

// ── PATCH /api/interventions/:id/report ───────────────────────────────────────
/**
 * Le technicien ajoute un rapport après avoir terminé l'intervention.
 * Seul le technicien assigné peut ajouter un rapport.
 */
export const addReport = async (req, res) => {
  const { id } = req.params;
  const { report } = req.body;

  try {
    const intervention = await Intervention.findOne({
      _id: id,
      assignedTo: req.user._id, // Seul le technicien assigné
    });

    if (!intervention) {
      return sendError(res, 'Intervention introuvable ou vous n\'êtes pas le technicien assigné', [], 404);
    }

    intervention.report = report;
    await intervention.save();

    const populated = await Intervention.findById(intervention._id)
      .populate('assignedTo', 'nom prenom identifier zone')
      .populate('createdBy', 'nom prenom identifier')
      .lean();

    // Notifier le shop_manager du rapport soumis
    if (populated.createdBy?._id) {
      notifyReportSubmitted(populated.createdBy._id.toString(), populated);
    }

    return sendSuccess(res, 'Rapport soumis avec succès', populated);
  } catch (error) {
    console.error('[Intervention Controller] addReport error:', error.message);
    return sendError(res, `Erreur lors de la soumission du rapport: ${error.message}`, [], 500);
  }
};

// ── PATCH /api/interventions/:id/assign ───────────────────────────────────────
/**
 * Réassigne une intervention à un autre technicien.
 * Seul le shop_manager créateur peut réassigner.
 */
export const reassignIntervention = async (req, res) => {
  const { id } = req.params;
  const { assignedTo: newTechnicianId } = req.body;

  try {
    const intervention = await Intervention.findOne({
      _id: id,
      createdBy: req.user._id, // Seul le créateur peut réassigner
    });

    if (!intervention) {
      return sendError(res, 'Intervention introuvable ou vous n\'êtes pas le créateur', [], 404);
    }

    intervention.assignedTo = newTechnicianId;
    await intervention.save();

    const populated = await Intervention.findById(intervention._id)
      .populate('assignedTo', 'nom prenom identifier zone')
      .populate('createdBy', 'nom prenom identifier')
      .lean();

    // Notification au nouveau technicien
    notifyInterventionReassigned(newTechnicianId, populated);

    // Envoi WhatsApp au nouveau technicien assigné
    await sendInterventionToWhatsApp(populated.assignedTo, populated);

    return sendSuccess(res, 'Intervention réassignée avec succès', populated);
  } catch (error) {
    console.error('[Intervention Controller] reassignIntervention error:', error.message);
    return sendError(res, `Erreur lors de la réassignation: ${error.message}`, [], 500);
  }
};
