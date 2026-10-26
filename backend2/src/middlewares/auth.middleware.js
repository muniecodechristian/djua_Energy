import jwt from 'jsonwebtoken';
import config from '../config/env.config.js';
import User from '../models/user.model.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware to protect routes and verify JWT from HttpOnly cookie.
 */
export const protect = async (req, res, next) => {
  let token;

  // Retrieve token from cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendError(res, 'Not authorized to access this route', [], 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from database, excluding password
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User no longer exists', [], 401);
    }
    if (user.status === 'suspended') {
      return sendError(res, 'This account is suspended. Contact your shop manager.', [], 403);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Not authorized, token validation failed', [], 401);
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role === 'administration' ? 'admin' : req.user?.role;
  // L'administrateur a accès à tout, quel que soit le rôle requis.
  if (role === 'admin') return next();
  if (!allowedRoles.includes(role)) {
    return sendError(res, 'You do not have permission to perform this action', [], 403);
  }
  next();
};

/**
 * Optional protection middleware:
 * Populates req.user if a valid token is present in cookies,
 * but allows unauthenticated requests to proceed with req.user = null.
 */
export const optionalProtect = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (user && user.status !== 'suspended') {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  next();
};

