/**
 * @file apiResponse.js
 * @description Standardized API response handlers for Express.
 */

/**
 * Sends a structured success response.
 * @param {import('express').Response} res - Express response object.
 * @param {string} message - User-friendly message.
 * @param {any} [data=null] - Payload data.
 * @param {number} [statusCode=200] - HTTP status code.
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const responsePayload = {
    success: true,
    message,
  };
  if (data !== null) {
    responsePayload.data = data;
  }
  return res.status(statusCode).json(responsePayload);
};

/**
 * Sends a structured error response.
 * @param {import('express').Response} res - Express response object.
 * @param {string} message - Main error message.
 * @param {any[]} [errors=[]] - Array of detailed errors.
 * @param {number} [statusCode=400] - HTTP status code.
 */
export const sendError = (res, message, errors = [], statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
