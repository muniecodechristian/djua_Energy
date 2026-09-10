import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Bot, Sparkles, X, MapPin, AlertTriangle, Box, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "../components/ui/button";
import Sidebar from '@/components/Sidebar';
import AIAssistant from '@/components/AIAssistant';
import { useAlertsQuery, useDevicesQuery, useKitsQuery } from '@/hooks/tanstack/useKitQueries';

const PageLoader = () => (
  <div className="min-h-[70vh] w-full flex flex-col items-center justify-center relative overflow-hidden font-sans bg-black">
    <div className="relative flex flex-col items-center gap-5 z-10">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-zinc-900 border-t-[#FF7900] animate-spin"></div>
        <div className="absolute w-9 h-9 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shadow-sm">
          <Bot size={18} className="text-[#FF7900]" />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-extrabold text-white tracking-wider uppercase">Chargement</span>
          <Sparkles size={13} className="text-[#FF7900] animate-pulse" />
        </div>
        <p className="text-[11px] font-medium text-zinc-500 tracking-wide">
          Préparation de votre espace de travail...
        </p>
      </div>

      <div className="w-40 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#FF7900] animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const { data: kits = [] } = useKitsQuery();
  const { data: alerts = [] } = useAlertsQuery();
  const { data: devices = {} } = useDevicesQuery();

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    const results = [];

    (Array.isArray(kits) ? kits : []).forEach((kit) => {
      const haystack = [kit.kitId, kit.clientPhone, kit.status, kit.region, kit.province].filter(Boolean).join(' ').toLowerCase();
      if (haystack.includes(query)) results.push({
        id: `kit-${kit.kitId || kit._id}`,
        type: 'kit',
        title: kit.kitId || 'Kit solaire',
        description: [kit.province || kit.region, kit.status].filter(Boolean).join(' • ') || 'Fiche du kit',
        icon: Box,
        action: () => navigate(`/SmartKitdetails?kitId=${encodeURIComponent(kit.kitId || kit._id)}`),
      });
    });

    Object.entries(devices || {}).forEach(([deviceId, device]) => {
      const haystack = [deviceId, device?.status, device?.telemetry?.kitId].filter(Boolean).join(' ').toLowerCase();
      if (haystack.includes(query)) results.push({
        id: `device-${deviceId}`,
        type: 'kit',
        title: deviceId,
        description: `Appareil • ${device?.status || 'état inconnu'}`,
        icon: MapPin,
        action: () => navigate(`/SmartKitdetails?kitId=${encodeURIComponent(deviceId)}`),
      });
    });

    (Array.isArray(alerts) ? alerts : []).forEach((alert, index) => {
      const haystack = [alert.kitId, alert.type, alert.label, alert.description, alert.severity].filter(Boolean).join(' ').toLowerCase();
      if (haystack.includes(query)) results.push({
        id: `alert-${alert._id || index}`,
        type: 'alert',
        title: alert.label || alert.type || 'Alerte du parc',
        description: [alert.kitId, alert.severity].filter(Boolean).join(' • ') || 'Voir les alertes',
        icon: AlertTriangle,
        action: () => navigate(`/notification?alertLabel=${encodeURIComponent(alert.label || alert.type || '')}&alertDesc=${encodeURIComponent(alert.description || '')}`),
      });
    });

    return results.slice(0, 8);
  }, [alerts, devices, kits, navigate, searchTerm]);

  useEffect(() => {
    if (!isSearchOpen) return undefined;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    const closeOnEscape = (event) => event.key === 'Escape' && setIsSearchOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const openWithShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', openWithShortcut);
    return () => window.removeEventListener('keydown', openWithShortcut);
  });

  const openSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(true);
  };

  const selectSearchResult = (result) => {
    result.action();
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  return (
    <div className="flex h-screen bg-[var(--app-bg)] text-[var(--app-foreground)] font-sans overflow-hidden">
      <div className="relative z-20">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto bg-[var(--app-surface)] relative z-10">
        <header className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-[var(--panel-border)] bg-[var(--panel)]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] hover:bg-[var(--panel-alt)]"
            >
              <Menu size={22} />
            </Button>
            <div className="min-w-0">
              <h2 className="max-w-[calc(100vw-110px)] truncate text-base font-bold tracking-tight text-[var(--app-foreground)] lg:max-w-none lg:text-xl">Heureux de vous revoir, Christian !</h2>
              <p className="hidden max-w-full truncate text-xs text-[var(--muted-foreground)] sm:block">Distribution et déploiement des kits solaires par province en RDC</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={openSearch} className="hidden md:flex items-center gap-2 bg-[var(--panel-alt)] border-[var(--panel-border)] text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] hover:border-[#FF7900] rounded-xl px-3" aria-label="Ouvrir la recherche">
              <Search size={16} />
              <span className="text-xs">Rechercher un kit ou une alerte</span>
              <kbd className="ml-3 rounded border border-[var(--panel-border)] px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={openSearch} className="md:hidden bg-[var(--panel-alt)] border-[var(--panel-border)] text-[var(--app-foreground)] hover:text-[#FF7900] rounded-xl" aria-label="Rechercher">
              <Search size={18} />
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="icon" className="bg-[var(--panel-alt)] border-[var(--panel-border)] text-[var(--app-foreground)] hover:bg-[var(--panel)] hover:text-[#FF7900] rounded-xl transition-colors">
                <Bell size={18} />
              </Button>
            </motion.div>
          </div>
        </header>

        {isSearchOpen && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/55 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsSearchOpen(false);
          }}>
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-2xl">
              <div className="flex items-center gap-3 border-b border-[var(--panel-border)] px-5 py-4">
                <Search size={20} className="text-[#FF7900]" />
                <input ref={searchInputRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher un kit, un appareil ou une alerte..." className="min-w-0 flex-1 bg-transparent text-base text-[var(--app-foreground)] outline-none placeholder:text-[var(--muted-foreground)]" />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--panel-alt)] hover:text-[var(--app-foreground)]" aria-label="Fermer la recherche"><X size={18} /></button>
              </div>
              <div className="max-h-[min(55vh,480px)] overflow-y-auto p-2">
                {!searchTerm.trim() && <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Commencez à saisir un identifiant de kit ou un nom d’alerte.</p>}
                {searchTerm.trim() && searchResults.length === 0 && <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Aucun résultat trouvé dans vos données.</p>}
                {searchResults.map((result) => {
                  const Icon = result.icon;
                  return <button key={result.id} type="button" onClick={() => selectSearchResult(result)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-[var(--panel-alt)]">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${result.type === 'alert' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}><Icon size={17} /></span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[var(--app-foreground)]">{result.title}</strong><span className="block truncate text-xs text-[var(--muted-foreground)]">{result.description}</span></span>
                    <ArrowRight size={16} className="text-[var(--muted-foreground)]" />
                  </button>;
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 bg-[var(--app-surface)]">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>

        <AIAssistant />
      </main>
    </div>
  );
}