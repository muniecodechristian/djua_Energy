import mongoose from 'mongoose';
import User from '../models/user.model.js';
import config from '../config/env.config.js';

const seedUser = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    const email = 'djuatest@gmail.com';

    // Check if user already exists
    const existingUser = await User.findOne({ identifier: email });
    if (existingUser) {
      console.log(`User with identifier ${email} already exists. Skipping seeding.`);
      process.exit(0);
    }

    console.log('Seeding user...');
    await User.create({
      nom: 'test',
      postNom: 'dieumerci',
      prenom: 'euniastyle',
      identifier: email,
      password: 'djuatest',
      role: 'kitireceveur',
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedUser();
