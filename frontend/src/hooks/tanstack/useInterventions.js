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
    staleTime: 1000 * 30,
  });
};

export const useUpdateInterventionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.patch(`/api/interventions/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions']);
    },
  });
};

export const useAddInterventionReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, report }) => {
      const response = await api.patch(`/api/interventions/${id}/report`, { report });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions']);
    },
  });
};

export const useReassignIntervention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, assignedTo }) => {
      const response = await api.patch(`/api/interventions/${id}/assign`, { assignedTo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions']);
    },
  });
};

export const useTeamTechnicians = () => {
  return useQuery({
    queryKey: ['team-technicians'],
    queryFn: async () => {
      const response = await api.get('/auth/team-users');
      const list = response.data?.data || [];
      return list.filter(u => u.role === 'technician' && u.status !== 'suspended');
    },
    staleTime: 1000 * 60 * 3,
  });
};
