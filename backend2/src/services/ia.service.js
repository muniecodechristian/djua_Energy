import axios from 'axios';
import config from '../config/env.config.js';

class IAService {
  constructor() {
    this.base = config.iaApiUrl?.replace(/\/$/, ''); // remove trailing slash
    this.client = axios.create({
      baseURL: this.base,
      timeout: 20_000,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
  }

  // ─── Normalise n'importe quel format de réponse ML → format interne unifié ───
  normalizeMLResponse(data, source) {
    // Format /ai/chat → { assistant_message, next_questions, used_ai, ... }
    if (data?.assistant_message) {
      return {
        assistant_message: data.assistant_message,
        next_questions: data.next_questions || [],
        can_recommend: data.can_recommend ?? false,
        used_ai: data.used_ai ?? true,
        source,
      };
    }
    // Format /demo/kit-console/chat → { answer, used_llm, context, ... }
    if (data?.answer) {
      return {
        assistant_message: data.answer,
        answer: data.answer,
        error: data.error,
        next_questions: data.next_questions || [],
        can_recommend: false,
        used_ai: data.used_llm ?? false,
        source,
      };
    }
    // Fallback générique
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return {
      assistant_message: text || 'Réponse reçue du modèle.',
      next_questions: [],
      can_recommend: false,
      used_ai: false,
      source,
    };
  }

  async tryEndpoint(endpoint, payload, label, contextErrors) {
    try {
      const resp = await this.client.post(endpoint, payload);
      console.log(`\n[IA API] 📥 RAW JSON RESPONSE from ${label}:`);
      console.log(JSON.stringify(resp.data, null, 2));
      const normalized = this.normalizeMLResponse(resp.data, label);
      console.log(`[IA API] ✅ ${label} → réponse reçue`, {
        status: resp.status,
        used_ai: normalized.used_ai,
        source: label,
      });
      return normalized;
    } catch (err) {
      const status = err.response?.status || 0;
      const rawBody = err.response?.data;
      const isTimeout = err.code === 'ECONNABORTED';
      
      if (isTimeout) {
        contextErrors.timeout = true;
      }

      console.warn(`[IA API] ⚠️ ${label} indisponible`, {
        status: status || err.code || 'NETWORK',
        body: typeof rawBody === 'string' ? rawBody.slice(0, 200) : JSON.stringify(rawBody)?.slice(0, 200),
      });
      return null; // signal d'échec → on passe au suivant
    }
  }

  // ─── Point d'entrée principal avec cascade de fallback ───────────────────────
  async postConversation({ message, context = {} }) {
    if (!this.base) {
      throw new Error('IA API URL not configured (IA_API_URL)');
    }

    const trimmed = (message || '').trim();

    const contextErrors = { timeout: false };

    // 1️⃣ Endpoint principal : /ai/chat  (schéma: { message })
    const primary = await this.tryEndpoint(
      '/ai/chat',
      { message: trimmed },
      'REMOTE /ai/chat',
      contextErrors
    );
    if (primary) return primary;

    // 2️⃣ Endpoint de secours : /demo/kit-console/chat  (schéma: { message, context })
    const secondary = await this.tryEndpoint(
      '/demo/kit-console/chat',
      { message: trimmed, context: context || {} },
      'REMOTE /demo/kit-console/chat',
      contextErrors
    );
    if (secondary) return secondary;

    // 3️⃣ Aucun fournisseur disponible
    console.error('[IA API] ⛔ Tous les endpoints distants sont indisponibles.');
    
    let errorMsg = "Le modèle IA est actuellement injoignable.";
    if (contextErrors.timeout) {
      errorMsg = "Le service IA a pris beaucoup de temps pour répondre (délai dépassé). Veuillez réessayer plus tard.";
    }
    
    const error = new Error(errorMsg);
    error.status = 503;
    throw error;
  }
}

const iaService = new IAService();
export default iaService;
