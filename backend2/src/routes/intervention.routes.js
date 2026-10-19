// src/routes/intervention.routes.js
// Routes REST pour les interventions/maintenances.
// Pipeline de sécurité : protect → authorizeRoles → validate → ownership → controller
// Mapping URL → controller uniquement. Aucune logique ici.

import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  verifyTechnicianOwnership,
  verifyKitZoneOwnership,
} from '../middlewares/ownership.middleware.js';
import {
  createInterventionSchema,
  updateInterventionStatusSchema,
  addReportSchema,
  reassignInterventionSchema,
} from '../schemas/intervention.schema.js';
import {
  createIntervention,
  getInterventions,
  updateInterventionStatus,
  addReport,
  reassignIntervention,
} from '../controllers/intervention.controller.js';

const router = Router();

// ── POST /api/interventions ───────────────────────────────────────────────────
// Crée une intervention et l'assigne à un technicien.
// Seul un shop_manager peut créer une intervention.
router.post(
  '/',
  protect,
  authorizeRoles('shop_manager'),
  validate(createInterventionSchema),
  verifyKitZoneOwnership,
  verifyTechnicianOwnership,
  createIntervention,
);

// ── GET /api/interventions ────────────────────────────────────────────────────
// Récupère les interventions selon le rôle (shop_manager, technician, admin).
router.get(
  '/',
  protect,
  authorizeRoles('shop_manager', 'technician', 'admin'),
  getInterventions,
);

// ── PATCH /api/interventions/:id/status ───────────────────────────────────────
// Met à jour le statut. Le technicien ne peut que "En cours" / "Terminée".
router.patch(
  '/:id/status',
  protect,
  authorizeRoles('shop_manager', 'technician'),
  validate(updateInterventionStatusSchema),
  updateInterventionStatus,
);

// ── PATCH /api/interventions/:id/report ───────────────────────────────────────
// Le technicien soumet un rapport. Seul le technicien assigné peut soumettre.
router.patch(
  '/:id/report',
  protect,
  authorizeRoles('technician'),
  validate(addReportSchema),
  addReport,
);

// ── PATCH /api/interventions/:id/assign ───────────────────────────────────────
// Réassigne à un autre technicien. Seul le shop_manager créateur.
router.patch(
  '/:id/assign',
  protect,
  authorizeRoles('shop_manager'),
  validate(reassignInterventionSchema),
  verifyTechnicianOwnership,
  reassignIntervention,
);

export default router;
