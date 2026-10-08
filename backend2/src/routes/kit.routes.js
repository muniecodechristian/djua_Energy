// src/routes/kit.routes.js
// Routes REST pour le modèle Kit (recherche lors du scan + création onboarding).
// Mapping URL → controller uniquement. Aucune logique ici.

import { Router }      from 'express';
import * as controller from '../controllers/kit.controller.js';

const router = Router();

/**
 * GET /api/kits/:kitId
 * Vérifie si un kit existe en base de données.
 * Utilisé par l'app technicien immédiatement après le scan QR / saisie manuelle.
 *
 * 200 { exists: true,  data: Kit }   → kit déjà installé
 * 200 { exists: false }              → nouveau kit, continuer l'onboarding
 */
router.get('/kits/:kitId', controller.getKitById);

/**
 * POST /api/kits
 * Crée un nouveau Kit après que le technicien a complété l'onboarding.
 *
 * 201 { data: Kit }
 * 409                → kit déjà existant (doublon de sécurité)
 */
router.post('/kits', controller.createKit);

export default router;
