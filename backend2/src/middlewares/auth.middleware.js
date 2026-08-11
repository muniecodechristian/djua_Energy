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

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Not authorized, token validation failed', [], 401);
  }
};
