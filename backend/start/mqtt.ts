import { startMqtt } from '../app/services/mqtt_service.js'
if (process.env.MQTT_ENABLED !== 'false') startMqtt().then(()=>console.log(`[MQTT] broker/listener ready on ${process.env.MQTT_PORT||1883}`)).catch((e)=>console.error('[MQTT]',e.message))
