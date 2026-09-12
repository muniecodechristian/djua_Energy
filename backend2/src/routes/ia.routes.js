import { Router } from 'express';
import { postConversation, analyzeTelemetry } from '../controllers/ia.controller.js';

const router = Router();

// POST /ai/conversation
router.post('/chat', postConversation);

// POST /ai/analyze-test (Proxy for CORS)
router.post('/analyze-test', analyzeTelemetry);

export default router;
