import { Router } from 'express';
import { getEnrichedTelemetry } from '../controllers/ml.controller.js';

const router = Router();

/**
 * @swagger
 * /api/ml/telemetry:
 *   get:
 *     summary: Retrieve enriched telemetry records (63 fields) for machine learning
 *     description: >
 *       Returns the list of enriched telemetry payloads stored in MongoDB.
 *       These payloads are generated dynamically when raw ESP32 data is received
 *       via MQTT and enriched with local database context (Kit/Client properties).
 *     tags:
 *       - Machine Learning
 *     parameters:
 *       - in: query
 *         name: kitId
 *         schema:
 *           type: string
 *         description: Filter records by kit ID.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of records to return.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order by creation timestamp.
 *     responses:
 *       '200':
 *         description: Enriched telemetry list retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Flat 63-field enriched telemetry object.
 *       '500':
 *         description: Internal server error.
 */
router.get('/telemetry', getEnrichedTelemetry);

export default router;
