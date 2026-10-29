import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import config from '../config/env.config.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours (2 semaines)

/**
 * Generates JWT and sets it as an HttpOnly secure cookie.
 * @param {import('express').Response} res - Express response object.
 * @param {string} userId - ID of the authenticated user.
 */
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '14d', // 14 jours (2 semaines) au lieu de 2h
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Obligatoire HTTPS en production
    sameSite: isProduction ? 'none' : 'lax', // 'none' en prod pour autoriser les cookies cross-site (Vercel -> Render)
    maxAge: FOURTEEN_DAYS_MS, // 14 jours (2 semaines)
  };

  res.cookie('token', token, cookieOptions);
};

/**
 * Register a new User.
 */
export const register = async (req, res) => {
  const { nom, prenom, postNom, identifier, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ identifier: identifier.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'User with this email or phone number already exists', [], 400);
    }

    // Create user
    const user = await User.create({
      nom,
      prenom,
      postNom,
      identifier: identifier.toLowerCase(),
      password,
    });

    // Exclude password from the returned user object
    const userWithoutPassword = {
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      postNom: user.postNom,
      identifier: user.identifier,
      role: user.role,
      createdAt: user.createdAt,
    };

    return sendSuccess(res, 'User registered successfully', userWithoutPassword, 201);
  } catch (error) {
    return sendError(res, `Registration failed: ${error.message}`, [], 500);
  }
};

export const createTeamUser = async (req, res) => {
  const { nom, prenom, postNom = '', identifier, whatsapp, password, role, zone } = req.body;
  const actorRole = req.user.role === 'administration' ? 'admin' : req.user.role;

  if (actorRole === 'admin' && !['admin', 'shop_manager', 'technician', 'commercial'].includes(role)) {
    return sendError(res, 'Rôle de compte non autorisé', [], 403);
  }
  if (actorRole === 'shop_manager' && !['technician', 'commercial'].includes(role)) {
    return sendError(res, 'A shop manager can create only technicians or commercial users', [], 403);
  }

  if (['technician', 'commercial'].includes(role) && (!whatsapp || String(whatsapp).trim().length < 6)) {
    return sendError(res, 'Le numéro WhatsApp est obligatoire pour créer un technicien ou un commercial', [], 400);
  }

  const assignedZone = actorRole === 'admin' ? zone?.trim() : req.user.zone?.trim();
  if (!assignedZone && role !== 'admin') {
    return sendError(res, 'A zone is required for this account', [], 400);
  }

  try {
    const normalizedIdentifier = identifier.toLowerCase();
    const existingUser = await User.findOne({ identifier: normalizedIdentifier });
    if (existingUser) {
      return sendError(res, 'User with this email or phone number already exists', [], 400);
    }

    const user = await User.create({
      nom,
      prenom,
      postNom,
      identifier: normalizedIdentifier,
      whatsapp: whatsapp ? String(whatsapp).trim() : '',
      password,
      role,
      zone: assignedZone,
      status: 'active',
      mustChangePassword: role === 'technician',
      createdBy: req.user._id,
    });

    return sendSuccess(res, 'Team account created successfully', {
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      postNom: user.postNom,
      identifier: user.identifier,
      whatsapp: user.whatsapp,
      role: user.role,
      zone: user.zone,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdBy: user.createdBy,
      createdAt: user.createdAt,
    }, 201);
  } catch (error) {
    return sendError(res, `Team account creation failed: ${error.message}`, [], 500);
  }
};

export const getTeamUsers = async (req, res) => {
  try {
    const actorRole = req.user.role === 'administration' ? 'admin' : req.user.role;
    const filter = actorRole === 'admin'
      ? { role: { $in: ['shop_manager', 'technician', 'commercial'] } }
      : { createdBy: req.user._id, role: { $in: ['technician', 'commercial'] } };
    const users = await User.find(filter)
      .select('nom prenom postNom identifier whatsapp role zone status mustChangePassword createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Team members retrieved successfully', users.map(user => ({
      ...user,
      status: user.status || 'active',
    })));
  } catch (error) {
    return sendError(res, `Could not load team members: ${error.message}`, [], 500);
  }
};

export const updateTeamUser = async (req, res) => {
  const { userId } = req.params;
  const { nom, prenom, postNom, identifier, whatsapp, role, zone, password } = req.body;
  const actorRole = req.user.role === 'administration' ? 'admin' : req.user.role;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'Membre de l’équipe introuvable', [], 404);
    }

    // Un responsable shop ne peut modifier que les membres qu'il a créés ou de sa zone (techniciens/commerciaux)
    if (actorRole === 'shop_manager') {
      const isOwner = user.createdBy && user.createdBy.toString() === req.user._id.toString();
      const isSameZone = user.zone && user.zone === req.user.zone;
      if (!isOwner && !isSameZone) {
        return sendError(res, 'Vous n’êtes pas autorisé à modifier ce compte', [], 403);
      }
      if (!['technician', 'commercial'].includes(user.role)) {
        return sendError(res, 'Un responsable shop ne peut modifier que des techniciens ou des commerciaux', [], 403);
      }
    }

    if (nom) user.nom = nom.trim();
    if (prenom) user.prenom = prenom.trim();
    if (postNom !== undefined) user.postNom = postNom.trim();
    if (whatsapp !== undefined) {
      if (['technician', 'commercial'].includes(user.role) && String(whatsapp).trim().length < 6) {
        return sendError(res, 'Le numéro WhatsApp est obligatoire', [], 400);
      }
      user.whatsapp = String(whatsapp).trim();
    }
    if (role && (actorRole === 'admin'
      ? ['shop_manager', 'technician', 'commercial'].includes(role)
      : ['technician', 'commercial'].includes(role))) {
      user.role = role;
    }
    if (zone && actorRole === 'admin') {
      user.zone = zone.trim();
    }

    if (identifier) {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      if (normalizedIdentifier !== user.identifier) {
        const existing = await User.findOne({ identifier: normalizedIdentifier, _id: { $ne: user._id } });
        if (existing) {
          return sendError(res, 'Un utilisateur avec cet identifiant existe déjà', [], 400);
        }
        user.identifier = normalizedIdentifier;
      }
    }

    if (password && password.trim().length >= 8) {
      user.password = password; // pre-save hook will hash it
    }

    await user.save();

    return sendSuccess(res, 'Informations du membre mises à jour avec succès', {
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      postNom: user.postNom,
      identifier: user.identifier,
      whatsapp: user.whatsapp,
      role: user.role,
      zone: user.zone,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return sendError(res, `Échec de mise à jour du membre: ${error.message}`, [], 500);
  }
};

export const updateTeamUserStatus = async (req, res) => {
  try {
    const actorRole = req.user.role === 'administration' ? 'admin' : req.user.role;
    const filter = actorRole === 'admin'
      ? { _id: req.params.userId, role: { $in: ['shop_manager', 'technician', 'commercial'] } }
      : { _id: req.params.userId, createdBy: req.user._id, role: { $in: ['technician', 'commercial'] } };
    const user = await User.findOne(filter);
    if (!user) return sendError(res, 'Team member not found', [], 404);

    user.status = req.body.status;
    await user.save();
    return sendSuccess(res, 'Team member status updated', {
      _id: user._id,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return sendError(res, `Could not update team member: ${error.message}`, [], 500);
  }
};

export const deleteTeamUser = async (req, res) => {
  try {
    const actorRole = req.user.role === 'administration' ? 'admin' : req.user.role;
    const filter = actorRole === 'admin'
      ? { _id: req.params.userId, role: { $in: ['shop_manager', 'technician', 'commercial'] } }
      : { _id: req.params.userId, createdBy: req.user._id, role: { $in: ['technician', 'commercial'] } };
    const user = await User.findOneAndDelete(filter);
    if (!user) return sendError(res, 'Team member not found', [], 404);
    return sendSuccess(res, 'Team member deleted successfully', { _id: user._id });
  } catch (error) {
    return sendError(res, `Could not delete team member: ${error.message}`, [], 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return sendError(res, 'User no longer exists', [], 401);

    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return sendError(res, 'Current password is incorrect', [], 400);

    user.password = req.body.newPassword;
    user.mustChangePassword = false;
    await user.save();
    return sendSuccess(res, 'Password updated successfully', { mustChangePassword: false });
  } catch (error) {
    return sendError(res, `Could not update password: ${error.message}`, [], 500);
  }
};

/**
 * Authenticate User & get token.
 */
export const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Find user and explicitly select password field
    const user = await User.findOne({ identifier: identifier.toLowerCase() }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid credentials', [], 401);
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', [], 401);
    }
    if (user.status === 'suspended') {
      return sendError(res, 'This account is suspended. Contact your shop manager.', [], 403);
    }

    // Generate JWT & set HttpOnly cookie
    generateTokenAndSetCookie(res, user._id);

    const userProfile = {
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      postNom: user.postNom,
      identifier: user.identifier,
      role: user.role,
      zone: user.zone,
      mustChangePassword: user.mustChangePassword,
    };

    return sendSuccess(res, 'Login successful', userProfile);
  } catch (error) {
    return sendError(res, `Login failed: ${error.message}`, [], 500);
  }
};

/**
 * Log out user & clear cookie.
 */
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      expires: new Date(0), // Instantly expire the cookie
    });

    return sendSuccess(res, 'Logged out successfully');
  } catch (error) {
    return sendError(res, 'Logout failed', [], 500);
  }
};

/**
 * Get current user profile.
 */
export const getMe = async (req, res) => {
  try {
    const userProfile = {
      _id: req.user._id,
      nom: req.user.nom,
      prenom: req.user.prenom,
      postNom: req.user.postNom,
      identifier: req.user.identifier,
      role: req.user.role,
      zone: req.user.zone,
      mustChangePassword: req.user.mustChangePassword,
      createdAt: req.user.createdAt,
    };

    return sendSuccess(res, 'User profile retrieved successfully', userProfile);
  } catch (error) {
    return sendError(res, 'Failed to retrieve profile', [], 500);
  }
};
