import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import Kit from '../src/models/kit.model.js';

describe('Kits API - installation registration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await Kit.deleteMany({});
  });

  afterAll(async () => {
    await Kit.deleteMany({});
    await mongoose.connection.close();
  });

  it('returns success when the same kit registration is retried', async () => {
    const payload = {
      kitId: 'KIT-RETRY-001',
      clientPhone: '+243 812 345 678',
      offerName: 'Installation manuelle',
    };

    const firstResponse = await request(app).post('/api/kits').send(payload);
    const retryResponse = await request(app)
      .post('/api/kits')
      .send({ ...payload, clientPhone: '+243 (812) 345-678' });

    expect(firstResponse.status).toBe(201);
    expect(retryResponse.status).toBe(200);
    expect(retryResponse.body.alreadyRegistered).toBe(true);
    expect(await Kit.countDocuments({ kitId: payload.kitId })).toBe(1);
  });

  it('explains when the client phone is already assigned to another kit', async () => {
    await Kit.create({
      kitId: 'KIT-PHONE-001',
      clientPhone: '+243 812 345 678',
      offerName: 'Installation manuelle',
    });

    const response = await request(app).post('/api/kits').send({
      kitId: 'KIT-PHONE-002',
      clientPhone: '+243812345678',
      offerName: 'Installation manuelle',
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CLIENT_PHONE_ALREADY_USED');
    expect(response.body.message).toBe('Ce numéro de téléphone est déjà utilisé.');
    expect(await Kit.countDocuments({ kitId: 'KIT-PHONE-002' })).toBe(0);
  });
});