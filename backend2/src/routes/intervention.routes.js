import express from 'express';
import { createIntervention, getInterventions, updateInterventionStatus } from '../controllers/intervention.controller.js';

const router = express.Router();

router.post('/', createIntervention);
router.get('/', getInterventions);
router.patch('/:id/status', updateInterventionStatus);

export default router;
