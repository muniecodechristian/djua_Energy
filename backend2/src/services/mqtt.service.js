// src/services/mqtt.service.js
// Client MQTT local (connecté au broker embarqué) + traitement des messages.
// Ce service est la seule couche qui interagit avec le store via les mutations MQTT.

<<<<<<< HEAD
import mqtt from 'mqtt';
import config from '../config/env.config.js';
import * as store from '../store/db.store.js';
import { checkAndTriggerGeofence } from './geofence.service.js';
=======
import mqtt   from 'mqtt';
import config from '../config/env.config.js';
import * as store from '../store/memory.store.js';
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366

// ─── État interne ─────────────────────────────────────────────────────────────

/** @type {import('mqtt').MqttClient | null} */
let client = null;

// ─── Traitement des messages ──────────────────────────────────────────────────

/**
 * Parse un payload MQTT : retourne un objet JSON si possible, sinon la chaîne brute.
 * @param {Buffer} raw
 * @returns {object | string}
 */
function parsePayload(raw) {
  try {
    return JSON.parse(raw.toString());
  } catch {
    return raw.toString();
  }
}

/**
 * Dispatch un message MQTT vers le bon handler du store.
 * Format de topic attendu : djua/<deviceId>/<dataType>
 * @param {string} topic
 * @param {Buffer} message
 */
function handleMessage(topic, message) {
  const parts = topic.split('/');
  if (parts.length < 3) return;

  const [, deviceId, dataType] = parts;
  const payload = parsePayload(message);

  console.log(`\n [${topic}]`);

  switch (dataType) {
    case 'status':
      console.log(` Statut    ${deviceId} :`, payload);
      store.setDeviceStatus(deviceId, payload);
      break;

    case 'telemetry': {
      // ─── Logging enrichi télémétrie ESP32 ────────────────────────────────
      const t = payload;
      console.log(`\n══════════════════ TÉLÉMÉTRIE [${deviceId}] ══════════════════`);
<<<<<<< HEAD
      console.log(`   Timestamp      : ${t.timestamp ?? new Date().toISOString()}`);
      console.log(`   Batterie       : ${t.batteryVoltage ?? '?'}V  |  ${t.batteryCurrent ?? '?'}A  |  SOC: ${t.batterySOC ?? '?'}%  |  Temp: ${t.batteryTemperature ?? '?'}°C`);
      console.log(`    Panneau       : ${t.panelVoltage ?? '?'}V  |  ${t.panelCurrent ?? '?'}A  |  Puissance: ${t.panelPower ?? '?'}W`);
      console.log(`   GPS            : lat=${t.latitude ?? '?'}  lon=${t.longitude ?? '?'}  vitesse=${t.speed ?? '?'} km/h`);
      console.log(`    Tamper        : ${t.tamper ? '  BOITIER OUVERT' : 'OK (fermé)'}`);
      console.log(`   Firmware       : ${t.firmwareVersion ?? '?'}`);
=======
      console.log(`  📅 Timestamp      : ${t.timestamp ?? new Date().toISOString()}`);
      console.log(`  🔋 Batterie       : ${t.batteryVoltage ?? '?'}V  |  ${t.batteryCurrent ?? '?'}A  |  SOC: ${t.batterySOC ?? '?'}%  |  Temp: ${t.batteryTemperature ?? '?'}°C`);
      console.log(`  ☀️  Panneau       : ${t.panelVoltage ?? '?'}V  |  ${t.panelCurrent ?? '?'}A  |  Puissance: ${t.panelPower ?? '?'}W`);
      console.log(`  📍 GPS            : lat=${t.latitude ?? '?'}  lon=${t.longitude ?? '?'}  vitesse=${t.speed ?? '?'} km/h`);
      console.log(`  🛡️  Tamper        : ${t.tamper ? '⚠️  BOITIER OUVERT' : 'OK (fermé)'}`);
      console.log(`  🔧 Firmware       : ${t.firmwareVersion ?? '?'}`);
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
      console.log(`══════════════════════════════════════════════════════════════\n`);
      store.setDeviceTelemetry(deviceId, payload);
      break;
    }

    case 'alerts':
      console.log(`  Alerte    ${deviceId} :`, payload);
      store.addDeviceAlert(deviceId, payload);
<<<<<<< HEAD
      checkAndTriggerGeofence(deviceId, payload.latitude, payload.longitude);
=======
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
      break;

    default:
      console.warn(` Type inconnu [${dataType}] ignoré.`);
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Connecte le client au broker local et s'abonne aux topics des devices.
 * À appeler après le démarrage du broker (voir server.js).
 */
export function connectClient() {
  console.log("Connexion de l'écouteur API au broker MQTT local...");

  client = mqtt.connect(config.mqtt.brokerUrl, {
    username: config.mqtt.username,
    password: config.mqtt.password,
    clientId: config.mqtt.clientId,
  });

  client.on('connect', () => {
    console.log(' Client MQTT connecté au broker.');
    client.subscribe(config.topics.subscribe, (err) => {
      if (err) {
        console.error(" Échec abonnement :", err);
      } else {
        console.log(` Abonné : ${config.topics.subscribe}`);
      }
    });
  });

<<<<<<< HEAD
  client.on('error', (err) => console.error(' Erreur MQTT :', err));
=======
  client.on('error',   (err) => console.error(' Erreur MQTT :', err));
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
  client.on('message', handleMessage);
}

/**
 * Publie une commande vers un device cible.
 * @param {string} deviceId
 * @param {string} command
 * @returns {Promise<void>}
 */
export function publishCommand(deviceId, command) {
  return new Promise((resolve, reject) => {
    if (!client?.connected) {
      return reject(new Error('Client MQTT non connecté'));
    }

<<<<<<< HEAD
    const topic = `${config.topics.commandBase}/${deviceId}/commands`;
=======
    const topic   = `${config.topics.commandBase}/${deviceId}/commands`;
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
    const payload = JSON.stringify({ command, timestamp: new Date().toISOString() });

    console.log(` Commande [${command}] → [${topic}]`);

    client.publish(topic, payload, { qos: 1 }, (err) => {
      err ? reject(err) : resolve();
    });
  });
}

<<<<<<< HEAD




=======
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
