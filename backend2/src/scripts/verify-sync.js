import mongoose from 'mongoose';
import dotenv from 'dotenv';
import orangeEnergyService from '../services/orangeEnergy.service.js';
import Client from '../models/client.model.js';
import Kit from '../models/kit.model.js';
import ScoringData from '../models/scoringData.model.js';

dotenv.config();

const verify = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Drop the clients collection to clear the old unique indexes
    try {
      await mongoose.connection.collection('clients').drop();
      console.log('Dropped clients collection to clear old indexes.');
    } catch (e) {
      // Collection might not exist yet, that's fine
    }
    await Kit.deleteMany({});
    await ScoringData.deleteMany({});

    console.log('\n--- Testing syncAndGetKits() ---');
    const kits = await orangeEnergyService.syncAndGetKits();
    console.log(`Fetched ${kits.length} kits.`);
    if (kits.length > 0) {
      console.log('First kit in DB:', JSON.stringify(kits[0], null, 2));
    }

    console.log('\n--- Testing syncAndGetClients() ---');
    const clients = await orangeEnergyService.syncAndGetClients();
    console.log(`Fetched ${clients.length} clients.`);
    if (clients.length > 0) {
      console.log('First client in DB:', JSON.stringify(clients[0], null, 2));
    }

    console.log('\n--- Testing syncAndGetKitById("DJUA-LUB-000009") ---');
    const singleKit = await orangeEnergyService.syncAndGetKitById('DJUA-LUB-000009');
    console.log('Single kit fetched:', JSON.stringify(singleKit, null, 2));

    console.log('\n--- Testing syncAndGetScoringData("0849991122") ---');
    const scoring = await orangeEnergyService.syncAndGetScoringData('0849991122');
    console.log('Scoring data fetched:', JSON.stringify(scoring, null, 2));

    console.log('\nAll tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
};

verify();
