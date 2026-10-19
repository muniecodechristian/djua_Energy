import mongoose from 'mongoose';
import User from '../models/user.model.js';
import config from '../config/env.config.js';

// Demo accounts only. Existing accounts are verified, never deleted or reset.
const PASSWORD = 'Djua2026!';
const ZONE = 'Kinshasa';
const accounts = [
  { identifier: 'shop@djua.test', prenom: 'Responsable', role: 'shop_manager' },
  { identifier: 'tech@djua.test', prenom: 'Technicien', role: 'technician' },
  { identifier: 'commercial@djua.test', prenom: 'Commercial', role: 'commercial' },
];

async function seedTeam() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
    await User.init();
    // Preflight all identifiers before creating anything.
    const existing = await User.find({ identifier: { $in: accounts.map(a => a.identifier) } }).select('+password');
    const manager = existing.find(u => u.identifier === accounts[0].identifier);
    for (const account of accounts) {
      const user = existing.find(u => u.identifier === account.identifier);
      if (!user) continue;
      const correctParent = account.role === 'shop_manager' || (manager && String(user.createdBy) === String(manager._id));
      if (user.role !== account.role || user.zone !== ZONE || user.status !== 'active' || !correctParent || !(await user.comparePassword(PASSWORD))) {
        throw new Error(`Account conflict: ${account.identifier}. Existing account was not changed.`);
      }
    }
    let parent = manager;
    const result = [];
    for (const account of accounts) {
      let user = existing.find(u => u.identifier === account.identifier);
      let created = false;
      if (!user) {
        user = await User.create({
          ...account, nom: 'Equipe Demo', password: PASSWORD, zone: ZONE,
          status: 'active', mustChangePassword: false,
          createdBy: account.role === 'shop_manager' ? null : parent._id,
          ...(account.role === 'technician' ? { seniority: 'senior' } : {}),
        });
        created = true;
      }
      if (account.role === 'shop_manager') parent = user;
      result.push({ identifier: user.identifier, role: user.role, zone: user.zone, created });
    }
    // Read persisted documents and check hashed passwords and ownership.
    const saved = await User.find({ identifier: { $in: accounts.map(a => a.identifier) } }).select('+password');
    for (const account of accounts) {
      const user = saved.find(u => u.identifier === account.identifier);
      if (!user || user.password === PASSWORD || !(await user.comparePassword(PASSWORD))) throw new Error('Password verification failed.');
      if (account.role !== 'shop_manager' && String(user.createdBy) !== String(parent._id)) throw new Error('Team ownership verification failed.');
    }
    console.log(`Demo team verified in database: ${mongoose.connection.name}`);
    console.table(result);
    console.log('Shared demo password: ' + PASSWORD);
    console.log('Technician and commercial are linked to shop@djua.test via createdBy.');
  } catch (error) {
    console.error(error.message.startsWith('Account conflict:') ? error.message : `Team seed failed (${error.name}). Check database connectivity/configuration. No existing password was reset.`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await seedTeam();
