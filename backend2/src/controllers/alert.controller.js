// src/controllers/alert.controller.js
// CRUD alertes manuelles du shop_manager.
// Chaque action est sécurisée par la chaîne : protect → authorizeRoles → ownership → validate.
// Les notifications Socket.io sont déléguées au notification.service.

import Alert from '../models/Alert.model.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { notifyNewAlert, notifyAlertReassigned } from '../services/notification.service.js';

// ── POST /api/alerts ──────────────────────────────────────────────────────────
/**
 * Crée une alerte manuelle et l'assigne à un technicien.
 * Le middleware verifyTechnicianOwnership a déjà validé que le technicien
 * appartient bien au shop_manager connecté.
 */
export const createAlert = async (req, res) => {
  const { kitId, type, severity, label, description, notes, assignedTo } = req.body;

  try {
    const alert = await Alert.create({
      kitId,
      source: 'manual',
      type,
      severity,
      label,
      description,
      notes: notes || '',
      assignedTo,
      createdBy: req.user._id,
      status: 'active',
    });

    // Populate pour la réponse complète
    const populated = await Alert.findById(alert._id)
      .populate('assignedTo', 'nom prenom identifier zone')
      .populate('createdBy', 'nom prenom identifier')
      .lean();

    // ── Notification temps réel au technicien ────────────────────────────────
    notifyNewAlert(assignedTo, populated);

    return sendSuccess(res, 'Alerte créée et technicien notifié', populated, 201);
  } catch (error) {
    console.error('[Alert Controller] createAlert error:', error.message);
    return sendError(res, `Erreur lors de la création de l'alerte: ${error.message}`, [], 500);
  }
};

// ── GET /api/alerts ───────────────────────────────────────────────────────────
/**
 * Récupère les alertes selon le rôle de l'utilisateur :
 * - shop_manager : voit toutes les alertes qu'il a créées + les alertes IoT de sa zone
 * - technician : voit uniquement les alertes qui lui sont assignées
 */
export const getAlerts = async (req, res) => {
  try {
    const user = req.user;
    const role = user?.role === 'administration' ? 'admin' : user?.role;
    const { kitId, status, severity } = req.query || {};

    // Le commercial est strictement restreint aux devis (interdiction d'accès aux alertes)
    if (role === 'commercial') {
      return sendError(res, 'You do not have permission to perform this action', [], 403);
    }

    let filter = {};

    if (role === 'shop_manager') {
      // Alertes créées par ce shop_manager OU alertes IoT globales
      filter.$or = [
        { createdBy: user._id },
        { source: { $in: ['iot_esp32', 'geofencing', 'system'] } },
      ];
    } else if (role === 'technician') {
      // Technicien : uniquement ses alertes assignées
      filter.assignedTo = user._id;
    } else if (role === 'admin') {
      // Admin Orange : visibilité sur toutes les alertes
    } else {
      // Visiteur / Dashboard public sans session connectée :
      // Voit uniquement les signaux et alertes télémétriques automatiques du parc IoT
      filter.source = { $in: ['iot_esp32', 'geofencing', 'system'] };
    }

    // Filtres optionnels
    if (kitId) filter.kitId = kitId;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const alerts = await Alert.find(filter)
      .populate('assignedTo', 'nom prenom identifier zone')
      .populate('createdBy', 'nom prenom identifier')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Alertes récupérées', alerts);
  } catch (error) {
    console.error('[Alert Controller] getAlerts error:', error.message);
    return sendError(res, `Erreur lors de la récupération des alertes: ${error.message}`, [], 500);
  }
};

// ── PATCH /api/alerts/:alertId/assign ─────────────────────────────────────────
/**
 * Réassigne une alerte à un autre technicien.
 * Seul le shop_manager créateur peut réassigner.
 */
export const reassignAlert = async (req, res) => {
  const { alertId } = req.params;
  const { assignedTo: newTechnicianId } = req.body;

  try {
    const alert = await Alert.findOne({
      _id: alertId,
      createdBy: req.user._id, // Seul le créateur peut réassigner
    });

    if (!alert) {
      return sendError(res, 'Alerte introuvable ou vous n\'êtes pas le créateur', [], 404);
    }

    const previousTechnicianId = alert.assignedTo?.toString();
    alert.assignedTo = newTechnicianId;
    await alert.save();

    const populated = await Alert.findById(alert._id)
      .populate('assignedTo', 'nom prenom identifier zone')
      .populate('createdBy', 'nom prenom identifier')
      .lean();

    // Notification au nouveau technicien
    notifyAlertReassigned(newTechnicianId, populated);

    return sendSuccess(res, 'Alerte réassignée avec succès', populated);
  } catch (error) {
    console.error('[Alert Controller] reassignAlert error:', error.message);
    return sendError(res, `Erreur lors de la réassignation: ${error.message}`, [], 500);
  }
};

// ── PATCH /api/alerts/:alertId/status ─────────────────────────────────────────
/**
 * Met à jour le statut d'une alerte.
 * - shop_manager : peut mettre à jour les alertes qu'il a créées
 * - technician : peut acknowledge/resolve les alertes qui lui sont assignées
 */
export const updateAlertStatus = async (req, res) => {
  const { alertId } = req.params;
  const { status } = req.body;
  const { role, _id: userId } = req.user;

  try {
    let filter = { _id: alertId };

    if (role === 'shop_manager') {
      filter.createdBy = userId;
    } else if (role === 'technician') {
      filter.assignedTo = userId;
    }

    const alert = await Alert.findOne(filter);

    if (!alert) {
      return sendError(res, 'Alerte introuvable ou accès non autorisé', [], 404);
    }

    alert.status = status;
    if (status === 'resolved') {
      alert.resolvedAt = new Date();
    }
    await alert.save();

    const populated = await Alert.findById(alert._id)
      .populate('assignedTo', 'nom prenom identifier zone')
      .populate('createdBy', 'nom prenom identifier')
      .lean();

    return sendSuccess(res, `Statut de l'alerte mis à jour: ${status}`, populated);
  } catch (error) {
    console.error('[Alert Controller] updateAlertStatus error:', error.message);
    return sendError(res, `Erreur lors de la mise à jour du statut: ${error.message}`, [], 500);
  }
};
