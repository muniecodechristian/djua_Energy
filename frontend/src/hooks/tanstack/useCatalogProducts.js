import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../Zustand/useAuthStore';

const catalogQueryKey = ['catalog-products'];

export function useCatalogProducts({ enabled = true } = {}) {
  const role = useAuthStore(state => state.user?.role);
  const access = ['admin', 'administration'].includes(role) ? 'admin' : 'commercial';
  return useQuery({
    queryKey: [...catalogQueryKey, access],
    queryFn: async () => {
      const response = await api.get('/api/catalog');
      return response.data.data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useSaveCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...product }) => {
      const response = id
        ? await api.patch(`/api/catalog/${encodeURIComponent(id)}`, product)
        : await api.post('/api/catalog', product);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogQueryKey }),
  });
}

export function useDeleteCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async id => {
      const response = await api.delete(`/api/catalog/${encodeURIComponent(id)}`);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogQueryKey }),
  });
}
