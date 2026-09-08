import { Router } from 'express';
import { postConversation } from '../controllers/ia.controller.js';

const router = Router();

// POST /ai/conversation
router.post('/chat', postConversation);

export default router;
