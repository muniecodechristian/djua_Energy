// src/routes/auth.routes.js
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, teamUserSchema, updateTeamUserSchema, teamMemberStatusSchema, teamMemberParamsSchema, changePasswordSchema } from '../schemas/auth.schema.js';
import { register, createTeamUser, getTeamUsers, getTechnicians, updateTeamUser, updateTeamUserStatus, deleteTeamUser, changePassword, login, logout, getMe } from '../controllers/auth.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Limiteur de débit strict pour la route d'inscription
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

// POST /auth/team-users — hiérarchie admin -> responsable -> commercial -> techniciens
router.post('/team-users', protect, authorizeRoles('admin', 'shop_manager', 'commercial'), validate(teamUserSchema), createTeamUser);
router.get('/team-users', protect, authorizeRoles('shop_manager', 'admin', 'commercial'), getTeamUsers);
router.get('/technicians', protect, authorizeRoles('admin', 'administration', 'shop_manager', 'commercial'), getTechnicians);
router.get('/all-users', protect, authorizeRoles('admin', 'administration', 'shop_manager', 'commercial'), getTechnicians);
router.patch('/team-users/:userId', protect, authorizeRoles('shop_manager', 'admin'), validate(updateTeamUserSchema), updateTeamUser);
router.patch('/team-users/:userId/status', protect, authorizeRoles('shop_manager'), validate(teamMemberStatusSchema), updateTeamUserStatus);
router.delete('/team-users/:userId', protect, authorizeRoles('shop_manager'), validate(teamMemberParamsSchema), deleteTeamUser);
router.patch('/password', protect, validate(changePasswordSchema), changePassword);

// POST /auth/login
router.post('/login', login);

// POST /auth/logout
router.post('/logout', logout);

// GET /auth/me
router.get('/me', protect, getMe);

// GET /auth/check-auth — Alias de /me, utilisé par le frontend pour vérifier l'état de session au démarrage
router.get('/check-auth', protect, getMe);

export default router;
