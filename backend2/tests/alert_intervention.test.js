import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import User from '../src/models/user.model.js';
import Kit from '../src/models/kit.model.js';
import Alert from '../src/models/Alert.model.js';
import { Intervention } from '../src/models/Intervention.model.js';

describe('Shop Manager Alert & Intervention Workflows - Integration Tests', () => {
  let managerUser;
  let managerCookie;
  let otherManagerUser;
  let otherManagerCookie;
  let techUser;
  let techCookie;
  let outsideTechUser;
  let seniorTechUser;
  let testKit;
  let outsideZoneKit;

  beforeAll(async () => {
    await connectDB();

    // 1. Créer Shop Manager principal (Zone: Gombe)
    managerUser = await User.create({
      nom: 'Manager',
      prenom: 'Gombe',
      identifier: 'manager.gombe@test.com',
      password: 'Password123!',
      role: 'shop_manager',
      zone: 'Gombe',
      status: 'active',
    });
    const mRes = await request(app).post('/auth/login').send({
      identifier: 'manager.gombe@test.com',
      password: 'Password123!',
    });
    managerCookie = mRes.headers['set-cookie'];

    // 2. Créer un autre Shop Manager (Zone: Limete)
    otherManagerUser = await User.create({
      nom: 'Manager',
      prenom: 'Limete',
      identifier: 'manager.limete@test.com',
      password: 'Password123!',
      role: 'shop_manager',
      zone: 'Limete',
      status: 'active',
    });
    const omRes = await request(app).post('/auth/login').send({
      identifier: 'manager.limete@test.com',
      password: 'Password123!',
    });
    otherManagerCookie = omRes.headers['set-cookie'];

    // 3. Technicien créé par managerUser dans sa zone
    techUser = await User.create({
      nom: 'Technicien',
      prenom: 'Junior',
      identifier: 'tech.junior@test.com',
      password: 'Password123!',
      role: 'technician',
      zone: 'Gombe',
      seniority: 'junior',
      status: 'active',
      createdBy: managerUser._id,
    });
    const tRes = await request(app).post('/auth/login').send({
      identifier: 'tech.junior@test.com',
      password: 'Password123!',
    });
    techCookie = tRes.headers['set-cookie'];

    // 4. Technicien créé par otherManagerUser (Zone Limete)
    outsideTechUser = await User.create({
      nom: 'Technicien',
      prenom: 'Outside',
      identifier: 'tech.outside@test.com',
      password: 'Password123!',
      role: 'technician',
      zone: 'Limete',
      seniority: 'junior',
      status: 'active',
      createdBy: otherManagerUser._id,
    });

    // 5. Technicien Senior assigné à la zone Gombe (créé par admin)
    seniorTechUser = await User.create({
      nom: 'Technicien',
      prenom: 'Senior',
      identifier: 'tech.senior@test.com',
      password: 'Password123!',
      role: 'technician',
      zone: 'Gombe',
      seniority: 'senior',
      status: 'active',
    });

    // 6. Kit sous la responsabilité de la zone Gombe
    testKit = await Kit.create({
      kitId: 'KIT-GOMBE-001',
      clientPhone: '+243810000001',
      offerName: 'DJUA_FAMILY',
      zone: 'Gombe',
      status: 'active',
    });

    // 7. Kit dans une autre zone (Limete)
    outsideZoneKit = await Kit.create({
      kitId: 'KIT-LIMETE-001',
      clientPhone: '+243810000002',
      offerName: 'DJUA_PRO',
      zone: 'Limete',
      status: 'active',
    });
  });

  afterAll(async () => {
    await Alert.deleteMany({});
    await Intervention.deleteMany({});
    await Kit.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 1: ALERTES MANUELLES
  // ═════════════════════════════════════════════════════════════════════════════

  describe('Alert Management & Security Controls', () => {
    let createdAlertId;

    it('should allow shop_manager to create a manual alert and assign it to their technician', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Cookie', managerCookie)
        .send({
          kitId: testKit.kitId,
          type: 'manual',
          severity: 'high',
          label: 'Anomalie batterie signalée par le client',
          description: 'Le client signale une baisse rapide de tension le soir.',
          notes: 'Intervenir avant 16h',
          assignedTo: techUser._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.source).toBe('manual');
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.assignedTo._id.toString()).toBe(techUser._id.toString());
      createdAlertId = res.body.data._id;
    });

    it('should allow shop_manager to assign a senior technician in their zone', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Cookie', managerCookie)
        .send({
          kitId: testKit.kitId,
          type: 'manual',
          severity: 'critical',
          label: 'Court-circuit onduleur',
          description: 'Intervention d urgence requise par un senior',
          assignedTo: seniorTechUser._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedTo._id.toString()).toBe(seniorTechUser._id.toString());
    });

    it('should prevent IDOR: shop_manager CANNOT assign a technician from another zone/team', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Cookie', managerCookie)
        .send({
          kitId: testKit.kitId,
          type: 'manual',
          severity: 'medium',
          label: 'Test IDOR technician',
          description: 'Tentative d assignation hors périmètre',
          assignedTo: outsideTechUser._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('équipe');
    });

    it('should prevent cross-zone kit manipulation: cannot create alert for kit outside zone', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Cookie', managerCookie)
        .send({
          kitId: outsideZoneKit.kitId,
          type: 'manual',
          severity: 'medium',
          label: 'Alerte cross-zone illégitime',
          description: 'Tentative de création sur un kit de Limete par manager de Gombe',
          assignedTo: techUser._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('hors de votre zone');
    });

    it('should prevent RBAC violation: technician cannot create alerts', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Cookie', techCookie)
        .send({
          kitId: testKit.kitId,
          type: 'manual',
          severity: 'low',
          label: 'Tentative technicien',
          description: 'Un technicien ne doit pas pouvoir créer une alerte',
          assignedTo: techUser._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should filter alerts by role: technician only sees their assigned alerts', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .set('Cookie', techCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((alert) => {
        const assignedId = alert.assignedTo?._id?.toString() || alert.assignedTo?.toString();
        expect(assignedId).toBe(techUser._id.toString());
      });
    });

    it('should allow assigned technician to acknowledge and resolve alert', async () => {
      // 1. Acknowledge
      const ackRes = await request(app)
        .patch(`/api/alerts/${createdAlertId}/status`)
        .set('Cookie', techCookie)
        .send({ status: 'acknowledged' });

      expect(ackRes.status).toBe(200);
      expect(ackRes.body.data.status).toBe('acknowledged');

      // 2. Resolve
      const resRes = await request(app)
        .patch(`/api/alerts/${createdAlertId}/status`)
        .set('Cookie', techCookie)
        .send({ status: 'resolved' });

      expect(resRes.status).toBe(200);
      expect(resRes.body.data.status).toBe('resolved');
      expect(resRes.body.data).toHaveProperty('resolvedAt');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 2: INTERVENTIONS & MAINTENANCES
  // ═════════════════════════════════════════════════════════════════════════════

  describe('Intervention Management & Security Controls', () => {
    let createdInterventionId;

    it('should allow shop_manager to create an intervention and assign a technician', async () => {
      const res = await request(app)
        .post('/api/interventions')
        .set('Cookie', managerCookie)
        .send({
          kitId: testKit.kitId,
          title: 'Maintenance préventive panneaux solaires',
          description: 'Nettoyage des modules et vérification du câblage DC.',
          type: 'maintenance',
          priority: 'Haute',
          assignedTo: techUser._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.status).toBe('Planifiée');
      expect(res.body.data.assignedTo._id.toString()).toBe(techUser._id.toString());
      createdInterventionId = res.body.data._id;
    });

    it('should prevent technician from creating interventions', async () => {
      const res = await request(app)
        .post('/api/interventions')
        .set('Cookie', techCookie)
        .send({
          kitId: testKit.kitId,
          title: 'Tentative création intervention',
          description: 'Non autorisé',
          assignedTo: techUser._id.toString(),
        });

      expect(res.status).toBe(403);
    });

    it('should allow assigned technician to progress status to "En cours" and "Terminée"', async () => {
      // 1. Passage en cours
      const inProgressRes = await request(app)
        .patch(`/api/interventions/${createdInterventionId}/status`)
        .set('Cookie', techCookie)
        .send({ status: 'En cours' });

      expect(inProgressRes.status).toBe(200);
      expect(inProgressRes.body.data.status).toBe('En cours');

      // 2. Passage terminée
      const doneRes = await request(app)
        .patch(`/api/interventions/${createdInterventionId}/status`)
        .set('Cookie', techCookie)
        .send({ status: 'Terminée' });

      expect(doneRes.status).toBe(200);
      expect(doneRes.body.data.status).toBe('Terminée');
      expect(doneRes.body.data).toHaveProperty('completedAt');
    });

    it('should forbid technician from cancelling intervention ("Annulée" is manager only)', async () => {
      const res = await request(app)
        .patch(`/api/interventions/${createdInterventionId}/status`)
        .set('Cookie', techCookie)
        .send({ status: 'Annulée' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('En cours');
    });

    it('should allow assigned technician to submit an intervention report', async () => {
      const res = await request(app)
        .patch(`/api/interventions/${createdInterventionId}/report`)
        .set('Cookie', techCookie)
        .send({
          report: 'Maintenance terminée avec succès. Tension à vide: 21.4V, connecteurs nettoyés.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report).toContain('Tension à vide: 21.4V');
    });

    it('should prevent outside technician from submitting a report for another technician’s intervention', async () => {
      const outsideRes = await request(app).post('/auth/login').send({
        identifier: 'tech.outside@test.com',
        password: 'Password123!',
      });
      const outsideCookie = outsideRes.headers['set-cookie'];

      const res = await request(app)
        .patch(`/api/interventions/${createdInterventionId}/report`)
        .set('Cookie', outsideCookie)
        .send({
          report: 'Tentative illégitime de soumission de rapport.',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('pas le technicien assigné');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 3: COMMERCIAL RBAC BOUNDARY (Commercial strictly restricted to quotes)
  // ═════════════════════════════════════════════════════════════════════════════

  describe('Commercial Strict RBAC Boundary', () => {
    let commercialCookie;

    beforeAll(async () => {
      await User.create({
        nom: 'Commercial',
        prenom: 'Gombe',
        identifier: 'commercial.gombe@test.com',
        password: 'Password123!',
        role: 'commercial',
        zone: 'Gombe',
        status: 'active',
      });

      const res = await request(app).post('/auth/login').send({
        identifier: 'commercial.gombe@test.com',
        password: 'Password123!',
      });
      commercialCookie = res.headers['set-cookie'];
    });

    it('should forbid commercial user from accessing interventions (strictly devis only)', async () => {
      const res = await request(app)
        .get('/api/interventions')
        .set('Cookie', commercialCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid commercial user from accessing alerts', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .set('Cookie', commercialCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 4: TECHNICIAN SCAN, SIGNAL & KNOWLEDGE SHARING
  // ═════════════════════════════════════════════════════════════════════════════

  describe('Kit Scan, Signal & Knowledge Sharing for Technicians', () => {
    let techBCookie;

    beforeAll(async () => {
      // Technicien B (différent du technicien A qui a réalisé la maintenance précédente)
      await User.create({
        nom: 'Technicien',
        prenom: 'Second',
        identifier: 'tech.second@test.com',
        password: 'Password123!',
        role: 'technician',
        zone: 'Gombe',
        seniority: 'senior',
        status: 'active',
      });

      const res = await request(app).post('/auth/login').send({
        identifier: 'tech.second@test.com',
        password: 'Password123!',
      });
      techBCookie = res.headers['set-cookie'];
    });

    it('should return complete scan history including past reports from other technicians when scanning a kit', async () => {
      const res = await request(app)
        .get(`/api/kits/${testKit.kitId}/scan-history`)
        .set('Cookie', techBCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exists).toBe(true);
      expect(res.body.data.kit.kitId).toBe(testKit.kitId);

      // Signal IoT
      expect(res.body.data).toHaveProperty('signal');
      expect(res.body.data.signal).toHaveProperty('isOnline');

      // Knowledge sharing : Technicien B voit le rapport complet rédigé par Technicien A
      expect(Array.isArray(res.body.data.interventions)).toBe(true);
      expect(res.body.data.interventions.length).toBeGreaterThan(0);
      const pastIntervention = res.body.data.interventions[0];
      expect(pastIntervention.report).toContain('Tension à vide: 21.4V');
      expect(pastIntervention.assignedTo.identifier).toBe('tech.junior@test.com');
    });

    it('should report exists: false when scanning an unknown kit', async () => {
      const res = await request(app)
        .get('/api/kits/KIT-UNKNOWN-999/scan-history')
        .set('Cookie', techBCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.exists).toBe(false);
    });

    it('should reject unauthenticated scan request', async () => {
      const res = await request(app)
        .get(`/api/kits/${testKit.kitId}/scan-history`);

      expect(res.status).toBe(401);
    });
  });
});
