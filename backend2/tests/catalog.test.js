import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import config from '../src/config/env.config.js';
import User from '../src/models/user.model.js';
import CatalogProduct from '../src/models/CatalogProduct.model.js';

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

  beforeEach(async () => CatalogProduct.deleteMany({}));

  afterAll(async () => {
    await CatalogProduct.deleteMany({});
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

  it('rejects anonymous and shop-manager access and prevents commercial mutations', async () => {
    expect((await request(app).get('/api/catalog')).status).toBe(401);
    expect((await request(app).get('/api/catalog').set('Cookie', cookie(shopManager))).status).toBe(403);
    expect((await request(app).post('/api/catalog').set('Cookie', cookie(commercial)).send(product())).status).toBe(403);
    expect((await request(app).post('/api/catalog').set('Cookie', cookie(admin)).send(product({ imageData: 'data:image/svg+xml;base64,PHN2Zz4=' }))).status).toBe(400);
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
