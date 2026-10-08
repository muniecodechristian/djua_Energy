import PageEntrance from '../components/PageEntrance';
import { quickSpring, revealGroup, revealItem } from '../lib/motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Popup, Circle, CircleMarker, useMap } from 'react-leaflet';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import {
  ArrowUpRight, RefreshCw, Sun, Radio, AlertTriangle, BrainCircuit,
  MapPin, Activity, Wrench, Zap, Shield, ChevronRight,
  Search, FileText, CheckCircle2, ExternalLink, Navigation, Info
} from 'lucide-react';
import { useKitsQuery, useAlertsQuery, useTelemetryQuery } from '../hooks/tanstack/useKitQueries';
import { useFleetLiveStatus } from '../hooks/tanstack/useFleetLiveStatus';
import {
  asList, activeAlerts, prioritize, latestByKit,
  observedRecently, coordinates, detailUrl, formatDate, severityLabels,
} from '../lib/operations';

/* ---------- Helpers de style avancés ---------- */
const STATUS = {
  alert: { label: 'Alerte', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30', dot: '#f43f5e', hex: '#f43f5e' },
  online: { label: 'Signal récent', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30', dot: '#10b981', hex: '#10b981' },
  offline: { label: 'À vérifier', badge: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-400 dark:border-zinc-500/30', dot: '#71717a', hex: '#71717a' },
};

const SEV = {
  critical: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
  low: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400',
};

// Styles partagés (Glassmorphism & Bordures subtiles)
const panel = 'dashboard-panel relative overflow-hidden rounded-2xl border';
const panelHover = 'dashboard-panel-interactive';
const chip = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors';

/* ---------- Animations Framer Motion ---------- */
const containerAnim = revealGroup;
const itemAnim = revealItem;
const MotionLink = motion.create(Link);

/* ---------- Carte Leaflet avec Geofencing ---------- */
function MapController({ selectedCoords }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 16, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [selectedCoords, map]);
  return null;
}

function LeafletMap({ points, selectedId, onSelect }) {
  const defaultCenter = [-4.0383, 21.7587]; // RDC Center
  const selectedPoint = points.find(p => p.id === selectedId)?.coords;

  return (
    <div className="absolute inset-0 h-full w-full z-0" style={{ background: 'var(--background)' }}>
      <MapContainer center={defaultCenter} zoom={5} className="h-full w-full outline-none" zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className="map-tiles grayscale-[20%] contrast-[110%] dark:invert dark:grayscale-[80%] dark:hue-rotate-180"
        />

        <MapController selectedCoords={selectedPoint} />

        {points.map(p => {
          if (!p.coords) return null;
          const isSelected = p.id === selectedId;
          const color = STATUS[p.status]?.hex || '#71717a';

          return (
            <div key={p.id}>
              <Circle
                center={p.coords}
                radius={90}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.15 : 0.05,
                  weight: isSelected ? 1.5 : 0.5,
                  dashArray: isSelected ? '4 4' : undefined
                }}
              />

              <CircleMarker
                center={p.coords}
                radius={isSelected ? 7 : 4}
                pathOptions={{
                  color: isSelected ? '#fff' : 'transparent',
                  fillColor: color,
                  fillOpacity: 1,
                  weight: isSelected ? 2 : 0
                }}
                eventHandlers={{ click: () => onSelect(p.kitId) }}
              >
                <Popup className="custom-popup rounded-2xl overflow-hidden shadow-xl border-0">
                  <div className="font-sans px-1 py-0.5">
                    <strong className="block text-sm font-bold text-zinc-900 mb-1">{p.kitId}</strong>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm" style={{ backgroundColor: color }}>
                      {STATUS[p.status].label}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function Dashboard() {
 const reduced = useReducedMotion();
  const kitsQuery = useKitsQuery();
  const alertsQuery = useAlertsQuery();
  const telemetryQuery = useTelemetryQuery();
  const { activeKitIds, isSocketConnected } = useFleetLiveStatus();
  const [now, setNow] = useState(Date.now);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('overview');
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Données backend ---------- */
  const kits = asList(kitsQuery.data);
  const alerts = prioritize(activeAlerts(alertsQuery.data));
  const latest = latestByKit(telemetryQuery.data);
  const recent = kit => activeKitIds.has(kit.kitId) || observedRecently(latest.get(kit.kitId), now);
  const online = kits.filter(recent).length;
  const affected = new Set(alerts.map(a => a.kitId));
  const located = kits.map(kit => ({ kit, point: coordinates(kit) })).filter(i => i.point);
  const refreshing = [kitsQuery, alertsQuery, telemetryQuery].some(q => q.isFetching);
  const refresh = () => { kitsQuery.refetch(); alertsQuery.refetch(); telemetryQuery.refetch(); };

  const failures = [
    kitsQuery.isError && 'parc',
    alertsQuery.isError && 'alertes',
    telemetryQuery.isError && 'télémétrie',
  ].filter(Boolean);

  const cv = (q, n) => (q.isPending || q.isError ? '—' : n.toLocaleString('fr-FR'));
  const statusOf = kit => (affected.has(kit.kitId) ? 'alert' : recent(kit) ? 'online' : 'offline');

  const operational = kits.length - affected.size;
  const pctOnline = kits.length > 0 ? Math.round((online / kits.length) * 100) : 0;
  const pctCritical = kits.length > 0 ? Math.round((affected.size / kits.length) * 100) : 0;
  const pctOps = kits.length > 0 ? Math.round((operational / kits.length) * 100) : 0;

  const kpis = [
    { label: 'Kits installés', value: cv(kitsQuery, kits.length), hint: 'Parc total déployé', icon: Sun, accent: '#f97316', to: '/parc', pct: null },
    { label: 'Kits en ligne', value: kitsQuery.isError || kitsQuery.isPending ? '—' : cv(telemetryQuery, online), hint: 'Signal actif — < 5 min', icon: Radio, accent: '#10b981', to: '/parc', pct: pctOnline, pctColor: 'text-emerald-500 dark:text-emerald-400', liveIndicator: true },
    { label: 'En situation critique', value: cv(alertsQuery, alerts.length), hint: alertsQuery.isSuccess ? `${affected.size} kit(s) impacté(s)` : 'Source indisponible', icon: AlertTriangle, accent: '#f43f5e', to: '/notification', pct: pctCritical, pctColor: alerts.length > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-500' },
    { label: 'Opérationnels', value: kitsQuery.isError || kitsQuery.isPending ? '—' : cv(kitsQuery, operational), hint: 'Aucune alerte active', icon: CheckCircle2, accent: '#8b5cf6', to: '/parc', pct: pctOps, pctColor: 'text-violet-500 dark:text-violet-400' },
  ];

  /* ---------- Filtres & Liste ---------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kits.filter(kit => {
      if (q && !String(kit.kitId || '').toLowerCase().includes(q)) return false;
      const s = statusOf(kit);
      if (filter === 'alert') return s === 'alert';
      if (filter === 'online') return s === 'online';
      if (filter === 'offline') return s === 'offline';
      return true;
    });
  }, [kits, search, filter, now, activeKitIds, alerts.length]);

  const filters = [
    { id: 'all', label: 'Tous', n: kits.length },
    { id: 'alert', label: 'Alertes', n: affected.size },
    { id: 'online', label: 'En ligne', n: online },
    { id: 'offline', label: 'Hors ligne', n: Math.max(kits.length - online, 0) },
  ];

  const selected = kits.find(k => k.kitId === selectedId) || kits[0];
  const selectedPoint = selected ? coordinates(selected) : null;
  const selectedAlerts = selected ? alerts.filter(a => a.kitId === selected.kitId) : [];
  const selectedStatus = selected ? statusOf(selected) : 'offline';
  const lastSample = selected ? latest.get(selected.kitId) : null;
  const lastSeen = lastSample?.timestamp || lastSample?.createdAt || lastSample?.time;

  const tabs = [
    { id: 'overview', label: 'Vue d’ensemble', icon: Info },
    { id: 'alerts', label: `Priorités (${cv(alertsQuery, alerts.length)})`, icon: Shield },
    { id: 'quality', label: 'Fiabilité réseau', icon: Activity },
    { id: 'links', label: 'Outils', icon: Navigation },
  ];

  return (
    <PageEntrance className="dashboard-home relative min-h-screen bg-background text-foreground font-sans selection:bg-sky-500/30">

      <div className="relative z-10 p-3 sm:p-5 max-w-[1600px] mx-auto flex flex-col gap-5 h-screen">

        {/* ================= HEADER ================= */}
        <header className="flex flex-wrap items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Supervision</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Vue d'ensemble de la flotte et télémétrie en temps réel.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md border ${isSocketConnected ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'}`}>
              <span className="relative flex h-2 w-2">
                {isSocketConnected && <span className="absolute inline-flex h-full w-full app-status-ping rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
              </span>
              {isSocketConnected ? 'WebSocket Actif' : 'Hors ligne'}
            </div>

            <button
              onClick={refresh}
              disabled={refreshing}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : 'transition-transform group-hover:rotate-12'} />
              {refreshing ? 'Synchronisation...' : 'Actualiser'}
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10" />
            </button>
          </div>
        </header>

        {failures.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle size={16} className="shrink-0" />
            <p><strong>Erreur de synchronisation :</strong> Impossible de charger {failures.join(', ')}.</p>
            <button onClick={refresh} className="ml-auto font-bold underline decoration-rose-500/50 underline-offset-4 hover:decoration-rose-500">Réessayer</button>
          </motion.div>
        )}

        <div className="flex-1 min-h-0 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">

          {/* ================= COLONNE GAUCHE : LISTE ================= */}
          <aside className={`${panel} flex flex-col h-full`}>
            <div className="p-4 border-b border-zinc-200/50 dark:border-white/[0.05] shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Flotte Déployée</h2>
                <span className="rounded-full bg-zinc-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                  {cv(kitsQuery, filtered.length)} KITS
                </span>
              </div>

              <div className="relative group mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-sky-500 transition-colors" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par ID (ex: KZI-...)"
                  className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-sky-500/50 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>

              <div className="flex bg-zinc-100/50 dark:bg-black/20 p-1 rounded-xl">
                {filters.map(f => {
                  const isActive = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className="relative flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-colors"
                    >
                      {isActive && (
                        <motion.div layoutId="filter-bg" className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200/50 dark:border-white/5" />
                      )}
                      <span className={`relative z-10 flex items-center justify-center gap-1.5 ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                        {f.label} <span className="opacity-50 font-normal">({f.n})</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
              {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <div className="p-4 rounded-full bg-zinc-100 dark:bg-white/5">
                    <Activity size={24} className="text-zinc-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Aucun équipement trouvé</p>
                  <p className="text-xs text-zinc-500">Essayez de modifier vos filtres de recherche.</p>
                </motion.div>
              ) : (
                <div className="space-y-1.5 p-2">
                  <AnimatePresence mode="popLayout">
                    {filtered.map(kit => {
                      const s = statusOf(kit);
                      const active = selected?.kitId === kit.kitId;
                      const pt = coordinates(kit);
                      const kitAlerts = alerts.filter(a => a.kitId === kit.kitId).length;

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          key={kit.kitId || kit._id}
                          onClick={() => {
                            setSelectedId(kit.kitId);
                            navigate(detailUrl(kit.kitId));
                          }}
                          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${active
                            ? 'border-sky-500/30 bg-sky-50/50 dark:border-sky-500/30 dark:bg-sky-500/10 shadow-sm'
                            : 'border-zinc-200/50 bg-white/50 hover:bg-zinc-50 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]'
                            }`}
                        >
                          {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />}

                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-mono text-sm font-bold text-zinc-900 dark:text-white tracking-tight">{kit.kitId}</h3>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500">
                                <MapPin size={10} />
                                {pt ? `${pt[0].toFixed(3)}°, ${pt[1].toFixed(3)}°` : 'Non localisé'}
                              </div>
                            </div>
                            <span className={`${chip} ${STATUS[s].badge}`}>{STATUS[s].label}</span>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="h-[2px] flex-1 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                                {active && <motion.div layoutId="progress" className="h-full bg-sky-500" style={{ width: '100%' }} />}
                              </div>
                            </div>

                            <span className="ml-4 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 group-hover:text-sky-500 transition-colors">
                              {kitAlerts > 0 ? <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={12} /> {kitAlerts} alertes</span> : 'Détails'}
                              <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </aside>

          {/* ================= COLONNE DROITE ================= */}
          <div className="flex flex-col gap-5 min-w-0 h-full">

            {/* -------- KPI CARDS -------- */}
            <motion.div variants={containerAnim} initial={reduced ? false : "hidden"} animate="show" className="grid grid-cols-2 gap-4 xl:grid-cols-4 shrink-0">
              {kpis.map(({ label, value, hint, icon: Icon, accent, to, pct, pctColor, liveIndicator }) => (
                <motion.div variants={itemAnim} key={label}>
                  <MotionLink to={to} whileHover={reduced ? undefined : { y: -3 }} whileTap={reduced ? undefined : { scale: 0.985, y: 0 }} transition={quickSpring} className={`${panel} ${panelHover} group block p-4 h-full relative`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20" style={{ color: accent }}>
                      <Icon size={64} className="-mt-4 -mr-4" />
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
                      <span className="flex items-center gap-2">
                        {liveIndicator && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full app-status-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                        )}
                        {label}
                      </span>
                      <span className="rounded-lg p-2 transition-transform group-hover:scale-105" style={{ backgroundColor: `${accent}15`, color: accent }}>
                        <Icon size={14} />
                      </span>
                    </div>

                    <strong className="block text-3xl font-bold tabular-nums text-zinc-900 dark:text-white tracking-tight">
                      {value}
                    </strong>

                    <div className="mt-3 flex items-end justify-between border-t border-zinc-100 dark:border-white/5 pt-3">
                      <span className="text-[11px] font-medium text-zinc-500">{hint}</span>
                      {pct !== null && pct !== undefined && (
                        <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 ${pctColor || 'text-zinc-500'}`}>
                          {pct}%
                        </span>
                      )}
                    </div>
                  </MotionLink>
                </motion.div>
              ))}
            </motion.div>

            {/* -------- CARTE GEOGRAPHIQUE -------- */}
            <section className={`${panel} relative flex-1 min-h-[300px] overflow-hidden group`}>
              <LeafletMap
                points={located.map(({ kit, point }) => ({ id: kit.kitId || kit._id, kitId: kit.kitId, coords: point, status: statusOf(kit) }))}
                selectedId={selected?.kitId}
                onSelect={setSelectedId}
              />

              {/* Header flottant Map */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-4 p-5 bg-gradient-to-b from-zinc-900/60 dark:from-[#09090b]/80 to-transparent">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Navigation size={14} className="text-sky-400" />
                    Topologie du Parc
                  </h3>
                  <p className="text-xs text-zinc-300/80 font-medium mt-1">{located.length} positions synchronisées</p>
                </div>
                <Link
                  to="/parc"
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all shadow-lg"
                >
                  Vue globale <ArrowUpRight size={14} />
                </Link>
              </div>

              {/* Tag Selection */}
              <AnimatePresence>
                {selected && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute left-5 top-20 z-[1000] rounded-xl border border-white/20 bg-black/40 px-3 py-2 backdrop-blur-md shadow-2xl">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Focus Actuel</p>
                    <p className="font-mono text-sm font-bold text-white">{selected.kitId}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Légende */}
              <div className="absolute bottom-5 left-5 z-[1000] flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1 backdrop-blur-md shadow-xl">
                {Object.entries(STATUS).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-zinc-200 hover:bg-white/10 transition-colors cursor-default">
                    <span className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: v.dot, color: v.dot }} />
                    {v.label}
                  </span>
                ))}
              </div>

              {located.length === 0 && (
                <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-3 bg-zinc-900/40 backdrop-blur-sm text-center">
                  <div className="p-4 rounded-full bg-black/40 border border-white/10">
                    <MapPin size={24} className="text-zinc-400" />
                  </div>
                  <div>
                    <strong className="block text-base text-white font-bold tracking-wide">
                      {kitsQuery.isPending ? 'Cartographie en cours...' : kitsQuery.isError ? 'Service cartographique indisponible' : 'Aucune donnée spatiale'}
                    </strong>
                    <span className="text-sm text-zinc-300 mt-1 block">Les coordonnées des kits s'afficheront ici.</span>
                  </div>
                </div>
              )}
            </section>

            {/* -------- PANNEAU DETAIL (TABS) -------- */}
            <section className={`${panel} shrink-0`}>
              <div className="flex overflow-x-auto border-b border-zinc-200/50 dark:border-white/[0.05] [&::-webkit-scrollbar]:hidden">
                {tabs.map(t => {
                  const isActive = tab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="relative flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-colors"
                    >
                      <Icon size={14} className={isActive ? 'text-sky-500' : 'text-zinc-400'} />
                      <span className={isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}>
                        {t.label}
                      </span>
                      {isActive && (
                        <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}>

                    {/* --- Vue d'ensemble --- */}
                    {tab === 'overview' && (
                      selected ? (
                        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr_1fr]">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{selected.kitId}</h3>
                              <span className={`${chip} ${STATUS[selectedStatus].badge}`}>{STATUS[selectedStatus].label}</span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-md">
                              Consultez l'historique, les anomalies détectées et les actions préventives recommandées par l'IA.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2.5">
                              <Link to={detailUrl(selected.kitId, true)} className="group inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm">
                                <BrainCircuit size={14} className="group-hover:text-sky-400 dark:group-hover:text-sky-600 transition-colors" /> Diagnostic IA
                              </Link>
                              <Link to={detailUrl(selected.kitId)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors">
                                <FileText size={14} /> Fiche technique
                              </Link>
                              <Link to="/InterventionWizard" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors">
                                <Wrench size={14} /> Intervention
                              </Link>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-black/20 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Dernières données</p>
                            <p className="font-mono text-base font-semibold text-zinc-900 dark:text-white">
                              {selectedPoint ? `${selectedPoint[0].toFixed(4)}, ${selectedPoint[1].toFixed(4)}` : 'Non renseignée'}
                            </p>
                            <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Horodatage</p>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{lastSeen ? formatDate(lastSeen) : 'Aucun signal'}</p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-black/20 p-4 relative overflow-hidden">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Alertes Actives</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-white tracking-tighter">{selectedAlerts.length}</p>
                              <span className="text-sm font-medium text-zinc-500">incidents</span>
                            </div>

                            {selectedAlerts[0] ? (
                              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                <AlertTriangle size={12} />
                                <span className="truncate">{selectedAlerts[0].label || selectedAlerts[0].type}</span>
                              </div>
                            ) : (
                              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={12} /> RAS
                              </div>
                            )}
                            <Shield size={80} className="absolute -bottom-4 -right-4 text-zinc-900/[0.03] dark:text-white/[0.02]" />
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 text-center flex flex-col items-center">
                          <Activity size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                          <p className="text-sm font-medium text-zinc-500">{kitsQuery.isPending ? 'Chargement des données du kit...' : 'Sélectionnez un équipement pour voir les détails.'}</p>
                        </div>
                      )
                    )}

                    {/* --- Alertes --- */}
                    {tab === 'alerts' && (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {alerts.slice(0, 6).map((alert, i) => (
                          <Link
                            key={alert._id || i}
                            to={'/notification?alertId=' + encodeURIComponent(alert._id || '')}
                            className="group flex flex-col rounded-2xl border border-zinc-200/50 dark:border-white/[0.05] bg-white dark:bg-white/[0.02] p-4 transition-all hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-md"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`${chip} ${SEV[alert.severity] || 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>
                                {severityLabels[alert.severity] || 'Non classée'}
                              </span>
                              <small className="text-[10px] font-semibold text-zinc-400">{formatDate(alert.createdAt)}</small>
                            </div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-sky-500 transition-colors">{alert.label || alert.type}</h3>
                            <div className="mt-auto pt-3 flex items-center justify-between text-xs">
                              <span className="font-mono text-zinc-500">{alert.kitId || 'Kit inconnu'}</span>
                              <span className="inline-flex items-center gap-1 font-bold text-sky-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">Examiner <ArrowUpRight size={14} /></span>
                            </div>
                          </Link>
                        ))}
                        {alerts.length === 0 && (
                          <div className="col-span-full py-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                            <CheckCircle2 size={32} className="text-emerald-500/50" />
                            <p className="text-sm font-medium">Aucune alerte critique en cours.</p>
                          </div>
                        )}
                        {alerts.length > 6 && (
                          <Link to="/notification" className="col-span-full mt-2 text-center text-sm font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                            Voir toutes les alertes ({alerts.length}) →
                          </Link>
                        )}
                      </div>
                    )}

                    {/* --- Fiabilité --- */}
                    {tab === 'quality' && (
                      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                              {isSocketConnected && <span className="absolute inline-flex h-full w-full app-status-ping rounded-full bg-emerald-400 opacity-75" />}
                              <span className={`relative inline-flex h-3 w-3 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                            </span>
                            <strong className="text-base font-bold text-zinc-900 dark:text-white">
                              {isSocketConnected ? 'Flux de données nominal' : 'Télémétrie en attente'}
                            </strong>
                          </div>
                          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                            L'état du réseau repose sur l'analyse des dernières requêtes (WebSocket & REST). Un kit marqué hors ligne nécessite une investigation technique, mais pas obligatoirement un déplacement.
                          </p>
                          <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            <RefreshCw size={12} /> Sync: {formatDate(telemetryQuery.dataUpdatedAt)}
                          </p>
                        </div>
                        <div className="flex gap-4 max-md:grid max-md:grid-cols-2">
                          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 min-w-[140px]">
                            <Zap size={20} className="text-emerald-500 mb-3" />
                            <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">{cv(kitsQuery, online)}</p>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 mt-1 uppercase tracking-wider">Actifs</p>
                          </div>
                          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 min-w-[140px]">
                            <AlertTriangle size={20} className="text-rose-500 mb-3" />
                            <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">{cv(alertsQuery, alerts.length)}</p>
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-500 mt-1 uppercase tracking-wider">Anomalies</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- Outils --- */}
                    {tab === 'links' && (
                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[
                          { label: 'Parc', desc: 'Gestion matérielle', to: '/parc', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                          { label: 'Incidents', desc: 'Alertes & logs', to: '/notification', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                          { label: 'Devis', desc: 'Propositions clients', to: '/devis', icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                          { label: 'Maintenance', desc: 'Planification', to: '/InterventionWizard', icon: Wrench, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                        ].map(({ label, desc, to, icon: Icon, color, bg }) => (
                          <Link key={to} to={to} className="group flex flex-col rounded-2xl border border-zinc-200/50 dark:border-white/[0.05] bg-white dark:bg-white/[0.02] p-5 transition-all hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-md hover:-translate-y-1">
                            <div className={`mb-4 inline-flex self-start rounded-xl p-3 ${bg} ${color}`}>
                              <Icon size={20} />
                            </div>
                            <strong className="text-sm font-bold text-zinc-900 dark:text-white">{label}</strong>
                            <span className="text-xs text-zinc-500 mt-1">{desc}</span>
                            <ArrowUpRight size={16} className="absolute right-4 top-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageEntrance>
  );
}