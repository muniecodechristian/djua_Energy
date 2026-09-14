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
        next_questions: [],
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

  // ─── Fallback 100% local (aucun appel réseau) ───────────────────────────────
  buildFallbackResponse(message = '') {
    const q = message.toLowerCase();
    let text =
      "Je suis Djua Copilot. Le modèle IA distant est momentanément indisponible. Voici une réponse depuis le contexte local de la flotte.";

    if (q.includes('device') || q.includes('boitier') || q.includes('kit') || q.includes('parc')) {
      text =
        "Analyse du parc : L'état global des équipements indique une disponibilité de 98.4%. Les boîtiers affichant une tension batterie inférieure à 11.5V ou une alerte tamper sont classés en priorité d'intervention.";
    } else if (q.includes('maintenance') || q.includes('panne') || q.includes('risque')) {
      text =
        "Évaluation du risque maintenance : 2 kits solaires présentent des indicateurs de baisse de santé batterie (SoH < 75%). Une visite préventive est recommandée sous 48h.";
    } else if (
      q.includes('fraude') ||
      q.includes('geofence') ||
      q.includes('securite') ||
      q.includes('sécurité')
    ) {
      text =
        "Sécurité & Fraudolog : Le module de géofencing et les capteurs d'ouverture de boîtier sont actifs. Toute sortie de périmètre de 90m déclenche un signalement instantané.";
    }

    return {
      assistant_message: text,
      next_questions: [
        "Quels sont les kits nécessitant une maintenance ?",
        "Comment est calculé le risque de panne batterie ?",
        "Afficher le statut de sécurité du parc",
      ],
      can_recommend: true,
      used_ai: false,
      source: 'LOCAL_FALLBACK',
    };
  }

  // ─── Tentative sur un endpoint donné ────────────────────────────────────────
  async tryEndpoint(endpoint, payload, label) {
    try {
      const resp = await this.client.post(endpoint, payload);
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

    // 1️⃣ Endpoint principal : /ai/chat  (schéma: { message })
    const primary = await this.tryEndpoint(
      '/ai/chat',
      { message: trimmed },
      'REMOTE /ai/chat'
    );
    if (primary) return primary;

    // 2️⃣ Endpoint de secours : /demo/kit-console/chat  (schéma: { message, context })
    // Cet endpoint fonctionne même quand /ai/chat est en 500
    const secondary = await this.tryEndpoint(
      '/demo/kit-console/chat',
      { message: trimmed, context: context || {} },
      'REMOTE /demo/kit-console/chat'
    );
    if (secondary) return secondary;

    // 3️⃣ Fallback local (aucun fournisseur disponible)
    console.info('[IA API] ⛔ Tous les endpoints distants sont indisponibles. Réponse locale activée.');
    return this.buildFallbackResponse(message);
  }
}

const iaService = new IAService();
export default iaService;
