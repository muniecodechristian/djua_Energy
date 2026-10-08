import axios from 'axios';
import type {
  InstallPayload,
  InstallResponse,
  DeviceState,
  OrangeQuote,
  KitRecord,
  CreateKitPayload,
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
   *
   * Stratégie : les routes /api/installations n'existent pas dans le backend.
   * On utilise les deux routes IoT réelles qui font un upsert sur le modèle Kit :
   *   1. POST /api/iot/:deviceId/status  → crée le Kit en base (upsert) avec status='active'
   *   2. POST /api/iot/:deviceId/telemetry → enrichit le document Kit avec tous les champs
   *      (system, location, clientPhone, quoteId, etc.) grâce à strict:false sur le schéma.
   *
   * Modèle Kit backend :
   *   { kitId, clientPhone, status, gpsCoordinates, ...extraFields (strict:false) }
   */
  registerInstall: async (payload: InstallPayload): Promise<InstallResponse> => {
    try {
      const deviceId = payload.boxId;  // boxId = kitId dans le modèle backend

      // ÉTAPE 1 — Crée ou met à jour le Kit avec status='active' (upsert)
      await api.post(`/iot/${deviceId}/status`, { status: 'active' });

      // ÉTAPE 2 — Envoie toutes les métadonnées via la route telemetry
      // processTelemetry() dans iot_controller.ts accepte tous les champs
      // supplémentaires (strict:false) et les persiste dans le document Kit.
      await api.post(`/iot/${deviceId}/telemetry`, {
        kit_id: deviceId,        // clé reconnue par processTelemetry
        device_id: deviceId,
        kitId: deviceId,
        // GPS (attendu par gpsCoordinates dans le modèle)
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        // Champs supplémentaires conservés grâce à strict:false
        source: payload.source,
        quoteId: payload.quoteId ?? null,
        clientName: payload.clientName ?? null,
        installedAt: payload.installedAt,
        diagnosticStatus: payload.diagnosticStatus,
        diagnosticChecks: payload.diagnosticChecks,
        locationName: payload.location.name,
        locationAccuracy: payload.location.accuracy,
        system: payload.system,
      });

      return {
        success: true,
        data: {
          installationId: `INST-${deviceId}-${Date.now()}`,
          kitId: deviceId,
          message: `Kit ${deviceId} enregistré avec succès`,
        },
      };
    } catch (err: any) {
      console.error('[API] Erreur enregistrement installation:', err);
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

// ─── Kits API (modèle Kit MongoDB) ───────────────────────────────────────────

export const kitsApi = {
  /**
   * Vérifie l'existence d'un kit dans la base de données MongoDB.
   * Appelé immédiatement après le scan QR ou la saisie manuelle.
   *
   * GET /api/kits/:kitId
   * Retourne { exists: true, data: KitRecord } ou { exists: false }
   */
  getKit: async (kitId: string): Promise<{ exists: boolean; data?: KitRecord }> => {
    try {
      const { data } = await api.get<{ success: boolean; exists: boolean; data?: KitRecord }>(
        `/kits/${kitId}`
      );
      return { exists: data.exists, data: data.data };
    } catch (err: any) {
      // En cas d'erreur réseau on laisse passer — le wizard continue
      console.warn('[KitsAPI] getKit erreur réseau, on suppose kit inexistant:', err.message);
      return { exists: false };
    }
  },

  /**
   * Crée un nouveau Kit dans MongoDB à la fin de l'onboarding technicien.
   *
   * POST /api/kits
   */
  createKit: async (payload: CreateKitPayload): Promise<{ success: boolean; data?: KitRecord; error?: string }> => {
    try {
      const { data } = await api.post<{ success: boolean; data: KitRecord }>('/kits', payload);
      return { success: true, data: data.data };
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.message;
      console.error('[KitsAPI] createKit erreur:', message);
      return { success: false, error: message };
    }
  },
};

