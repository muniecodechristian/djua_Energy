// src/routes/alert.routes.js
// Routes REST pour les alertes manuelles du shop_manager.
// Pipeline de sécurité : protect → authorizeRoles → validate → ownership → controller
// Mapping URL → controller uniquement. Aucune logique ici.

import { Router } from 'express';
import { protect, authorizeRoles, optionalProtect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  verifyTechnicianOwnership,
  verifyKitZoneOwnership,
} from '../middlewares/ownership.middleware.js';
import {
  createAlertSchema,
  assignAlertSchema,
  updateAlertStatusSchema,
} from '../schemas/alert.schema.js';
import {
  createAlert,
  getAlerts,
  reassignAlert,
  updateAlertStatus,
} from '../controllers/alert.controller.js';

const router = Router();

// ── POST /api/alerts ──────────────────────────────────────────────────────────
// Crée une alerte manuelle et l'assigne à un technicien.
// Seul un shop_manager peut créer une alerte manuelle.
router.post(
  '/',
  protect,
  authorizeRoles('shop_manager'),
  validate(createAlertSchema),
  verifyKitZoneOwnership,
  verifyTechnicianOwnership,
  createAlert,
);

// ── GET /api/alerts ───────────────────────────────────────────────────────────
// Récupère les alertes selon le rôle :
// - shop_manager : ses alertes créées + IoT de sa zone
// - technician : ses alertes assignées
// - admin : toutes les alertes
// - commercial : 403 interdit
// - public / non connecté : signaux & alertes IoT du parc solaire
router.get(
  '/',
  optionalProtect,
  getAlerts,
);

// ── PATCH /api/alerts/:alertId/assign ─────────────────────────────────────────
// Réassigne une alerte à un autre technicien. Seul le shop_manager créateur.
router.patch(
  '/:alertId/assign',
  protect,
  authorizeRoles('shop_manager'),
  validate(assignAlertSchema),
  verifyTechnicianOwnership,
  reassignAlert,
);

// ── PATCH /api/alerts/:alertId/status ─────────────────────────────────────────
// Met à jour le statut d'une alerte (shop_manager ou technician assigné).
router.patch(
  '/:alertId/status',
  protect,
  authorizeRoles('shop_manager', 'technician'),
  validate(updateAlertStatusSchema),
  updateAlertStatus,
);

export default router;
