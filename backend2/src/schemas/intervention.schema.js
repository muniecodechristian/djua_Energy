// src/schemas/intervention.schema.js
// Validation Zod stricte pour les interventions/maintenances.
// Seuls les champs whitelistés passent — protection contre le mass assignment.

import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

/**
 * POST /api/interventions — Création d'une intervention par un shop_manager.
 */
export const createInterventionSchema = z.object({
  body: z.object({
    kitId: z.string().trim().min(1, 'kitId est requis'),
    title: z.string().trim().min(1, 'Le titre est requis').max(300),
    description: z.string().trim().min(1, 'La description est requise').max(3000),
    type: z.enum(['maintenance', 'repair', 'inspection', 'installation'], {
      errorMap: () => ({ message: 'Type invalide (maintenance, repair, inspection, installation)' }),
    }).optional(),
    priority: z.enum(['Basse', 'Moyenne', 'Haute', 'Critique'], {
      errorMap: () => ({ message: 'Priorité invalide (Basse, Moyenne, Haute, Critique)' }),
    }).optional(),
    scheduledDate: z.string().datetime({ offset: true }).optional(),
    assignedTo: z.string().regex(objectIdRegex, 'ID technicien invalide'),
  }),
});

/**
 * PATCH /api/interventions/:id/status — Mise à jour du statut par shop_manager ou technicien.
 */
export const updateInterventionStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID intervention invalide'),
  }),
  body: z.object({
    status: z.enum(['Planifiée', 'En cours', 'Terminée', 'Annulée'], {
      errorMap: () => ({ message: 'Statut invalide (Planifiée, En cours, Terminée, Annulée)' }),
    }),
  }),
});

/**
 * PATCH /api/interventions/:id/report — Ajout d'un rapport par le technicien.
 */
export const addReportSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID intervention invalide'),
  }),
  body: z.object({
    report: z.string().trim().min(1, 'Le rapport ne peut pas être vide').max(5000),
  }),
});

/**
 * PATCH /api/interventions/:id/assign — Réassignation à un autre technicien.
 */
export const reassignInterventionSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID intervention invalide'),
  }),
  body: z.object({
    assignedTo: z.string().regex(objectIdRegex, 'ID technicien invalide'),
  }),
});
