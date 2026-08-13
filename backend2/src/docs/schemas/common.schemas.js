/**
 * @file common.schemas.js
 * @description Reusable OpenAPI 3.1 schemas shared across all API groups.
 *
 * These schemas are registered under `components.schemas` and can be
 * referenced via `$ref: '#/components/schemas/<Name>'` in any route annotation.
 *
 * Design principle: every API response is a typed envelope with a `success`
 * discriminator, following the Google API Design Guide convention of a
 * consistent top-level response structure.
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: >
 *         JWT Bearer token. Include the token returned by `POST /auth/login`
 *         in the `Authorization` header as `Bearer <token>`.
 *
 *   schemas:
 *     ApiSuccessResponse:
 *       type: object
 *       description: >
 *         Standard success envelope. All successful responses wrap their
 *         payload in `data` and set `success: true`.
 *       required:
 *         - success
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           description: >
 *             Number of items in `data` (present when data is an array).
 *           example: 3
 *         data:
 *           description: The response payload. Shape varies per endpoint.
 *
 *     ApiErrorResponse:
 *       type: object
 *       description: >
 *         Standard error envelope. All error responses set `success: false`
 *         and include a human-readable `message`.
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Human-readable error description.
 *           example: 'Équipement non trouvé'
 */

// This file is intentionally empty at runtime — it exists solely to declare
// OpenAPI component definitions that swagger-jsdoc picks up via JSDoc parsing.
