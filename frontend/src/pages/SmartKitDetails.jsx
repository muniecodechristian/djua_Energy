import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  MapPin, Activity, ShieldAlert, Wifi, Zap, 
  CheckCircle2, Box, Layers, Expand, RotateCcw, Monitor, 
  Thermometer, Battery, Sun, Cpu, Signal, MoreHorizontal, 
  ChevronDown, Wrench, RefreshCw, Send, Power as PowerIcon
} from 'lucide-react';
import { useKitTelemetryQuery } from '../hooks/tanstack/useKitQueries.js';

// --- MOCK DATA ---

const generateSparkline = (base, variance) => 
  Array.from({ length: 10 }, (_, i) => ({ val: base + (Math.random() * variance - variance/2) }));

const telemetryData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  voltage: 12 + Math.random() * 2,
  current: 15 + Math.random() * 5,
  temp: 35 + Math.random() * 10,
  soc: 40 + Math.random() * 20 + (i > 12 ? 10 : 0)
}));

const healthHistoryData = Array.from({ length: 7 }, (_, i) => ({ day: `1${i+2} Mai`, val: 80 + Math.random()*15 }));

const componentsData = [
  { name: 'Panneau Solaire', status: 'OK', health: 95 },
  { name: 'Batterie', status: 'OK', health: 88 },
  { name: 'Contrôleur de Charge', status: 'OK', health: 100 },
  { name: 'Onduleur', status: 'OK', health: 90 },
  { name: 'Sortie Charge', status: 'OK', health: 100 },
  { name: 'Module IoT', status: 'OK', health: 99 },
];

const eventsData = [
  { id: 1, time: '09:31', type: 'critical', title: 'Décision IA déclenchée', desc: 'Risque élevé de fraude détecté', icon: <ShieldAlert size={14} /> },
  { id: 2, time: '06:27', type: 'success', title: 'Télémétrie reçue', desc: 'Tous les systèmes sont nominaux', icon: <CheckCircle2 size={14} /> },
  { id: 3, time: '04:05', type: 'info', title: 'Connectivité restaurée', desc: 'Coupure de connexion : 18m', icon: <Wifi size={14} /> },
  { id: 4, time: '03:12', type: 'warning', title: 'Mouvement détecté', desc: 'Durée : 2m 34s', icon: <Activity size={14} /> },
  { id: 5, time: 'Hier\n23:41', type: 'success', title: 'Kit en ligne', desc: 'Disponibilité : 92.8%', icon: <PowerIcon size={14} /> },
];

// --- REUSABLE COMPONENTS ---

const Card = ({ children, className = "", title, action, titleRight }) => (
  <div className={`bg-neutral-900/40 backdrop-blur-md border border-neutral-800/80 rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/40 ${className}`}>
    {(title || action || titleRight) && (
      <div className="px-4 py-3 border-b border-neutral-800/60 flex justify-between items-center bg-neutral-900/60">
        {title && <h3 className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">{title}</h3>}
        <div className="flex items-center gap-2">
          {titleRight && <span className="text-[10px] text-neutral-500 font-medium">{titleRight}</span>}
          {action && <button onClick={action.onClick} className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer font-medium bg-transparent border-none">{action.label}</button>}
        </div>
      </div>
    )}
    <div className="p-4 flex-1 flex flex-col">{children}</div>
  </div>
);

const Sparkline = ({ data, color }) => (
  <div className="h-8 w-full mt-1">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="val" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const SimpleProgressBar = ({ value, color }) => (
  <div className="h-1.5 w-full bg-neutral-800/80 rounded-full overflow-hidden mt-2 shadow-inner">
    <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1 }} className={`h-full ${color}`} />
  </div>
);

// --- MAIN DASHBOARD COMPONENT ---

export default function SmartKitDetails() {
  const [searchParams] = useSearchParams();
  const kitId = searchParams.get('kitId');
  const { data: telemetryDocuments = [], isLoading: telemetryLoading } = useKitTelemetryQuery(kitId);
  const telemetryRecords = useMemo(
    () => telemetryDocuments.flatMap((document) => document.records || []).filter(Boolean),
    [telemetryDocuments],
  );
  const latestTelemetry = telemetryRecords[telemetryRecords.length - 1];
  const hasTelemetry = Boolean(latestTelemetry);
  const chartTelemetry = telemetryRecords.slice(-24).map((record, index) => ({
    time: record.event_time || `${index + 1}`,
    voltage: record.battery_voltage_v ?? 0,
    current: record.battery_current_a ?? 0,
    temp: record.device_temperature_c ?? 0,
    soc: record.state_of_charge_pct ?? 0,
  }));
  const displayKitId = kitId || 'Kit non sélectionné';
  const [activeTab, setActiveTab] = useState('Jumeau Numérique');
  const [notification, setNotification] = useState(null);
  
  const tabs = ['Jumeau Numérique', 'Télémétrie', 'Santé', 'Événements', 'Énergie', 'Configuration', 'Historique', 'Documents'];

  const handleQuickAction = (actionName) => {
    setNotification(`Exécution de : ${actionName} sur le ${displayKitId}...`);
    setTimeout(() => setNotification(null), 3500);
  };

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="min-h-screen text-neutral-200 p-4 md:p-6 font-['Montserrat',sans-serif]">
      
      {/* NOTIFICATION TOAST */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs shadow-xl backdrop-blur-md flex items-center gap-2"
          >
            <RefreshCw size={14} className="animate-spin text-orange-400" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KIT HEADER TITLE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800/60 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">{displayKitId}</h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold shadow-sm ${hasTelemetry ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500 animate-pulse"></span> En ligne
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-2 font-medium">
            SN: <span className="text-neutral-300 font-mono">RN87391V22K41</span> • 
            Modèle: <span className="text-neutral-300">D3LIA-RK-2.1</span> • 
            Installé le: <span className="text-neutral-300">12 Fév 2026</span>
            <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] ml-2 font-semibold shadow-sm">Kit Résidentiel</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleQuickAction('Exporter le rapport de diagnostic')} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-800/50 transition-colors flex items-center gap-1.5 text-neutral-300 shadow-sm">
            Actions <ChevronDown size={14} />
          </button>
          <button onClick={() => handleQuickAction('Créer une intervention sur le terrain')} className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-semibold text-white transition-colors shadow-md shadow-orange-600/30">
            Créer une intervention
          </button>
          <button className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800/50 text-neutral-400 shadow-sm">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </motion.div>

      {/* TABS */}
      <div className="flex gap-6 mb-6 overflow-x-auto hide-scrollbar border-b border-neutral-800/60 pb-1">
        {tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`pb-2 text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer bg-transparent border-none ${activeTab === tab ? 'text-orange-400' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            {tab}
            {activeTab === tab && <motion.div layoutId="activeTabSmart" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-sm shadow-orange-500" />}
          </button>
        ))}
      </div>

      {/* MAIN GRID */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: 5/12 */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Digital Twin View */}
          <motion.div variants={fadeUp} className="h-[320px]">
            <Card title="VUE JUMEAU NUMÉRIQUE" titleRight="Mode de vue : 3D ▾" className="h-full p-0">
              <div className="flex-1 relative bg-neutral-950/40 flex items-center justify-center overflow-hidden">
                <div className="absolute left-2 top-2 bg-neutral-900/80 backdrop-blur rounded-lg border border-neutral-800 flex flex-col gap-1 p-1 z-10 shadow-sm">
                  <button className="p-1.5 text-orange-400 bg-orange-500/10 rounded border border-orange-500/20 shadow-sm"><Layers size={14}/></button>
                  <button className="p-1.5 text-neutral-400 hover:text-neutral-200"><Expand size={14}/></button>
                  <button className="p-1.5 text-neutral-400 hover:text-neutral-200"><RotateCcw size={14}/></button>
                  <button className="p-1.5 text-neutral-400 hover:text-neutral-200"><Monitor size={14}/></button>
                  <div className="text-[9px] font-bold text-neutral-500 text-center mt-1">3D</div>
                </div>
                
                <div className="relative w-full h-full flex items-center justify-center group cursor-grab">
                   <div className="absolute bottom-10 w-48 h-12 bg-black/50 blur-xl rounded-[100%]"></div>
                   <div className="relative w-40 h-40 transform transition-transform duration-1000 group-hover:scale-105">
                     <div className="absolute inset-0 bg-neutral-800/85 border border-neutral-700 rounded-lg transform skew-x-12 skew-y-12 shadow-2xl flex items-center justify-center">
                        <Box size={48} className="text-neutral-500 opacity-30" />
                     </div>
                     <div className="absolute -top-10 -left-6 w-48 h-20 bg-neutral-900/90 border border-orange-500/30 rounded-lg transform skew-x-[-45deg] rotate-[-10deg] flex items-center justify-center overflow-hidden shadow-xl">
                        <div className="w-full h-full opacity-40" style={{ backgroundImage: 'linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                     </div>
                     <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.9)] animate-pulse"></div>
                   </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-md border-t border-neutral-800/80 p-3 grid grid-cols-4 gap-2 text-[10px] font-medium shadow-md">
                  <div><span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Latitude</span><span className="text-neutral-200 font-mono">7.539912° N</span></div>
                  <div><span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Longitude</span><span className="text-neutral-200 font-mono">-5.533456° W</span></div>
                  <div><span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Altitude</span><span className="text-neutral-200">350 m</span></div>
                  <div><span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Mise à jour</span><span className="text-neutral-200">21 Mai, 09:32</span></div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Latest Telemetry Chart */}
          <motion.div variants={fadeUp} className="flex-1 min-h-[260px]">
            <Card title="DERNIÈRE TÉLÉMÉTRIE" titleRight="Dernières 24 heures ▾" className="h-full">
               <div className="flex flex-wrap justify-center gap-4 mb-4 text-[10px] font-medium">
                 <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-blue-500"></span><span className="text-neutral-400">Tension (V)</span></div>
                 <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-green-500"></span><span className="text-neutral-400">Courant (A)</span></div>
                 <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-orange-500"></span><span className="text-neutral-400">Temp (°C)</span></div>
                 <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-purple-500"></span><span className="text-neutral-400">SoC (%)</span></div>
               </div>
               <div className="flex-1 w-full relative min-h-[180px]">
                 {!telemetryLoading && !hasTelemetry && (
                   <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-neutral-500">
                     Boîtier non configuré : aucune télémétrie disponible
                   </div>
                 )}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartTelemetry} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.4} vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#737373' }} dy={10} interval={4} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#737373' }} domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#737373' }} domain={[0, 60]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
                      <Line yAxisId="left" type="monotone" dataKey="soc" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="current" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-2 text-right">
                  <button onClick={() => setActiveTab('Historique')} className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold bg-transparent border-none cursor-pointer">Voir l'historique complet -&gt;</button>
               </div>
            </Card>
          </motion.div>
        </div>

        {/* CENTER COLUMN: 4/12 */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* System Overview */}
          <motion.div variants={fadeUp}>
            <Card title="APERÇU DU SYSTÈME" titleRight="Dernière maj : 21 Mai, 09:32" className="pb-2">
              {!telemetryLoading && !hasTelemetry && <p className="mb-5 text-xs text-neutral-500">Aucune donnée de télémétrie reçue pour ce kit.</p>}
              <div className="grid grid-cols-3 gap-4 gap-y-6">
                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">État de charge</span>
                  <span className="text-sm font-bold text-white">{latestTelemetry?.state_of_charge_pct ?? '—'}{hasTelemetry && '%'}</span>
                  <SimpleProgressBar value={latestTelemetry?.state_of_charge_pct ?? 0} color="bg-orange-500 shadow-sm shadow-orange-500" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">État de santé</span>
                  <span className="text-sm font-bold text-white">{latestTelemetry?.state_of_health_pct ?? '—'}{hasTelemetry && '%'}</span>
                  <SimpleProgressBar value={latestTelemetry?.state_of_health_pct ?? 0} color="bg-orange-500 shadow-sm shadow-orange-500" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">Temp. Batterie</span>
                  <span className="text-sm font-bold text-white">43°C</span>
                  <SimpleProgressBar value={70} color="bg-orange-500 shadow-sm shadow-orange-500" />
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">Énergie Solaire</span>
                  <span className="text-sm font-bold text-white">{latestTelemetry?.solar_power_w ?? '—'}{hasTelemetry && ' W'}</span>
                  <Sparkline data={generateSparkline(500, 50)} color="#f97316" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">Énergie Consommée</span>
                  <span className="text-sm font-bold text-white">{latestTelemetry?.load_power_w ?? '—'}{hasTelemetry && ' W'}</span>
                  <Sparkline data={generateSparkline(180, 20)} color="#f97316" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">Énergie du Jour</span>
                  <span className="text-sm font-bold text-white">2.34 kWh</span>
                  <Sparkline data={generateSparkline(2, 0.5)} color="#f97316" />
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">Tension</span>
                  <span className="text-sm font-bold text-white">{latestTelemetry?.battery_voltage_v ?? '—'}{hasTelemetry && ' V'}</span>
                  <Sparkline data={generateSparkline(12.5, 0.2)} color="#f97316" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">Courant</span>
                  <span className="text-sm font-bold text-white">{latestTelemetry?.battery_current_a ?? '—'}{hasTelemetry && ' A'}</span>
                  <Sparkline data={generateSparkline(18, 1)} color="#f97316" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">Connectivité</span>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-sm font-bold text-white">{hasTelemetry ? 'Connecté' : '—'}</span>
                    <Signal size={16} className="text-orange-400 mb-0.5" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Components Status + Kit Health Score */}
          <div className="grid grid-cols-2 gap-5 flex-1">
            <motion.div variants={fadeUp} className="h-full">
              <Card title="COMPOSANTS" className="h-full">
                <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-1">
                  <span>Nom</span>
                  <div className="flex gap-3">
                    <span>Statut</span><span>Santé</span>
                  </div>
                </div>
                <div className="space-y-3 mt-1">
                  {componentsData.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 && <Sun size={12} className="text-orange-400" />}
                        {idx === 1 && <Battery size={12} className="text-orange-400" />}
                        {idx === 2 && <Activity size={12} className="text-orange-400" />}
                        {idx === 3 && <Zap size={12} className="text-orange-400" />}
                        {idx === 4 && <Box size={12} className="text-orange-400" />}
                        {idx === 5 && <Cpu size={12} className="text-orange-400" />}
                        <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white transition-colors truncate max-w-[65px]">{comp.name}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[9px] text-orange-400 font-semibold">{comp.status}</span>
                        <span className="text-[9px] text-neutral-400 font-medium w-7 text-right">{comp.health}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="h-full">
              <Card title="SCORE DE SANTÉ" className="h-full items-center">
                <div className="relative w-28 h-28 mt-2 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#262626" strokeWidth="8" fill="none" />
                    <circle cx="56" cy="56" r="48" stroke="#f97316" strokeWidth="8" fill="none" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * 0.89)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white leading-none">89<span className="text-[10px] text-neutral-500 font-normal">/100</span></span>
                    <span className="text-[10px] font-semibold text-orange-400 mt-1 uppercase tracking-wider">Bon</span>
                  </div>
                </div>

                <div className="w-full h-16 mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthHistoryData} margin={{ top: 5, right: 0, left: -25, bottom: -10 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#262626" opacity={0.4} vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#737373' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#737373' }} domain={[0, 100]} ticks={[0, 50, 100]} />
                      <Line type="monotone" dataKey="val" stroke="#f97316" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <button onClick={() => setActiveTab('Santé')} className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold mt-2 bg-transparent border-none cursor-pointer">Voir les détails de santé -&gt;</button>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3/12 */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Location */}
          <motion.div variants={fadeUp}>
            <Card title="EMPLACEMENT" className="p-0">
               <div className="h-32 bg-neutral-950 relative overflow-hidden flex items-center justify-center border-b border-neutral-800/80">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #f97316 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <div className="relative z-10 flex flex-col items-center animate-bounce">
                    <div className="p-1.5 bg-orange-600 rounded-full text-white shadow-lg shadow-orange-600/50"><MapPin size={14} /></div>
                    <div className="w-1 h-3 bg-orange-500/50 -mt-1"></div>
                    <div className="w-4 h-1 bg-black/50 blur-sm rounded-full"></div>
                  </div>
               </div>
               <div className="p-4">
                  <h4 className="text-xs font-bold text-white">Kinshasa, RDC</h4>
                  <div className="flex justify-between items-end mt-1">
                    <p className="text-[10px] text-neutral-400 font-medium">Gombe Station</p>
                    <div className="text-right">
                      <span className="text-[9px] text-neutral-500 block uppercase font-medium">Précision</span>
                      <span className="text-[10px] text-neutral-300 font-semibold">5 m</span>
                    </div>
                  </div>
               </div>
            </Card>
          </motion.div>

          {/* Recent Events */}
          <motion.div variants={fadeUp} className="flex-1">
            <Card title="ÉVÉNEMENTS RÉCENTS" action={{ label: 'Voir tout', onClick: () => setActiveTab('Événements') }} className="h-full">
              <div className="relative pl-3 mt-1 flex-1">
                <div className="absolute left-[17px] top-2 bottom-2 w-px bg-neutral-800/80"></div>
                
                <div className="space-y-4">
                  {eventsData.map((ev) => (
                    <div key={ev.id} className="flex gap-3 relative z-10 group">
                      <div className="w-10 pt-0.5 text-right flex-shrink-0">
                        <span className="text-[9px] text-neutral-500 leading-tight whitespace-pre-line font-mono">{ev.time}</span>
                      </div>
                      <div className="mt-0.5 p-1 rounded-full border border-neutral-800 bg-orange-500/10 text-orange-400 z-10 flex-shrink-0 h-fit shadow-sm">
                        {ev.icon}
                      </div>
                      <div className="pt-0.5 min-w-0">
                        <h4 className="text-[11px] font-semibold text-neutral-200 truncate">{ev.title}</h4>
                        <p className="text-[10px] text-neutral-500 truncate font-medium">{ev.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp}>
            <Card title="ACTIONS RAPIDES">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleQuickAction('Diagnostic')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors group shadow-sm cursor-pointer">
                  <Wrench size={16} className="text-neutral-400 group-hover:text-orange-400 mb-2 transition-colors" />
                  <span className="text-[9px] font-semibold text-neutral-300 text-center">Lancer un Diagnostic</span>
                </button>
                <button onClick={() => handleQuickAction('Redémarrage')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors group shadow-sm cursor-pointer">
                  <RefreshCw size={16} className="text-neutral-400 group-hover:text-orange-400 mb-2 transition-colors" />
                  <span className="text-[9px] font-semibold text-neutral-300 text-center">Redémarrer le Kit</span>
                </button>
                <button onClick={() => handleQuickAction('Commande envoyée')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors group shadow-sm cursor-pointer">
                  <Send size={16} className="text-neutral-400 group-hover:text-orange-400 mb-2 transition-colors" />
                  <span className="text-[9px] font-semibold text-neutral-300 text-center">Envoyer une Commande</span>
                </button>
              </div>
            </Card>
          </motion.div>
        </div>

      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}