// src/middlewares/ownership.middleware.js
// Vérifie la chaîne de propriété hiérarchique :
//   - Un shop_manager ne peut assigner que les techniciens qu'il a créés.
//   - Un technicien ne peut accéder qu'aux ressources qui lui sont assignées.
//
// Ce middleware prévient les attaques IDOR (Insecure Direct Object Reference)
// où un utilisateur pourrait manipuler un ID pour accéder à des ressources
// d'un autre shop ou d'un autre technicien.

import User from '../models/user.model.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Vérifie qu'un technicien (req.body.assignedTo) appartient bien
 * au shop_manager connecté (req.user._id).
 *
 * Doit être placé APRÈS protect + authorizeRoles('shop_manager').
 */
export const verifyTechnicianOwnership = async (req, res, next) => {
  // L'administrateur bypass les vérifications de propriété.
  const role = req.user?.role === 'administration' ? 'admin' : req.user?.role;
  if (role === 'admin') return next();

  const technicianId = req.body.assignedTo;

  // Auto-assignation (pas de technicien fourni) : le controller choisit le technicien senior de la zone.
  if (!technicianId) return next();

  try {
    // Conditions de propriété selon le rôle créateur.
    const conditions = [];
    if (role === 'shop_manager') {
      conditions.push({ createdBy: req.user._id });
      if (req.user.zone) conditions.push({ zone: req.user.zone });
    } else if (role === 'commercial') {
      // Un commercial peut assigner les techniciens de sa zone (senior bro).
      if (req.user.zone) conditions.push({ zone: req.user.zone });
      else conditions.push({ createdBy: req.user._id });
    } else {
      conditions.push({ createdBy: req.user._id });
      if (req.user.zone) conditions.push({ zone: req.user.zone });
    }

    const technician = await User.findOne({
      _id: technicianId,
      role: 'technician',
      $or: conditions,
    }).lean();

    if (!technician) {
      return sendError(
        res,
        'Ce technicien n\'existe pas, n\'appartient pas à votre équipe ou n\'est pas assigné à votre zone',
        [],
        403,
      );
    }

    if (technician.status === 'suspended') {
      return sendError(
        res,
        'Ce technicien est actuellement suspendu. Réactivez-le avant de l\'assigner.',
        [],
        403,
      );
    }

    // Attache le technicien validé au request pour usage dans le controller
    req.assignedTechnician = technician;
    next();
  } catch (error) {
    console.error('[Ownership] Erreur vérification technicien:', error.message);
    return sendError(res, 'Erreur de vérification de propriété', [], 500);
  }
};

/**
 * Vérifie qu'un kit appartient à la zone ou à la charge du shop_manager connecté.
 * Le kitId peut venir de req.body.kitId ou req.params.kitId.
 *
 * Doit être placé APRÈS protect + authorizeRoles('shop_manager').
 */
export const verifyKitZoneOwnership = async (req, res, next) => {
  // L'administrateur bypass les vérifications de propriété.
  const role = req.user?.role === 'administration' ? 'admin' : req.user?.role;
  if (role === 'admin') return next();

  const kitId = req.body.kitId || req.params.kitId;
  const userZone = req.user.zone;

  if (!kitId) {
    return sendError(res, 'Le champ kitId est requis', [], 400);
  }

  try {
    const Kit = (await import('../models/kit.model.js')).default;
    const kit = await Kit.findOne({ kitId }).lean();

    if (kit) {
      // Si le kit est directement rattaché à un shop manager particulier
      if (kit.shopManager && kit.shopManager.toString() !== req.user._id.toString()) {
        return sendError(res, 'Ce kit n\'est pas sous votre charge', [], 403);
      }

      // Si le kit a une zone et le manager a une zone, vérifier la correspondance
      if (kit.zone && userZone && kit.zone.toLowerCase() !== userZone.toLowerCase()) {
        return sendError(
          res,
          `Ce kit est assigné à la zone (${kit.zone}), en dehors de votre zone de supervision (${userZone})`,
          [],
          403,
        );
      }
      req.kit = kit;
    }

    next();
  } catch (error) {
    console.error('[Ownership] Erreur vérification kit:', error.message);
    return sendError(res, 'Erreur lors de la vérification de propriété du kit', [], 500);
  }
};
