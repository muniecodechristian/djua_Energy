import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import User from '../src/models/user.model.js';
import Shop from '../src/models/Shop.model.js';

describe('Authentication API - Integration Tests', () => {
  beforeAll(async () => {
    // Connect to the in-memory MongoDB server started by global.setup.js
    await connectDB();
  });

  afterAll(async () => {
    // Clean up DB and close connection
    await User.deleteMany({});
    await Shop.deleteMany({});
    await mongoose.connection.close();
  });

  const userData = {
    nom: 'Doe',
    prenom: 'John',
    postNom: 'Mamba',
    identifier: 'john.doe@example.com',
    password: 'Password123!',
  };

  const createSession = async (role, zone = '') => {
    const identifier = `${role}-${Math.random().toString(36).slice(2)}@example.com`;
    await User.create({ nom: 'Test', prenom: 'Role', identifier, password: 'Password123!', role, zone });
    const response = await request(app).post('/auth/login').send({ identifier, password: 'Password123!' });
    return { cookie: response.headers['set-cookie'], identifier };
  };

  const createShop = async (cookie, name = `Test shop ${Date.now()}`) => request(app)
    .post('/api/shops')
    .set('Cookie', cookie)
    .send({ name, address: '12 Avenue de la Paix', region: 'Kinshasa' });

  describe('/api/shops', () => {
    it('should let an admin create and list shops', async () => {
      const { cookie } = await createSession('admin');
      const created = await createShop(cookie, 'Shop de test');
      const listed = await request(app).get('/api/shops').set('Cookie', cookie);

      expect(created.status).toBe(201);
      expect(created.body.data).toMatchObject({
        name: 'Shop de test',
        address: '12 Avenue de la Paix',
        region: 'Kinshasa',
      });
      expect(listed.status).toBe(200);
      expect(listed.body.data.map(shop => shop._id)).toContain(created.body.data._id);
    });

    it('should prevent non-admins from creating shops', async () => {
      const { cookie } = await createSession('shop_manager');
      const response = await createShop(cookie);
      const list = await request(app).get('/api/shops').set('Cookie', cookie);

      expect(response.status).toBe(403);
      expect(list.status).toBe(403);
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully with valid inputs', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(userData);

      if (res.status === 500) console.log('Registration error:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('successfully');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.identifier).toBe(userData.identifier.toLowerCase());
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not allow public registration to assign an internal role', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...userData, identifier: 'self-admin@example.com', role: 'admin', zone: 'Kinshasa' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('kitireceveur');
    });

    it('should fail registration with duplicate identifier', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(userData);

      if (res.status === 500) console.log('Duplicate Reg error:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail registration with invalid email format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          ...userData,
          identifier: 'notanemail',
        });

      if (res.status === 500) console.log('Invalid email Reg error:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].field).toBe('identifier');
    });

    it('should fail registration with weak password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          ...userData,
          identifier: 'another@example.com',
          password: 'weak',
        });

      if (res.status === 500) console.log('Weak pw Reg error:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].field).toBe('password');
    });
  });

  describe('POST /auth/team-users', () => {
    const newTeamUser = (role, identifier, zone) => ({
      nom: 'Equipe',
      prenom: 'Djua',
      identifier,
      whatsapp: '+243812345678',
      password: 'Password123!',
      role,
      zone,
    });

    it('should let admins create only shop managers and admins, not technicians or commercial users', async () => {
      const { cookie } = await createSession('admin');
      const shop = await createShop(cookie, 'Shop des techniciens');
      const deniedMembers = await Promise.all(['technician', 'commercial'].map(role => request(app)
        .post('/auth/team-users')
        .set('Cookie', cookie)
        .send({
          ...newTeamUser(role, `admin-${role}-${Date.now()}@example.com`, 'Kinshasa'),
          shopId: shop.body.data._id,
        })));
      const manager = await request(app)
        .post('/auth/team-users')
        .set('Cookie', cookie)
        .send({
          ...newTeamUser('shop_manager', `assigned-manager-${Date.now()}@example.com`, 'Autre région'),
          shopId: shop.body.data._id,
        });

      expect(deniedMembers.map(response => response.status)).toEqual([403, 403]);
      expect(manager.status).toBe(201);
      expect(manager.body.data.role).toBe('shop_manager');
      expect(manager.body.data.zone).toBe('Kinshasa');
      expect(manager.body.data.shopId._id).toBe(shop.body.data._id);
    });

    it('should allow an admin to create another admin without assigning a zone', async () => {
      const { cookie } = await createSession('admin');
      const res = await request(app)
        .post('/auth/team-users')
        .set('Cookie', cookie)
        .send(newTeamUser('admin', `second-admin-${Date.now()}@example.com`, ''));

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('admin');
      expect(res.body.data.zone).toBe('');
    });

    it('should allow admin-created accounts without an optional WhatsApp number', async () => {
      const { cookie } = await createSession('admin');
      const shop = await createShop(cookie);

      for (const [role, zone] of [['shop_manager', 'Kinshasa'], ['admin', '']]) {
        const res = await request(app)
          .post('/auth/team-users')
          .set('Cookie', cookie)
          .send({
            ...newTeamUser(role, `${role}-no-whatsapp-${Date.now()}@example.com`, zone),
            whatsapp: '',
            ...(role === 'shop_manager' ? { shopId: shop.body.data._id } : {}),
          });

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe(role);
        expect(res.body.data.whatsapp).toBe('');
      }
    });

    it('should let an admin manage non-admin team accounts without suspending admins', async () => {
      const { cookie } = await createSession('admin');
      const identifier = `admin-manager-${Date.now()}@example.com`;
      const shop = await createShop(cookie);
      const created = await request(app)
        .post('/auth/team-users')
        .set('Cookie', cookie)
        .send({
          ...newTeamUser('shop_manager', identifier, 'Kinshasa'),
          shopId: shop.body.data._id,
        });
      expect(created.status).toBe(201);

      const listed = await request(app).get('/auth/team-users').set('Cookie', cookie);
      expect(listed.status).toBe(200);
      expect(listed.body.data.map(member => member._id)).toContain(created.body.data._id);

      const managerLogin = await request(app)
        .post('/auth/login')
        .send({ identifier, password: 'Password123!' });
      const technician = await request(app)
        .post('/auth/team-users')
        .set('Cookie', managerLogin.headers['set-cookie'])
        .send(newTeamUser('technician', `shop-tech-${Date.now()}@example.com`, 'Kinshasa'));
      const managerTeam = await request(app)
        .get('/auth/team-users')
        .set('Cookie', managerLogin.headers['set-cookie']);

      expect(technician.status).toBe(201);
      expect(managerTeam.status).toBe(200);
      expect(managerTeam.body.data.find(member => member._id === technician.body.data._id)?.shopId.name).toBe(shop.body.data.name);

      const forbiddenRoleChange = await request(app)
        .patch(`/auth/team-users/${created.body.data._id}`)
        .set('Cookie', cookie)
        .send({ role: 'technician' });
      expect(forbiddenRoleChange.status).toBe(403);

      const suspended = await request(app)
        .patch(`/auth/team-users/${created.body.data._id}/status`)
        .set('Cookie', cookie)
        .send({ status: 'suspended' });
      expect(suspended.status).toBe(200);

      const protectedAdmin = await User.create({
        nom: 'Protected',
        prenom: 'Admin',
        identifier: `protected-admin-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'admin',
      });
      const protectedStatus = await request(app)
        .patch(`/auth/team-users/${protectedAdmin._id}/status`)
        .set('Cookie', cookie)
        .send({ status: 'suspended' });
      expect(protectedStatus.status).toBe(404);
      expect((await User.findById(protectedAdmin._id)).status).toBe('active');
    });

    it('should assign a manager zone to technicians and commercial users', async () => {
      const { cookie, identifier } = await createSession('shop_manager', 'Goma');
      const manager = await User.findOne({ identifier });
      const shop = await Shop.create({
        name: `Shop manager ${Date.now()}`,
        address: '12 Avenue de la Paix',
        region: 'Goma',
        createdBy: manager._id,
      });
      manager.shopId = shop._id;
      await manager.save();

      for (const role of ['technician', 'commercial']) {
        const res = await request(app)
          .post('/auth/team-users')
          .set('Cookie', cookie)
          .send(newTeamUser(role, `${role}@example.com`, 'Autre zone'));

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe(role);
        expect(res.body.data.zone).toBe('Goma');
        expect(res.body.data.shopId._id).toBe(String(shop._id));
        expect(res.body.data.mustChangePassword).toBe(role === 'technician');
      }
    });

    it('should list, suspend, and delete only the manager team members', async () => {
      const { cookie } = await createSession('shop_manager', 'Goma');
      const created = await request(app)
        .post('/auth/team-users')
        .set('Cookie', cookie)
        .send(newTeamUser('technician', 'managed-tech@example.com', 'Goma'));
      const memberId = created.body.data._id;
      const memberSession = await request(app)
        .post('/auth/login')
        .send({ identifier: 'managed-tech@example.com', password: 'Password123!' });

      expect(created.status).toBe(201);
      expect(created.body.data.mustChangePassword).toBe(true);
      expect(memberSession.body.data.mustChangePassword).toBe(true);

      const list = await request(app).get('/auth/team-users').set('Cookie', cookie);
      expect(list.status).toBe(200);
      expect(list.body.data.map(member => member._id)).toContain(memberId);

      const suspended = await request(app)
        .patch(`/auth/team-users/${memberId}/status`)
        .set('Cookie', cookie)
        .send({ status: 'suspended' });
      expect(suspended.status).toBe(200);

      const activeSession = await request(app).get('/auth/me').set('Cookie', memberSession.headers['set-cookie']);
      const newLogin = await request(app)
        .post('/auth/login')
        .send({ identifier: 'managed-tech@example.com', password: 'Password123!' });
      expect(activeSession.status).toBe(403);
      expect(newLogin.status).toBe(403);

      const deleted = await request(app).delete(`/auth/team-users/${memberId}`).set('Cookie', cookie);
      const afterDelete = await request(app).get('/auth/team-users').set('Cookie', cookie);
      expect(deleted.status).toBe(200);
      expect(afterDelete.body.data).toHaveLength(0);
    });

    it('should reject a manager trying to create another manager', async () => {
      const { cookie } = await createSession('shop_manager', 'Goma');
      const res = await request(app)
        .post('/auth/team-users')
        .set('Cookie', cookie)
        .send(newTeamUser('shop_manager', 'second-manager@example.com', 'Goma'));

      expect(res.status).toBe(403);
    });

    it('should reject team account creation without authentication', async () => {
      const res = await request(app)
        .post('/auth/team-users')
        .send(newTeamUser('shop_manager', 'anonymous-manager@example.com', 'Kinshasa'));

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/technicians', () => {
    it('should list only technicians belonging to the commercial user shop manager', async () => {
      const suffix = Date.now();
      const manager = await User.create({
        nom: 'Manager',
        prenom: 'Shop',
        identifier: `technicians-manager-${suffix}@example.com`,
        password: 'Password123!',
        role: 'shop_manager',
      });
      const otherManager = await User.create({
        nom: 'Other',
        prenom: 'Manager',
        identifier: `technicians-other-manager-${suffix}@example.com`,
        password: 'Password123!',
        role: 'shop_manager',
      });
      const commercial = await User.create({
        nom: 'Commercial',
        prenom: 'Shop',
        identifier: `technicians-commercial-${suffix}@example.com`,
        password: 'Password123!',
        role: 'commercial',
        createdBy: manager._id,
      });
      const managerTechnician = await User.create({
        nom: 'Technician',
        prenom: 'Same Shop',
        identifier: `technicians-same-shop-${suffix}@example.com`,
        password: 'Password123!',
        role: 'technician',
        createdBy: manager._id,
      });
      await User.create({
        nom: 'Technician',
        prenom: 'Other Shop',
        identifier: `technicians-other-shop-${suffix}@example.com`,
        password: 'Password123!',
        role: 'technician',
        createdBy: otherManager._id,
      });
      await User.create({
        nom: 'Technician',
        prenom: 'Commercial Created',
        identifier: `technicians-commercial-created-${suffix}@example.com`,
        password: 'Password123!',
        role: 'technician',
        createdBy: commercial._id,
      });
      const login = await request(app)
        .post('/auth/login')
        .send({ identifier: commercial.identifier, password: 'Password123!' });

      const response = await request(app)
        .get('/auth/technicians')
        .set('Cookie', login.headers['set-cookie']);

      expect(response.status).toBe(200);
      expect(response.body.data.map(technician => technician._id)).toEqual([String(managerTechnician._id)]);
    });

    it('should return no technicians to a commercial without a shop manager', async () => {
      const { cookie } = await createSession('commercial');

      const response = await request(app)
        .get('/auth/technicians')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /auth/login', () => {
    it('should log in successfully and set the HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          identifier: userData.identifier,
          password: userData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.identifier).toBe(userData.identifier.toLowerCase());

      // Verify the cookie header is returned
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should fail to log in with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          identifier: userData.identifier,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow a technician to change the initial password without losing the session', async () => {
      const identifier = 'first-login-tech@example.com';
      await User.create({
        nom: 'Technicien',
        prenom: 'Test',
        identifier,
        password: 'Password123!',
        role: 'technician',
        zone: 'Goma',
        mustChangePassword: true,
      });
      const login = await request(app).post('/auth/login').send({ identifier, password: 'Password123!' });
      const changed = await request(app)
        .patch('/auth/password')
        .set('Cookie', login.headers['set-cookie'])
        .send({ currentPassword: 'Password123!', newPassword: 'NewPassword456!' });
      const nextLogin = await request(app).post('/auth/login').send({ identifier, password: 'NewPassword456!' });

      expect(login.body.data.mustChangePassword).toBe(true);
      expect(changed.status).toBe(200);
      expect(changed.body.data.mustChangePassword).toBe(false);
      expect(nextLogin.status).toBe(200);
      expect(nextLogin.body.data.mustChangePassword).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('should deny profile access without authorization cookie', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow profile access with a valid token cookie', async () => {
      // Login to obtain the cookie
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          identifier: userData.identifier,
          password: userData.password,
        });

      const tokenCookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', tokenCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.identifier).toBe(userData.identifier.toLowerCase());
      expect(res.body.data.nom).toBe(userData.nom);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the token cookie', async () => {
      const res = await request(app).post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=;');
    });
  });
});
