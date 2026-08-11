import mongoose from 'mongoose';
import User from '../models/user.model.js';
import config from '../config/env.config.js';

const createUser = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected.');

    const email = 'dm@gmail.com';
    const password = '123456';

    // Delete existing user if any
    await User.deleteOne({ identifier: email });

    console.log('Creating user dm@gmail.com...');
    await User.create({
      nom: 'M.',
      postNom: 'D.',
      prenom: 'Dieumerci',
      identifier: email,
      password: password,
      role: 'administration', // Administration for full privileges
    });

    console.log('User created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
};

createUser();
