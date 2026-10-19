// src/schemas/alert.schema.js
// Validation Zod stricte pour les alertes manuelles du shop_manager.
// Seuls les champs whitelistés passent — protection contre le mass assignment.

import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

/**
 * POST /api/alerts — Création d'une alerte manuelle par un shop_manager.
 */
export const createAlertSchema = z.object({
  body: z.object({
    kitId: z.string().trim().min(1, 'kitId est requis'),
    type: z.string().trim().min(1, 'Le type d\'alerte est requis'),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info'], {
      errorMap: () => ({ message: 'Sévérité invalide (critical, high, medium, low, info)' }),
    }),
    label: z.string().trim().min(1, 'Le label est requis').max(200),
    description: z.string().trim().min(1, 'La description est requise').max(2000),
    notes: z.string().trim().max(2000).optional(),
    assignedTo: z.string().regex(objectIdRegex, 'ID technicien invalide'),
  }),
});

/**
 * PATCH /api/alerts/:alertId/assign — Réassignation d'une alerte.
 */
export const assignAlertSchema = z.object({
  params: z.object({
    alertId: z.string().regex(objectIdRegex, 'ID alerte invalide'),
  }),
  body: z.object({
    assignedTo: z.string().regex(objectIdRegex, 'ID technicien invalide'),
  }),
});

/**
 * PATCH /api/alerts/:alertId/status — Mise à jour du statut d'une alerte.
 */
export const updateAlertStatusSchema = z.object({
  params: z.object({
    alertId: z.string().regex(objectIdRegex, 'ID alerte invalide'),
  }),
  body: z.object({
    status: z.enum(['active', 'acknowledged', 'resolved'], {
      errorMap: () => ({ message: 'Statut invalide (active, acknowledged, resolved)' }),
    }),
  }),
});

/**
 * GET /api/alerts — Query params de filtrage.
 */
export const getAlertsQuerySchema = z.object({
  query: z.object({
    kitId: z.string().trim().optional(),
    status: z.enum(['active', 'acknowledged', 'resolved']).optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  }).optional(),
});
