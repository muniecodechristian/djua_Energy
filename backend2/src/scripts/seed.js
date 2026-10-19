import mongoose from 'mongoose';
import User from '../models/user.model.js';
import config from '../config/env.config.js';

/**
 * Script de Seed pour créer un compte administrateur simple et prêt à l'emploi.
 * Commande : npm run seed
 */
const seedAdmin = async () => {
  try {
    console.log('Connexion à la base de données MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log(' Connecté à MongoDB avec succès.');

    const adminEmail = 'admin@djua.com';
    const adminPassword = 'Admin123!';

    let admin = await User.findOne({ identifier: adminEmail }).select('+password');

    if (admin) {
      console.log(`Le compte administrateur (${adminEmail}) existe déjà. Réinitialisation du mot de passe et du rôle...`);
      admin.role = 'admin';
      admin.status = 'active';
      admin.password = adminPassword; // Sera hashé automatiquement par le pre-save hook
      admin.mustChangePassword = false;
      await admin.save();
      console.log(' Compte administrateur mis à jour.');
    } else {
      console.log(`Création du compte administrateur (${adminEmail})...`);
      await User.create({
        nom: 'Orange',
        postNom: 'RDC',
        prenom: 'Admin',
        identifier: adminEmail,
        password: adminPassword,
        role: 'admin',
        status: 'active',
        mustChangePassword: false,
      });
      console.log(' Compte administrateur créé avec succès.');
    }

    console.log('\n======================================================');
    console.log('   IDENTIFIANTS ADMINISTRATEUR (À PARTAGER)          ');
    console.log('======================================================');
    console.log(` Identifiant / Email : ${adminEmail}`);
    console.log(` Mot de passe        : ${adminPassword}`);
    console.log(` Rôle                : admin`);
    console.log(` Accès direct        : /AdministrationSettings`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(' Erreur lors du seeding de la base de données :', error);
    process.exit(1);
  }
};

seedAdmin();
