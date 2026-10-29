import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';
import config from '../src/config/env.config.js';
import User from '../src/models/user.model.js';
import Quote from '../src/models/Quote.model.js';
import Client from '../src/models/SalesClient.model.js';
import Notice from '../src/models/InstallationNotice.model.js';
import Kit from '../src/models/kit.model.js';
import { businessDay, validPlannedDate } from '../src/services/quote.service.js';
let manager,commercial,other,technician,admin,outsider;
const cookie=user=>`token=${jwt.sign({id:String(user._id)},config.jwtSecret,{expiresIn:'1h'})}`;
const body=(requestKey='test-request-001',phone='0812345678')=>({requestKey,customer:{name:'Équipe Kabeya',phone,email:'client@example.com',profile:'personne',details:{contactPref:'WhatsApp'}},site:{adresse:'Avenue du test',ville:'Kinshasa'},system:{panels:4,panelPower:450,batteryCapacity:4.8,inverterPower:3},appliances:[{name:'Télévision',quantity:2,watts:80,hours:5,period:'night'}],amount:2500,currency:'USD'});
const save=async(key,phone)=>{const response=await request(app).post('/api/quotes').set('Cookie',cookie(commercial)).send(body(key,phone));expect(response.status).toBe(201);return response.body.data;};
const approve=async(quote,date=businessDay())=>{const response=await request(app).patch(`/api/quotes/${quote.number}/approve`).set('Cookie',cookie(commercial)).send({plannedDate:date});expect(response.status).toBe(200);return response.body.data;};
const install=(quote,kitId='KIT-QUOTE-001')=>request(app).post('/api/kits').set('Cookie',cookie(technician)).send({kitId,source:'quote',quoteId:quote.number,clientPhone:'00000000',installationDate:'2000-01-01',system:{panels:999},appliances:[],gpsCoordinates:{latitude:-4.32,longitude:15.31}});
describe('Customer quotations and installation lifecycle',()=>{
 beforeAll(async()=>{
  await connectDB();
  await Promise.all([Quote.init(),Client.init(),Notice.init(),Kit.init()]);
  const make=(role,identifier,createdBy)=>User.create({nom:'Test',prenom:role,identifier,password:'TestPass123!',role,createdBy});
  manager=await make('shop_manager','quote-manager@test.local');
  commercial=await make('commercial','quote-sales@test.local',manager._id);
  other=await make('commercial','quote-other@test.local',manager._id);
  technician=await make('technician','quote-tech@test.local',manager._id);
  admin=await make('admin','quote-admin@test.local');
  outsider=await make('technician','quote-outside@test.local',admin._id);
 });
 beforeEach(async()=>{await Promise.all([Quote.deleteMany({}),Client.deleteMany({}),Notice.deleteMany({}),Kit.deleteMany({})]);});
 afterAll(async()=>{await Promise.all([Quote.deleteMany({}),Client.deleteMany({}),Notice.deleteMany({}),Kit.deleteMany({}),User.deleteMany({identifier:/quote-.*@test\.local$/})]);await mongoose.connection.close();});
 it('reuses one customer for local and international phone formats and lists all their quotes',async()=>{
  const first=await save('customer-quote-001');const second=await save('customer-quote-002','+243 812 345 678');
  expect(first.client).toBe(second.client);expect(await Client.countDocuments()).toBe(1);
  for(const search of ['kabeya','equipe','0812345678','+243812345678']){
   const response=await request(app).get('/api/quotes').query({search}).set('Cookie',cookie(commercial));
   expect(response.status).toBe(200);expect(response.body.data.total).toBe(2);
  }
  expect(second.customer.details.contactPref).toBe('WhatsApp');
 });
 it('stores the client postnom and indicative budget in quote details',async()=>{
  const payload=body('client-details-budget-001');
  payload.customer.details={postNom:'Mukendi',budget:120,budgetPeriod:'month',budgetCurrency:'USD'};
  const response=await request(app).post('/api/quotes').set('Cookie',cookie(commercial)).send(payload);
  expect(response.status).toBe(201);
  expect(response.body.data.customer.details).toMatchObject({postNom:'Mukendi',budget:120,budgetPeriod:'month',budgetCurrency:'USD'});
 });
 it('returns a role-scoped dashboard summary with follow-up quotes and installed kit ids',async()=>{
  const quote=await save('dashboard-summary-001');
  const createdAt=new Date(Date.now()-4*24*60*60*1000);
  const storedQuote=await Quote.findOne({number:quote.number}).select('_id');
  await Quote.collection.collection.updateOne({_id:storedQuote._id},{$set:{createdAt,kitId:'KIT-DASHBOARD-001'}});
  expect((await Quote.findById(quote._id)).createdAt.getTime()).toBe(createdAt.getTime());
  const response=await request(app).get('/api/quotes').set('Cookie',cookie(commercial));
  expect(response.status).toBe(200);
  expect(response.body.data.stats.draftsToFollowUp).toBe(1);
  expect(response.body.data.followUps.map(item=>item.number)).toContain(quote.number);
  expect(response.body.data.kitIds).toContain('KIT-DASHBOARD-001');
  const otherResponse=await request(app).get('/api/quotes').set('Cookie',cookie(other));
  expect(otherResponse.body.data.stats.draftsToFollowUp).toBe(0);
  expect(otherResponse.body.data.kitIds).toEqual([]);
 });
 it('filters validated quotes as a group while keeping summary amounts role-scoped and split by currency',async()=>{
  const draft=await save('dashboard-filter-draft');
  const approved=await save('dashboard-filter-approved');
  const installing=await save('dashboard-filter-installing');
  const installed=await save('dashboard-filter-installed');
  await Quote.updateOne({number:approved.number},{$set:{status:'approved',amount:200}});
  await Quote.updateOne({number:installing.number},{$set:{status:'installing',amount:300,currency:'CDF'}});
  await Quote.updateOne({number:installed.number},{$set:{status:'installed',amount:400,currency:'CDF'}});
  const createdAt=new Date(Date.now()-4*24*60*60*1000);
  await Quote.collection.collection.updateOne({number:draft.number},{$set:{createdAt,amount:100}});

  const validated=await request(app).get('/api/quotes').query({status:'validated'}).set('Cookie',cookie(commercial));
  expect(validated.status).toBe(200);
  expect(validated.body.data.quotes.map(item=>item.status).sort()).toEqual(['approved','installed','installing']);
  expect(validated.body.data.total).toBe(3);
  expect(validated.body.data.stats.total).toBe(4);
  expect(validated.body.data.stats.valuePendingByCurrency).toEqual({USD:300,CDF:300});

  const followUps=await request(app).get('/api/quotes').query({followUp:'true'}).set('Cookie',cookie(commercial));
  expect(followUps.status).toBe(200);
  expect(followUps.body.data.quotes.map(item=>item.number)).toEqual([draft.number]);
  expect(followUps.body.data.total).toBe(1);
 });
 it('is idempotent for retries, including parallel saves',async()=>{
  const results=await Promise.all([1,2].map(()=>request(app).post('/api/quotes').set('Cookie',cookie(commercial)).send(body())));
  expect(results.every(item=>[200,201].includes(item.status))).toBe(true);
  expect(await Quote.countDocuments()).toBe(1);expect(await Client.countDocuments()).toBe(1);
 });
 it('enforces authentication, commercial ownership and shop access',async()=>{
  const quote=await save('access-quote-001');
  expect((await request(app).get('/api/quotes')).status).toBe(401);
  expect((await request(app).get('/api/quotes').set('Cookie',cookie(other))).body.data.total).toBe(0);
  expect((await request(app).get('/api/quotes').set('Cookie',cookie(manager))).body.data.total).toBe(1);
  expect((await request(app).get('/api/quotes').set('Cookie',cookie(admin))).body.data.total).toBe(1);
    expect((await request(app).get(`/api/quotes/${quote.number}`).set('Cookie',cookie(outsider))).status).toBe(403);
  expect((await request(app).post('/api/quotes').set('Cookie',cookie(technician)).send(body())).status).toBe(403);
  expect((await request(app).patch(`/api/quotes/${quote.number}/approve`).set('Cookie',cookie(other)).send({plannedDate:businessDay()})).status).toBe(404);
 });
 it('requires a real date today or later and blocks installation before approval',async()=>{
  const quote=await save('date-quote-001');
  for(const plannedDate of [undefined,'2000-01-01','2027-02-30','tomorrow'])expect((await request(app).patch(`/api/quotes/${quote.number}/approve`).set('Cookie',cookie(commercial)).send({plannedDate})).status).toBe(400);
  expect((await install(quote)).status).toBe(409);
  expect((await request(app).get(`/api/quotes/${quote.number}`).set('Cookie',cookie(technician))).status).toBe(409);
  await approve(quote);
  expect((await request(app).get(`/api/quotes/${quote.number}`).set('Cookie',cookie(technician))).body.data.appliances[0].name).toBe('Télévision');
 });
 it('uses server quote data and server installation date, preserves appliances and supports retries',async()=>{
  const quote=await approve(await save('install-quote-001'));
  const response=await install(quote);expect(response.status).toBe(201);
  expect(response.body.data.system.panels).toBe(4);expect(response.body.data.appliances[0].quantity).toBe(2);
  expect(response.body.data.clientPhone).toBe('243812345678');expect(response.body.data.shopManager).toBe(String(manager._id));
  const record=await Quote.findById(quote._id);expect(record.status).toBe('installed');expect(record.dateMatched).toBe(true);
  expect(await Notice.countDocuments()).toBe(0);
  expect((await install(quote)).status).toBe(200);expect(await Kit.countDocuments()).toBe(1);
  expect((await install(quote,'KIT-QUOTE-OTHER')).status).toBe(409);
 });
 it('permits multiple quoted kits for the same client while claiming each quote once',async()=>{
  const first=await approve(await save('multiple-kit-001'));const second=await approve(await save('multiple-kit-002'));
  expect((await install(first,'KIT-FIRST')).status).toBe(201);expect((await install(second,'KIT-SECOND')).status).toBe(201);
  expect(await Kit.countDocuments({clientPhone:'243812345678'})).toBe(2);
 });
 it('creates one seven-day alert visible only to the owner, manager and admin',async()=>{
  const tomorrow=businessDay(new Date(Date.now()+86400000));
  const quote=await approve(await save('alert-quote-001'),tomorrow);
  expect((await install(quote)).status).toBe(201);
  const notice=await Notice.findOne();expect(notice.plannedDate).toBe(tomorrow);expect(notice.installedDay).toBe(businessDay());
  expect(notice.expiresAt.getTime()-new Date((await Kit.findOne()).createdAt).getTime()).toBe(7*86400000);
  await install(quote);expect(await Notice.countDocuments()).toBe(1);expect((await Notice.findOne()).expiresAt).toEqual(notice.expiresAt);
  for(const user of [commercial,manager,admin])expect((await request(app).get('/api/quotes').set('Cookie',cookie(user))).body.data.notices).toHaveLength(1);
  expect((await request(app).get('/api/quotes').set('Cookie',cookie(other))).body.data.notices).toHaveLength(0);
  await Notice.updateOne({_id:notice._id},{$set:{expiresAt:new Date(Date.now()-1000)}});
  expect((await request(app).get('/api/quotes').set('Cookie',cookie(commercial))).body.data.notices).toHaveLength(0);
  expect((await Notice.collection.indexes()).some(index=>index.key.expiresAt===1 && index.expireAfterSeconds===0)).toBe(true);
 });
 it('claims an approved quote only once during concurrent kit registrations',async()=>{
  const quote=await approve(await save('concurrent-001'));
  const responses=await Promise.all([install(quote,'KIT-A'),install(quote,'KIT-B')]);
  expect(responses.map(item=>item.status).sort()).toEqual([201,409]);expect(await Kit.countDocuments()).toBe(1);
 });
 it('rejects incomplete quotes and treats search metacharacters as literal text',async()=>{
  expect((await request(app).post('/api/quotes').set('Cookie',cookie(commercial)).send({...body(),appliances:[]})).status).toBe(400);
  await save('search-quote-001');const response=await request(app).get('/api/quotes').query({search:'.*'}).set('Cookie',cookie(commercial));expect(response.body.data.total).toBe(0);
 });
 it('uses the Kinshasa calendar across UTC midnight boundaries',()=>{
  expect(businessDay(new Date('2026-10-19T23:30:00Z'))).toBe('2026-10-20');
  expect(validPlannedDate('2026-10-19',new Date('2026-10-19T23:30:00Z'))).toBe(false);
  expect(validPlannedDate('2026-10-20',new Date('2026-10-19T23:30:00Z'))).toBe(true);
 });
});
