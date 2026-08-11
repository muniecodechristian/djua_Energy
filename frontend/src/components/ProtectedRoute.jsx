import React from 'react';
import { Navigate } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';
import useAuthStore from '../hooks/Zustand/useAuthStore.js';

/**
 * ProtectedRoute — Garde de route basée sur l'état Zustand.
 * 
 * - Si la vérification d'auth est en cours (isCheckingAuth) → loader
 * - Si l'utilisateur n'est pas authentifié → redirect vers /
 * - Si authentifié → render children
 */
const AuthLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black">
    <div className="relative flex flex-col items-center gap-5">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-zinc-900 border-t-[#FF7900] animate-spin" />
        <div className="absolute w-9 h-9 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shadow-sm">
          <Bot size={18} className="text-[#FF7900]" />
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-extrabold text-white tracking-wider uppercase">
            Vérification de session
          </span>
          <Sparkles size={13} className="text-[#FF7900] animate-pulse" />
        </div>
        <p className="text-[11px] font-medium text-zinc-500 tracking-wide">
          Authentification en cours...
        </p>
      </div>
      <div className="w-40 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#FF7900] animate-pulse" />
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  // Pendant la vérification initiale de la session
  if (isCheckingAuth) {
    return <AuthLoader />;
  }

  // Non authentifié → retour à la page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
