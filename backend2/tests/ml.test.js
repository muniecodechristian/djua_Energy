import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import EnrichedTelemetry from '../src/models/EnrichedTelemetry.js';

describe('Machine Learning API - Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await EnrichedTelemetry.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/ml/telemetry', () => {
    it('should return empty list when no data is in DB', async () => {
      const res = await request(app).get('/api/ml/telemetry');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should retrieve enriched telemetry records', async () => {
      const sampleTelemetry = {
        kit_id: 'kit-test-ml',
        device_id: 'device-test-ml',
        battery_voltage_v: 12.5,
        battery_current_a: 1.2,
      };

      await EnrichedTelemetry.create(sampleTelemetry);

      const res = await request(app).get('/api/ml/telemetry?kitId=kit-test-ml');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].kit_id).toBe('kit-test-ml');
      expect(res.body.data[0].battery_voltage_v).toBe(12.5);
    });
  });
});
