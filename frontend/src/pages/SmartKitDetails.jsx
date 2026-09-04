import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import {
  Activity, ShieldAlert, Wifi, Zap,
  RefreshCw, MoreHorizontal, MapPin,
  Radio, Database, Server,
  ShieldCheck, Thermometer, Droplets,
  Sun, BatteryCharging, Battery, Navigation,
  Signal, AlertTriangle, CheckCircle2, Clock,
  ArrowUpRight, TrendingUp, TrendingDown,
  Minus, ChevronRight, Cpu, Layers
} from 'lucide-react';
import { useKitLiveTelemetry } from '../hooks/tanstack/useKitLiveTelemetry.js';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Custom Leaflet Marker ---
const customIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
    <span style="position:absolute;display:inline-flex;height:100%;width:100%;border-radius:50%;background:rgba(249,115,22,0.35);animation:ping 1.4s cubic-bezier(0,0,.2,1) infinite;"></span>
    <span style="position:relative;display:inline-flex;border-radius:50%;width:14px;height:14px;background:#f97316;border:2.5px solid #09090b;box-shadow:0 0 0 3px rgba(249,115,22,0.25);"></span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// --- Date Parser robuste ---
const parseDateString = (v) => {
  if (!v) return null;
  let d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  d = new Date(Number(v) * 1000);
  if (!isNaN(d.getTime())) return d;
  d = new Date(Number(v));
  if (!isNaN(d.getTime())) return d;
  return null;
};

const formatTime = (v) => {
  const d = parseDateString(v);
  return d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '\u2014';
};

const fmt = (value, unit = '') => {
  if (value === undefined || value === null) return '\u2014';
  if (typeof value === 'number') return `${Number(value.toFixed(2)).toString()}${unit}`;
  return `${value}${unit}`;
};

// --- Map auto-center ---
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom(), { animate: true }); }, [center, map]);
  return null;
};

// --- Sparkline mini ---
const Spark = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={36}>
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`sg${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="val" stroke={color} strokeWidth={1.5}
        fill={`url(#sg${color.replace('#', '')})`} dot={false} isAnimationActive={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// --- Badge de tendance ---
const Trend = ({ prev, curr, unit = '' }) => {
  if (prev == null || curr == null) return null;
  const diff = curr - prev;
  if (Math.abs(diff) < 0.01) return (
    <span className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-500">
      <Minus size={9} /> stable
    </span>
  );
  const up = diff > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-mono ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}{diff.toFixed(2)}{unit}
    </span>
  );
};

// --- Carte Metrique --- icones toujours orange
const ICON_ORANGE = '#f97316';
const MetricCard = ({ icon: Icon, label, value, unit, color, sparkData, prev, curr, badge }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative bg-zinc-900/50 border border-zinc-800/70 rounded-2xl p-4 flex flex-col gap-1 overflow-hidden group hover:border-zinc-700/60 transition-all duration-300"
    whileHover={{ scale: 1.015 }}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: `radial-gradient(ellipse at top left, ${color}10 0%, transparent 65%)` }} />

    <div className="flex items-center justify-between mb-1 relative z-10">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ background: '#f9731618', border: '1px solid #f9731630' }}>
          <Icon size={13} style={{ color: ICON_ORANGE }} />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      {badge && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 bg-zinc-950/60">{badge}</span>
      )}
    </div>

    <div className="flex items-baseline gap-1.5 relative z-10">
      <span className="text-2xl font-extrabold font-mono text-white tracking-tight leading-none">
        {value ?? '\u2014'}
      </span>
      {unit && <span className="text-sm font-mono text-zinc-400">{unit}</span>}
    </div>

    <Trend prev={prev} curr={curr} unit={unit} />

    {sparkData && sparkData.length > 0 && (
      <div className="mt-1 relative z-10">
        <Spark data={sparkData} color={color} />
      </div>
    )}
  </motion.div>
);

// --- Skeleton de chargement ---
const SkeletonCard = () => (
  <div className="bg-zinc-900/50 border border-zinc-800/70 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-zinc-800" />
      <div className="h-2.5 w-24 rounded bg-zinc-800" />
    </div>
    <div className="h-7 w-20 rounded bg-zinc-800" />
    <div className="h-8 w-full rounded bg-zinc-800/60" />
  </div>
);

const LoadingScreen = ({ kitId }) => (
  <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
    <header className="border-b border-zinc-800/70 px-5 py-4">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
          <Zap size={18} className="text-orange-400" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold font-mono text-white">{kitId || 'DK-SOLAR-092'}</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              <RefreshCw size={10} className="animate-spin text-orange-400" />
              Vérification de l’état du kit…
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">Connexion au kit en cours, veuillez patienter</p>
        </div>
      </div>
    </header>
    <main className="max-w-screen-2xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
    </main>
  </div>
);

// --- Section Header ---
const SectionTitle = ({ icon: Icon, title, subtitle, color = '#f97316' }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="p-1.5 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
      <Icon size={14} style={{ color }} />
    </div>
    <div>
      <h2 className="text-xs font-semibold font-mono text-zinc-200 uppercase tracking-widest">{title}</h2>
      {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
    </div>
  </div>
);

// --- Panel wrapper ---
const Panel = ({ children, className = '', glow = false, color = '#f97316' }) => (
  <div
    className={`relative bg-zinc-900/50 border border-zinc-800/70 rounded-2xl overflow-hidden ${className}`}
    style={glow ? { boxShadow: `0 0 30px -10px ${color}30` } : {}}
  >
    {children}
  </div>
);

// --- Gauge radiale ---
const RadialGauge = ({ value, max = 100, color, label, unit }) => {
  const pct = Math.min(100, Math.max(0, ((value ?? 0) / max) * 100));
  const data = [{ value: pct, fill: color }];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 90, height: 90 }}>
        <RadialBarChart
          width={90} height={90}
          innerRadius={30} outerRadius={42}
          data={data} startAngle={220} endAngle={-40}
          barSize={8}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#1c1c1e' }} />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold font-mono text-white">{value ?? '\u2014'}</span>
          <span className="text-[9px] font-mono text-zinc-500">{unit}</span>
        </div>
      </div>
      <span className="text-[10px] font-mono text-zinc-400 text-center leading-tight">{label}</span>
    </div>
  );
};

// --- Signal strength bars ---
const SignalBars = ({ dbm }) => {
  const strength = dbm >= -50 ? 4 : dbm >= -65 ? 3 : dbm >= -80 ? 2 : 1;
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map(b => (
        <div key={b} className="w-1.5 rounded-sm" style={{
          height: `${b * 22}%`,
          background: b <= strength ? '#f97316' : '#27272a',
          minHeight: 3
        }} />
      ))}
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function SmartKitDetails() {
  const [searchParams] = useSearchParams();
  const kitId = searchParams.get('kitId');
  const [activeTab, setActiveTab] = useState('Synth\u00e8se');
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(new Date());
  const prevTelRef = useRef(null);
  // Chargement initial : on laisse 3.5s au serveur pour détecter l'état réel
  const [isChecking, setIsChecking] = useState(true);

  const { telemetryRecords, latestTelemetry, isLive, dataSource, isLoading } = useKitLiveTelemetry(kitId);

  useEffect(() => {
    // On attend que le hook ait fini OU 3.5s max, le premier des deux
    if (!isLoading) { setIsChecking(false); return; }
    const timer = setTimeout(() => setIsChecking(false), 3500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const T = latestTelemetry;
  const P = prevTelRef.current;
  useEffect(() => {
    if (T) prevTelRef.current = T;
  }, [T]);

  const lastUpdate = formatTime(T?.event_time);

  const lat = T?.latitude && !isNaN(T.latitude) ? Number(T.latitude) : -4.325;
  const lng = T?.longitude && !isNaN(T.longitude) ? Number(T.longitude) : 15.3222;

  const chartData = telemetryRecords.slice(-24).map((r, i) => {
    const d = parseDateString(r.event_time);
    return {
      time: d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : `${i + 1}h`,
      tension_bat: r.battery_voltage_v ?? 0,
      courant_bat: r.battery_current_a ?? 0,
      tension_pv: r.solar_voltage_v ?? 0,
      courant_pv: r.solar_current_a ?? 0,
      puissance_pv: r.solar_power_w ?? 0,
      soc: r.state_of_charge_pct ?? 0,
      temp_boitier: r.device_temperature_c ?? 0,
      temp_ambiante: r.ambient_temperature_c ?? 0,
      humidite: r.humidity_pct ?? 0,
    };
  });

  const spark = (key) => chartData.map(r => ({ val: r[key] ?? 0 }));

  const tabs = ['Synth\u00e8se', '\u00c9nergie Solaire', 'Environnement', 'R\u00e9seau & GPS'];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (isChecking) return <LoadingScreen kitId={kitId} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-zinc-900/95 border border-zinc-700 text-zinc-200 text-xs shadow-2xl backdrop-blur-xl flex items-center gap-3"
          >
            <CheckCircle2 size={14} className="text-orange-400" />
            <span className="font-mono text-[11px]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER COCKPIT */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/70">
        <div className="max-w-screen-2xl mx-auto px-5 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
                  <Zap size={18} className="text-orange-400" />
                </div>
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-950 ${isLive ? 'bg-emerald-500' : 'bg-zinc-600'}`}>
                  {isLive && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold font-mono text-white tracking-tight">{kitId || 'DK-SOLAR-092'}</h1>
                  {/* Badge statut — termes non-techniques */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold tracking-wide ${
                    isLive
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                    {isLive ? 'Actif — données en direct' : 'Inactif — dernier relevé connu'}
                  </div>
                  {/* Badge source — termes non-techniques */}
                  {T && (
                    <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-medium ${
                      dataSource === 'live'
                        ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}>
                      {dataSource === 'live'
                        ? <><Radio size={9} className="animate-pulse" /> Mis à jour automatiquement</>
                        : <><Database size={9} /> Données enregistrées</>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono mt-0.5">
                  <span>Dernier paquet : <strong className="text-zinc-300">{lastUpdate}</strong></span>
                  <span className="text-zinc-700">\u2022</span>
                  <span>{now.toLocaleTimeString('fr-FR')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Diagnostic lanc\u00e9\u2026')}
                className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl text-xs font-medium text-zinc-300 transition-all active:scale-95 flex items-center gap-2"
              >
                <Activity size={13} className="text-zinc-400" /> Diagnostic
              </button>
              <button
                onClick={() => showToast('Intervention terrain cr\u00e9\u00e9e')}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-semibold text-white transition-all shadow-lg shadow-orange-950/50 active:scale-95"
              >
                Intervention
              </button>
              <button className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl text-zinc-500 transition-all">
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-0.5 mt-4 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 text-[11px] font-semibold transition-all cursor-pointer bg-transparent border-none whitespace-nowrap rounded-lg ${
                  activeTab === tab ? 'text-orange-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {activeTab === tab && (
                  <motion.div layoutId="tab-bg"
                    className="absolute inset-0 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative">{tab}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-screen-2xl mx-auto px-5 py-6">
        <AnimatePresence mode="wait">

          {/* ===== SYNTHESE ===== */}
          {activeTab === 'Synth\u00e8se' && (
            <motion.div key="synthese"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <MetricCard icon={Battery} label="\u00c9tat de Charge" value={T?.state_of_charge_pct} unit="%" color="#10b981"
                sparkData={spark('soc')} prev={P?.state_of_charge_pct} curr={T?.state_of_charge_pct} badge="SoC" />
              <MetricCard icon={BatteryCharging} label="Tension Batterie" value={T?.battery_voltage_v} unit=" V" color="#f97316"
                sparkData={spark('tension_bat')} prev={P?.battery_voltage_v} curr={T?.battery_voltage_v} badge="VDC" />
              <MetricCard icon={Zap} label="Courant Batterie" value={T?.battery_current_a} unit=" A" color="#eab308"
                sparkData={spark('courant_bat')} prev={P?.battery_current_a} curr={T?.battery_current_a} badge="MPPT" />
              <MetricCard icon={Activity} label="Puissance Batterie" value={T?.battery_power_w} unit=" W" color="#a78bfa"
                sparkData={[]} prev={P?.battery_power_w} curr={T?.battery_power_w} badge="PWR" />

              <MetricCard icon={ShieldCheck} label="Sant\u00e9 Batterie" value={T?.state_of_health_pct} unit="%" color="#06b6d4"
                sparkData={[]} prev={null} curr={null} badge="SoH" />
              <MetricCard icon={Sun} label="Tension Panneau PV" value={T?.solar_voltage_v} unit=" V" color="#fbbf24"
                sparkData={spark('tension_pv')} prev={P?.solar_voltage_v} curr={T?.solar_voltage_v} badge="PV" />
              <MetricCard icon={TrendingUp} label="Courant Solaire" value={T?.solar_current_a} unit=" A" color="#fb923c"
                sparkData={spark('courant_pv')} prev={P?.solar_current_a} curr={T?.solar_current_a} badge="PV" />
              <MetricCard icon={Layers} label="Puissance Solaire" value={T?.solar_power_w} unit=" W" color="#f97316"
                sparkData={spark('puissance_pv')} prev={P?.solar_power_w} curr={T?.solar_power_w} badge="PV" />

              <MetricCard icon={Zap} label="\u00c9nergie G\u00e9n\u00e9r\u00e9e" value={T?.energy_generated_wh} unit=" Wh" color="#34d399"
                sparkData={[]} prev={null} curr={null} badge="WH" />
              <MetricCard icon={Thermometer} label="Temp. Bo\u00eetier" value={T?.device_temperature_c} unit="\u00b0C" color="#f43f5e"
                sparkData={spark('temp_boitier')} prev={P?.device_temperature_c} curr={T?.device_temperature_c} badge="ESP32" />
              <MetricCard icon={Thermometer} label="Temp. Ambiante" value={T?.ambient_temperature_c} unit="\u00b0C" color="#fb7185"
                sparkData={spark('temp_ambiante')} prev={P?.ambient_temperature_c} curr={T?.ambient_temperature_c} badge="EXT" />
              <MetricCard icon={Droplets} label="Humidit\u00e9" value={T?.humidity_pct} unit="%" color="#38bdf8"
                sparkData={spark('humidite')} prev={P?.humidity_pct} curr={T?.humidity_pct} badge="RH" />

              {/* Graphe combine */}
              <div className="col-span-2 md:col-span-4">
                <Panel className="p-5">
                  <SectionTitle icon={Activity} title="Analyse T\u00e9l\u00e9m\u00e9trique Continue"
                    subtitle="Courbes tension / courant \u2014 Batterie & Panneau Solaire (24 derniers relev\u00e9s)" />
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.length > 0 ? chartData : []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1c1c1e" vertical={false} />
                        <XAxis dataKey="time" stroke="#3f3f46" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#3f3f46" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace' }} />
                        <Line type="monotone" dataKey="tension_bat" name="Tension Bat. (V)" stroke="#f97316" strokeWidth={1.8} dot={false} />
                        <Line type="monotone" dataKey="courant_bat" name="Courant Bat. (A)" stroke="#eab308" strokeWidth={1.8} dot={false} />
                        <Line type="monotone" dataKey="tension_pv" name="Tension PV (V)" stroke="#34d399" strokeWidth={1.4} dot={false} strokeDasharray="4 2" />
                        <Line type="monotone" dataKey="courant_pv" name="Courant PV (A)" stroke="#38bdf8" strokeWidth={1.4} dot={false} strokeDasharray="4 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>

              {/* Erreurs */}
              <div className="col-span-2">
                <Panel className="p-5 h-full">
                  <SectionTitle icon={ShieldAlert} title="Codes Erreur & Alertes" color="#f43f5e" />
                  <div className="space-y-2.5">
                    {[
                      { label: 'Erreur Batterie', value: T?.battery_error_code, icon: Battery },
                      { label: 'Erreur Panneau PV', value: T?.solar_error_code, icon: Sun },
                      { label: 'Surcharge D\u00e9tect\u00e9e', value: T?.overload_detected ? 'OUI' : 'NON', icon: AlertTriangle, alert: T?.overload_detected },
                      { label: 'Conso. Anormale', value: T?.abnormal_consumption_detected ? 'OUI' : 'NON', icon: Activity, alert: T?.abnormal_consumption_detected },
                    ].map(({ label, value, icon: Icon, alert }) => (
                      <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <Icon size={12} className={alert ? 'text-red-400' : 'text-zinc-500'} />
                          <span className="text-[11px] font-mono text-zinc-400">{label}</span>
                        </div>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                          alert || (value && value !== 'NONE' && value !== 'NON')
                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        }`}>{value || 'AUCUN'}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              {/* Cycles de charge */}
              <div className="col-span-2">
                <Panel className="p-5 h-full">
                  <SectionTitle icon={Clock} title="Cycles de Charge" color="#a78bfa" />
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {[
                      { label: 'Dur\u00e9e Charge', sec: T?.charge_duration_seconds, color: '#10b981' },
                      { label: 'Dur\u00e9e D\u00e9charge', sec: T?.discharge_duration_seconds, color: '#f97316' },
                    ].map(({ label, sec, color }) => {
                      const h = sec != null ? Math.floor(sec / 3600) : null;
                      const m = sec != null ? Math.floor((sec % 3600) / 60) : null;
                      return (
                        <div key={label} className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/50 gap-1">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{label}</span>
                          <span className="text-xl font-extrabold font-mono" style={{ color }}>
                            {sec != null ? `${h}h${String(m).padStart(2, '0')}` : '\u2014'}
                          </span>
                          {sec != null && <span className="text-[9px] text-zinc-600 font-mono">{sec} sec</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu size={12} className="text-zinc-500" />
                      <span className="text-[11px] font-mono text-zinc-400">N\u00b0 S\u00e9quence</span>
                    </div>
                    <span className="text-[11px] font-mono text-orange-400">{T?.sequence_number ?? '\u2014'}</span>
                  </div>
                </Panel>
              </div>
            </motion.div>
          )}

          {/* ===== ENERGIE SOLAIRE ===== */}
          {activeTab === '\u00c9nergie Solaire' && (
            <motion.div key="solaire"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Panel className="p-6">
                <SectionTitle icon={Sun} title="Vue Panneau Photovolta\u00efque" subtitle="Donn\u00e9es temps r\u00e9el depuis le contr\u00f4leur MPPT" color="#fbbf24" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
                  <RadialGauge value={T?.solar_voltage_v} max={50} color="#fbbf24" label="Tension PV" unit="V" />
                  <RadialGauge value={T?.solar_current_a} max={20} color="#fb923c" label="Courant PV" unit="A" />
                  <RadialGauge value={T?.solar_power_w} max={400} color="#f97316" label="Puissance PV" unit="W" />
                  <RadialGauge value={T?.energy_generated_wh} max={2000} color="#34d399" label="\u00c9nergie G\u00e9n\u00e9r\u00e9e" unit="Wh" />
                </div>
              </Panel>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel className="p-5">
                  <SectionTitle icon={BatteryCharging} title="Batterie \u2014 D\u00e9tail Complet" color="#10b981" />
                  <div className="space-y-2 mt-2">
                    {[
                      { label: 'Tension', value: fmt(T?.battery_voltage_v, ' V'), color: '#f97316' },
                      { label: 'Courant', value: fmt(T?.battery_current_a, ' A'), color: '#eab308' },
                      { label: 'Puissance', value: fmt(T?.battery_power_w, ' W'), color: '#a78bfa' },
                      { label: '\u00c9tat de Charge (SoC)', value: fmt(T?.state_of_charge_pct, ' %'), color: '#10b981' },
                      { label: '\u00c9tat de Sant\u00e9 (SoH)', value: fmt(T?.state_of_health_pct, ' %'), color: '#06b6d4' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                        <span className="text-[11px] font-mono text-zinc-400">{label}</span>
                        <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="p-5">
                  <SectionTitle icon={Sun} title="Panneau Solaire \u2014 D\u00e9tail" color="#fbbf24" />
                  <div className="space-y-2 mt-2">
                    {[
                      { label: 'Tension PV', value: fmt(T?.solar_voltage_v, ' V'), color: '#fbbf24' },
                      { label: 'Courant PV', value: fmt(T?.solar_current_a, ' A'), color: '#fb923c' },
                      { label: 'Puissance PV', value: fmt(T?.solar_power_w, ' W'), color: '#f97316' },
                      { label: '\u00c9nergie Intervalle', value: fmt(T?.energy_generated_wh, ' Wh'), color: '#34d399' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                        <span className="text-[11px] font-mono text-zinc-400">{label}</span>
                        <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
                      <span>Niveau de charge batterie</span>
                      <span className="text-emerald-400">{T?.state_of_charge_pct ?? 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${T?.state_of_charge_pct ?? 0}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, #10b981, ${(T?.state_of_charge_pct ?? 0) > 60 ? '#34d399' : '#fbbf24'})` }}
                      />
                    </div>
                  </div>
                </Panel>
              </div>

              <Panel className="p-5">
                <SectionTitle icon={Activity} title="Courbe Puissance Solaire & SoC" color="#fbbf24" />
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gpv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gsoc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1c1c1e" vertical={false} />
                      <XAxis dataKey="time" stroke="#3f3f46" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#3f3f46" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Area type="monotone" dataKey="puissance_pv" name="Puissance PV (W)" stroke="#fbbf24" strokeWidth={1.8} fill="url(#gpv)" dot={false} />
                      <Area type="monotone" dataKey="soc" name="SoC (%)" stroke="#10b981" strokeWidth={1.8} fill="url(#gsoc)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ===== ENVIRONNEMENT ===== */}
          {activeTab === 'Environnement' && (
            <motion.div key="env"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Panel className="p-5 md:col-span-1" glow color="#f43f5e">
                <SectionTitle icon={Thermometer} title="Temp\u00e9rature Bo\u00eetier ESP32" color="#f43f5e" />
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="absolute inset-0" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="54" fill="none" stroke="#1c1c1e" strokeWidth="10" />
                      <circle cx="64" cy="64" r="54" fill="none" stroke="#f43f5e"
                        strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${Math.min(100, (T?.device_temperature_c ?? 0) / 80 * 100) * 3.39} 339`}
                        transform="rotate(-90 64 64)" />
                    </svg>
                    <div className="text-center">
                      <span className="text-3xl font-extrabold font-mono text-white">{T?.device_temperature_c ?? '\u2014'}</span>
                      <span className="text-sm text-zinc-400 block">\u00b0C</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
                    (T?.device_temperature_c ?? 0) > 60
                      ? 'bg-red-500/15 border-red-500/25 text-red-400'
                      : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                  }`}>
                    {(T?.device_temperature_c ?? 0) > 60 ? '\u26a0 Seuil critique approch\u00e9' : '\u2713 Temp\u00e9rature nominale'}
                  </span>
                </div>
              </Panel>

              <Panel className="p-5 md:col-span-1">
                <SectionTitle icon={Droplets} title="Conditions Ambiantes" color="#38bdf8" />
                <div className="space-y-4 mt-2">
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[11px] font-mono text-zinc-400">Temp\u00e9rature Ext\u00e9rieure</span>
                      <span className="text-xl font-extrabold font-mono text-amber-400">{T?.ambient_temperature_c ?? '\u2014'}\u00b0C</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${Math.min(100, (T?.ambient_temperature_c ?? 0) / 50 * 100)}%` }}
                        className="h-full bg-amber-400 rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[11px] font-mono text-zinc-400">Humidit\u00e9 Relative</span>
                      <span className="text-xl font-extrabold font-mono text-sky-400">{T?.humidity_pct ?? '\u2014'}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${T?.humidity_pct ?? 0}%` }}
                        className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel className="p-5 md:col-span-1">
                <SectionTitle icon={Activity} title="Historique Temp\u00e9ratures" color="#f43f5e" />
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1c1c1e" vertical={false} />
                      <XAxis dataKey="time" stroke="#3f3f46" fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis stroke="#3f3f46" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="temp_boitier" name="Bo\u00eetier (\u00b0C)" stroke="#f43f5e" strokeWidth={1.8} dot={false} />
                      <Line type="monotone" dataKey="temp_ambiante" name="Ambiante (\u00b0C)" stroke="#fbbf24" strokeWidth={1.4} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="humidite" name="Humidit\u00e9 (%)" stroke="#38bdf8" strokeWidth={1.4} dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ===== RESEAU & GPS ===== */}
          {activeTab === 'R\u00e9seau & GPS' && (
            <motion.div key="gps"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Panel className="p-5 md:col-span-1">
                <SectionTitle icon={Signal} title="R\u00e9seau & Connectivit\u00e9" color="#f97316" />
                <div className="space-y-3 mt-2">
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-zinc-400">Intensit\u00e9 Signal (RSSI)</span>
                      <SignalBars dbm={T?.signal_strength_dbm ?? -99} />
                    </div>
                    <span className="text-2xl font-extrabold font-mono text-orange-400">
                      {T?.signal_strength_dbm != null ? `${T.signal_strength_dbm} dBm` : '\u2014'}
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                      {(T?.signal_strength_dbm ?? -99) >= -65 ? 'Signal excellent' : (T?.signal_strength_dbm ?? -99) >= -80 ? 'Signal correct' : 'Signal faible'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">Mode de réception</span>
                    <div className="flex items-center gap-2">
                      {isLive
                        ? <Radio size={14} className="text-orange-400 animate-pulse" />
                        : <Database size={14} className="text-zinc-500" />}
                      <span className="text-sm font-bold font-mono text-white">
                        {isLive
                          ? 'Mis à jour en temps réel'
                          : 'Affichage du dernier relevé connu'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {isLive
                        ? 'Le kit envoie des données à cet instant.'
                        : 'Le kit ne transmet plus. Les données affichées sont les dernières reçues.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">ID Message</span>
                    <span className="text-[11px] font-mono text-zinc-300 break-all">{T?.message_id || '\u2014'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">R\u00e9gion d\u2019Installation</span>
                    <span className="text-sm font-bold font-mono text-white capitalize">{T?.region || 'Kinshasa, DRC'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">Type d\u2019Installation</span>
                    <span className="text-[11px] font-mono text-zinc-300 capitalize">
                      {(T?.installation_type || 'household_rooftop').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </Panel>

              <Panel className="p-5 md:col-span-2" glow color="#f97316">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <SectionTitle icon={MapPin} title="Localisation GPS Temps R\u00e9el"
                    subtitle="Coordonn\u00e9es GNSS depuis l\u2019ESP32 \u2014 mise \u00e0 jour automatique" color="#f97316" />
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                    <Navigation size={10} className="text-orange-400" />
                    <span className="text-orange-400 font-semibold">{lat.toFixed(5)}</span>
                    <span className="text-zinc-600">,</span>
                    <span className="text-orange-400 font-semibold">{lng.toFixed(5)}</span>
                  </div>
                </div>

                <div className="h-72 w-full rounded-xl overflow-hidden border border-zinc-800/80 relative">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                  >
                    <MapUpdater center={[lat, lng]} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      className="map-tiles-dark"
                    />
                    <Marker position={[lat, lng]} icon={customIcon} />
                  </MapContainer>
                  <div className="absolute bottom-3 left-3 z-[999] px-3 py-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800 backdrop-blur-sm flex items-center gap-2">
                    <MapPin size={11} className="text-orange-400" />
                    <span className="text-[10px] font-mono text-zinc-300">
                      LAT {lat.toFixed(6)} &nbsp; LNG {lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              </Panel>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <style>{`
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(92%) saturate(0.85);
        }
        .leaflet-container { background: #09090b !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}