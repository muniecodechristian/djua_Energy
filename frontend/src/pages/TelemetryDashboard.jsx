import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Battery,
  Sun,
  MapPin,
  Shield,
  ShieldAlert,
  RefreshCw,
  Terminal,
  Cpu,
  Wifi,
  WifiOff,
  Zap,
  Thermometer,
  Wind,
  Radio,
  Lock,
  Unlock,
  RotateCcw,
  Send,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTelemetryDashboard } from '../hooks/tanstack/useTelemetryStream.js';
import { useSendCommandMutation } from '../hooks/tanstack/useKitQueries.js';

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 180, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v, decimals = 1) => (v != null ? Number(v).toFixed(decimals) : '—');

const socColor = (soc) => {
  if (soc == null) return 'text-zinc-500';
  if (soc >= 60)   return 'text-emerald-400';
  if (soc >= 25)   return 'text-amber-400';
  return 'text-red-400';
};

const socBarColor = (soc) => {
  if (soc == null) return 'bg-zinc-700';
  if (soc >= 60)   return 'bg-emerald-500';
  if (soc >= 25)   return 'bg-amber-500';
  return 'bg-red-500';
};

const formatTs = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return String(ts); }
};

const formatShort = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return String(ts); }
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, title, value, unit, sub, accent = '#FF7900', warn = false }) => (
  <motion.div
    variants={fadeUp}
    className={`relative overflow-hidden rounded-2xl bg-zinc-950/80 border ${warn ? 'border-red-500/40' : 'border-zinc-800/60'} p-5 flex flex-col gap-3 group hover:border-zinc-700/80 transition-all duration-300`}
  >
    {/* Glow bg */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
      style={{ background: `radial-gradient(ellipse at top left, ${warn ? 'rgba(239,68,68,0.07)' : 'rgba(255,121,0,0.06)'} 0%, transparent 70%)` }}
    />

    <div className="flex items-center justify-between relative z-10">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: warn ? 'rgba(239,68,68,0.12)' : 'rgba(255,121,0,0.1)' }}
      >
        <Icon size={17} style={{ color: warn ? '#f87171' : accent }} />
      </div>
      {warn && (
        <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Alerte
        </span>
      )}
    </div>

    <div className="relative z-10">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-zinc-100 tabular-nums">{value ?? '—'}</span>
        {unit && <span className="text-xs text-zinc-500 font-medium">{unit}</span>}
      </div>
      {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  </motion.div>
);

// ─── Ligne skeleton ───────────────────────────────────────────────────────────
const RowSkeleton = () => (
  <div className="grid grid-cols-[1fr_1.2fr_1.5fr_1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 border-b border-zinc-900/50 animate-pulse">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-3 bg-zinc-800/60 rounded" />
    ))}
  </div>
);

// ─── Commandes par device ─────────────────────────────────────────────────────
const COMMANDS = [
  { label: 'requestTelemetry', icon: Send,      color: 'text-blue-400',    cmd: 'requestTelemetry' },
  { label: 'lockDevice',       icon: Lock,      color: 'text-red-400',     cmd: 'lockDevice' },
  { label: 'unlockDevice',     icon: Unlock,    color: 'text-emerald-400', cmd: 'unlockDevice' },
  { label: 'reboot',           icon: RotateCcw, color: 'text-amber-400',   cmd: 'reboot' },
];

const DeviceCommandPanel = ({ deviceId, device }) => {
  const { mutate: sendCmd, isPending } = useSendCommandMutation();
  const isOnline = device?.status === 'online';
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]' : 'bg-zinc-600'}`} />
          <span className="text-xs font-semibold text-zinc-200">{deviceId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800/60'}`}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
          {expanded ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2">
              {COMMANDS.map(({ label, icon: Icon, color, cmd }) => (
                <button
                  key={cmd}
                  onClick={() => sendCmd({ deviceId, command: cmd })}
                  disabled={isPending || !isOnline}
                  title={!isOnline ? 'Device hors ligne' : cmd}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-semibold bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
                >
                  <Icon size={11} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Page Principale ──────────────────────────────────────────────────────────
export default function TelemetryDashboard() {
  const {
    telemetryHistory,
    devicesMap,
    stats,
    isLoading,
    isError,
    refetch,
    lastUpdated,
  } = useTelemetryDashboard();

  const [filterDevice, setFilterDevice]   = useState('');
  const [showTamperOnly, setShowTamper]   = useState(false);
  const [expandedRow, setExpandedRow]     = useState(null);
  const [selectedTelemetry, setSelectedTelemetry] = useState(null);

  // Filtrage : une seule ligne de télémétrie par kit (la plus récente)
  const filteredHistory = useMemo(() => {
    // Éliminer les doublons historiques pour ne garder que le message le plus récent par deviceId
    const latestEntries = [];
    const seen = new Set();
    for (const entry of telemetryHistory) {
      if (!seen.has(entry.deviceId)) {
        seen.add(entry.deviceId);
        latestEntries.push(entry);
      }
    }

    let list = latestEntries;
    if (filterDevice.trim()) {
      const q = filterDevice.toLowerCase();
      list = list.filter((e) => e.deviceId?.toLowerCase().includes(q));
    }
    if (showTamperOnly) {
      list = list.filter((e) => e.data?.tamper === true);
    }
    return list;
  }, [telemetryHistory, filterDevice, showTamperOnly]);

  const deviceIds = Object.keys(devicesMap);

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-zinc-900 px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF7900] to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,121,0,0.3)]">
              <Radio size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Télémétrie IoT</h1>
              <p className="text-[10px] text-zinc-500 font-medium">Topic : <code className="text-[#FF7900]">djua/+/telemetry</code> — Refresh auto toutes les 10s</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicateur live */}
          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isError ? 'text-red-400' : 'text-emerald-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-400' : 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]'}`} />
            {isError ? 'Déconnecté' : 'Live'}
          </div>

          {lastUpdated && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500">
              <Clock size={10} />
              {formatShort(lastUpdated)}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-lg text-xs gap-1.5"
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            Rafraîchir
          </Button>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-8">

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          <KpiCard
            icon={Wifi}
            title="Devices en ligne"
            value={stats.onlineDevices}
            unit={`/ ${stats.totalDevices}`}
            sub="Connectés au broker"
          />
          <KpiCard
            icon={Battery}
            title="Tension batterie moy."
            value={stats.avgBatteryVoltage}
            unit="V"
            sub="Sur les 20 dernières"
          />
          <KpiCard
            icon={Activity}
            title="SOC moyen"
            value={stats.avgBatterySOC != null ? `${stats.avgBatterySOC}` : null}
            unit="%"
            sub="État de charge moyen"
          />
          <KpiCard
            icon={Sun}
            title="Puissance panneau moy."
            value={stats.avgPanelPower}
            unit="W"
            sub="Énergie générée"
          />
          <KpiCard
            icon={Terminal}
            title="Entrées reçues"
            value={stats.totalEntries}
            sub="Dans le buffer (max 100)"
          />
          <KpiCard
            icon={ShieldAlert}
            title="Alertes tamper"
            value={stats.tamperCount}
            sub="Boîtier ouvert détecté"
            warn={stats.tamperCount > 0}
          />
        </motion.div>

        {/* ── Contenu principal : Log + Panel Commandes ──────────────────────── */}
        <div className="flex gap-6 flex-col xl:flex-row">

          {/* ── Log Télémétrie ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Log Télémétrie</h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {isLoading ? 'Chargement...' : `${filteredHistory.length} entrée(s) affichée(s)`}
                </p>
              </div>

              {/* Filtres */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTamper((p) => !p)}
                  className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                    showTamperOnly
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ShieldAlert size={11} />
                  Tamper seul
                </button>
                <input
                  type="text"
                  placeholder="Filtrer par device..."
                  value={filterDevice}
                  onChange={(e) => setFilterDevice(e.target.value)}
                  className="h-8 w-40 text-[11px] bg-zinc-900/50 border border-zinc-800/60 text-zinc-200 placeholder-zinc-600 rounded-lg px-3 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-[#FF7900]/30 transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-zinc-800/50 overflow-hidden bg-zinc-950/40">
              {/* En-têtes */}
              <div className="hidden lg:grid grid-cols-[1.4fr_1.2fr_1.6fr_1.1fr_1.1fr_1fr_0.8fr_70px] gap-3 px-4 py-2.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 bg-zinc-950/60">
                <div className="flex items-center gap-1"><Cpu size={9} />Device</div>
                <div className="flex items-center gap-1"><Clock size={9} />Timestamp</div>
                <div className="flex items-center gap-1"><Battery size={9} />Batterie</div>
                <div className="flex items-center gap-1"><Sun size={9} />Panneau</div>
                <div className="flex items-center gap-1"><MapPin size={9} />GPS</div>
                <div className="flex items-center gap-1"><Wind size={9} />Vitesse</div>
                <div className="flex items-center gap-1"><Shield size={9} />Tamper</div>
                <div>Firmware</div>
              </div>

              {/* Skeletons */}
              {isLoading && (
                <div>
                  {Array.from({ length: 7 }).map((_, i) => <RowSkeleton key={i} />)}
                </div>
              )}

              {/* Erreur */}
              {isError && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <AlertTriangle size={24} className="text-zinc-600" />
                  <p className="text-xs text-zinc-500">Impossible de contacter le backend.</p>
                  <Button onClick={refetch} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 rounded-lg text-xs mt-1">
                    Réessayer
                  </Button>
                </div>
              )}

              {/* Vide */}
              {!isLoading && !isError && filteredHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Radio size={24} className="text-zinc-700" />
                  <p className="text-xs text-zinc-500">Aucune télémétrie reçue.</p>
                  <p className="text-[10px] text-zinc-600">En attente de messages sur <code className="text-zinc-500">djua/+/telemetry</code></p>
                </div>
              )}

              {/* Lignes */}
              {!isLoading && filteredHistory.length > 0 && (
                <div className="divide-y divide-zinc-900/50">
                  <AnimatePresence initial={false}>
                    {filteredHistory.map((entry, idx) => {
                      const d   = entry.data || {};
                      const soc = d.batterySOC;
                      const isExpanded = expandedRow === idx;
                      const hasTamper  = d.tamper === true;

                      return (
                        <motion.div
                          key={`${entry.deviceId}-${entry.timestamp}-${idx}`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Ligne principale */}
                          <div
                            onClick={() => setSelectedTelemetry(entry)}
                            className={`hidden lg:grid grid-cols-[1.4fr_1.2fr_1.6fr_1.1fr_1.1fr_1fr_0.8fr_70px] gap-3 px-4 py-3 items-center cursor-pointer transition-all hover:bg-zinc-900/30 ${
                              hasTamper ? 'bg-red-500/5 hover:bg-red-500/8' : ''
                            }`}
                          >
                            {/* Device */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] font-bold text-[#FF7900] truncate">{entry.deviceId}</span>
                            </div>

                            {/* Timestamp */}
                            <div className="text-[10px] text-zinc-400 tabular-nums">{formatTs(entry.timestamp)}</div>

                            {/* Batterie */}
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-semibold tabular-nums ${socColor(soc)}`}>
                                  {fmt(soc)}%
                                </span>
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${socBarColor(soc)}`}
                                    style={{ width: `${Math.min(100, soc ?? 0)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[9px] text-zinc-500 tabular-nums">
                                {fmt(d.batteryVoltage)}V · {fmt(d.batteryCurrent)}A · {fmt(d.batteryTemperature)}°C
                              </span>
                            </div>

                            {/* Panneau */}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold text-amber-400 tabular-nums">{fmt(d.panelPower)}W</span>
                              <span className="text-[9px] text-zinc-500 tabular-nums">{fmt(d.panelVoltage)}V · {fmt(d.panelCurrent)}A</span>
                            </div>

                            {/* GPS */}
                            <div className="flex flex-col gap-0.5">
                              {d.latitude != null ? (
                                <>
                                  <span className="text-[9px] text-zinc-400 tabular-nums">{Number(d.latitude).toFixed(4)}</span>
                                  <span className="text-[9px] text-zinc-400 tabular-nums">{Number(d.longitude).toFixed(4)}</span>
                                </>
                              ) : (
                                <span className="text-[9px] text-zinc-600">—</span>
                              )}
                            </div>

                            {/* Vitesse */}
                            <div className="text-[10px] text-zinc-400 tabular-nums">
                              {d.speed != null ? `${fmt(d.speed)} km/h` : '—'}
                            </div>

                            {/* Tamper */}
                            <div>
                              {hasTamper ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                                  <ShieldAlert size={8} />TAMPER
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-500">
                                  <CheckCircle2 size={9} />OK
                                </span>
                              )}
                            </div>

                            {/* Firmware */}
                            <div className="text-[9px] text-zinc-600 truncate">{d.firmwareVersion ?? '—'}</div>
                          </div>

                          {/* Ligne mobile (collapsed) */}
                          <div
                            onClick={() => setSelectedTelemetry(entry)}
                            className={`lg:hidden px-4 py-3 cursor-pointer flex flex-col gap-1 hover:bg-zinc-900/30 transition-colors ${hasTamper ? 'bg-red-500/5' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#FF7900]">{entry.deviceId}</span>
                              {hasTamper && (
                                <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <ShieldAlert size={8} />TAMPER
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                              <span>🔋 {fmt(soc)}% · {fmt(d.batteryVoltage)}V</span>
                              <span>☀️ {fmt(d.panelPower)}W</span>
                            </div>
                            <span className="text-[9px] text-zinc-600">{formatTs(entry.timestamp)}</span>
                          </div>

                          {/* Détail étendu */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 py-4 bg-zinc-950/60 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Device ID</span>
                                    <span className="text-[11px] font-semibold text-zinc-200">{entry.deviceId}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Timestamp</span>
                                    <span className="text-[11px] font-medium text-zinc-300">{formatTs(entry.timestamp)}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Batterie (V)</span>
                                    <span className="text-[11px] font-semibold text-zinc-200">{fmt(d.batteryVoltage, 2)} V</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Courant batterie</span>
                                    <span className="text-[11px] font-semibold text-zinc-200">{fmt(d.batteryCurrent, 3)} A</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">SOC</span>
                                    <span className={`text-[11px] font-bold ${socColor(soc)}`}>{fmt(soc, 0)} %</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Température batt.</span>
                                    <span className="text-[11px] font-semibold text-zinc-200">{fmt(d.batteryTemperature, 1)} °C</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Tension panneau</span>
                                    <span className="text-[11px] font-semibold text-amber-400">{fmt(d.panelVoltage, 2)} V</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Courant panneau</span>
                                    <span className="text-[11px] font-semibold text-amber-400">{fmt(d.panelCurrent, 3)} A</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Puissance panneau</span>
                                    <span className="text-[11px] font-bold text-amber-400">{fmt(d.panelPower, 2)} W</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Latitude</span>
                                    <span className="text-[11px] font-medium text-zinc-300">{d.latitude ?? '—'}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Longitude</span>
                                    <span className="text-[11px] font-medium text-zinc-300">{d.longitude ?? '—'}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Vitesse</span>
                                    <span className="text-[11px] font-medium text-zinc-300">{d.speed != null ? `${d.speed} km/h` : '—'}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Tamper</span>
                                    <span className={`text-[11px] font-bold ${hasTamper ? 'text-red-400' : 'text-emerald-400'}`}>
                                      {hasTamper ? '⚠ BOITIER OUVERT' : '✓ Fermé'}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Firmware</span>
                                    <span className="text-[11px] font-medium text-zinc-400">{d.firmwareVersion ?? '—'}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* ── Panel de Commandes ────────────────────────────────────────────── */}
          <div className="xl:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-[#FF7900]" />
                <h2 className="text-sm font-semibold text-zinc-100">Commandes</h2>
                <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800/60 px-1.5 py-0.5 rounded-full">
                  {deviceIds.length} device(s)
                </span>
              </div>

              {deviceIds.length === 0 && !isLoading ? (
                <div className="rounded-2xl bg-zinc-950/40 border border-zinc-800/40 p-6 flex flex-col items-center gap-3 text-center">
                  <WifiOff size={22} className="text-zinc-700" />
                  <p className="text-xs text-zinc-500">Aucun device détecté.</p>
                  <p className="text-[10px] text-zinc-600">
                    Les devices apparaissent dès leur première connexion MQTT.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deviceIds.map((deviceId) => (
                    <DeviceCommandPanel
                      key={deviceId}
                      deviceId={deviceId}
                      device={devicesMap[deviceId]}
                    />
                  ))}
                </div>
              )}

              {/* Légende des commandes */}
              <div className="mt-5 rounded-xl bg-zinc-950/40 border border-zinc-800/40 p-4 space-y-2.5">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-3">Référence commandes</p>
                {[
                  { cmd: 'requestTelemetry', desc: 'Force l\'ESP32 à envoyer sa télémétrie immédiatement', color: 'text-blue-400' },
                  { cmd: 'lockDevice',       desc: 'Verrouille le kit (LED rouge + buzzer)', color: 'text-red-400' },
                  { cmd: 'unlockDevice',     desc: 'Rétablit le fonctionnement normal', color: 'text-emerald-400' },
                  { cmd: 'reboot',           desc: 'Force le redémarrage matériel de l\'ESP32', color: 'text-amber-400' },
                ].map(({ cmd, desc, color }) => (
                  <div key={cmd} className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-mono font-semibold ${color}`}>{cmd}</span>
                    <span className="text-[9px] text-zinc-600 leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal Détails Télémétrie ── */}
      <AnimatePresence>
        {selectedTelemetry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTelemetry(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Contenu Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
            >
              {/* En-tête */}
              <div className="p-4 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Radio size={14} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Données Télémétrie instantanées</h3>
                    <p className="text-[9px] text-zinc-500 font-mono">{selectedTelemetry.deviceId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTelemetry(null)}
                  className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-400">
                {/* Métriques Clés */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Batterie SOC</span>
                    <span className="text-sm font-bold text-white">{selectedTelemetry.data?.batterySOC}%</span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">{selectedTelemetry.data?.batteryVoltage}V · {selectedTelemetry.data?.batteryCurrent}A</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Énergie Panneau</span>
                    <span className="text-sm font-bold text-amber-400">{selectedTelemetry.data?.panelPower} W</span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">{selectedTelemetry.data?.panelVoltage}V · {selectedTelemetry.data?.panelCurrent}A</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Statut Boîtier</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full border ${
                      selectedTelemetry.data?.tamper ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {selectedTelemetry.data?.tamper ? '⚠️ TAMPER (OUVERT)' : '✅ SÉCURISÉ (FERMÉ)'}
                    </span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 col-span-2">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Coordonnées GPS</span>
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mt-1">
                      <MapPin size={12} className="text-orange-500" />
                      Lat: {selectedTelemetry.data?.latitude?.toFixed(5) ?? 'N/A'}, Lon: {selectedTelemetry.data?.longitude?.toFixed(5) ?? 'N/A'}
                    </span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Dernier Contact</span>
                    <span className="text-xs font-bold text-zinc-300 block mt-1">{new Date(selectedTelemetry.timestamp).toLocaleTimeString('fr-FR')}</span>
                  </div>
                </div>

                {/* Données Brutes JSON */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Données Brutes (Payload reçu)</span>
                  <pre className="text-[10px] font-mono bg-zinc-950 p-4 rounded-xl overflow-x-auto border border-zinc-900 text-zinc-300 leading-relaxed">
                    {JSON.stringify(selectedTelemetry, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Pied de page */}
              <div className="p-3 border-t border-zinc-900 bg-zinc-900/20 flex justify-end gap-2">
                <Button onClick={() => setSelectedTelemetry(null)} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
                  Fermer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
