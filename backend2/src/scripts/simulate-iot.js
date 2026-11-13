import mongoose from 'mongoose';
import config from '../config/env.config.js';
import Kit from '../models/kit.model.js';
import EnrichedTelemetry from '../models/EnrichedTelemetry.js';
import { enrichTelemetry } from '../services/telemetryEnricher.service.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const simulationStartedAt = Date.now();

const runSimulation = async () => {
  try {
    console.log('🔌 [Simulation IoT] Connexion à MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ [Simulation IoT] Connecté.');

    while (true) {
      console.log('\n🔍 [Simulation IoT] Recherche de kits en base pour simulation...');
      const kits = await Kit.find({}).lean();
      
      if (kits.length === 0) {
        console.warn('⚠️ [Simulation IoT] Aucun kit trouvé en base. En attente de synchronisation... (retry in 10s)');
        await delay(10000);
        continue;
      }

      console.log(`🚀 [Simulation IoT] Simulation pour ${kits.length} kits...`);

      for (const kit of kits) {
        // Générer des variations réalistes
        const batteryVoltage = Number((11.5 + Math.random() * 2).toFixed(2));
        const batteryCurrent = Number((-6.0 + Math.random() * 8).toFixed(2));
        const batteryPower = Number((batteryVoltage * batteryCurrent).toFixed(2));
        const solarVoltage = Number((15 + Math.random() * 5).toFixed(2));
        const solarCurrent = Number((0.5 + Math.random() * 3).toFixed(2));
        const solarPower = Number((solarVoltage * solarCurrent).toFixed(2));
        const loadVoltage = Number((11 + Math.random() * 2).toFixed(2));
        const loadCurrent = Number((1 + Math.random() * 8).toFixed(2));
        const loadPower = Number((loadVoltage * loadCurrent).toFixed(2));

        const iotPayload = {
          protocol: 'D2T2',
          message_id: `sim-msg-${kit.kitId}-${Date.now()}`,
          kit_id: kit.kitId,
          sequence: Math.floor(Math.random() * 100000),
          uptime_ms: Date.now() - simulationStartedAt,
          timestamp_ms: Date.now(),
          interval_seconds: 60,
          timestamp: new Date().toISOString(),
          // GPS du kit ou petite déviation
          latitude: kit.gpsCoordinates?.latitude ? kit.gpsCoordinates.latitude + (Math.random() - 0.5) * 0.001 : -4.325,
          longitude: kit.gpsCoordinates?.longitude ? kit.gpsCoordinates.longitude + (Math.random() - 0.5) * 0.001 : 15.322,
          battery: {
            voltage_v: batteryVoltage,
            current_a: batteryCurrent,
            power_w: batteryPower,
          },
          solar: {
            voltage_v: solarVoltage,
            current_a: solarCurrent,
            power_w: solarPower,
            energy_interval_wh: Math.floor(100 + Math.random() * 200),
          },
          dc_load: {
            voltage_v: loadVoltage,
            current_a: loadCurrent,
            power_w: loadPower,
            energy_interval_wh: Math.floor(500 + Math.random() * 1000),
            measured_count: 1,
          },
          ac_load: {
            voltage_v: 220,
            current_a: Number((loadPower / 220).toFixed(2)),
            active_power_w: loadPower,
            apparent_power_va: loadPower,
            energy_interval_wh: Math.floor(100 + Math.random() * 300),
          },
          device_temperature_c: Number((35 + Math.random() * 15).toFixed(1)),
          validity: {
            rtc: true,
            gps: Boolean(kit.gpsCoordinates?.latitude && kit.gpsCoordinates?.longitude),
            battery: true,
            solar: true,
            solar_energy: true,
            dc_load: true,
            dc_load_energy: true,
            ac: true,
            ac_energy: true,
          },
        };

        try {
          const enriched = await enrichTelemetry(iotPayload);
          await EnrichedTelemetry.create(enriched);
          console.log(`✅ [Simulation IoT] Télémétrie enrichie et stockée pour ${kit.kitId}`);
        } catch (enrichErr) {
          console.error(`❌ [Simulation IoT] Échec d'enrichissement pour ${kit.kitId}:`, enrichErr.message);
        }
      }

      console.log('😴 [Simulation IoT] En attente de la prochaine simulation dans 15 secondes...');
      await delay(15000);
    }
  } catch (error) {
    console.error('💥 [Simulation IoT] Erreur critique dans la simulation:', error);
    process.exit(1);
  }
};

runSimulation();
