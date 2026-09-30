import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import worldTopo from 'world-atlas/countries-50m.json';
import {
  ArrowUpRight, RefreshCw, Sun, Radio, AlertTriangle, BrainCircuit,
  MapPin, Activity, Wrench, CircleHelp, Zap, Shield, ChevronRight,
  Search, FileText, Gauge, Plus, Minus, Crosshair,
} from 'lucide-react';
import { useKitsQuery, useAlertsQuery, useTelemetryQuery } from '../hooks/tanstack/useKitQueries';
import { useFleetLiveStatus } from '../hooks/tanstack/useFleetLiveStatus';
import {
  asList, activeAlerts, prioritize, latestByKit,
  observedRecently, coordinates, detailUrl, formatDate, severityLabels,
} from '../lib/operations';

/* ---------- petits helpers de style ---------- */
const STATUS = {
  alert: { label: 'Alerte', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: '#f59e0b' },
  online: { label: 'Signal récent', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', dot: '#22d3ee' },
  offline: { label: 'À vérifier', badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', dot: '#64748b' },
};

const SEV = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const panel = 'rounded-2xl border border-white/[0.06] bg-[#111113]';
const chip = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide';

/* ---------- Carte du monde sombre (SVG, sans tuiles ni Leaflet) ---------- */
const MW = 960;
const MH = 500;
const projection = geoNaturalEarth1().fitExtent([[8, 8], [MW - 8, MH - 8]], { type: 'Sphere' });
const pathGen = geoPath(projection);
const LAND = pathGen(feature(worldTopo, worldTopo.objects.land));
const BORDERS = pathGen(mesh(worldTopo, worldTopo.objects.countries, (a, b) => a !== b));
const GRATICULE = pathGen(geoGraticule10());
const toXY = ([lat, lng]) => projection([lng, lat]); // coordinates(kit) = [lat, lng]

function WorldMap({ points, selectedId, onSelect }) {
  const home = useMemo(() => {
    const [x, y] = toXY([-3.5, 23.5]); // centre d'origine : RDC
    return { x, y, k: 3 };
  }, []);
  const [view, setView] = useState(home);

  const sel = points.find(p => p.id === selectedId);
  const selXY = sel ? toXY(sel.coords) : null;
  const selKey = selXY ? selXY.join(',') : '';

  useEffect(() => {
    if (selXY) setView({ x: selXY[0], y: selXY[1], k: 5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selKey]);

  const zoom = f => setView(v => ({ ...v, k: Math.min(14, Math.max(1, v.k * f)) }));
  const { k } = view;
  const tx = MW / 2 - view.x * k;
  const ty = MH / 2 - view.y * k;

  return (
    <>
      <svg
        viewBox={`0 0 ${MW} ${MH}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Carte du parc"
      >
        <defs>
          <radialGradient id="wm-bg" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#15151a" />
            <stop offset="100%" stopColor="#09090b" />
          </radialGradient>
          <pattern id="wm-dots" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
            <circle cx="1.6" cy="1.6" r="0.75" fill="#a1a1aa" />
          </pattern>
          {Object.entries(STATUS).map(([key, v]) => (
            <radialGradient key={key} id={`wm-glow-${key}`}>
              <stop offset="0%" stopColor={v.dot} stopOpacity="0.55" />
              <stop offset="100%" stopColor={v.dot} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        <rect width={MW} height={MH} fill="url(#wm-bg)" />

        <g style={{ transform: `translate(${tx}px, ${ty}px) scale(${k})`, transformOrigin: '0 0', transition: 'transform .9s cubic-bezier(.4,0,.2,1)' }}>
          <path d={GRATICULE} fill="none" stroke="#fff" strokeOpacity="0.035" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <path d={LAND} fill="#141417" />
          <path d={LAND} fill="url(#wm-dots)" opacity="0.5" />
          <path d={BORDERS} fill="none" stroke="#9a9aa4" strokeOpacity="0.4" strokeWidth="0.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={LAND} fill="none" stroke="#b4b4bd" strokeOpacity="0.5" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />

          {points.map(p => {
            const xy = toXY(p.coords);
            if (!xy) return null;
            const isSel = p.id === selectedId;
            return (
              <g key={p.id} transform={`translate(${xy[0]} ${xy[1]})`} onClick={() => onSelect(p.kitId)} style={{ cursor: 'pointer' }}>
                <circle r={18 / k} fill={`url(#wm-glow-${p.status})`} />
                {isSel && (
                  <circle r={8 / k} fill="none" stroke="#fff" strokeWidth={1.2 / k}>
                    <animate attributeName="r" values={`${7 / k};${15 / k}`} dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={4.4 / k} fill={STATUS[p.status].dot} stroke="#0a0a0b" strokeWidth={1.6 / k} />
                <title>{p.kitId}</title>
              </g>
            );
          })}

          {sel && selXY && (
            <g transform={`translate(${selXY[0]} ${selXY[1]}) scale(${1 / k})`} pointerEvents="none">
              <g transform="translate(0 -14)">
                <rect x={-(sel.kitId.length * 3.6 + 24)} y={-24} width={sel.kitId.length * 7.2 + 48} height={24} rx="7"
                  fill="#000" fillOpacity="0.78" stroke="#fff" strokeOpacity="0.14" />
                <circle cx={-(sel.kitId.length * 3.6 + 10)} cy={-12} r="3" fill={STATUS[sel.status].dot} />
                <text x="4" y={-8} textAnchor="middle" fontSize="11" fill="#fff" fontFamily="ui-monospace, monospace">{sel.kitId}</text>
              </g>
            </g>
          )}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 z-[500] flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/60 text-zinc-300 backdrop-blur">
        <button onClick={() => zoom(1.6)} aria-label="Zoomer" className="p-2 hover:bg-white/10"><Plus size={14} /></button>
        <button onClick={() => zoom(1 / 1.6)} aria-label="Dézoomer" className="border-t border-white/10 p-2 hover:bg-white/10"><Minus size={14} /></button>
        <button onClick={() => setView(home)} aria-label="Recentrer" className="border-t border-white/10 p-2 hover:bg-white/10"><Crosshair size={14} /></button>
      </div>
    </>
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

  const kpis = [
    { label: 'Équipements', value: cv(kitsQuery, kits.length), hint: 'Inventaire des kits', icon: Sun, accent: '#f97316', to: '/parc' },
    {
      label: 'Signal récent', value: kitsQuery.isError || kitsQuery.isPending ? '—' : cv(telemetryQuery, online),
      hint: 'Mesure < 5 min', icon: Radio, accent: '#22d3ee', to: '/telemetry'
    },
    {
      label: 'Alertes ouvertes', value: cv(alertsQuery, alerts.length),
      hint: alertsQuery.isSuccess ? `${affected.size} kit(s) concerné(s)` : 'Source indisponible',
      icon: AlertTriangle, accent: '#f59e0b', to: '/notification'
    },
    {
      label: 'Sans observation', value: kitsQuery.isError || kitsQuery.isPending ? '—' : cv(telemetryQuery, kits.length - online),
      hint: 'Aucun signal récent', icon: CircleHelp, accent: '#a78bfa', to: '/diagnostics'
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
    <div className="min-h-screen bg-[#0a0a0b] p-3 text-zinc-300 sm:p-4">
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
                <button
                  key={kit.kitId || kit._id}
                  onClick={() => setSelectedId(kit.kitId)}
                  className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-white/15 bg-white/[0.06]' : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
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
                    <span className="text-zinc-500">
                      {kitAlerts > 0 ? `${kitAlerts} alerte(s)` : 'Aucune alerte'}
                    </span>
                  </div>
                </button>
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
            {kpis.map(({ label, value, hint, icon: Icon, accent, to }) => (
              <Link key={label} to={to} className={`${panel} group p-3.5 transition hover:border-white/15`}>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{label}</span>
                  <span className="rounded-lg p-1.5" style={{ background: `${accent}22`, color: accent }}>
                    <Icon size={13} />
                  </span>
                </div>
                <strong className="mt-1 block text-2xl font-semibold tabular-nums text-white">{value}</strong>
                <span className="text-[11px] text-zinc-500">{hint}</span>
              </Link>
            ))}
          </div>

          {/* -------- CARTE -------- */}
          <section className={`${panel} relative h-[380px] overflow-hidden lg:h-auto lg:min-h-[360px] lg:flex-1`}>
            <WorldMap
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
                      <Link to="/diagnostics" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-zinc-200">
                        <BrainCircuit size={12} /> Examiner
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
                  { label: 'Télémétrie', desc: 'Capteurs & mesures', to: '/telemetry', icon: Gauge, accent: '#22d3ee' },
                  { label: 'Devis', desc: 'Dimensionnement offres', to: '/devis', icon: ArrowUpRight, accent: '#a78bfa' },
                  { label: 'Maintenance', desc: 'Interventions', to: '/InterventionWizard', icon: Wrench, accent: '#f59e0b' },
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