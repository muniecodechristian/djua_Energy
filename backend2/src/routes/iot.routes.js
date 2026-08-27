import { Router } from 'express';
import { authenticateDevice } from '../middlewares/iot.middleware.js';
import { getCommands, receiveAlert, receiveStatus, receiveTelemetry } from '../controllers/iot.controller.js';

const router = Router();

router.use(authenticateDevice);
// These endpoints are designed for ESP32 devices using HTTP/HTTPS instead of MQTT.
router.post('/telemetry', receiveTelemetry);
router.post('/:deviceId/telemetry', receiveTelemetry);
router.post('/:deviceId/alerts', receiveAlert);
router.post('/:deviceId/status', receiveStatus);
router.get('/:deviceId/commands', getCommands);

export default router;
