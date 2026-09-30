import axios from 'axios';
import config from '../config/env.config.js';

const ML_BASE = config.iaApiUrl?.replace(/\/$/, '');

const mlClient = axios.create({
  baseURL: ML_BASE,
  timeout: 25_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ─── Helper : proxy générique vers l'API ML (pour les autres routes) ────────
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

    console.log(`[Solar]  ${method.toUpperCase()} ${path} → ${mlRes.status}`);
    return res.json({ success: true, data: mlRes.data });
  } catch (err) {
    const status = err.response?.status || 0;
    const body = err.response?.data;
    console.error(`[Solar]  ${method.toUpperCase()} ${path} → ${status}`, {
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

// ─── Normalise un appareil Djua → schema exact /solar-advisor/recommend ─────
// Schema ML attendu: { appliance_id, name, quantity, hours_per_day, usage_period, essential, simultaneous }
function normalizeAppliance(a) {
  // Dériver un appliance_id slugifié depuis le nom si absent
  const appliance_id =
    a.appliance_id ||
    (a.name || 'appareil')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  // Mapper usage_period: Djua "both" → ML "mixed"
  const periodMap = {
    day: 'day',
    night: 'night',
    both: 'mixed',
    mixed: 'mixed',
    continuous: 'continuous',
  };
  const usage_period = periodMap[a.period] || periodMap[a.usage_period] || 'mixed';

  return {
    appliance_id,
    name: a.name || 'Appareil',
    quantity: Math.max(1, parseInt(a.quantity, 10) || 1),
    hours_per_day: Math.max(0.5, parseFloat(a.hours ?? a.hours_per_day ?? 1)),
    usage_period,
    essential: a.essential ?? true,
    simultaneous: a.simultaneous ?? true,
  };
}

// ─── POST /solar/recommend ──────────────────────────────────────────────────
// Reçoit les appareils + contexte client, normalise, logue, et proxy vers
// POST /solar-advisor/recommend sur l'API ML
export async function recommend(req, res) {
  const { appliances, ...rest } = req.body;

  if (!Array.isArray(appliances) || appliances.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_APPLIANCES',
        message: 'Le champ "appliances" est requis et doit contenir au moins un appareil.',
      },
    });
  }

  if (!ML_BASE) {
    return res.status(503).json({
      success: false,
      error: { code: 'ML_URL_NOT_CONFIGURED', message: "URL du modèle ML non configurée (IA_API_URL)." },
    });
  }

  // Normaliser les appareils vers le schema attendu par le modèle
  const normalizedAppliances = appliances.map(normalizeAppliance);

  // Construire le payload complet conforme au schema /solar-advisor/recommend
  const payload = {
    appliances: normalizedAppliances,
    city: rest.city || undefined,
    region: rest.region || undefined,
    housing_type: rest.housing_type || undefined,
    people_count: rest.people_count ? parseInt(rest.people_count, 10) : undefined,
    autonomy_hours: rest.autonomy_hours ?? 10,
    budget: rest.budget || undefined,
    preference: rest.preference || 'balanced',
    customer_id: rest.customer_id || rest.contact?.phone || 'djua-client',
    contact: rest.contact || undefined,
    source: rest.source || 'djua-backend',
  };

  // ── LOG : payload complet envoyé au modèle ─────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  [Solar Advisor] PAYLOAD → POST /solar-advisor/recommend');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`  URL cible : ${ML_BASE}/solar-advisor/recommend`);
  console.log(`  Appareils normalisés (${normalizedAppliances.length}) :`);
  normalizedAppliances.forEach((a, i) => {
    console.log(
      `    [${i + 1}] "${a.name}" × ${a.quantity} | ${a.hours_per_day}h/j | period: ${a.usage_period} | id: ${a.appliance_id}`,
    );
  });
  console.log('  Contexte client :');
  console.log(`   city           : ${payload.city ?? '(non fourni)'}`);
  console.log(`    region         : ${payload.region ?? '(non fourni)'}`);
  console.log(`    housing_type   : ${payload.housing_type ?? '(non fourni)'}`);
  console.log(`    people_count   : ${payload.people_count ?? '(non fourni)'}`);
  console.log(`    autonomy_hours : ${payload.autonomy_hours}`);
  console.log(`    budget         : ${payload.budget ?? '(non fourni)'}`);
  console.log(`    preference     : ${payload.preference}`);
  console.log(`    customer_id    : ${payload.customer_id}`);
  console.log(`    source         : ${payload.source}`);
  console.log('  Payload JSON complet envoyé au modèle :');
  console.log(JSON.stringify(payload, null, 2));
  console.log('════════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    const mlRes = await mlClient.post('/solar-advisor/recommend', payload);
    const elapsed = Date.now() - startTime;

    // ── LOG : vraie réponse du modèle ─────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`  [Solar Advisor] RÉPONSE reçue en ${elapsed}ms — HTTP ${mlRes.status}`);
    console.log('════════════════════════════════════════════════════════════════');
    console.log(JSON.stringify(mlRes.data, null, 2));
    console.log('════════════════════════════════════════════════════════════════\n');

    return res.json({ success: true, data: mlRes.data });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const status = err.response?.status || 0;
    const body = err.response?.data;

    // ── LOG : erreur détaillée ────────────────────────────────────────────────
    console.error('\n════════════════════════════════════════════════════════════════');
    console.error(`❌  [Solar Advisor] ERREUR après ${elapsed}ms — HTTP ${status}`);
    console.error('════════════════════════════════════════════════════════════════');
    console.error('Corps de la réponse ML :', JSON.stringify(body, null, 2));
    console.error('Message axios          :', err.message);
    console.error('════════════════════════════════════════════════════════════════\n');

    if (status === 422) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: "Les données envoyées au modèle sont invalides.",
          details: body?.detail,
        },
      });
    }
    return res.status(503).json({
      success: false,
      error: { code: 'ML_UNAVAILABLE', message: "Le service Solar Advisor est momentanément indisponible." },
    });
  }
}

// ─── POST /solar/conversation ───────────────────────────────────────────────
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

// ─── GET /solar/recommendations ────────────────────────────────────────────
// Lister les recommandations sauvegardées
export async function listRecommendations(req, res) {
  const limit = parseInt(req.query.limit, 10) || 20;
  return proxyToML('get', '/solar-advisor/recommendations', { limit }, res);
}

// ─── GET /solar/recommendations/:id ────────────────────────────────────────
// Détail complet d'une recommandation
export async function getRecommendation(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requis.' } });
  return proxyToML('get', `/solar-advisor/recommendations/${id}`, {}, res);
}

// ─── POST /solar/recommendations/:id/ask ───────────────────────────────────
// Question interactive sur un devis calculé
export async function askRecommendation(req, res) {
  const { id } = req.params;
  const { question } = req.body;

  if (!id) return res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requis.' } });
  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_QUESTION', message: 'Le champ "question" est requis.' },
    });
  }

  return proxyToML('post', `/solar-advisor/recommendations/${id}/ask`, { question }, res);
}

// ─── POST /solar/recommendations/:id/explain ───────────────────────────────
// Explication lisible du devis (client / technicien / commercial)
export async function explainRecommendation(req, res) {
  const { id } = req.params;
  const { audience = 'client' } = req.body;
  if (!id) return res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requis.' } });
  return proxyToML('post', `/solar-advisor/recommendations/${id}/explain`, { audience }, res);
}
