# Djua Energy AdonisJS backend

This directory is the AdonisJS/TypeScript migration of `backend2`. It follows Laravel-style separation: controllers orchestrate requests, models encapsulate MongoDB documents, services contain integration logic, middleware handles authentication, and `start/routes.ts` defines the HTTP API.

## Run

```sh
npm install
npm run dev       # development
npm run build     # production build
npm start
```

Set `MONGO_URI`, `JWT_SECRET`, `ORANGE_ENERGY_API_URL`, `IA_API_URL`, and optionally `IOT_API_KEY` in `.env`.

The public routes and response envelopes remain compatible with backend2. MQTT and Socket.IO start with the HTTP server by default; set `MQTT_ENABLED=false` to disable the embedded MQTT broker. OpenAPI JSON is available at `/api-docs.json` and Swagger UI at `/api-docs`.
