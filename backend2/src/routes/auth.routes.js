// src/routes/auth.routes.js
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Limiteur de débit strict pour la route de connexion et d'inscription
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Limite chaque IP à 5 tentatives par fenêtre de 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

// POST /auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /auth/login
router.post('/login', authLimiter, login);

// POST /auth/logout
router.post('/logout', logout);

// GET /auth/me
router.get('/me', protect, getMe);

// GET /auth/check-auth — Alias de /me, utilisé par le frontend pour vérifier l'état de session au démarrage
router.get('/check-auth', protect, getMe);

export default router;
