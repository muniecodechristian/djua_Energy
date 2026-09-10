import axios from 'axios';
import config from '../config/env.config.js';

class IAService {
  constructor() {
    this.base = config.iaApiUrl?.replace(/\/$/, ''); // remove trailing slash
    this.endpoint = '/solar-advisor/conversation';
    this.client = axios.create({
      baseURL: this.base,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  buildFallbackResponse() {
    return {
      assistant_message: "L'assistant met plus de temps que prévu à répondre. Vous pouvez réessayer dans quelques instants.",
      next_questions: [],
      can_recommend: false,
      used_ai: false,
    };
  }

  async postConversation({ message, context = {} }) {
    if (!this.base) {
      throw new Error('IA API URL not configured (IA_API_URL)');
    }

    const payload = {
      context,
      message,
    };

    const url = this.endpoint;
    try {
      const resp = await this.client.post(url, payload);
      console.log('[IA API] Réponse reçue', {
        status: resp.status,
        usedAI: resp.data?.used_ai ?? null,
      });
      return resp.data;
    } catch (err) {
      const status = err.response?.status || 0;
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      const isProviderFailure = isTimeout || status >= 500 || status === 0;

      console.error('[IA API] Fournisseur indisponible', {
        code: err.code || 'UNKNOWN',
        status: status || 'NETWORK',
      });

      if (isProviderFailure) {
        return this.buildFallbackResponse();
      }

      const e = new Error('IA provider request rejected');
      e.status = status;
      throw e;
    }
  }
}

const iaService = new IAService();
export default iaService;
