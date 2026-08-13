import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios.js';
import { toast } from 'sonner';

/**
 * Hooks TanStack Query pour les kits solaires et alertes.
 * Pattern identique à useAuthMutations — queryKey + queryFn + gestion d'erreur.
 */

// ─── 1. Liste de tous les kits solaires ───────────────────────────────────────
/**
 * Récupère tous les kits depuis le backend (GET /users/orange/kits).
 * Chaque kit est lié à un abonné via clientPhone.
 */
export const useKitsQuery = () => {
  return useQuery({
    queryKey: ['kits'],
    queryFn: async () => {
      const response = await api.get('/users/orange/kits');
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes de fraîcheur
    retry: 1,
    onError: (error) => {
      console.error('[useKitsQuery] Erreur:', error.message);
    },
  });
};

// ─── 2. Liste des clients Orange Energy ───────────────────────────────────────
/**
 * Récupère tous les clients depuis le backend (GET /users/orange/clients).
 */
export const useClientsQuery = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/users/orange/clients');
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

// ─── 3. Alertes IoT (depuis le broker MQTT/store mémoire) ─────────────────────
/**
 * Récupère l'historique des alertes IoT (GET /api/alerts).
 * Données en mémoire du backend — se réinitialise au redémarrage.
 */
export const useAlertsQuery = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await api.get('/api/alerts');
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    },
    staleTime: 1000 * 30, // 30 secondes — les alertes sont volatiles
    refetchInterval: 1000 * 30, // Repolling toutes les 30 secondes
    retry: 1,
  });
};

// ─── 4. Tous les devices IoT ───────────────────────────────────────────────────
/**
 * Récupère tous les appareils IoT enregistrés (GET /api/devices).
 */
export const useDevicesQuery = () => {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await api.get('/api/devices');
      if (response.data?.success) {
        return response.data.data;
      }
      return {};
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    retry: 1,
  });
};

// ─── 5. Télémétrie globale ─────────────────────────────────────────────────────
/**
 * Récupère l'historique de télémétrie (GET /api/telemetry).
 */
export const useTelemetryQuery = () => {
  return useQuery({
    queryKey: ['telemetry'],
    queryFn: async () => {
      const response = await api.get('/api/telemetry');
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    retry: 1,
  });
};

// ─── 6. Scoring d'un client par téléphone ─────────────────────────────────────
/**
 * Récupère les données de scoring d'un client (GET /users/orange/scoring-data/:phone).
 * N'est pas exécuté si phone est null/undefined.
 */
export const useScoringQuery = (phone) => {
  return useQuery({
    queryKey: ['scoring', phone],
    queryFn: async () => {
      const response = await api.get(`/users/orange/scoring-data/${phone}`);
      if (response.data?.success) {
        return response.data.data;
      }
      return null;
    },
    enabled: !!phone, // N'exécute la requête que si phone est défini
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

// ─── 7. Commande MQTT vers un device ──────────────────────────────────────────
/**
 * Envoie une commande MQTT à un device (POST /api/commands).
 * Usage: const { mutate: sendCmd } = useSendCommandMutation();
 *        sendCmd({ deviceId: 'djua-device-001', command: 'RESET' });
 */
export const useSendCommandMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceId, command }) => {
      const response = await api.post('/api/commands', { deviceId, command });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Commande envoyée avec succès');
      // Revalider les devices pour refléter le nouvel état
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Erreur lors de l'envoi de la commande";
      toast.error(msg);
    },
  });
};
