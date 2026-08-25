import mongoose from 'mongoose';
import config from '../config/env.config.js';
import Kit from '../models/kit.model.js';
import EnrichedTelemetry from '../models/EnrichedTelemetry.js';
import { enrichTelemetry } from '../services/telemetryEnricher.service.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
          message_id: `sim-msg-${kit.kitId}-${Date.now()}`,
          message_type: 'telemetry',
          device_id: `device-${kit.kitId}`,
          kit_id: kit.kitId,
          serial_number: kit.serialNumber || `SN-${kit.kitId}`,
          event_time: String(Math.floor(Date.now() / 1000)),
          sequence_number: Math.floor(Math.random() * 100000),
          
          battery_voltage_v: batteryVoltage,
          battery_current_a: batteryCurrent,
          battery_power_w: batteryPower,
          state_of_charge_pct: Math.floor(20 + Math.random() * 80),
          state_of_health_pct: Math.floor(70 + Math.random() * 30),
          
          solar_voltage_v: solarVoltage,
          solar_current_a: solarCurrent,
          solar_power_w: solarPower,
          energy_generated_wh: Math.floor(100 + Math.random() * 200),
          panel_temperature_c: Math.floor(35 + Math.random() * 25),
          solar_irradiance_w_m2: Math.floor(100 + Math.random() * 800),
          
          load_voltage_v: loadVoltage,
          load_current_a: loadCurrent,
          load_power_w: loadPower,
          energy_consumed_wh: Math.floor(500 + Math.random() * 1000),
          
          overload_detected: Math.random() > 0.95,
          short_circuit_detected: Math.random() > 0.99,
          
          // GPS du kit ou petite déviation
          latitude: kit.gpsCoordinates?.latitude ? kit.gpsCoordinates.latitude + (Math.random() - 0.5) * 0.001 : -4.325,
          longitude: kit.gpsCoordinates?.longitude ? kit.gpsCoordinates.longitude + (Math.random() - 0.5) * 0.001 : 15.322,
          gps_accuracy_m: Number((5 + Math.random() * 10).toFixed(1)),
          speed_mps: 0,
          movement_detected: Math.random() > 0.9,
          movement_duration_seconds: 0,
          movement_event_count: 0,
          
          tamper_detected: Math.random() > 0.98,
          enclosure_opened: Math.random() > 0.99,
          impact_detected: Math.random() > 0.98,
          
          connectivity_type: 'lte',
          connection_status: Math.random() > 0.9 ? 'degraded' : 'connected',
          connectivity_gap_seconds: Math.floor(Math.random() * 60),
          network_operator: 'orange',
          network_quality: Math.random() > 0.8 ? 'weak' : 'medium',
          
          device_temperature_c: Number((35 + Math.random() * 15).toFixed(1)),
          reset_count: Math.random() > 0.95 ? 2 : 1,
          missing_measurement_count: Math.floor(Math.random() * 2),
          sensor_failure_detected: Math.random() > 0.99,
          battery_error_code: Math.random() > 0.95 ? 'BATT_TEMP_HIGH' : 'NONE',
          solar_error_code: Math.random() > 0.95 ? 'LOW_INPUT' : 'NONE',
          device_error_code: 'NONE',
          schema_version: '1.0'
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
