import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Settings,
  Headphones,
  FileCode,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useLogoutMutation } from '../hooks/tanstack/useAuthMutations.js';

const mainNavItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Devis', icon: FileText, path: '/devis' },
  { label: 'Parc', icon: Map, path: '/parc' },
  { label: 'Interventions', icon: ClipboardList, path: '/InterventionWizard' },
  { label: 'Administration', icon: Settings, path: '/AdministrationSettings' },
];

const bottomNavItems = [
  { label: 'Support Technique', icon: Headphones, path: '/support', kind: 'support' },
  { label: 'Docs & API', icon: FileCode, path: '/docs', kind: 'docs' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [comingSoon, setComingSoon] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout } = useLogoutMutation();

  useEffect(() => {
    if (!comingSoon) return;

    const timer = setTimeout(() => setComingSoon(null), 2400);
    return () => clearTimeout(timer);
  }, [comingSoon]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/'),
    });
  };

  const handleComingSoon = (item) => {
    setComingSoon({
      title: item.label,
      description: item.kind === 'support'
        ? 'Le support technique est en cours de préparation pour votre espace.'
        : 'La documentation API sera disponible prochainement pour vos intégrations.',
      icon: item.kind === 'support' ? Wrench : Sparkles,
    });
  };

  return (
    <>
      <AnimatePresence>
        {comingSoon && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 top-8 z-[60] mx-auto w-[min(92vw,420px)]"
          >
            <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-zinc-950/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.55),0_0_28px_rgba(249,115,22,0.18)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_42%)]" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/30">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  >
                    <comingSoon.icon size={22} />
                  </motion.div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">À venir</p>
                      <h3 className="mt-1 text-base font-semibold text-white">{comingSoon.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setComingSoon(null)}
                      className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                      aria-label="Fermer la notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{comingSoon.description}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside
        className={`relative flex flex-col justify-between h-screen bg-[var(--sidebar)] backdrop-blur-xl border-r border-[var(--sidebar-border)] text-[var(--sidebar-foreground)] transition-all duration-300 select-none z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-7 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] rounded-full p-1 cursor-pointer shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-colors hover:border-[#FF7900]/50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div>
          <div className={`flex items-center h-16 px-4 border-b border-[var(--sidebar-border)] ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-[#FF7900] to-amber-500 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-[0_0_15px_rgba(255,121,0,0.3)] group-hover:shadow-[0_0_20px_rgba(255,121,0,0.5)] transition-shadow">
                D
              </div>

              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--sidebar-foreground)] tracking-tight group-hover:text-[#FF7900] transition-colors">Djua Energy</span>
                  <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">Télémétrie & Flotte</span>
                </div>
              )}
            </div>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-150px)] no-scrollbar">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 relative group ${
                    isActive
                      ? 'bg-[#FF7900] text-white shadow-[0_0_15px_rgba(255,121,0,0.3)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[var(--muted-foreground)] group-hover:text-[var(--sidebar-foreground)]'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-[var(--sidebar-border)] space-y-1 bg-[var(--sidebar)] backdrop-blur-md">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (item.kind === 'support' || item.kind === 'docs') {
                    handleComingSoon(item);
                    return;
                  }
                  navigate(item.path);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-[#FF7900] text-white shadow-[0_0_15px_rgba(255,121,0,0.3)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)] border border-transparent'
                }`}
              >
                <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[var(--muted-foreground)]'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          <div className={`pt-3 mt-2 border-t border-[var(--sidebar-border)] flex items-center justify-between ${isCollapsed ? 'justify-center' : 'px-1'}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-200 flex-shrink-0 shadow-inner">
                CM
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-[var(--sidebar-foreground)] truncate leading-tight">Christian M.</span>
                  <span className="text-[10px] font-medium text-[var(--muted-foreground)] truncate leading-tight mt-0.5">Admin Système</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Se déconnecter"
                className="text-[var(--muted-foreground)] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar { width: 5px; }
            .no-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .no-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .no-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF7900; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `,
        }} />
      </aside>

    </>
  );
}
