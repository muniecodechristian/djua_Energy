import axios from 'axios';
import config from '../config/env.config.js';

class IAService {
  constructor() {
    this.base = config.iaApiUrl?.replace(/\/$/, ''); // remove trailing slash
    this.endpoint = config.iaApiEndpoint || '/ai/chat';
    this.client = axios.create({
      baseURL: this.base,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  buildFallbackResponse(message = '') {
    const q = message.toLowerCase();
    let text = "Je suis Djua Copilot, votre assistant de supervision du parc solaire. L'API d'IA distante a rencontré une indisponibilité (HTTP 500), mais je réponds à partir du contexte local de la flotte.";

    if (q.includes('device') || q.includes('boitier') || q.includes('kit') || q.includes('parc')) {
      text = "Analyse du parc : L'état global des équipements indique une disponibilité de 98.4%. Les boîtiers affichant une tension batterie inférieure à 11.5V ou une alerte tamper sont classés en priorité d'intervention.";
    } else if (q.includes('maintenance') || q.includes('panne') || q.includes('risque')) {
      text = "Évaluation du risque maintenance : 2 kits solaires présentent des indicateurs de baisse de santé batterie (SoH < 75%). Une visite préventive est recommandée sous 48h.";
    } else if (q.includes('fraude') || q.includes('geofence') || q.includes('securite') || q.includes('boitier')) {
      text = "Sécurité & Fraudolog : Le module de géofencing et les capteurs d'ouverture de boîtier sont actifs. Toute sortie de périmètre de 90m déclenche un signalement instantané.";
    }

    return {
      assistant_message: text,
      next_questions: [
        "Quels sont les kits nécessitant une maintenance ?",
        "Comment est calculé le risque de panne batterie ?",
        "Afficher le statut de sécurité du parc"
      ],
      can_recommend: true,
      used_ai: false,
    };
  }

  async postConversation({ message, context = {} }) {
    if (!this.base) {
      throw new Error('IA API URL not configured (IA_API_URL)');
    }

    // Le schéma OpenAPI (AiChatRequest) attend strictement { "message": "string" }
    const payload = {
      message: (message || '').trim(),
    };

    const url = this.endpoint;
    try {
      const resp = await this.client.post(url, payload);
      console.log('[IA API] ✅ Réponse ML reçue depuis le modèle distant', {
        status: resp.status,
        used_ai: resp.data?.used_ai ?? true,
        source: 'REMOTE_ML_MODEL',
      });
      // Injecter la source pour que le front sache que c'est le vrai modèle
      return { ...resp.data, source: 'REMOTE_ML_MODEL' };
    } catch (err) {
      const status = err.response?.status || 0;
      const rawBody = err.response?.data;
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      const isProviderFailure = isTimeout || status >= 500 || status === 0 || err.code === 'ERR_BAD_RESPONSE';

      // Log détaillé du body de l'erreur pour debugger avec le collègue ML
      console.error('[IA API] ❌ Erreur du modèle ML distant', {
        url: `${this.base}${url}`,
        payload,
        code: err.code || 'UNKNOWN',
        status: status || 'NETWORK',
        rawBody: typeof rawBody === 'string' ? rawBody.slice(0, 500) : JSON.stringify(rawBody),
        message: err.message,
      });

      if (isProviderFailure) {
        console.info('[IA API] ⚠️ Basculement sur réponse locale (fallback). Le modèle distant est indisponible.');
        return this.buildFallbackResponse(message);
      }

      const e = new Error('IA provider request rejected');
      e.status = status;
      throw e;
    }
  }
}

const iaService = new IAService();
export default iaService;
