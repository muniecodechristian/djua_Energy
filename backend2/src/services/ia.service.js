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
      // Log au terminal du backend pour visionnage
      console.log('\n=== [IA API RESPONSE] ===\n', JSON.stringify(resp.data, null, 2), '\n=========================\n');
      return resp.data;
    } catch (err) {
      console.log(err)
      // Normalize error
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };
      const e = new Error('Failed to call IA provider');
      e.status = status;
      e.data = data;
      throw e;
    }
  }
}

const iaService = new IAService();
export default iaService;
