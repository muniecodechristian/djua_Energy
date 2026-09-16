// src/app.js
// Configuration Express : middlewares globaux + montage des routes.
// N'écoute pas sur un port — responsabilité exclusive de server.js.

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { rateLimit } from "express-rate-limit";
import deviceRoutes from "./routes/device.routes.js";
import authRoutes from "./routes/auth.routes.js";
import orangeEnergyRoutes from "./routes/orangeEnergy.routes.js";
import iaRoutes from "./routes/ia.routes.js";
import mlRoutes from "./routes/ml.routes.js";
import iotRoutes from "./routes/iot.routes.js";
import solarRoutes from "./routes/solar.routes.js";
import { swaggerSpec, swaggerUiOptions } from "./docs/swagger.config.js";

const app = express();

// ─── 1. CORS — Autoriser toutes les origines avec credentials ─────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Permet explicitement toutes les origines entrantes (y compris requêtes sans origin comme curl/Postman)
    // tout en restant 100% compatible avec credentials: true
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ─── 2. Middlewares de Sécurité Globale ───────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }),
); // En-têtes HTTP sécurisés sans bloquer le cross-origin
app.use(mongoSanitize()); // Protection contre l'injection NoSQL dans req.body, req.query, req.params
app.use(hpp()); // Protection contre la pollution des paramètres HTTP (HPP)

// ─── 3. Limiteur de débit global (relaxé en dev pour éviter les 429) ─────────
const isDev = process.env.NODE_ENV !== "production";
const globalLimiter = rateLimit({
  skip: (req) => req.method === 'POST' && /^\/auth\/login\/?$/i.test(req.path),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 1000, // 10 000 requêtes en dev au lieu de 100
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());

// ─── Health check public ──────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger UI ─────────────────────────────────────────────────────────────
// Activé si SWAGGER_ENABLED=true (ou si on n'est pas en production).
// Sur Render : ajoutez SWAGGER_ENABLED=true dans les variables d'environnement.
const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production';

if (swaggerEnabled) {
  // Import dynamique nécessaire car swagger-ui-express est un module CommonJS
  // et ce projet utilise ESM (type: "module" dans package.json).
  const swaggerUi = await import("swagger-ui-express");

  app.use(
    "/api-docs",
    swaggerUi.default.serve,
    swaggerUi.default.setup(swaggerSpec, swaggerUiOptions),
  );

  // Expose the raw OpenAPI JSON spec for tooling (Postman import, code gen, etc.)
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(" Swagger UI disponible sur /api-docs");
  console.log(" OpenAPI spec JSON disponible sur /api-docs.json");
}

// Routes applicatives ──────────────────────────────────────────────────────
app.use("/auth", authRoutes);

app.use("/api", deviceRoutes);

app.use("/api/ml", mlRoutes);
app.use("/api/iot", iotRoutes);

app.use("/users/", orangeEnergyRoutes);

// Routes pour relayer les requêtes vers l'API d'IA externe
app.use("/ai", iaRoutes);

// Routes Solar Advisor — proxy vers l'API ML du modèle de recommandation
app.use("/solar", solarRoutes);

export default app;
