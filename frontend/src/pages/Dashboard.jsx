import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Popup, Circle, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowUpRight, RefreshCw, Sun, Radio, AlertTriangle, BrainCircuit,
  MapPin, Activity, Wrench, CircleHelp, Zap, Shield, ChevronRight,
  Search, FileText, Gauge, Plus, Minus, Crosshair, CheckCircle2, ExternalLink,
} from 'lucide-react';
import { useKitsQuery, useAlertsQuery, useTelemetryQuery } from '../hooks/tanstack/useKitQueries';
import { useFleetLiveStatus } from '../hooks/tanstack/useFleetLiveStatus';
import {
  asList, activeAlerts, prioritize, latestByKit,
  observedRecently, coordinates, detailUrl, formatDate, severityLabels,
} from '../lib/operations';

/* ---------- petits helpers de style ---------- */
const STATUS = {
  alert: { label: 'Alerte', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: '#f59e0b', hex: '#f59e0b' },
  online: { label: 'Signal récent', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', dot: '#22d3ee', hex: '#22d3ee' },
  offline: { label: 'À vérifier', badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', dot: '#64748b', hex: '#64748b' },
};

const SEV = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const panel = 'rounded-2xl border border-white/[0.06] bg-[#111113]';
const chip = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide';

/* ---------- Carte Leaflet avec Geofencing ---------- */
function MapController({ selectedCoords }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 16, { duration: 1.5 });
    }
  }, [selectedCoords, map]);
  return null;
}

function LeafletMap({ points, selectedId, onSelect }) {
  const defaultCenter = [-4.0383, 21.7587]; // RDC Center
  const selectedPoint = points.find(p => p.id === selectedId)?.coords;

  return (
    <div className="absolute inset-0 h-full w-full z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController selectedCoords={selectedPoint} />

        {points.map(p => {
          if (!p.coords) return null;
          const isSelected = p.id === selectedId;
          const color = STATUS[p.status]?.hex || '#64748b';
          
          return (
            <div key={p.id}>
              {/* Cercle de Geofencing (90m de rayon) */}
              <Circle 
                center={p.coords} 
                radius={90} 
                pathOptions={{ 
                  color: color, 
                  fillColor: color, 
                  fillOpacity: isSelected ? 0.25 : 0.1,
                  weight: isSelected ? 2 : 1,
                  dashArray: '4 4'
                }} 
              />
              
              {/* Marqueur principal avec un rayon constant en pixels */}
              <CircleMarker
                center={p.coords}
                radius={isSelected ? 8 : 5}
                pathOptions={{
                  color: '#000',
                  fillColor: color,
                  fillOpacity: 1,
                  weight: 1.5
                }}
                eventHandlers={{ click: () => onSelect(p.kitId) }}
              >
                <Popup className="text-zinc-900 rounded-xl overflow-hidden">
                  <div className="font-sans">
                    <strong className="block text-sm font-bold mb-1">{p.kitId}</strong>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold text-white`} style={{ backgroundColor: color }}>
                      {STATUS[p.status].label}
                    </span>
                    <div className="mt-2 text-[10px] text-zinc-500">
                      Geofence: 90 mètres
                    </div>
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

  /* ---------- données backend (logique inchangée) ---------- */
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
  const pctOnline   = kits.length > 0 ? Math.round((online / kits.length) * 100) : 0;
  const pctCritical = kits.length > 0 ? Math.round((affected.size / kits.length) * 100) : 0;
  const pctOps      = kits.length > 0 ? Math.round((operational / kits.length) * 100) : 0;

  const kpis = [
    {
      label: 'Kits installés',
      value: cv(kitsQuery, kits.length),
      hint: 'Parc total déployé',
      icon: Sun, accent: '#f97316', to: '/parc',
      pct: null, // pas de % pour le total
    },
    {
      label: 'Kits en ligne',
      value: kitsQuery.isError || kitsQuery.isPending ? '—' : cv(telemetryQuery, online),
      hint: 'Signal actif — < 5 min',
      icon: Radio, accent: '#22d3ee', to: '/parc',
      pct: pctOnline, pctColor: 'text-emerald-400',
      liveIndicator: true,
    },
    {
      label: 'Kits en situation critique',
      value: cv(alertsQuery, alerts.length),
      hint: alertsQuery.isSuccess ? `${affected.size} kit(s) impacté(s)` : 'Source indisponible',
      icon: AlertTriangle, accent: '#ef4444', to: '/notification',
      pct: pctCritical, pctColor: alerts.length > 0 ? 'text-red-400' : 'text-zinc-500',
    },
    {
      label: 'Kits opérationnels',
      value: kitsQuery.isError || kitsQuery.isPending ? '—' : cv(kitsQuery, operational),
      hint: 'Aucune alerte active',
      icon: CheckCircle2, accent: '#a78bfa', to: '/parc',
      pct: pctOps, pctColor: 'text-violet-400',
    },
  ];

  /* ---------- liste filtrée (panneau gauche) ---------- */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kits, search, filter, now, activeKitIds, alerts.length]);

  const filters = [
    { id: 'all', label: 'Tous', n: kits.length },
    { id: 'alert', label: 'Alertes', n: affected.size },
    { id: 'online', label: 'En ligne', n: online },
    { id: 'offline', label: 'Sans signal', n: Math.max(kits.length - online, 0) },
  ];

  const selected = kits.find(k => k.kitId === selectedId) || kits[0];
  const selectedPoint = selected ? coordinates(selected) : null;
  const selectedAlerts = selected ? alerts.filter(a => a.kitId === selected.kitId) : [];
  const selectedStatus = selected ? statusOf(selected) : 'offline';
  const lastSample = selected ? latest.get(selected.kitId) : null;
  const lastSeen = lastSample?.timestamp || lastSample?.createdAt || lastSample?.time;

  const tabs = [
    { id: 'overview', label: 'Vue d’ensemble' },
    { id: 'alerts', label: `Priorités (${cv(alertsQuery, alerts.length)})` },
    { id: 'quality', label: 'Fiabilité' },
    { id: 'links', label: 'Accès rapide' },
  ];

  return (
    <div className="min-h-screen  p-3 text-zinc-300 sm:p-4">
      {/* ================= HEADER ================= */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">Supervision du parc</h1>
          <p className="text-xs text-zinc-500">Surveillez les équipements, identifiez les priorités, préparez les actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${chip} ${isSocketConnected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-zinc-600/40 bg-zinc-500/10 text-zinc-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isSocketConnected ? 'animate-pulse bg-emerald-400' : 'bg-zinc-500'}`} />
            {isSocketConnected ? 'Temps réel' : 'Hors ligne'}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </header>

      {failures.length > 0 && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertTriangle size={14} />
          <span>Chargement impossible : {failures.join(', ')}.</span>
          <button onClick={refresh} className="ml-auto font-semibold underline underline-offset-2">Réessayer</button>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ================= LISTE DES KITS ================= */}
        <aside className={`${panel} flex flex-col p-4 lg:h-[calc(100vh-6.5rem)]`}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Liste des kits</h2>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
              {cv(kitsQuery, filtered.length)} équipements
            </span>
          </div>

          <label className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 focus-within:border-sky-500/50">
            <Search size={14} className="text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un kit…"
              className="w-full bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
          </label>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${filter === f.id ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
              >
                {f.label} <span className="opacity-60">{f.n}</span>
              </button>
            ))}
          </div>

          <div className="-mr-1 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] max-lg:max-h-[420px]">
            {filtered.map(kit => {
              const s = statusOf(kit);
              const active = selected?.kitId === kit.kitId;
              const pt = coordinates(kit);
              const kitAlerts = alerts.filter(a => a.kitId === kit.kitId).length;
              return (
              <div
                  key={kit.kitId || kit._id}
                  onClick={() => {
                    setSelectedId(kit.kitId);
                    navigate(detailUrl(kit.kitId));
                  }}
                  className={`cursor-pointer w-full rounded-xl border p-3 text-left transition ${
                    active ? 'border-white/15 bg-white/[0.06]' : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] font-semibold tracking-wide text-white">{kit.kitId}</span>
                    <span className={`${chip} ${STATUS[s].badge}`}>{STATUS[s].label}</span>
                  </div>

                  {/* ligne de progression façon "route" */}
                  <div className="my-2.5 flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>{pt ? `${pt[0].toFixed(2)}°` : '—'}</span>
                    <div className="relative h-px flex-1 bg-white/10">
                      <span className="absolute -top-[3px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 rounded-full" style={{ background: STATUS[s].dot }} />
                    </div>
                    <span>{pt ? `${pt[1].toFixed(2)}°` : '—'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">
                      {pt ? 'Géolocalisé' : 'Position non renseignée'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-zinc-500 hover:text-sky-400">
                      {kitAlerts > 0 ? `${kitAlerts} alerte(s)` : 'Voir le détail'}
                      <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-xs text-zinc-500">
                <Activity size={20} />
                <strong className="text-zinc-300">
                  {kitsQuery.isPending ? 'Chargement…' : kitsQuery.isError ? 'Parc indisponible' : 'Aucun kit trouvé'}
                </strong>
                <span>Modifiez la recherche ou le filtre.</span>
              </div>
            )}
          </div>
        </aside>

        {/* ================= COLONNE DROITE ================= */}
        <div className="flex min-w-0 flex-col gap-3">
          {/* -------- KPI -------- */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {kpis.map(({ label, value, hint, icon: Icon, accent, to, pct, pctColor, liveIndicator }) => (
              <Link key={label} to={to} className={`${panel} group p-3.5 transition hover:border-white/15`}>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    {liveIndicator && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                    )}
                    {label}
                  </span>
                  <span className="rounded-lg p-1.5" style={{ background: `${accent}22`, color: accent }}>
                    <Icon size={13} />
                  </span>
                </div>
                <strong className="mt-1 block text-2xl font-semibold tabular-nums text-white">{value}</strong>
                <div className="mt-1 flex items-end justify-between">
                  <span className="text-[11px] text-zinc-500">{hint}</span>
                  {pct !== null && pct !== undefined && (
                    <span className={`text-xs font-bold tabular-nums ${pctColor || 'text-zinc-400'}`}>
                      {pct}%
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* -------- CARTE -------- */}
          <section className={`${panel} relative h-[380px] overflow-hidden lg:h-auto lg:min-h-[360px] lg:flex-1`}>
            <LeafletMap
              points={located.map(({ kit, point }) => ({ id: kit.kitId || kit._id, kitId: kit.kitId, coords: point, status: statusOf(kit) }))}
              selectedId={selected?.kitId}
              onSelect={setSelectedId}
            />

            {/* voile dégradé + titre flottant */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-4">
              <div>
                <p className="text-sm font-semibold text-white">Équipements sur le terrain</p>
                <p className="text-[11px] text-zinc-400">{located.length} position(s) renseignée(s)</p>
              </div>
              <Link
                to="/parc"
                className="pointer-events-auto inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur hover:bg-black/70"
              >
                Voir le parc <ArrowUpRight size={12} />
              </Link>
            </div>

            {/* étiquette du kit sélectionné (façon "Dest / From") */}
            {selected && (
              <div className="absolute left-4 top-16 z-[500] hidden rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-[11px] backdrop-blur sm:block">
                <span className="text-zinc-500">Sélection </span>
                <span className="font-mono font-semibold text-white">{selected.kitId}</span>
              </div>
            )}

            {/* légende */}
            <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] text-zinc-300 backdrop-blur">
              {Object.entries(STATUS).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full" style={{ background: v.dot }} />
                  {v.label}
                </span>
              ))}
            </div>

            {located.length === 0 && (
              <div className="absolute inset-0 z-[600] flex flex-col items-center justify-center gap-1.5 bg-black/70 text-center text-xs text-zinc-400">
                <MapPin size={20} />
                <strong className="text-sm text-white">
                  {kitsQuery.isPending ? 'Chargement…' : kitsQuery.isError ? 'Parc indisponible' : 'Aucun équipement géolocalisé'}
                </strong>
                <span>Les positions renseignées apparaîtront ici.</span>
              </div>
            )}
          </section>

          {/* -------- PANNEAU DÉTAIL À ONGLETS -------- */}
          <section className={`${panel} p-4`}>
            <nav className="mb-4 flex gap-5 overflow-x-auto border-b border-white/[0.06] text-xs">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px whitespace-nowrap border-b-2 pb-2.5 font-medium transition ${tab === t.id ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {/* --- Vue d'ensemble --- */}
            {tab === 'overview' && (
              selected ? (
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-base font-semibold text-white">{selected.kitId}</h3>
                      <span className={`${chip} ${STATUS[selectedStatus].badge}`}>{STATUS[selectedStatus].label}</span>
                    </div>
                    <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">
                      Consultez les mesures du kit, les résultats du modèle et les recommandations à valider avant intervention.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to={detailUrl(selected.kitId, true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-zinc-200">
                        <BrainCircuit size={12} /> Diagnostic IA
                      </Link>
                      <Link to={detailUrl(selected.kitId)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/5">
                        <FileText size={12} /> Ouvrir la fiche
                      </Link>
                      <Link to="/InterventionWizard" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/5">
                        <Wrench size={12} /> Préparer une intervention
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[11px] text-zinc-500">Position</p>
                    <p className="mt-1 font-mono text-sm text-white">
                      {selectedPoint ? `${selectedPoint[0].toFixed(4)}, ${selectedPoint[1].toFixed(4)}` : 'Non renseignée'}
                    </p>
                    <p className="mt-3 text-[11px] text-zinc-500">Dernière mesure</p>
                    <p className="mt-1 text-sm text-white">{lastSeen ? formatDate(lastSeen) : 'Aucune reçue'}</p>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[11px] text-zinc-500">Alertes du kit</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{selectedAlerts.length}</p>
                    {selectedAlerts[0] ? (
                      <p className="mt-2 line-clamp-2 text-[11px] text-zinc-400">
                        {selectedAlerts[0].label || selectedAlerts[0].type}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-zinc-500">Rien à signaler.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-zinc-500">
                  {kitsQuery.isPending ? 'Chargement…' : 'Aucun kit à afficher.'}
                </p>
              )
            )}

            {/* --- Priorités / alertes --- */}
            {tab === 'alerts' && (
              <div className="grid gap-2 md:grid-cols-2">
                {alerts.slice(0, 6).map((alert, i) => (
                  <Link
                    key={alert._id || i}
                    to={'/notification?alertId=' + encodeURIComponent(alert._id || '')}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`${chip} ${SEV[alert.severity] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>
                        {severityLabels[alert.severity] || 'Non classée'}
                      </span>
                      <small className="text-[10px] text-zinc-500">{formatDate(alert.createdAt)}</small>
                    </div>
                    <h3 className="mt-2 text-[13px] font-medium text-white">{alert.label || alert.type}</h3>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-zinc-400">{alert.kitId || 'Kit non identifié'}</span>
                      <span className="inline-flex items-center text-sky-400">Examiner <ChevronRight size={12} /></span>
                    </div>
                  </Link>
                ))}
                {alerts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center gap-1.5 py-8 text-center text-xs text-zinc-500">
                    <Activity size={20} />
                    <strong className="text-zinc-300">
                      {alertsQuery.isPending ? 'Chargement…' : alertsQuery.isError ? 'Alertes indisponibles' : 'Aucune alerte ouverte'}
                    </strong>
                    <span>
                      {alertsQuery.isSuccess ? 'La liste se met à jour avec les remontées terrain.' : 'Réessayez pour connaître les priorités.'}
                    </span>
                  </div>
                )}
                {alerts.length > 0 && (
                  <Link to="/notification" className="col-span-full text-right text-[11px] font-medium text-sky-400 hover:underline">
                    Ouvrir le centre d’alertes →
                  </Link>
                )}
              </div>
            )}

            {/* --- Fiabilité --- */}
            {tab === 'quality' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-cyan-400' : 'bg-zinc-500'}`} />
                    <strong className="text-sm text-white">
                      {isSocketConnected ? 'Flux temps réel connecté' : 'Flux temps réel indisponible'}
                    </strong>
                  </div>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
                    Les compteurs utilisent les données reçues, dont les 100 dernières mesures. Un signal absent n’est pas un diagnostic de panne.
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-600">
                    Dernière lecture : {formatDate(telemetryQuery.dataUpdatedAt)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <Zap size={14} className="text-cyan-400" />
                    <p className="mt-2 text-xl font-semibold tabular-nums text-white">{cv(kitsQuery, online)}</p>
                    <span className="text-[11px] text-zinc-500">en ligne</span>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <Shield size={14} className="text-amber-400" />
                    <p className="mt-2 text-xl font-semibold tabular-nums text-white">{cv(alertsQuery, alerts.length)}</p>
                    <span className="text-[11px] text-zinc-500">alertes</span>
                  </div>
                </div>
              </div>
            )}

            {/* --- Accès rapide --- */}
            {tab === 'links' && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  { label: 'Parc solaire', desc: 'Fiche équipements', to: '/parc', icon: Sun, accent: '#f97316' },
                  { label: 'Alertes', desc: 'Anomalies & pannes', to: '/notification', icon: AlertTriangle, accent: '#f59e0b' },
                  { label: 'Devis', desc: 'Dimensionnement offres', to: '/devis', icon: ArrowUpRight, accent: '#a78bfa' },
                  { label: 'Maintenance', desc: 'Interventions', to: '/InterventionWizard', icon: Wrench, accent: '#22d3ee' },
                ].map(({ label, desc, to, icon: Icon, accent }) => (
                  <Link key={to} to={to} className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:bg-white/[0.05]">
                    <span className="rounded-lg p-2" style={{ background: `${accent}22`, color: accent }}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-xs text-white">{label}</strong>
                      <small className="block truncate text-[10px] text-zinc-500">{desc}</small>
                    </div>
                    <ChevronRight size={13} className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}