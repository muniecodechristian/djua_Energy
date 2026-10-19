import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

/**
 * Hook pour récupérer les alertes selon le rôle de l'utilisateur connecté :
 * - shop_manager : alertes créées + IoT globales
 * - technician : alertes qui lui sont assignées
 */
export const useAlerts = (filters = {}) => {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.kitId) params.append('kitId', filters.kitId);
      if (filters.status) params.append('status', filters.status);
      if (filters.severity) params.append('severity', filters.severity);

      const qs = params.toString();
      const url = qs ? `/api/alerts?${qs}` : '/api/alerts';
      const response = await api.get(url);
      return response.data?.data || [];
    },
    staleTime: 1000 * 30,
  });
};

/**
 * Hook pour la création d'une alerte manuelle par le shop_manager
 */
export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertData) => {
      const response = await api.post('/api/alerts', alertData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    },
  });
};

/**
 * Hook pour la réassignation d'une alerte à un autre technicien
 */
export const useReassignAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, assignedTo }) => {
      const response = await api.patch(`/api/alerts/${alertId}/assign`, { assignedTo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    },
  });
};

/**
 * Hook pour mettre à jour le statut d'une alerte (acknowledged, resolved)
 */
export const useUpdateAlertStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, status }) => {
      const response = await api.patch(`/api/alerts/${alertId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    },
  });
};
