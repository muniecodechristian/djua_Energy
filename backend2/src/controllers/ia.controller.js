import iaService from '../services/ia.service.js';
import axios from 'axios';
import { getIO } from '../services/socket.service.js';

export async function postConversation(req, res) {
  const { message, context = {} } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Field "message" is required and must be a string.' });
  }

  try {
    const result = await iaService.postConversation({ message, context });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[IA Controller] Requête refusée', {
      status: err.status || 500,
    });

    return res.status(err.status === 400 ? 400 : 503).json({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: err.message || "Le service a rencontré un problème inattendu. Il se peut qu'il ait pris trop de temps pour répondre ou soit temporairement injoignable.",
      },
    });
  }
}

export async function analyzeTelemetry(req, res) {
  try {
    const aiApiUrl = process.env.IA_API_URL || 'https://djua-energy-data-ai.onrender.com';
    const { data } = await axios.post(`${aiApiUrl}/telemetry/analyze`, req.body);
    console.log("\n=== ✅ RÉPONSE DE L'API IA (Proxy) ===");
    console.log(JSON.stringify(data, null, 2));

    // Broadcast en temps réel à tous les clients connectés
    try {
      const io = getIO();
      io.emit('prediction:update', { timestamp: new Date().toISOString(), result: data });
    } catch (_) { /* Socket pas encore init */ }

    return res.json(data);
  } catch (err) {
    console.error("\n=== ❌ ERREUR DE L'API IA (Proxy) ===");
    console.error(err.response?.data || err.message);
    return res.status(500).json({ error: err.message, details: err.response?.data });
  }
}
