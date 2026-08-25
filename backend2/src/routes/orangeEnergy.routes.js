import express from 'express';
import { getClients, getKits, getScoringData, getKitById, getPayments, getPaymentsByPhone } from '../controllers/orangeEnergy.controller.js';

const router = express.Router();

/**
 * @swagger
 * /users/orange/clients:
 *   get:
 *     summary: List all Orange Energy clients
 *     description: >
 *       Triggers a sync with the Orange Energy external API and returns the
 *       full list of client profiles stored in the local MongoDB cache.
 *
 *       **Sync behavior**: On each call, fresh data is fetched from
 *       `ORANGE_ENERGY_API_URL` and upserted into MongoDB before responding.
 *       This ensures data freshness at the cost of a per-request external
 *       HTTP round-trip (~200–800ms additional latency in production).
 *
 *       **MongoDB Collection**: `clients`
 *     tags:
 *       - Orange Energy — Clients
 *     responses:
 *       '200':
 *         description: Client list retrieved and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *             example:
 *               success: true
 *               data:
 *                 - _id: '64a1b2c3d4e5f6a7b8c9d0e1'
 *                   accountNumber: 'OE-2026-00142'
 *                   firstName: 'Jean-Pierre'
 *                   lastName: 'Kabila'
 *                   phone: '+243812345678'
 *                   syncStatus: synced
 *                   socioEconomic:
 *                     profession: Teacher
 *                     estimatedIncomeUSD: 250
 *                     orangeMoneyAccountAgeMonths: 18
 *                     historicalRiskScore: 12.5
 *       '502':
 *         description: >
 *           Bad Gateway — the upstream Orange Energy API is unreachable
 *           or returned an unexpected error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: 'Unable to reach Orange Energy API: ECONNREFUSED'
 */
router.get('/orange/clients', getClients);

/**
 * @swagger
 * /users/orange/kits:
 *   get:
 *     summary: List all solar kit subscriptions
 *     description: >
 *       Triggers a sync with the Orange Energy external API and returns the
 *       full list of solar kit records stored in the local MongoDB cache.
 *
 *       Each kit record is linked to a client via `clientPhone` and tracks
 *       the subscription lifecycle: installation date, payment status,
 *       active/suspended/terminated state, and GPS installation coordinates.
 *
 *       **MongoDB Collection**: `kits`
 *     tags:
 *       - Orange Energy — Kits
 *     responses:
 *       '200':
 *         description: Kit list retrieved and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Kit'
 *             example:
 *               success: true
 *               data:
 *                 - _id: '64a1b2c3d4e5f6a7b8c9d0e2'
 *                   kitId: 'KIT-OE-00789'
 *                   clientPhone: '+243812345678'
 *                   offerName: 'Solar Home 50W'
 *                   installationDate: '2026-02-14'
 *                   subscriptionFeePaid: true
 *                   periodicAmountUSD: 15
 *                   status: active
 *                   paidMonthsCount: 6
 *                   gpsCoordinates:
 *                     latitude: -4.3217
 *                     longitude: 15.3219
 *       '502':
 *         description: >
 *           Bad Gateway — the upstream Orange Energy API is unreachable
 *           or returned an unexpected error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: 'Unable to reach Orange Energy API: timeout after 5000ms'
 */
router.get('/orange/kits', getKits);
router.get('/orange/kits/:kitId', getKitById);

/**
 * @swagger
 * /users/orange/scoring-data/{phone}:
 *   get:
 *     summary: Get credit scoring data for a client
 *     description: >
 *       Returns a composite credit-scoring view for the client identified by
 *       their Orange Money phone number.
 *
 *       The scoring record aggregates three data sources into a single document:
 *       1. **Client profile** — demographics and socio-economic indicators
 *       2. **Subscription** — active kit and payment commitment
 *       3. **Payment history** — chronological list of all payment transactions
 *
 *       This endpoint is primarily consumed by credit decisioning systems
 *       to evaluate pay-as-you-go eligibility and risk.
 *
 *       **MongoDB Collection**: `scoringdatas`
 *     tags:
 *       - Orange Energy — Scoring
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: >
 *           Orange Money phone number of the client.
 *           Must be in international format (e.g., `+243812345678`).
 *         example: '+243812345678'
 *     responses:
 *       '200':
 *         description: Scoring data found and returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScoringData'
 *             example:
 *               success: true
 *               data:
 *                 clientPhone: '+243812345678'
 *                 client:
 *                   accountNumber: 'OE-2026-00142'
 *                   firstName: 'Jean-Pierre'
 *                   lastName: 'Kabila'
 *                   orangeMoneyAccountAgeMonths: 18
 *                   estimatedIncomeUSD: 250
 *                   profession: Teacher
 *                   historicalRiskScore: 12.5
 *                 subscription:
 *                   kitId: 'KIT-OE-00789'
 *                   offerName: 'Solar Home 50W'
 *                   status: active
 *                   paidMonthsCount: 6
 *                 paymentHistory:
 *                   - paymentId: 'PAY-2026-08-001'
 *                     amountUSD: 15
 *                     date: '2026-08-01T10:30:00.000Z'
 *                     status: completed
 *                     description: 'Mensualité août 2026 — Solar Home 50W'
 *       '400':
 *         description: >
 *           Missing phone parameter in the request path.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: 'Phone parameter is required'
 *       '404':
 *         description: >
 *           No scoring record found for the provided phone number.
 *           The client may not have an active subscription or the phone
 *           number may be incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: 'Scoring data not found'
 *       '502':
 *         description: >
 *           Bad Gateway — upstream sync failure or database error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: 'Failed to sync scoring data from Orange Energy API'
 */
router.get('/orange/scoring-data/:phone', getScoringData);

/**
 * @swagger
 * /users/orange/payments:
 *   get:
 *     summary: List all Orange Energy payments
 *     description: >
 *       Triggers a sync with the Orange Energy external API and returns the
 *       full list of payment records stored in the local MongoDB cache.
 *     tags:
 *       - Orange Energy — Payments
 *     responses:
 *       '200':
 *         description: Payments list retrieved and returned successfully.
 *       '502':
 *         description: Bad Gateway.
 */
router.get('/orange/payments', getPayments);

/**
 * @swagger
 * /users/orange/payments/{phone}:
 *   get:
 *     summary: List Orange Energy payments by phone
 *     description: >
 *       Triggers a sync with the Orange Energy external API and returns the
 *       payment records for the client identified by their phone number.
 *     tags:
 *       - Orange Energy — Payments
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: Orange Money phone number.
 *     responses:
 *       '200':
 *         description: Payments found and returned.
 *       '502':
 *         description: Bad Gateway.
 */
router.get('/orange/payments/:phone', getPaymentsByPhone);

export default router;