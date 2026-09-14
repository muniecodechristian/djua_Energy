import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isCheckingAuth: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isInitialized: true,
          isCheckingAuth: false,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isCheckingAuth: false,
        }),

      setInitialized: (status) =>
        set({
          isInitialized: status,
        }),

      setCheckingAuth: (status) =>
        set({
          isCheckingAuth: status,
        }),
    }),
    {
      name: 'djua-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
