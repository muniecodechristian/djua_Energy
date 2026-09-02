import router from '@adonisjs/core/services/router'
import { health, devices, device, telemetry, alerts, command, rawTelemetry } from '../app/controllers/device_controller.js'
import { register, login, logout } from '../app/controllers/auth_controller.js'
import { receiveTelemetry, receiveAlert, receiveStatus, commands } from '../app/controllers/iot_controller.js'
import { enrichedTelemetry } from '../app/controllers/ml_controller.js'
import { clients, kits, kit, scoring, payments, paymentsByPhone } from '../app/controllers/orange_energy_controller.js'
import { conversation } from '../app/controllers/ia_controller.js'
import { json as openapiJson, ui as swaggerUi } from '../app/controllers/docs_controller.js'
import { protect } from '../app/middleware/auth_middleware.js'
router.get('/', health); router.get('/api-docs.json', openapiJson); router.get('/api-docs', swaggerUi)
router.post('/auth/register', register); router.post('/auth/login', login); router.post('/auth/logout', logout)
router.get('/auth/me', protect); router.get('/auth/check-auth', protect)
router.get('/api/devices', devices); router.get('/api/devices/:deviceId', device)
router.get('/api/telemetry', telemetry); router.get('/api/telemetry/:kitId', rawTelemetry); router.get('/api/alerts', alerts); router.post('/api/commands', command)
router.get('/api/ml/telemetry', enrichedTelemetry)
router.post('/api/iot/telemetry' , receiveTelemetry); router.post('/api/iot/:deviceId/telemetry' , receiveTelemetry); router.post('/api/iot/:deviceId/alerts' , receiveAlert); router.post('/api/iot/:deviceId/status' , receiveStatus); router.get('/api/iot/:deviceId/commands' , commands)
router.get('/users/orange/clients', clients); router.get('/users/orange/kits', kits); router.get('/users/orange/kits/:kitId', kit); router.get('/users/orange/scoring-data/:phone', scoring); router.get('/users/orange/payments', payments); router.get('/users/orange/payments/:phone', paymentsByPhone)
router.post('/ai/conversation', conversation)
