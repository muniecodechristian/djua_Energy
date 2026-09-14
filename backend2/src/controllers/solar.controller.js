import axios from 'axios';
import config from '../config/env.config.js';

const ML_BASE = config.iaApiUrl?.replace(/\/$/, '');

const mlClient = axios.create({
  baseURL: ML_BASE,
  timeout: 25_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ─── Helper : proxy générique vers l'API ML ────────────────────────────────
async function proxyToML(method, path, data, res) {
  if (!ML_BASE) {
    return res.status(503).json({
      success: false,
      error: { code: 'ML_URL_NOT_CONFIGURED', message: "URL du modèle ML non configurée (IA_API_URL)." },
    });
  }
  try {
    const mlRes = method === 'get'
      ? await mlClient.get(path, { params: data })
      : await mlClient.post(path, data);

    console.log(`[Solar] ✅ ${method.toUpperCase()} ${path} → ${mlRes.status}`);
    return res.json({ success: true, data: mlRes.data });
  } catch (err) {
    const status = err.response?.status || 0;
    const body = err.response?.data;
    console.error(`[Solar] ❌ ${method.toUpperCase()} ${path} → ${status}`, {
      body: typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body)?.slice(0, 300),
    });

    if (status === 422) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: "Les données envoyées sont invalides.", details: body?.detail },
      });
    }
    return res.status(503).json({
      success: false,
      error: { code: 'ML_UNAVAILABLE', message: "Le service Solar Advisor est momentanément indisponible." },
    });
  }
}

// ─── POST /solar/recommend ─────────────────────────────────────────────────
// Dimensionner un kit solaire depuis les besoins client
export async function recommend(req, res) {
  const { appliances, ...rest } = req.body;

  if (!Array.isArray(appliances) || appliances.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_APPLIANCES', message: 'Le champ "appliances" est requis et doit contenir au moins un appareil.' },
    });
  }

  const payload = { appliances, ...rest };
  return proxyToML('post', '/solar-advisor/recommend', payload, res);
}

// ─── POST /solar/conversation ──────────────────────────────────────────────
// Chat conversationnel guidé pour dimensionner un kit via langage naturel
export async function conversation(req, res) {
  const { message, context = {} } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_MESSAGE', message: 'Le champ "message" est requis.' },
    });
  }

  return proxyToML('post', '/solar-advisor/conversation', { message, context }, res);
}

// ─── GET /solar/recommendations ───────────────────────────────────────────
// Lister les recommandations sauvegardées
export async function listRecommendations(req, res) {
  const limit = parseInt(req.query.limit, 10) || 20;
  return proxyToML('get', '/solar-advisor/recommendations', { limit }, res);
}

// ─── GET /solar/recommendations/:id ───────────────────────────────────────
// Détail complet d'une recommandation
export async function getRecommendation(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requis.' } });
  return proxyToML('get', `/solar-advisor/recommendations/${id}`, {}, res);
}

// ─── POST /solar/recommendations/:id/ask ──────────────────────────────────
// Question interactive sur un devis calculé
export async function askRecommendation(req, res) {
  const { id } = req.params;
  const { question } = req.body;

  if (!id) return res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requis.' } });
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ success: false, error: { code: 'MISSING_QUESTION', message: 'Le champ "question" est requis.' } });
  }

  return proxyToML('post', `/solar-advisor/recommendations/${id}/ask`, { question }, res);
}

// ─── POST /solar/recommendations/:id/explain ──────────────────────────────
// Explication lisible du devis (client / technicien / commercial)
export async function explainRecommendation(req, res) {
  const { id } = req.params;
  const { audience = 'client' } = req.body;
  if (!id) return res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requis.' } });
  return proxyToML('post', `/solar-advisor/recommendations/${id}/explain`, { audience }, res);
}
