import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios.js';
import useAuthStore from '../Zustand/useAuthStore.js';
import { toast } from 'sonner';

/**
 * Hook contenant toutes les mutations et queries d'authentification.
 * Basé sur TanStack Query + Zustand pour la gestion d'état globale.
 */

// ─── 1. Vérification de session au démarrage de l'app (checkAuth) ─────────────
/**
 * Vérifie si l'utilisateur est déjà authentifié via le cookie HttpOnly.
 * Doit être appelé une fois au démarrage (dans App ou un composant racine).
 * Met à jour le store Zustand selon le résultat.
 */
export const useCheckAuth = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const setCheckingAuth = useAuthStore((state) => state.setCheckingAuth);

  return useQuery({
    queryKey: ['auth', 'check-auth'],
    queryFn: async () => {
      setCheckingAuth(true);

      try {
        const response = await api.get('/auth/check-auth');

        if (response.data?.success) {
          setUser(response.data.data);
          return response.data.data;
        }

        setUser(null);
        return null;
      } catch {
        // 401 = pas de session valide, c'est normal
        setUser(null);
        setCheckingAuth(false);
        return null;
      }
    },
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};

// ─── 2. Profil utilisateur (après login) ──────────────────────────────────────
export const useGetMeQuery = () => {
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.data);
          return response.data.data;
        }
        setUser(null);
        return null;
      } catch (error) {
        setUser(null);
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
  });
};

// ─── 3. Mutation de connexion ──────────────────────────────────────────────────
export const useLoginMutation = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        setUser(data.data);
        queryClient.setQueryData(['auth', 'check-auth'], data.data);
        queryClient.setQueryData(['auth', 'me'], data.data);
        toast.success(data.message || 'Connexion réussie !');
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Connexion échouée, vérifiez vos identifiants.';
      toast.error(errorMessage);
    },
  });
};

// ─── 4. Mutation d'inscription ─────────────────────────────────────────────────
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (userData) => {
      const response = await api.post('/auth/register', userData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(data.message || 'Inscription réussie ! Vous pouvez maintenant vous connecter.');
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Inscription échouée.';
      toast.error(errorMessage);
    },
  });
};

// ─── 5. Mutation de déconnexion ────────────────────────────────────────────────
export const useLogoutMutation = () => {
  const logoutStore = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await api.post('/auth/logout');
        return response.data;
      } catch (error) {
        // On efface localement même si le backend ne répond pas
        logoutStore();
        queryClient.setQueryData(['auth', 'check-auth'], null);
        queryClient.setQueryData(['auth', 'me'], null);
        queryClient.removeQueries({ queryKey: ['kits'] });
        queryClient.removeQueries({ queryKey: ['alerts'] });

        throw error;
      }
    },
    onSuccess: (data) => {
      logoutStore();
      queryClient.setQueryData(['auth', 'check-auth'], null);
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['kits'] });
      queryClient.removeQueries({ queryKey: ['alerts'] });
      toast.success(data?.message || 'Déconnexion réussie !');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Déconnexion échouée, mais votre session locale a bien été fermée.';
      toast.error(errorMessage);
    },
  });
};
