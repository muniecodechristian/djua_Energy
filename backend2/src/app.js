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
import { swaggerSpec, swaggerUiOptions } from "./docs/swagger.config.js";

const app = express();

// ─── Middlewares de Sécurité Globale ──────────────────────────────────────────
app.use(helmet()); // En-têtes HTTP sécurisés
app.use(mongoSanitize()); // Protection contre l'injection NoSQL dans req.body, req.query, req.params
app.use(hpp()); // Protection contre la pollution des paramètres HTTP (HPP)

// Limiteur de débit global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000 : 100, // limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(globalLimiter);

const allowedOrigins = [
  "https://djua-energy-three.vercel.app",
  "http://localhost:5173", // Adresse habituelle du frontend de dev (Vite)
  "https://orangeenergyapi.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permet les requêtes sans origine (comme les applications mobiles, curl, postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.startsWith("http://localhost:")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Non autorisé par CORS"));
      }
    },
    credentials: true,
  }),
);
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

app.use("/users/", orangeEnergyRoutes);

// Routes pour relayer les requêtes vers l'API d'IA externe
app.use("/ai", iaRoutes);

export default app;
