import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import {
  Search,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  ShieldAlert,
  Wifi,
  Database,
  Brain,
  Cpu,
  Box,
  RefreshCw,
  Globe
} from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const mapMarkers = [
  { name: "Kinshasa", coordinates: [15.3222, -4.325], status: "operational", hubs: "64,210", load: "94.2%" },
  { name: "Lubumbashi", coordinates: [27.4794, -11.6609], status: "operational", hubs: "28,400", load: "88.5%" },
  { name: "Goma", coordinates: [29.2285, -1.6792], status: "critical", hubs: "12,150", load: "62.1%" },
  { name: "Kisangani", coordinates: [25.1900, 0.5153], status: "warning", hubs: "9,830", load: "78.4%" },
  { name: "Bukavu", coordinates: [28.8608, -2.5083], status: "warning", hubs: "8,920", load: "74.9%" },
  { name: "Matadi", coordinates: [13.4500, -5.8167], status: "operational", hubs: "15,200", load: "91.0%" },
  { name: "Mbuji-Mayi", coordinates: [23.6000, -6.1500], status: "warning", hubs: "11,410", load: "69.3%" },
  { name: "Kananga", coordinates: [22.4167, -5.8958], status: "critical", hubs: "8,622", load: "58.8%" },
];

const generateSparklineData = (base) =>
  Array.from({ length: 15 }, () => ({ value: base + Math.floor(Math.random() * 20 - 10) }));

const kpiData = [
  { 
    title: "Total Smart Hubs", 
    value: "158 742", 
    change: "+2.4% vs hier", 
    isPositive: true,
    strokeColor: "#FF7900", 
    icon: <Box size={18} className="text-[#FF7900]" />, 
    data: generateSparklineData(150) 
  },
  { 
    title: "Opérationnels", 
    value: "142 389", 
    change: "89.7% du parc", 
    isPositive: true,
    strokeColor: "#10b981", 
    icon: <CheckCircle2 size={18} className="text-emerald-400" />, 
    data: generateSparklineData(140) 
  },
  { 
    title: "À Risque", 
    value: "7 842", 
    change: "4.9% du parc", 
    isPositive: false,
    strokeColor: "#f59e0b", 
    icon: <AlertTriangle size={18} className="text-amber-400" />, 
    data: generateSparklineData(20) 
  },
  { 
    title: "Hors Ligne", 
    value: "8 511", 
    change: "5.4% du parc", 
    isPositive: false,
    strokeColor: "#ef4444", 
    icon: <XCircle size={18} className="text-rose-400" />, 
    data: generateSparklineData(15) 
  },
  { 
    title: "Énergie Produite", 
    value: "518.4 MWh", 
    change: "+4.1% vs hier", 
    isPositive: true,
    strokeColor: "#FF7900", 
    icon: <Zap size={18} className="text-[#FF7900]" />, 
    data: generateSparklineData(500) 
  },
];

const alertsData = [
  { severity: "CRITIQUE", label: "Détection de fraude", desc: "HUB-82331 • Goma", time: "À l'instant", type: "critical" },
  { severity: "ÉLEVÉ", label: "Panne prédictive : 48h", desc: "HUB-21004 • Kananga", time: "Il y a 5 min", type: "high" },
  { severity: "ÉLEVÉ", label: "Consommation anormale", desc: "HUB-99122 • Bukavu", time: "Il y a 12 min", type: "high" },
  { severity: "MOYEN", label: "Dégradation batterie", desc: "HUB-55091 • Kisangani", time: "Il y a 28 min", type: "medium" },
  { severity: "FAIBLE", label: "Hors ligne > 24h", desc: "HUB-41001 • Mbuji-Mayi", time: "Il y a 42 min", type: "low" },
  { severity: "FAIBLE", label: "Signal réseau faible", desc: "HUB-10023 • Kinshasa", time: "Il y a 1h", type: "low" },
];

const donutData = [
  { name: 'Critiques', value: 10, color: '#ef4444' },
  { name: 'Élevées', value: 25, color: '#f97316' },
  { name: 'Moyennes', value: 45, color: '#eab308' },
  { name: 'Faibles', value: 20, color: '#3b82f6' },
];

const systemStatusData = [
  { label: "Connectivité IoT", value: "99.9%", icon: Wifi },
  { label: "Ingestion Données", value: "99.2%", icon: Database },
  { label: "Télémétrie IA", value: "100.0%", icon: Brain },
  { label: "Jumeau Numérique", value: "99.7%", icon: Cpu },
  { label: "Moteur SMS", value: "99.7%", icon: Bell },
];

const recentActivityData = [
  { action: "Intervention terminée", desc: "HUB-66122 • Kinshasa", time: "2 min", status: "success" },
  { action: "Nouveau module déployé", desc: "Firmware v4.22", time: "8 min", status: "info" },
  { action: "Hub de nouveau en ligne", desc: "HUB-33019 • Matadi", time: "11 min", status: "success" },
  { action: "Mise à jour système", desc: "1,200 hubs synchronisés", time: "15 min", status: "neutral" },
];

const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.7)] hover:shadow-[0_8px_30px_rgba(255,121,0,0.06)] hover:border-zinc-700/80 transition-all duration-500 ${className}`}>
    {children}
  </div>
);

export default function Dashboard() {
  const [activeCity, setActiveCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="min-h-screen text-zinc-100 p-4 md:p-8 font-sans bg-transparent selection:bg-[#FF7900]/30 selection:text-white relative">

      <div className="space-y-6 relative z-10 max-w-[1600px] mx-auto">
        
   

        {/* 1. KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="p-5 flex flex-col justify-between group cursor-default relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{kpi.title}</span>
                  <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300 group-hover:scale-110 group-hover:border-zinc-700 transition-all duration-300 shadow-sm">
                    {kpi.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight font-mono">{kpi.value}</div>
                <div className={`text-[11px] mt-1.5 font-medium flex items-center gap-1 ${kpi.isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {kpi.change}
                </div>
              </div>

              <div className="h-12 mt-4 w-full relative z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.data}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={kpi.strokeColor} 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>

        {/* 2. SECTION CENTRALE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* COLONNE GAUCHE : ALERTES */}
          <Card className="lg:col-span-3 flex flex-col p-0 h-[520px]">
            <div className="px-5 py-4 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-950/40 backdrop-blur-md">
              <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                Alertes Actives
                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">12</span>
              </h2>
              <button className="text-[11px] font-medium text-[#FF7900] hover:text-orange-400 transition-colors">Tout voir</button>
            </div>

            <div className="divide-y divide-zinc-800/40 flex-1 overflow-y-auto custom-scrollbar">
              {alertsData.map((alert, i) => {
                const isCritical = alert.type === 'critical';
                const isHigh = alert.type === 'high';

                return (
                  <div key={i} className="p-4 hover:bg-zinc-900/40 transition-colors cursor-pointer flex items-start gap-3.5 group">
                    <div className="mt-0.5">
                      {isCritical ? (
                        <ShieldAlert size={16} className="text-rose-500 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      ) : isHigh ? (
                        <AlertTriangle size={16} className="text-amber-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      ) : (
                        <Activity size={16} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                          isCritical ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                          : isHigh ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                          : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60'
                        }`}>
                          {alert.severity}
                        </span>
                        <h3 className="text-[11px] font-semibold text-zinc-200 truncate">{alert.label}</h3>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mb-1">{alert.desc}</p>
                      <span className="text-[10px] font-medium text-zinc-500 font-mono">{alert.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* COLONNE CENTRALE : CARTE RDC HAUTE DÉFINITION & PROPRE */}
          <Card className="lg:col-span-6 flex flex-col p-0 relative overflow-hidden group h-[520px]">
            <div className="px-5 py-4 flex justify-between items-center bg-zinc-950/80 border-b border-zinc-800/60 z-20 absolute top-0 left-0 right-0 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-[#FF7900]" />
                <h2 className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">
                  Cartographie Opérationnelle RDC ({mapMarkers.length} Hubs Majeurs)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-medium text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
            </div>

            <div className="flex-1 bg-zinc-950 relative flex items-center justify-center overflow-hidden pt-12">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,121,0,0.06)_0%,transparent_70%)] pointer-events-none" />
              
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 2300, center: [23.5, -2.8] }}
                className="w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-700"
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const isDRC = geo.properties.NAME === "Democratic Republic of the Congo" || geo.id === "180";
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isDRC ? "#1e1e24" : "#121216"} 
                          stroke={isDRC ? "#FF7900" : "#222228"} 
                          strokeWidth={isDRC ? 1.2 : 0.4}
                          style={{
                            default: { outline: "none", transition: "all 300ms" },
                            hover: { fill: isDRC ? "#272732" : "#16161a", stroke: isDRC, outline: "none" },
                            pressed: { fill: "#FF7900", outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {mapMarkers.map(({ name, coordinates, status, hubs, load }, i) => (
                  <Marker 
                    key={i} 
                    coordinates={coordinates}
                    onMouseEnter={() => setActiveCity({ name, status, hubs, load })}
                    onMouseLeave={() => setActiveCity(null)}
                    className="cursor-pointer"
                  >
                    {status === 'critical' && (
                      <circle r={14} fill="#ef4444" opacity={0.25} className="animate-ping" />
                    )}
                    <circle
                      r={5.5}
                      fill={
                        status === 'operational' ? '#10b981'
                        : status === 'warning' ? '#f59e0b'
                        : '#ef4444'
                      }
                      stroke="#000000"
                      strokeWidth={2}
                      className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] transition-transform hover:scale-125"
                    />
                    <text
                      textAnchor="middle"
                      y={-12}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "9.5px",
                        fontWeight: "600",
                        fill: "#e4e4e7",
                        pointerEvents: "none",
                        textShadow: "0 2px 4px rgba(0,0,0,0.9)"
                      }}
                    >
                      {name}
                    </text>
                  </Marker>
                ))}
              </ComposableMap>

              {/* TOOLTIP HOVER CARTE */}
              {activeCity && (
                <div className="absolute top-16 right-5 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/80 rounded-xl p-3 shadow-2xl z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-xs font-bold text-white mb-1 flex items-center justify-between gap-3">
                    <span>{activeCity.name}</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                      activeCity.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' :
                      activeCity.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {activeCity.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 space-y-0.5 font-mono">
                    <div>Hubs actifs : <strong className="text-zinc-200">{activeCity.hubs}</strong></div>
                    <div>Charge réseau : <strong className="text-zinc-200">{activeCity.load}</strong></div>
                  </div>
                </div>
              )}

              {/* LÉGENDE DE LA CARTE */}
              <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-xl p-3 space-y-2 text-[11px] font-medium z-10 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-zinc-300">En service (142k)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <span className="text-zinc-300">Avertissement (7.8k)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-zinc-300">Hors service (8.5k)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* COLONNE DROITE : STATUTS & RÉPARTITION */}
          <div className="lg:col-span-3 flex flex-col gap-5 h-[520px]">
            
            {/* Pie Chart */}
            <Card className="p-4 flex-1 flex flex-col justify-between">
              <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-1">Incidents Hubs</h2>
              
              <div className="flex-1 relative flex items-center justify-center min-h-[130px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={64}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(9,9,11,0.95)', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', fontWeight: '500', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white font-mono leading-none">1 247</span>
                  <span className="text-[9px] font-medium text-zinc-400 mt-1 uppercase tracking-widest">Total</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/60">
                {donutData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                    <span className="text-zinc-300 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Statut Cloud */}
            <Card className="p-4 flex-1 flex flex-col justify-center">
              <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-4">Statut Cloud & IoT</h2>
              <div className="space-y-3.5">
                {systemStatusData.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                        <Icon size={14} className="text-zinc-500 group-hover:text-[#FF7900] transition-colors" />
                        <span className="font-medium text-[11px]">{item.label}</span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>
        </div>

        {/* 3. ACTIVITÉ RÉCENTE */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-[#FF7900]" />
              Dernières Activités Système
            </h2>
            <span className="text-[9px] font-mono font-semibold text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded uppercase tracking-widest bg-zinc-900/60">Temps Réel</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {recentActivityData.map((activity, i) => (
              <div key={i} className="bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' 
                    : activity.status === 'info' ? 'bg-[#FF7900] shadow-[0_0_10px_rgba(255,121,0,0.8)]' 
                    : 'bg-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.8)]'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">{activity.action}</p>
                    <p className="text-[10px] font-medium text-zinc-400 truncate mt-0.5 font-mono">{activity.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium text-zinc-500 whitespace-nowrap ml-3">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(39, 39, 42, 0.6); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(113, 113, 122, 0.9); }
      `}} />
    </div>
  );
}