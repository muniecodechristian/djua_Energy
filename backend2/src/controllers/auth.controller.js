import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import config from '../config/env.config.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Generates JWT and sets it as an HttpOnly secure cookie.
 * @param {import('express').Response} res - Express response object.
 * @param {string} userId - ID of the authenticated user.
 */
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '2h',
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict', // Protect against CSRF
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
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
      createdAt: user.createdAt,
    };

    return sendSuccess(res, 'User registered successfully', userWithoutPassword, 201);
  } catch (error) {
    return sendError(res, `Registration failed: ${error.message}`, [], 500);
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

    // Generate JWT & set HttpOnly cookie
    generateTokenAndSetCookie(res, user._id);

    const userProfile = {
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      postNom: user.postNom,
      identifier: user.identifier,
      role: user.role,
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
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
      createdAt: req.user.createdAt,
    };

    return sendSuccess(res, 'User profile retrieved successfully', userProfile);
  } catch (error) {
    return sendError(res, 'Failed to retrieve profile', [], 500);
  }
};
