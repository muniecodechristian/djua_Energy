// src/broker/mqtt.broker.js
// Démarre le broker MQTT embarqué (Aedes) sur un serveur TCP.
// Isolé dans son propre module pour que server.js reste un simple chef d'orchestre.
//
// NOTE : aedes est un package CJS. Node.js l'enveloppe automatiquement :
//        son `module.exports` (le constructeur) devient l'export default ESM.

import Aedes from 'aedes';
import net   from 'net';
import config from '../config/env.config.js';

/**
 * Crée et démarre le broker MQTT TCP.
 * @returns {{ broker: Aedes, server: net.Server }}
 */
export function startBroker() {
  const broker = new Aedes();

  // Authentification — autorise tout en environnement labo
  broker.authenticate = (_client, _username, _password, callback) => {
    callback(null, true);
  };

  const server = net.createServer(broker.handle);

  server.listen(config.mqtt.port, '0.0.0.0', () => {
    console.log(
      `Broker MQTT embarqué démarré sur le port ${config.mqtt.port} (toutes interfaces)`
    );
  });

  broker.on('client',           (client) => console.log(`[Broker] Connecté    : ${client.id}`));
  broker.on('clientDisconnect', (client) => console.log(`[Broker] Déconnecté  : ${client.id}`));

  return { broker, server };
}
