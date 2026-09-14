import { Router } from 'express';
import {
  recommend,
  conversation,
  listRecommendations,
  getRecommendation,
  askRecommendation,
  explainRecommendation,
} from '../controllers/solar.controller.js';

const router = Router();

// POST /solar/recommend — dimensionner un kit solaire depuis les appareils
router.post('/recommend', recommend);

// POST /solar/conversation — chat guidé vers une recommandation
router.post('/conversation', conversation);

// GET  /solar/recommendations — lister les recommandations sauvegardées
router.get('/recommendations', listRecommendations);

// GET  /solar/recommendations/:id — détail d'une recommandation
router.get('/recommendations/:id', getRecommendation);

// POST /solar/recommendations/:id/ask — question sur un devis
router.post('/recommendations/:id/ask', askRecommendation);

// POST /solar/recommendations/:id/explain — explication lisible
router.post('/recommendations/:id/explain', explainRecommendation);

export default router;
