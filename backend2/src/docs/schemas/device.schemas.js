/**
 * @file device.schemas.js
 * @description OpenAPI 3.1 schemas for the IoT Device domain.
 *
 * These schemas reflect the in-memory store structure managed by
 * `src/store/memory.store.js`. Devices communicate via MQTT (Aedes broker)
 * and expose three categories of data: status, telemetry, and alerts.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       description: >
 *         An IoT device tracked by the Djua Energy platform.
 *         Device data is held in-memory and updated in real-time via MQTT.
 *       properties:
 *         status:
 *           description: >
 *             Latest status payload published by the device on its status topic.
 *             Shape is device-specific (string or object).
 *           example: 'online'
 *         telemetry:
 *           type: object
 *           description: >
 *             Most recent telemetry snapshot (e.g., voltage, current, power).
 *           example:
 *             voltage: 220.5
 *             current: 1.3
 *             power: 286.65
 *         alerts:
 *           type: array
 *           description: List of unresolved alerts for this device (LIFO order).
 *           items:
 *             $ref: '#/components/schemas/AlertPayload'
 *         lastSeen:
 *           type: string
 *           format: date-time
 *           description: ISO 8601 timestamp of the last MQTT message received.
 *           example: '2026-08-09T07:00:00.000Z'
 *
 *     TelemetryEntry:
 *       type: object
 *       description: >
 *         A historical telemetry record. The global telemetry history stores
 *         the last N entries (configurable via `HISTORY_MAX_TELEMETRY`).
 *       required:
 *         - deviceId
 *         - timestamp
 *         - data
 *       properties:
 *         deviceId:
 *           type: string
 *           description: Unique identifier of the source device.
 *           example: 'djua-device-001'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When this telemetry was captured.
 *           example: '2026-08-09T07:00:00.000Z'
 *         data:
 *           type: object
 *           description: Raw telemetry payload published by the device.
 *           example:
 *             voltage: 220.5
 *             current: 1.3
 *             power: 286.65
 *
 *     AlertPayload:
 *       type: object
 *       description: Raw alert payload published by a device on its alert topic.
 *       properties:
 *         type:
 *           type: string
 *           description: Alert category identifier.
 *           example: 'OVERVOLTAGE'
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           example: 'high'
 *         value:
 *           type: number
 *           description: Measured value that triggered the alert.
 *           example: 265.0
 *         message:
 *           type: string
 *           example: 'Voltage exceeded 260V threshold'
 *
 *     AlertEntry:
 *       type: object
 *       description: >
 *         A historical alert record. The global alerts history stores
 *         the last N entries (configurable via `HISTORY_MAX_ALERTS`).
 *       required:
 *         - deviceId
 *         - timestamp
 *         - data
 *       properties:
 *         deviceId:
 *           type: string
 *           example: 'djua-device-001'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2026-08-09T07:05:00.000Z'
 *         data:
 *           $ref: '#/components/schemas/AlertPayload'
 *
 *     CommandRequest:
 *       type: object
 *       description: >
 *         Payload to publish an MQTT command to a specific device.
 *         The server forwards this to the device via the Aedes broker.
 *       required:
 *         - deviceId
 *         - command
 *       properties:
 *         deviceId:
 *           type: string
 *           description: Target device identifier.
 *           example: 'djua-device-001'
 *         command:
 *           type: string
 *           description: >
 *             Command string to send. Valid values depend on device firmware
 *             (e.g., 'RESET', 'STATUS', 'TOGGLE_RELAY').
 *           example: 'RESET'
 *
 *     CommandResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Commande 'RESET' envoyée à djua-device-001"
 */

// Runtime no-op — JSDoc only.
