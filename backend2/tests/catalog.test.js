import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import config from '../src/config/env.config.js';
import User from '../src/models/user.model.js';
import CatalogProduct from '../src/models/CatalogProduct.model.js';
import Quote from '../src/models/Quote.model.js';

let admin;
let commercial;
let shopManager;
const cookie = user => `token=${jwt.sign({ id: String(user._id) }, config.jwtSecret, { expiresIn: '1h' })}`;
const imageData = 'data:image/jpeg;base64,ZmFrZQ==';
const product = overrides => ({
  name: 'Télévision LED',
  category: 'Multimédia',
  brand: 'Djua test',
  model: 'TV-32',
  watts: 85,
  hours: 5,
  period: 'both',
  diversity: 0.8,
  price: 100,
  currency: 'USD',
  imageData,
  active: true,
  ...overrides,
});

describe('Shared solar equipment catalogue', () => {
  beforeAll(async () => {
    await connectDB();
    await CatalogProduct.init();
    const make = (role, identifier) => User.create({ nom: 'Catalog', prenom: role, identifier, password: 'TestPass123!', role });
    [admin, commercial, shopManager] = await Promise.all([
      make('admin', 'catalog-admin@test.local'),
      make('commercial', 'catalog-commercial@test.local'),
      make('shop_manager', 'catalog-manager@test.local'),
    ]);
  });

  beforeEach(async () => {
    await CatalogProduct.deleteMany({});
    await Quote.deleteMany({});
  });

  afterAll(async () => {
    await CatalogProduct.deleteMany({});
    await Quote.deleteMany({});
    await User.deleteMany({ identifier: /^catalog-(admin|commercial|manager)@test\.local$/ });
    await mongoose.connection.close();
  });

  it('allows the administrator to create products with a validated image and shares active products with commercial users', async () => {
    const created = await request(app).post('/api/catalog').set('Cookie', cookie(admin)).send(product());
    expect(created.status).toBe(201);
    expect(created.body.data.imageData).toBe(imageData);
    expect(created.body.data.watts).toBe(85);

    const hidden = await request(app).post('/api/catalog').set('Cookie', cookie(admin)).send(product({ name: 'Produit archivé', active: false }));
    expect(hidden.status).toBe(201);

    const commercialList = await request(app).get('/api/catalog').set('Cookie', cookie(commercial));
    expect(commercialList.status).toBe(200);
    expect(commercialList.body.data.map(item => item.name)).toEqual(['Télévision LED']);

    const adminList = await request(app).get('/api/catalog').set('Cookie', cookie(admin));
    expect(adminList.body.data).toHaveLength(2);
  });

  it('rejects anonymous access and prevents unauthorized catalogue mutations', async () => {
    expect((await request(app).get('/api/catalog')).status).toBe(401);
    expect((await request(app).get('/api/catalog').set('Cookie', cookie(shopManager))).status).toBe(200);
    expect((await request(app).post('/api/catalog').set('Cookie', cookie(commercial)).send(product())).status).toBe(403);
    expect((await request(app).post('/api/catalog').set('Cookie', cookie(admin)).send(product({ imageData: 'data:image/svg+xml;base64,PHN2Zz4=' }))).status).toBe(400);
  });

  it('counts product appearances in quotes from the last 30 days', async () => {
    const television = await CatalogProduct.create({ ...product(), createdBy: admin._id });
    const refrigerator = await CatalogProduct.create({ ...product({ name: 'Réfrigérateur', model: 'FR-1' }), createdBy: admin._id });
    const quote = (number, createdAt, name) => ({
      number,
      requestKey: number,
      owner: admin._id,
      client: new mongoose.Types.ObjectId(),
      customer: { name: 'Client test' },
      site: {},
      system: {},
      appliances: [{ name, quantity: 1, watts: 85, hours: 5 }],
      amount: 100,
      currency: 'USD',
      createdAt,
      updatedAt: createdAt,
    });
    await Quote.create([
      quote('Q-CATALOG-RECENT-1', new Date(), 'Télévision LED'),
      quote('Q-CATALOG-RECENT-2', new Date(), 'télévision led'),
      quote('Q-CATALOG-OLD', new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), 'Télévision LED'),
      quote('Q-CATALOG-OTHER', new Date(), 'Autre appareil'),
    ]);

    const response = await request(app).get('/api/catalog').set('Cookie', cookie(admin));
    const counts = new Map(response.body.data.map(item => [item._id, item.usageCount]));
    expect(counts.get(String(television._id))).toBe(2);
    expect(counts.get(String(refrigerator._id))).toBe(0);
  });

  it('lets only administrators update and delete existing catalogue products', async () => {
    const created = await CatalogProduct.create({ ...product(), createdBy: admin._id });
    const denied = await request(app).patch(`/api/catalog/${created._id}`).set('Cookie', cookie(commercial)).send({ watts: 120 });
    expect(denied.status).toBe(403);

    const updated = await request(app).patch(`/api/catalog/${created._id}`).set('Cookie', cookie(admin)).send({ watts: 120 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.watts).toBe(120);

    const removed = await request(app).delete(`/api/catalog/${created._id}`).set('Cookie', cookie(admin));
    expect(removed.status).toBe(200);
    expect(await CatalogProduct.countDocuments()).toBe(0);
  });
});
