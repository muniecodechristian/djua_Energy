/**
 * @file swagger.config.js
 * @description Central Swagger / OpenAPI 3.1 configuration for Djua Energy API.
 *
 * This module builds and exports the swagger-jsdoc options object.
 * It is the single source of truth for:
 *   - API metadata (title, version, description, contact, license)
 *   - Server list (dynamically populated from environment)
 *   - Tag definitions for logical grouping in Swagger UI
 *   - Glob patterns pointing to all JSDoc-annotated source files
 *
 * Usage (in app.js):
 *   import { swaggerSpec } from './docs/swagger.config.js';
 *   import swaggerUi from 'swagger-ui-express';
 *   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 *
 * @module docs/swagger.config
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, resolve }  from 'path';
import config from '../config/env.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * OpenAPI 3.1 definition object.
 * @type {import('swagger-jsdoc').OAS3Definition}
 */
const definition = {
  openapi: '3.1.0',

  // ─── API Metadata ────────────────────────────────────────────────────────────
  info: {
    title: 'Djua Energy API',
    version: '2.0.0',
    description: `
## Overview

**Djua Energy** is an IoT-backed energy management platform serving pay-as-you-go
solar kit clients in partnership with Orange Energy (DRC market).

This API exposes three functional domains:

| Domain | Base Path | Description |
|---|---|---|
| **Authentication** | \`/auth\` | Session management |
| **IoT Devices** | \`/api\` | Real-time device telemetry, alerts, and MQTT commands |
| **Orange Energy** | \`/users\` | Client profiles, solar kit subscriptions, and credit scoring |

## Architecture

- **Transport**: HTTP/REST + MQTT (Aedes broker, port 1883)
- **Database**: MongoDB via Mongoose (remote Atlas cluster)
- **External API**: Orange Energy REST API (synced into local MongoDB cache)
- **Runtime**: Node.js ESM, Express 4

## Response Contract

All endpoints return a consistent JSON envelope:

\`\`\`json
// Success
{ "success": true, "count": 3, "data": [...] }

// Error
{ "success": false, "message": "Human-readable error description" }
\`\`\`
    `.trim(),

    contact: {
      name: 'Djua Energy Engineering',
      email: 'dev@djua-energy.com',
      url: 'https://djua-energy.com',
    },

    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },

  // ─── Servers ─────────────────────────────────────────────────────────────────
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Local development server',
    },
    {
      url: 'https://orangeenergyapi.vercel.app',
      description: 'Production (Vercel)',
    },
  ],

  // ─── Tag Definitions ─────────────────────────────────────────────────────────
  // Tags create logical sections in Swagger UI — order matters for display.
  tags: [
    {
      name: 'Authentication',
      description: 'Session lifecycle — login and credential validation.',
    },
    {
      name: 'Devices',
      description:
        'IoT device registry. Devices publish data via MQTT; this API exposes their in-memory state.',
    },
    {
      name: 'Telemetry',
      description:
        'Historical telemetry records collected from all devices (LIFO ring buffer).',
    },
    {
      name: 'Alerts',
      description:
        'Threshold-triggered alerts emitted by devices (LIFO ring buffer).',
    },
    {
      name: 'Commands',
      description: 'Publish MQTT commands to specific devices via the Aedes broker.',
    },
    {
      name: 'Orange Energy — Clients',
      description:
        'Orange Energy client profiles synced from the external API and cached in MongoDB.',
    },
    {
      name: 'Orange Energy — Kits',
      description:
        'Solar kit subscription records linked to Orange Energy clients.',
    },
    {
      name: 'Orange Energy — Scoring',
      description:
        'Composite credit-scoring views used by credit decisioning systems.',
    },
  ],

  // ─── External Documentation ──────────────────────────────────────────────────
  externalDocs: {
    description: 'Djua Energy Developer Portal',
    url: 'https://docs.djua-energy.com',
  },

  // ─── Global Security ─────────────────────────────────────────────────────────
  // Schemas declared here; actual `security` requirement is set per-route.
  components: {},
};

/**
 * swagger-jsdoc options.
 * `apis` is the exhaustive glob list of files that contain `@swagger` JSDoc blocks.
 * Schema-only files in `docs/schemas/` are always included.
 *
 * @type {import('swagger-jsdoc').Options}
 */
const options = {
  definition,
  apis: [
    // Schema definition files (no-op at runtime, JSDoc only)
    resolve(__dirname, './schemas/common.schemas.js'),
    resolve(__dirname, './schemas/device.schemas.js'),
    resolve(__dirname, './schemas/orangeEnergy.schemas.js'),

    // Route files (contain @swagger endpoint annotations)
    resolve(__dirname, '../routes/auth.routes.js'),
    resolve(__dirname, '../routes/device.routes.js'),
    resolve(__dirname, '../routes/orangeEnergy.routes.js'),
    resolve(__dirname, '../routes/ml.routes.js'),
  ],
};

/**
 * Pre-compiled OpenAPI specification object.
 * Computed once at startup — no runtime overhead per request.
 *
 * @type {object}
 */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Swagger UI Express options for a polished, production-grade UI.
 *
 * @type {import('swagger-ui-express').SwaggerUiOptions}
 */
export const swaggerUiOptions = {
  customSiteTitle: 'Djua Energy API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><text y="24" font-size="20" fill="%23f5a623" font-family="sans-serif">⚡ Djua</text></svg>'); }
    .swagger-ui .info .title { color: #1a1a2e; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 12px; border-radius: 8px; }
  `,
  swaggerOptions: {
    // Collapse all sections by default for a clean first impression
    docExpansion: 'list',
    // Show request duration in Swagger UI
    displayRequestDuration: true,
    // Persist auth token across page refreshes
    persistAuthorization: true,
    // Sort tags alphabetically
    tagsSorter: 'alpha',
    // Sort operations within tags
    operationsSorter: 'alpha',
    // Deep link to specific operations via URL hash
    deepLinking: true,
    // Show model examples in the request body
    defaultModelRendering: 'example',
  },
};
