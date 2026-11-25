import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios.js';

export const useShopsQuery = (enabled = true) => useQuery({
  queryKey: ['shops'],
  queryFn: async () => {
    const response = await api.get('/api/shops');
    return response.data?.data || [];
  },
  enabled,
  retry: false,
});
