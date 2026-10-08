import express from 'express';
import { createIntervention, getInterventions } from '../controllers/intervention.controller.js';

const router = express.Router();

router.post('/', createIntervention);
router.get('/', getInterventions);

export default router;
