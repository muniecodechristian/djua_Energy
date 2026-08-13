/**
 * @file validate.middleware.js
 * @description Express middleware to validate request body, query parameters, and URL parameters using Zod schemas.
 */

/**
 * Validates request data against a Zod schema.
 * @param {import('zod').AnyZodObject} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler}
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Assign parsed and cleaned values back to request
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;

    next();
  } catch (error) {
    console.error('Validation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: `Internal validation error: ${error.message}`,
      stack: error.stack,
    });
  }
};
