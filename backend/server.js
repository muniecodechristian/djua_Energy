const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
let aedes;
let mqttClient;
const net = require('net');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration Middleware
app.use(cors());
app.use(express.json());

// In-Memory Database (Stockage temporaire en mémoire)
const devices = {};
const telemetryHistory = [];
const alertsHistory = [];

// Configuration MQTT (Port d'écoute du broker embarqué)
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_USER = process.env.MQTT_USER || 'djua_device';
const MQTT_PASS = process.env.MQTT_PASS || 'djua_pass_2026';

// --- INITIALISATION DU BROKER MQTT EMBARQUÉ ---
(async () => {
  try {
    const aedesModule = await import('aedes');
    const Aedes = aedesModule.Aedes || (aedesModule.default && aedesModule.default.Aedes);
    if (!Aedes || typeof Aedes.createBroker !== 'function') {
      throw new Error('Impossible de trouver Aedes.createBroker dans le module importé.');
    }
    aedes = await Aedes.createBroker();

    // Optionnel : validation des identifiants (ici on autorise toutes les connexions pour simplifier le labo)
    aedes.authenticate = function (client, username, password, callback) {
      callback(null, true);
    };

    const mqttServer = net.createServer(aedes.handle);
    mqttServer.listen(MQTT_PORT, '0.0.0.0', () => {
      console.log(` Broker MQTT embarqué démarré et écoute sur le port ${MQTT_PORT} (toutes interfaces)`);
    });

    aedes.on('client', (client) => {
      console.log(`[MQTT Broker] Client connecté : ${client.id}`);
    });

    aedes.on('clientDisconnect', (client) => {
      console.log(` [MQTT Broker] Client déconnecté : ${client.id}`);
    });

    // Connexion du client API local (Écouteur Express)
    console.log('Connexion de l\'écouteur API au broker MQTT local...');
    mqttClient = mqtt.connect(`mqtt://127.0.0.1:${MQTT_PORT}`, {
      username: MQTT_USER,
      password: MQTT_PASS,
      clientId: `DjuaExpressBackend_Listener`
    });

    // Gestionnaires MQTT
    mqttClient.on('connect', () => {
      console.log('✅ Connecté avec succès au broker MQTT.');
      
      // S'abonner à toutes les télémétries, alertes et statuts des équipements
      mqttClient.subscribe('djua/+/+', (err) => {
        if (!err) {
          console.log('📡 Abonné aux topics : djua/+/+ (telemetry, alerts, status)');
        } else {
          console.error('❌ Échec de l\'abonnement aux topics :', err);
        }
      });
    });

    mqttClient.on('error', (err) => {
      console.error('❌ Erreur de connexion MQTT :', err);
    });

    mqttClient.on('message', (topic, message) => {
      const topicParts = topic.split('/');
      if (topicParts.length < 3) return;

      const deviceId = topicParts[1];
      const dataType = topicParts[2]; // telemetry, alerts, ou status
      const payloadStr = message.toString();

      console.log(`\n📥 Message reçu [${topic}]`);

      try {
        // Si c'est du texte brut pour le statut simple, ou du JSON
        let payload;
        try {
          payload = JSON.parse(payloadStr);
        } catch {
          payload = payloadStr; // Garder en string si ce n'est pas du JSON valide
        }

        if (dataType === 'status') {
          console.log(`ℹ️ Statut de ${deviceId} : ${payloadStr}`);
          if (!devices[deviceId]) devices[deviceId] = {};
          devices[deviceId].status = payload;
          devices[deviceId].lastSeen = new Date();
        } 
        
        else if (dataType === 'telemetry') {
          console.log(`📊 Télémétrie reçue de ${deviceId} :`, payload);
          
          // Mettre à jour l'état en mémoire pour cet appareil
          if (!devices[deviceId]) devices[deviceId] = {};
          devices[deviceId].telemetry = payload;
          devices[deviceId].lastSeen = new Date();

          // Ajouter à l'historique global (max 100 entrées)
          telemetryHistory.unshift({ deviceId, timestamp: new Date(), data: payload });
          if (telemetryHistory.length > 100) telemetryHistory.pop();
        } 
        
        else if (dataType === 'alerts') {
          console.log(`⚠️ ALERTE de ${deviceId} :`, payload);

          // Mettre à jour les alertes de l'appareil
          if (!devices[deviceId]) devices[deviceId] = {};
          if (!devices[deviceId].alerts) devices[deviceId].alerts = [];
          devices[deviceId].alerts.unshift(payload);
          devices[deviceId].lastSeen = new Date();

          // Ajouter à l'historique des alertes
          alertsHistory.unshift({ deviceId, timestamp: new Date(), data: payload });
        }
      } catch (error) {
        console.error('❌ Erreur lors du parsing du message MQTT :', error);
      }
    });

  } catch (err) {
    console.error('Erreur lors du démarrage du broker:', err);
    process.exit(1);
  }
})();

// --- API HTTP ENDPOINTS ---

// 1. Obtenir l'état de tous les équipements actifs
app.get('/api/devices', (req, res) => {
  res.json({
    success: true,
    count: Object.keys(devices).length,
    data: devices
  });
});

// 2. Obtenir l'état d'un équipement spécifique
app.get('/api/devices/:deviceId', (req, res) => {
  const device = devices[req.params.deviceId];
  if (!device) {
    return res.status(404).json({ success: false, message: 'Équipement non trouvé' });
  }
  res.json({ success: true, data: device });
});

// 3. Obtenir l'historique des télémétries
app.get('/api/telemetry', (req, res) => {
  res.json({ success: true, count: telemetryHistory.length, data: telemetryHistory });
});

// 4. Obtenir l'historique des alertes
app.get('/api/alerts', (req, res) => {
  res.json({ success: true, count: alertsHistory.length, data: alertsHistory });
});

// 5. Envoyer une commande à un équipement (reboot, lockDevice, unlockDevice, etc.)
app.post('/api/commands', (req, res) => {
  const { deviceId, command } = req.body;

  if (!deviceId || !command) {
    return res.status(400).json({ success: false, message: 'deviceId et command requis' });
  }

  const topic = `djua/${deviceId}/commands`;
  const payload = JSON.stringify({ command, timestamp: new Date().toISOString() });

  console.log(` Envoi de la commande [${command}] vers [${topic}]`);
  
  if (!mqttClient || !mqttClient.connected) {
    return res.status(503).json({ success: false, message: 'MQTT broker non connecté' });
  }

  mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Échec de publication de la commande :', err);
      return res.status(500).json({ success: false, message: 'Erreur broker MQTT lors de l\'envoi' });
    }
    res.json({ success: true, message: `Commande '${command}' envoyée avec succès à ${deviceId}` });
  });
});

// Lancement du serveur Express
app.listen(PORT, () => {
  console.log(`🚀 Serveur HTTP Express démarré sur le port ${PORT}`);
  console.log(` API disponible sur http://localhost:${PORT}/api/devices`);
});
