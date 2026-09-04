import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Activity, ShieldAlert, Wifi, Zap,
  ChevronDown, RefreshCw, MoreHorizontal,
  Radio, Database, Gauge, Server, HardDrive, ShieldCheck,
  Cpu, Thermometer, BatteryCharging, Clock, ArrowUpRight
} from 'lucide-react';
import { useKitLiveTelemetry } from '../hooks/tanstack/useKitLiveTelemetry.js';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- CUSTOM MAP MARKER (Évite l'épingle bleue générique) ---
const customIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-40 animate-ping"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border-2 border-zinc-950"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// --- MOCK DATA ---

const generateSparkline = (base, variance) =>
  Array.from({ length: 12 }, (_, i) => ({ val: base + (Math.random() * variance - variance / 2) }));

const telemetryFallback = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  voltage: Number((12.2 + Math.random() * 0.8).toFixed(2)),
  current: Number((14 + Math.random() * 4).toFixed(1)),
  temp: Number((34 + Math.random() * 6).toFixed(1)),
  soc: Math.min(100, Math.floor(45 + i * 2.2))
}));

const componentsData = [
  { name: 'Panneau Photovoltaïque', status: 'Optimal', health: 98, metric: '320W peak' },
  { name: 'Banc de Batteries LiFePO4', status: 'Nominal', health: 91, metric: '48V / 200Ah' },
  { name: 'Régulateur MPPT', status: 'Optimal', health: 100, metric: '98.5% eff.' },
  { name: 'Onduleur Pure Sinus', status: 'Nominal', health: 94, metric: '1.2 kW load' },
  { name: 'Relais & Protections CC', status: 'Actif', health: 100, metric: '0 défaut' },
  { name: 'Microcontrôleur & Modème IoT', status: 'En ligne', health: 99, metric: '-68 dBm 4G' },
];

const eventsData = [
  { id: 1, time: '09:31', type: 'critical', title: 'Alerte Anomalie Profil', desc: 'Surtension temporaire détectée sur la ligne d\'entrée', icon: <ShieldAlert size={13} /> },
  { id: 2, time: '06:27', type: 'success', title: 'Synchro Télémétrique', desc: 'Trame de données valides (CRC32 OK)', icon: <ShieldCheck size={13} /> },
  { id: 3, time: '04:05', type: 'info', title: 'Basculement Réseau', desc: 'Reconnexion auto via relais GSM secondaire', icon: <Wifi size={13} /> },
  { id: 4, time: '03:12', type: 'warning', title: 'Capteur Accéléromètre', desc: 'Micro-vibration détectée sur le châssis', icon: <Activity size={13} /> },
];

// --- COMPOSANTS DE STRUCTURE UI ---

const Card = ({ children, className = "", title, subtitle, action, titleRight }) => (
  <div className={`bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex flex-col overflow-hidden transition-all duration-200 hover:border-zinc-700/60 ${className}`}>
    {(title || action || titleRight) && (
      <div className="px-4 py-3 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-950/40">
        <div>
          {title && <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide uppercase font-mono">{title}</h3>}
          {subtitle && <p className="text-[10px] text-zinc-500 font-sans">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {titleRight && <span className="text-[10px] font-mono text-zinc-400">{titleRight}</span>}
          {action && (
            <button
              onClick={action.onClick}
              className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors cursor-pointer font-medium bg-transparent border-none flex items-center gap-1"
            >
              {action.label} <ArrowUpRight size={12} />
            </button>
          )}
        </div>
      </div>
    )}
    <div className="p-4 flex-1 flex flex-col">{children}</div>
  </div>
);

const Sparkline = ({ data, color }) => (
  <div className="h-9 w-full mt-2">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="val"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function SmartKitDetails() {
  const [searchParams] = useSearchParams();
  const kitId = searchParams.get('kitId');

  const {
    telemetryRecords,
    latestTelemetry,
    isLive,
    dataSource,
  } = useKitLiveTelemetry(kitId);

  const hasTelemetry = Boolean(latestTelemetry);

  const formatMetric = (value, unit = '') =>
    value === undefined || value === null || Number.isNaN(Number(value))
      ? '—'
      : `${value}${unit}`;

  const lastUpdate = latestTelemetry?.event_time
    ? new Date(Number(latestTelemetry.event_time) * 1000 || latestTelemetry.event_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  const chartTelemetry = telemetryRecords.slice(-24).map((record, index) => ({
    time: record.event_time
      ? new Date(Number(record.event_time) * 1000 || record.event_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : `${index + 1}h`,
    voltage: record.battery_voltage_v ?? 0,
    current: record.battery_current_a ?? 0,
    temp: record.device_temperature_c ?? 0,
    soc: record.state_of_charge_pct ?? 0,
  }));

  const displayKitId = kitId || 'DK-SOLAR-092';
  const [activeTab, setActiveTab] = useState('Vue Synthèse');
  const [notification, setNotification] = useState(null);

  const tabs = ['Vue Synthèse', 'Télémétrie Haute Fréquence', 'Diagnostics & Santé', 'Journal système', 'Matrice d\'Énergie'];

  const handleQuickAction = (actionName) => {
    setNotification(`Commande envoyée : ${actionName}`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans selection:bg-orange-500/30">

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs shadow-2xl backdrop-blur-xl flex items-center gap-3"
          >
            <RefreshCw size={13} className="animate-spin text-orange-400" />
            <span className="font-mono text-[11px]">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER COCKPIT */}
      <header className="mb-8 border-b border-zinc-800/80 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">{displayKitId}</h1>

              {/* Statut Live */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono">
                <span className={`relative flex h-2 w-2`}>
                  {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-zinc-600'}`}></span>
                </span>
                <span className={isLive ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>{isLive ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              {/* Source flux */}
              {hasTelemetry && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono tracking-wider ${dataSource === 'live'
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                  {dataSource === 'live' ? <Radio size={11} className="animate-pulse" /> : <Database size={11} />}
                  {dataSource === 'live' ? 'SOCKET.IO STREAM' : 'DB SNAPSHOT'}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-400 font-mono">
              <span>S/N: <strong className="text-zinc-200 font-normal">RN87391V22K41</strong></span>
              <span className="text-zinc-700">•</span>
              <span>Rév. Hardware: <strong className="text-zinc-200 font-normal">v2.1-PRO</strong></span>
              <span className="text-zinc-700">•</span>
              <span>Dernier paquet: <strong className="text-zinc-200 font-normal">{lastUpdate}</strong></span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleQuickAction('Re-calibration des capteurs')}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium transition-all text-zinc-300 flex items-center gap-2 active:scale-95"
            >
              Diagnostic <ChevronDown size={13} className="text-zinc-500" />
            </button>
            <button
              onClick={() => handleQuickAction('Ouverture d\'un ticket d\'assistance')}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-orange-950/40 active:scale-95 flex items-center gap-1.5"
            >
              Intervention terrain
            </button>
            <button className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 transition-all">
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* NAVIGATION SYSTEME (TABS) */}
        <nav className="flex gap-1 mt-6 overflow-x-auto hide-scrollbar border-b border-zinc-800/40">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 text-xs font-medium transition-all relative cursor-pointer bg-transparent border-none ${isActive ? 'text-orange-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                {tab}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* DASHBOARD GRID */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* METRIC 1: SOC */}
        <Card title="Charge Batterie (SoC)">
          <div className="flex justify-between items-baseline my-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatMetric(latestTelemetry?.state_of_charge_pct, '%')}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              <span>+1.2%/h</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden my-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${latestTelemetry?.state_of_charge_pct ?? 68}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-emerald-500"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
            <span>Capacité: 9.6 kWh</span>
            <span>Reste: ~14h20</span>
          </div>
        </Card>

        {/* METRIC 2: VOLTAGE */}
        <Card title="Tension du Bus">
          <div className="flex justify-between items-baseline my-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatMetric(latestTelemetry?.battery_voltage_v, ' V')}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Cible: 12.8V</span>
          </div>
          <Sparkline data={generateSparkline(12.6, 0.3)} color="#f97316" />
        </Card>

        {/* METRIC 3: CURRENT */}
        <Card title="Intensité Solaires">
          <div className="flex justify-between items-baseline my-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatMetric(latestTelemetry?.battery_current_a, ' A')}
            </span>
            <span className="text-[10px] font-mono text-orange-400">MPPT Max</span>
          </div>
          <Sparkline data={generateSparkline(15.2, 2.5)} color="#fbbf24" />
        </Card>

        {/* METRIC 4: TEMPERATURE */}
        <Card title="Température Boîtier">
          <div className="flex justify-between items-baseline my-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatMetric(latestTelemetry?.device_temperature_c, '°C')}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Seuil Sécurité OK</span>
          </div>
          <Sparkline data={generateSparkline(36.5, 1.8)} color="#10b981" />
        </Card>

        {/* GRAPH & CHART SECTION */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card title="Analyse Télémétrique Continue" subtitle="Graphe combiné : tension d'entrée (V) vs courant de décharge (A)" titleRight={lastUpdate}>
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartTelemetry.length > 0 ? chartTelemetry : telemetryFallback} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} fontStyle="monospaced" />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} fontStyle="monospaced" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                    itemStyle={{ padding: '0px' }}
                  />
                  <Line type="monotone" dataKey="voltage" name="Tension (V)" stroke="#f97316" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="current" name="Courant (A)" stroke="#eab308" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* EVENT LOG / AUDIT TRAIL */}
        <div className="md:col-span-2 lg:col-span-1">
          <Card title="Flux d'événements" subtitle="4 derniers signaux système">
            <div className="space-y-3 mt-2 overflow-y-auto max-h-72 pr-1 hide-scrollbar">
              {eventsData.map((event) => (
                <div key={event.id} className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex gap-2.5 items-start">
                  <div className={`p-1.5 rounded mt-0.5 shrink-0 ${event.type === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      event.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        event.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                    {event.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-medium text-zinc-200 text-xs truncate">{event.title}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono">{event.time}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">{event.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* SUB-SYSTEMS HEALTH */}
        <div className="md:col-span-2 lg:col-span-2">
          <Card title="État des composants" subtitle="Matrice de contrôle d'intégrité des blocs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
              {componentsData.map((comp) => (
                <div key={comp.name} className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/60 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-medium text-zinc-200">{comp.name}</h5>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{comp.metric}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {comp.health}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* GEOLOCATION WITH LEAFLET (DARK CUSTOM) */}
        <div className="md:col-span-2 lg:col-span-2">
          <Card title="Coordonnées & Géofencing" subtitle="Positionnement GNSS direct" titleRight="Kinshasa, DRC">
            <div className="h-44 w-full rounded-lg overflow-hidden border border-zinc-800/80 relative">
              <MapContainer
                center={[-4.325, 15.3222]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                {/* Custom CSS Tile Filter pour rendu Dark Mode ultra clean */}
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="map-tiles-dark"
                />
                <Marker position={[-4.325, 15.3222]} icon={customIcon} />
              </MapContainer>
            </div>
          </Card>
        </div>

      </main>

      {/* Style d'injection pour le filtre Dark Mode de la carte */}
      <style>{`
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-container {
          background: #09090b !important;
        }
      `}</style>
    </div>
  );
}