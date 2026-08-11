import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import User from '../src/models/user.model.js';

describe('Authentication API - Integration Tests', () => {
  beforeAll(async () => {
    // Connect to the in-memory MongoDB server started by global.setup.js
    await connectDB();
  });

  afterAll(async () => {
    // Clean up DB and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  const userData = {
    nom: 'Doe',
    prenom: 'John',
    postNom: 'Mamba',
    identifier: 'john.doe@example.com',
    password: 'Password123!',
  };

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
