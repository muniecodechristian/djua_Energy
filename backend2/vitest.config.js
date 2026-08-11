// vitest.config.js
// Configuration Vitest pour le projet Djua Energy (ESM natif).
//
// Vitest est choisi plutôt que Jest car :
//   - Support natif des modules ESM (pas de transform babel/ts-jest requis)
//   - API 100% compatible Jest (describe, it, expect, vi.*)
//   - ~3-5× plus rapide grâce au moteur Vite sous-jacent
//   - Coverage via V8 (intégré dans Node.js, zéro overhead d'instrumentation)

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ─── Environnement ──────────────────────────────────────────────────────────
    // 'node' est l'environnement par défaut et le bon choix pour une API Express.
    environment: 'node',

    // ─── Fichiers de test ───────────────────────────────────────────────────────
    // Convention: *.test.js ou *.spec.js dans le dossier tests/
    include: ['tests/**/*.{test,spec}.js'],
    exclude: ['node_modules', 'tests/.gitkeep'],

    // ─── Variables globales (style Jest) ────────────────────────────────────────
    // Permet d'utiliser describe/it/expect sans import explicite dans chaque fichier.
    globals: true,

    // ─── Setup global ───────────────────────────────────────────────────────────
    // Fichier exécuté une seule fois avant tous les tests (connexion MongoDB, etc.)
    globalSetup: ['tests/setup/global.setup.js'],

    // ─── Coverage ───────────────────────────────────────────────────────────────
    coverage: {
      // V8 = couverture native Node.js, pas besoin de babel ni istanbul
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      // Seuils de couverture minimaux (objectif senior)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      // Fichiers à inclure dans le rapport (exclut config, docs, etc.)
      include: ['src/**/*.js'],
      exclude: [
        'src/docs/**',
        'src/config/**',
        'src/server.js',
        'src/broker/**',
      ],
    },

    // ─── Timeout ────────────────────────────────────────────────────────────────
    // Augmenté pour les tests avec mongodb-memory-server (démarrage ~2-3s)
    testTimeout: 15000,
    hookTimeout: 15000,

    // ─── Reporter ───────────────────────────────────────────────────────────────
    reporters: ['verbose'],

    pool: 'forks',
    maxWorkers: 1,
  },
});
