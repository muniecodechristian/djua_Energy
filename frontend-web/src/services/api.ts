import axios from 'axios';
import type {
  InstallPayload,
  InstallResponse,
  DeviceState,
  OrangeQuote,
} from '../types/install.types';

// ─── Client axios de base ────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT si disponible (partagé avec le frontend principal)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('djua_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await axios.post('/auth/login', { email, password });
    if (data.token) localStorage.setItem('djua_token', data.token);
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// ─── Devices API ─────────────────────────────────────────────────────────────

export const devicesApi = {
  /**
   * Vérifie si un boîtier existe dans le registre du backend.
   * GET /api/devices/:deviceId
   */
  getDevice: async (deviceId: string): Promise<DeviceState | null> => {
    try {
      const { data } = await api.get<{ success: boolean; data: DeviceState }>(
        `/devices/${deviceId}`
      );
      return data.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  /**
   * Récupère l'historique de télémétrie d'un kit pour le diagnostic.
   * GET /api/telemetry/:kitId
   */
  getTelemetry: async (kitId: string, limit = 10) => {
    try {
      const { data } = await api.get(`/telemetry/${kitId}`, {
        params: { limit, sort: 'desc' },
      });
      return data.data as Record<string, number>[];
    } catch {
      return [];
    }
  },

  /**
   * Enregistre l'installation d'un boîtier avec toutes les données collectées.
   * POST /api/installations  (endpoint à créer côté backend)
   * Pour l'instant, simule avec un délai.
   */
  registerInstall: async (payload: InstallPayload): Promise<InstallResponse> => {
    try {
      const { data } = await api.post<InstallResponse>('/installations', payload);
      return data;
    } catch (err: any) {
      // Fallback mock si l'endpoint n'existe pas encore
      if (err.response?.status === 404) {
        console.warn('[API] /api/installations non trouvé — mode mock activé');
        return {
          success: true,
          data: {
            installationId: `INST-${Date.now()}`,
            kitId: payload.boxId,
            message: 'Installation enregistrée (mock)',
          },
        };
      }
      return {
        success: false,
        error: err.response?.data?.message ?? err.message,
      };
    }
  },

  /**
   * Envoie une commande MQTT à un device.
   * POST /api/commands
   */
  sendCommand: async (deviceId: string, command: string) => {
    const { data } = await api.post('/commands', { deviceId, command });
    return data;
  },
};

// ─── Orange Energy API (Devis) ────────────────────────────────────────────────

const ORANGE_API_URL = import.meta.env.VITE_ORANGE_API_URL ?? 'https://orange-energy-test-api.vercel.app';

export const orangeApi = {
  /**
   * Recherche un devis Orange Energy par son ID.
   * GET /api/devis/:id  (endpoint Orange Energy)
   */
  searchQuote: async (quoteId: string): Promise<OrangeQuote | null> => {
    try {
      const { data } = await axios.get(`${ORANGE_API_URL}/api/devis/${quoteId}`, {
        timeout: 8_000,
      });
      return data;
    } catch (err: any) {
      // Mock si l'API Orange est indisponible ou 404
      console.warn('[OrangeAPI] Indisponible — données mock retournées');
      if (quoteId.trim()) {
        return {
          id: quoteId,
          client: 'Jean Kabeya',
          location: 'Maison individuelle — Gombe, Kinshasa',
          system: {
            panels: 4,
            panelPower: 600,
            batteryCapacity: 5,
            inverterPower: 3,
          },
        };
      }
      return null;
    }
  },
};
