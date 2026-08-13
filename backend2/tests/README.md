# Tests — Djua Energy Backend

## Stack de test

| Package | Rôle | Pourquoi ce choix |
|---|---|---|
| **Vitest** | Test runner | ESM natif, API Jest-compatible, ~5× plus rapide |
| **@vitest/coverage-v8** | Couverture de code | Moteur V8 intégré à Node.js, zéro overhead |
| **Supertest** | Tests d'intégration HTTP | Teste les routes Express sans démarrer un vrai serveur |
| **mongodb-memory-server** | MongoDB en mémoire | Isolation totale, aucune dépendance externe, CI-ready |

## Structure

```
tests/
  setup/
    global.setup.js    ← Démarrage/arrêt MongoDB Memory Server
  unit/                ← Tests unitaires (store, services, utils)
  integration/         ← Tests d'intégration (routes HTTP via supertest)
  coverage/            ← Rapports HTML générés (gitignored)
```

## Commandes

```bash
# Lancer les tests une fois (CI)
npm test

# Mode watch (développement)
npm run test:watch

# Avec rapport de couverture
npm run test:coverage

# Interface graphique Vitest (navigateur)
npm run test:ui
```

## Seuils de couverture (objectifs)

| Métrique | Seuil |
|---|---|
| Lignes | 80% |
| Fonctions | 80% |
| Branches | 70% |
| Instructions | 80% |
