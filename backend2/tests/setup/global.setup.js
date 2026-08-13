/**
 * @file global.setup.js
 * @description Global setup/teardown exécuté UNE SEULE FOIS avant/après toute la suite de tests.
 *
 * Responsabilités :
 *   - Démarrer une instance MongoDB en mémoire (mongodb-memory-server)
 *   - Injecter l'URI dans process.env pour que db.config.js s'y connecte
 *   - Arrêter proprement l'instance après tous les tests
 *
 * Avantages de mongodb-memory-server :
 *   - Aucune dépendance à une base de données externe (CI/CD friendly)
 *   - Isolation totale entre les runs de test
 *   - Compatible avec Mongoose sans modification du code de production
 */

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

/**
 * Démarre le serveur MongoDB en mémoire avant tous les tests.
 * Exécuté automatiquement par Vitest via `globalSetup`.
 */
export async function setup() {
  mongod = await MongoMemoryServer.create({
    instance: {
      // Port aléatoire pour éviter les conflits si plusieurs suites tournent en parallèle
      port: undefined,
      dbName: 'djua_energy_test',
      debug: true,
      launchTimeout: 60000, // Augmenté à 60 secondes pour éviter les échecs sur les machines lentes ou en téléchargement
    },
  });

  // Injecter l'URI dans l'environnement — db.config.js lira process.env.MONGO_URI
  process.env.MONGO_URI = mongod.getUri();
  process.env.NODE_ENV   = 'test';

  console.log(`\n🧪 MongoDB Memory Server démarré : ${process.env.MONGO_URI}`);
}

/**
 * Arrête et libère le serveur MongoDB en mémoire après tous les tests.
 * Exécuté automatiquement par Vitest via `globalSetup`.
 */
export async function teardown() {
  if (mongod) {
    await mongod.stop();
    console.log('\n🧪 MongoDB Memory Server arrêté.');
  }
}
