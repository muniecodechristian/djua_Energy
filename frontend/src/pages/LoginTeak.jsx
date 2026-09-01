import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../hooks/tanstack/useAuthMutations.js';

// --- ICÔNES SVG INLINE (Zéro dépendance, performance maximale) ---
const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

const SunIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

// --- CONFIGURATION DES ANIMATIONS DE L'INTERFACE ---
const springTransition = {
  type: "spring",
  stiffness: 55,
  damping: 14,
  mass: 1.1
};

// Animation d'entrée de la carte (Glissement depuis la gauche avec rebond naturel)
const cardEntrance = {
  initial: { opacity: 0, x: -80, scale: 0.97 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      ...springTransition, 
      delay: 0.1,
      staggerChildren: 0.06,
      delayChildren: 0.3
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
};

export default function LoginDjuaEnergy() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const syncTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier || !password) return;
    
    loginMutation.mutate(
      { identifier, password },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
      }
    );
  };

  return (
    <div className={`relative min-h-screen w-full font-sans flex items-center justify-center overflow-hidden transition-colors duration-500 ${
      isDark ? 'bg-[#0a0a0a] text-neutral-300' : 'bg-[#faf9f6] text-neutral-700'
    }`}>
      
      {/* ================= BACKGROUND ÉNERGIE SOLAIRE & FLUX TRAVERSANTS ================= */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        
        {/* 1. Noyau Solaire Flouté (Solar Flare Core) */}
        <motion.div 
          className={`absolute -top-[10%] -right-[10%] w-[450px] h-[450px] rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${
            isDark ? 'bg-orange-600/10' : 'bg-amber-500/20'
          }`}
          animate={{
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* 2. Rayon Solaire Vectoriel Traversant (Flux d'énergie dynamique de gauche à droite) */}
        <motion.svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="energyStream" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor={isDark ? '#ea580c' : '#f97316'} stopOpacity="0" />
              <stop offset="50%" stopColor={isDark ? '#f97316' : '#f59e0b'} stopOpacity="0.35" />
              <stop offset="100%" stopColor={isDark ? '#eab308' : '#eab308'} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Onde d'énergie principale qui traverse l'écran */}
          <motion.path 
            d="M -100,500 C 300,420 500,580 900,320 C 1200,120 1600,450 1600,450" 
            fill="none" 
            stroke="url(#energyStream)" 
            strokeWidth="2.5"
            initial={{ strokeDasharray: "1000", strokeDashoffset: 1000 }}
            animate={{ strokeDashoffset: [1000, -1000] }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Onde secondaire pointillée pour l'aspect technique */}
          <motion.path 
            d="M -50,350 C 400,520 700,220 1100,620 C 1300,820 1500,420 1500,420" 
            fill="none" 
            stroke="url(#energyStream)" 
            strokeWidth="1"
            strokeDasharray="8 18"
            animate={{
              strokeDashoffset: [0, -1000]
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.svg>

        {/* 3. Rayons Solaire Vectoriels Rotatifs */}
        <motion.svg 
          className="absolute -top-[20%] -right-[20%] w-[600px] h-[600px] opacity-[0.15]" 
          viewBox="0 0 200 200"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <radialGradient id="solarRayGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isDark ? '#f97316' : '#eab308'} stopOpacity="1" />
              <stop offset="60%" stopColor={isDark ? '#ea580c' : '#f97316'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isDark ? '#0a0a0a' : '#faf9f6'} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="40" fill="none" stroke="url(#solarRayGrad)" strokeWidth="0.5" strokeDasharray="5 5" />
          <circle cx="100" cy="100" r="65" fill="none" stroke="url(#solarRayGrad)" strokeWidth="0.5" strokeDasharray="10 8" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="url(#solarRayGrad)" strokeWidth="0.5" strokeDasharray="15 12" />
          <path d="M100 10 L100 190 M10 100 L190 100 M36.36 36.36 L163.64 163.64 M36.36 163.64 L163.64 36.36" stroke="url(#solarRayGrad)" strokeWidth="0.2" />
        </motion.svg>

        {/* 4. Particules de Photons Flottantes */}
        {[
          { x: "20%", y: "30%", size: "4px", delay: 0 },
          { x: "75%", y: "20%", size: "6px", delay: 2 },
          { x: "85%", y: "60%", size: "5px", delay: 1.5 },
          { x: "15%", y: "70%", size: "3px", delay: 3 },
        ].map((particle, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full pointer-events-none blur-[1px] ${
              isDark ? 'bg-amber-400' : 'bg-orange-500'
            }`}
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.1, 0.7, 0.1],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 7 + i,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* ================= FORMULAIRE DE CONNEXION (Style Teak Conservé + Entrée Spring) ================= */}
      <motion.div 
        variants={cardEntrance}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full max-w-[390px] px-6 py-10 flex flex-col items-center"
      >
        
        {/* LOGO DJUA ENERGY */}
        <motion.div variants={fadeInUp} className="flex items-center gap-2.5 mb-8 select-none">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
            isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-white'
          }`}>
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M12 2L2 19.72h20L12 2zm0 4.5l6.43 11.22H5.57L12 6.5z" />
            </svg>
          </div>
          <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
            isDark ? 'text-neutral-100' : 'text-neutral-900'
          }`}>Djua Energy</span>
        </motion.div>

        {/* FORMULAIRE (Commence directement sous le logo) */}
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <motion.div variants={fadeInUp}>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 ml-0.5">Identifiant (Email / Téléphone)</label>
            <input 
              type="text" 
              placeholder="votre@email.com ou +33600000000"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loginMutation.isPending}
              required
              className={`w-full rounded-lg px-3.5 py-3 text-xs focus:outline-none focus:ring-1 transition-all ${
                isDark 
                  ? 'bg-[#141414] border border-neutral-900 focus:border-orange-500/40 focus:ring-orange-500/20 text-neutral-100 placeholder:text-neutral-700' 
                  : 'bg-white border border-neutral-200 focus:border-orange-500/50 focus:ring-orange-500/10 text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 ml-0.5">Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
              required
              className={`w-full rounded-lg px-3.5 py-3 text-xs tracking-widest focus:outline-none focus:ring-1 transition-all ${
                isDark 
                  ? 'bg-[#141414] border border-neutral-900 focus:border-orange-500/40 focus:ring-orange-500/20 text-neutral-100 placeholder:text-neutral-700' 
                  : 'bg-white border border-neutral-200 focus:border-orange-500/50 focus:ring-orange-500/10 text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
          </motion.div>

          {/* ACTION : SE CONNECTER */}
          <motion.div variants={fadeInUp} className="pt-2">
            <motion.button 
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loginMutation.isPending}
              className={`w-full bg-[#ea580c] hover:bg-[#f97316] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/15 text-xs transition-all ${
                loginMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loginMutation.isPending ? 'Connexion en cours...' : 'Se connecter'} <ArrowRightIcon className="w-3.5 h-3.5" />
            </motion.button>
          </motion.div>
        </form>

        {/* LIENS INFÉRIEURS */}
        <motion.div 
          variants={fadeInUp}
          className="mt-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500"
        >
          <a href="#" className="hover:text-[#ea580c] transition-colors">Mot de passe oublié ?</a>
          <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-300'}`} />
          <a href="#" className="hover:text-[#ea580c] transition-colors">S'inscrire</a>
          <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-300'}`} />
          <a href="#" className="hover:text-[#ea580c] transition-colors">Mentions légales</a>
        </motion.div>

      </motion.div>
    </div>
  );
}