import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/djua_energy',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_fallback_djua_energy_2026_key_senior_grade_protection',
  orangeEnergyApiUrl: process.env.ORANGE_ENERGY_API_URL || 'https://orangeenergyapi.vercel.app',

  // URL de l'API externe d'IA (fournie par votre collègue)
  // Ex: https://colleague-host.example.com
  iaApiUrl: process.env.IA_API_URL || '',

  mqtt: {
    port: parseInt(process.env.MQTT_PORT, 10) || 1883,
    username: process.env.MQTT_USER ?? 'djua_device',
    password: process.env.MQTT_PASS ?? 'djua_pass_2026',
    clientId: 'DjuaExpressBackend_Listener',
    get brokerUrl() {
      return `mqtt://127.0.0.1:${this.port}`;
    },
  },


  topics: {
    subscribe: 'djua/+/+',
  },


  history: {
    maxTelemetry: 100,
    maxAlerts: 100,
  },
};

export default config;