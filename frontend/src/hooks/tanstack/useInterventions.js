import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const useCreateIntervention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (interventionData) => {
      const response = await api.post('/api/interventions', interventionData);
      return response.data;
    },
    onSuccess: () => {
      // Invalider les requêtes pour rafraîchir la liste
      queryClient.invalidateQueries(['interventions']);
    },
  });
};

export const useGetInterventions = (kitId = null) => {
  return useQuery({
    queryKey: ['interventions', kitId],
    queryFn: async () => {
      const url = kitId ? `/api/interventions?kitId=${kitId}` : '/api/interventions';
      const response = await api.get(url);
      return response.data.data;
    },
  });
};
