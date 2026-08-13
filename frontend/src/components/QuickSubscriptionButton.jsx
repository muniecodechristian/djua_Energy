import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FilePlus, Sparkles } from 'lucide-react';

export default function QuickSubscriptionButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Ne pas afficher si l'utilisateur est déjà sur la page de souscription
  if (location.pathname.toLowerCase() === '/subscription') {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 flex items-center group">
      {/* Tooltip au survol */}
      <span className="mr-3 px-3 py-1.5 bg-zinc-900/90 text-zinc-200 border border-zinc-700/60 text-xs font-semibold rounded-xl shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        Nouvelle Souscription
      </span>

      {/* Bouton principal */}
      <button
        onClick={() => navigate('/subscription')}
        aria-label="Nouvelle souscription"
        className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF7900] to-amber-500 text-white shadow-[0_0_20px_rgba(255,121,0,0.4)] hover:shadow-[0_0_30px_rgba(255,121,0,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 border border-orange-400/40 cursor-pointer"
      >
        <FilePlus size={20} className="stroke-[2.2]" />

        {/* Badge / Indicator d'action rapide */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-zinc-950"></span>
        </span>
      </button>
    </div>
  );
}