// src/routes/device.routes.js
// Mapping URL → controller uniquement. Aucune logique ici.

import { Router }      from 'express';
import * as controller from '../controllers/device.controller.js';

const router = Router();

// ─── Lectures ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: List all known IoT devices
 *     description: >
 *       Returns a map of all devices currently tracked in the in-memory store.
 *       A device appears in this registry as soon as it publishes its first
 *       MQTT message to the Aedes broker.
 *
 *       The response object is keyed by `deviceId`. Each value contains the
 *       latest known state: status, telemetry snapshot, unresolved alerts,
 *       and `lastSeen` timestamp.
 *
 *       **Data freshness**: This endpoint reflects the live in-memory state.
 *       Data is not persisted to MongoDB — a server restart resets the store.
 *     tags:
 *       - Devices
 *     responses:
 *       '200':
 *         description: Successfully retrieved device map.
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
 *                   description: Number of devices in the registry.
 *                   example: 2
 *                 data:
 *                   type: object
 *                   description: >
 *                     Map of `deviceId` → Device state object.
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/Device'
 *             example:
 *               success: true
 *               count: 2
 *               data:
 *                 djua-device-001:
 *                   status: online
 *                   telemetry:
 *                     voltage: 220.5
 *                     current: 1.3
 *                     power: 286.65
 *                   alerts: []
 *                   lastSeen: '2026-08-09T07:00:00.000Z'
 *                 djua-device-002:
 *                   status: offline
 *                   telemetry: null
 *                   alerts: []
 *                   lastSeen: '2026-08-08T22:00:00.000Z'
 */
router.get('/devices', controller.getAllDevices);

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   get:
 *     summary: Get a single device by ID
 *     description: >
 *       Returns the complete in-memory state for a specific device:
 *       latest status, telemetry snapshot, pending alerts, and `lastSeen` time.
 *
 *       Returns `404` if the device ID has never published to the MQTT broker
 *       in the current server session.
 *     tags:
 *       - Devices
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: >
 *           Unique device identifier. This is the MQTT client ID used by the
 *           device when connecting to the Aedes broker.
 *         example: djua-device-001
 *     responses:
 *       '200':
 *         description: Device found and returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *             example:
 *               success: true
 *               data:
 *                 status: online
 *                 telemetry:
 *                   voltage: 220.5
 *                   current: 1.3
 *                   power: 286.65
 *                 alerts: []
 *                 lastSeen: '2026-08-09T07:00:00.000Z'
 *       '404':
 *         description: No device with the given ID exists in the current session.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: 'Équipement non trouvé'
 */
router.get('/devices/:deviceId', controller.getDeviceById);

/**
 * @swagger
 * /api/telemetry:
 *   get:
 *     summary: Get global telemetry history
 *     description: >
 *       Returns the telemetry ring buffer — a LIFO list of the most recent
 *       telemetry events across **all devices**.
 *
 *       The maximum buffer size is set by the `HISTORY_MAX_TELEMETRY`
 *       environment variable (defaults to 100). When the buffer is full,
 *       the oldest entry is discarded on each new push.
 *
 *       Entries are ordered most-recent first (index 0 = latest).
 *     tags:
 *       - Telemetry
 *     responses:
 *       '200':
 *         description: Telemetry history retrieved successfully.
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
 *                   description: Number of entries in the history buffer.
 *                   example: 42
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TelemetryEntry'
 *             example:
 *               success: true
 *               count: 2
 *               data:
 *                 - deviceId: djua-device-001
 *                   timestamp: '2026-08-09T07:05:00.000Z'
 *                   data:
 *                     voltage: 221.0
 *                     current: 1.35
 *                     power: 298.35
 *                 - deviceId: djua-device-001
 *                   timestamp: '2026-08-09T07:00:00.000Z'
 *                   data:
 *                     voltage: 220.5
 *                     current: 1.3
 *                     power: 286.65
 */
router.get('/telemetry', controller.getTelemetry);

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get global alerts history
 *     description: >
 *       Returns the alerts ring buffer — a LIFO list of the most recent alert
 *       events across **all devices**.
 *
 *       The maximum buffer size is set by the `HISTORY_MAX_ALERTS`
 *       environment variable (defaults to 50). Entries are ordered
 *       most-recent first.
 *
 *       **Note**: This endpoint returns historical alert records regardless of
 *       whether they have been acknowledged. There is no alert resolution
 *       mechanism yet — see roadmap.
 *     tags:
 *       - Alerts
 *     responses:
 *       '200':
 *         description: Alerts history retrieved successfully.
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlertEntry'
 *             example:
 *               success: true
 *               count: 1
 *               data:
 *                 - deviceId: djua-device-001
 *                   timestamp: '2026-08-09T07:05:00.000Z'
 *                   data:
 *                     type: OVERVOLTAGE
 *                     severity: high
 *                     value: 265.0
 *                     message: 'Voltage exceeded 260V threshold'
 */
router.get('/alerts', controller.getAlerts);

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/commands:
 *   post:
 *     summary: Send an MQTT command to a device
 *     description: >
 *       Publishes a command message to the target device's MQTT command topic
 *       via the Aedes broker. The command is forwarded asynchronously —
 *       this endpoint confirms broker delivery, not device execution.
 *
 *       **MQTT topic**: `djua/{deviceId}/commands`
 *
 *       **Common commands** (device firmware dependent):
 *       | Command | Effect |
 *       |---|---|
 *       | `RESET` | Soft-resets the device |
 *       | `STATUS` | Triggers an immediate status report |
 *       | `TOGGLE_RELAY` | Toggles the main relay (enable/disable power output) |
 *
 *       Returns `500` if the Aedes broker is unavailable or the publish fails.
 *     tags:
 *       - Commands
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommandRequest'
 *           examples:
 *             reset_device:
 *               summary: Send a RESET command
 *               value:
 *                 deviceId: djua-device-001
 *                 command: RESET
 *             toggle_relay:
 *               summary: Toggle the main relay
 *               value:
 *                 deviceId: djua-device-002
 *                 command: TOGGLE_RELAY
 *     responses:
 *       '200':
 *         description: Command successfully published to the MQTT broker.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommandResponse'
 *             example:
 *               success: true
 *               message: "Commande 'RESET' envoyée à djua-device-001"
 *       '400':
 *         description: Missing required fields — `deviceId` or `command`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: 'deviceId et command sont requis'
 *       '500':
 *         description: MQTT broker error — command could not be delivered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "Erreur broker MQTT lors de l'envoi"
 */
router.post('/commands', controller.sendCommand);

export default router;
