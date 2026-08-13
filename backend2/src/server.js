import config            from './config/env.config.js';
import connectDB         from './config/db.config.js'; 
import { startBroker }   from './broker/mqtt.broker.js';
import { connectClient } from './services/mqtt.service.js';
import app               from './app.js';
import http              from 'http';
import { initSocket }    from './services/socket.service.js';

const startServer = async () => {
  try {
    // 2. Initialisation de la connexion MongoDB avant de lancer le serveur
    await connectDB();

    // 3. Démarrage du broker et des services MQTT
    startBroker();
    setTimeout(connectClient, 200);

    // 4. Démarrage du serveur HTTP avec Socket.io
    const server = http.createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      console.log(` Serveur HTTP démarré sur le port ${config.port}`);
      console.log(` API : http://localhost:${config.port}/api/devices`);
    });
  } catch (error) {
    console.error(' Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
};

startServer();