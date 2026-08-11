import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isCheckingAuth: true, // Vrai jusqu'à ce que checkAuth soit terminé

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user, 
    isInitialized: true,
    isCheckingAuth: false,
  }),

  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    isInitialized: true,
    isCheckingAuth: false,
  }),

  setInitialized: (status) => set({ 
    isInitialized: status 
  }),

  setCheckingAuth: (status) => set({
    isCheckingAuth: status,
  }),
}));

export default useAuthStore;
