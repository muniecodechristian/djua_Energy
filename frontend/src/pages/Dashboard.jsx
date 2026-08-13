import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Tooltip as RechartsTooltip
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
  Globe,
  MapPin,
  X
} from 'lucide-react';
import {
  useAlertsQuery,
  useClientsQuery,
  useDevicesQuery,
  useKitsQuery,
  useSendCommandMutation,
  useTelemetryQuery
} from '@/hooks/tanstack/useKitQueries';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
    strokeColor: "#FF7900",
    icon: <CheckCircle2 size={18} className="text-emerald-400" />,
    data: generateSparklineData(140)
  },
  {
    title: "À Risque",
    value: "7 842",
    change: "4.9% du parc",
    isPositive: false,
    strokeColor: "#FF7900",
    icon: <AlertTriangle size={18} className="text-amber-400" />,
    data: generateSparklineData(20)
  },
  {
    title: "Hors Ligne",
    value: "8 511",
    change: "5.4% du parc",
    isPositive: false,
    strokeColor: "#FF7900",
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

const parseCoordinate = (val) => {
  if (val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
};

export default function Dashboard() {
  const [activeHub, setActiveHub] = useState(null);
  const [physicalAddress, setPhysicalAddress] = useState("");
  const addressCache = useRef({});

  const { data: kits, isLoading: kitsLoading } = useKitsQuery();
  const { data: clients } = useClientsQuery();
  const { data: alerts } = useAlertsQuery();
  const { data: devices } = useDevicesQuery();
  const { data: telemetry } = useTelemetryQuery();

  const dynamicMarkers = useMemo(() => {
    if (!kits || !Array.isArray(kits)) return [];

    return kits
      .map((kit, index) => {
        const lat = parseCoordinate(
          kit.gpsCoordinates?.latitude ?? kit.latitude ?? kit.lat
        );
        const lng = parseCoordinate(
          kit.gpsCoordinates?.longitude ?? kit.longitude ?? kit.lng
        );

        if (lat === null || lng === null) return null;

        const isKitActive = kit.status === 'active';

        const safePhone = kit.clientPhone
          ? `*** *** ${kit.clientPhone.slice(-3)}`
          : "Non assigné";

        return {
          id: kit._id || kit.kitId || `kit-${index}`,
          name: kit.kitId || `Kit #${index + 1}`,
          coordinates: [lng, lat],
          status: isKitActive ? 'operational' : 'critical',
          rawStatus: kit.status || 'inactif',
          model: kit.offerName || "Offre Inconnue",
          owner: safePhone
        };
      })
      .filter(Boolean);
  }, [kits]);

  useEffect(() => {
    if (!activeHub) return;

    const fetchAddress = async () => {
      const cacheKey = `${activeHub.coordinates[1]},${activeHub.coordinates[0]}`;

      if (addressCache.current[cacheKey]) {
        setPhysicalAddress(addressCache.current[cacheKey]);
        return;
      }

      setPhysicalAddress("Résolution de l'adresse en cours...");

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${activeHub.coordinates[1]}&lon=${activeHub.coordinates[0]}&zoom=18&addressdetails=1`);
        const data = await response.json();

        if (data && data.address) {
          const addr = data.address;
          const formattedAddress = [addr.road, addr.suburb || addr.village, addr.city || addr.town || addr.state]
            .filter(Boolean)
            .join(", ");

          const finalAddress = formattedAddress || "Emplacement spécifique non cartographié";
          addressCache.current[cacheKey] = finalAddress;
          setPhysicalAddress(finalAddress);
        } else {
          setPhysicalAddress("Adresse introuvable sur la carte");
        }
      } catch (error) {
        setPhysicalAddress("Service de localisation temporairement indisponible");
      }
    };

    fetchAddress();
  }, [activeHub]);

  return (
    <div className="min-h-screen text-zinc-100 p-4 md:p-8 font-sans bg-transparent selection:bg-[#FF7900]/30 selection:text-white relative">
      <div className="space-y-6 relative z-10 max-w-[1600px] mx-auto">

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          <Card className="lg:col-span-3 flex flex-col p-0 h-[520px]">
            <div className="px-5 py-4 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-950/40 backdrop-blur-md">
              <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                Alertes Actives
                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {Array.isArray(alerts) ? alerts.length : alertsData.length}
                </span>
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
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${isCritical ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
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

          <Card className="lg:col-span-6 flex flex-col p-0 relative overflow-hidden group h-[520px]">
            <div className="px-5 py-4 flex justify-between items-center bg-zinc-950/80 border-b border-zinc-800/60 z-20 absolute top-0 left-0 right-0 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-[#FF7900]" />
                <h2 className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">
                  Parc RDC ({dynamicMarkers.length} Détectés)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {kitsLoading ? (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-2 animate-pulse font-mono">
                    <RefreshCw size={12} className="animate-spin text-[#FF7900]" /> Sync...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-medium text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Sync
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 bg-zinc-950 relative flex items-center justify-center overflow-hidden pt-12">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,121,0,0.06)_0%,transparent_70%)] pointer-events-none" />

              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 1900, center: [24, -3.5] }}
                className="w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-700 outline-none"
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const isDRC = geo.properties.NAME === "Democratic Republic of the Congo" || geo.id === "180";
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isDRC ? "#22222a" : "#101014"}
                          stroke={isDRC ? "#FF7900" : "#1c1c21"}
                          strokeWidth={isDRC ? 1.0 : 0.4}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: isDRC ? "#2a2a36" : "#101014", stroke: isDRC ? "#FF7900" : "#1c1c21", outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {dynamicMarkers.map((marker) => (
                  <Marker
                    key={marker.id}
                    coordinates={marker.coordinates}
                    onClick={() => setActiveHub(marker)}
                    className="cursor-pointer"
                  >
                    {marker.status === 'critical' && (
                      <circle r={10} fill="#ef4444" opacity={0.35} className="animate-ping" />
                    )}
                    <circle
                      r={5}
                      fill={marker.status === 'operational' ? '#10b981' : '#ef4444'}
                      stroke="#000000"
                      strokeWidth={1.5}
                      className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] transition-transform hover:scale-150"
                    />
                  </Marker>
                ))}
              </ComposableMap>

              {activeHub && (
                <div className="absolute top-16 right-5 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-xl shadow-2xl z-30 min-w-[260px] animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-white truncate">{activeHub.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${activeHub.rawStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : activeHub.rawStatus === 'suspended'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                        {activeHub.rawStatus}
                      </span>
                      <button onClick={() => setActiveHub(null)} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 text-[12px] text-zinc-400 space-y-3 font-mono">
                    <div className="flex justify-between items-center gap-2 border-b border-zinc-800/40 pb-2">
                      <span>Offre:</span>
                      <strong className="text-zinc-200">{activeHub.model}</strong>
                    </div>
                    <div className="flex justify-between items-center gap-2 border-b border-zinc-800/40 pb-2">
                      <span>ID Client:</span>
                      <strong className="text-zinc-200">{activeHub.owner}</strong>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="flex items-center gap-1.5 text-zinc-500"><MapPin size={12} /> Localisation (Live):</span>
                      <strong className="text-[#FF7900] leading-snug">{physicalAddress}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-xl p-3 space-y-2 text-[11px] font-medium z-10 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-zinc-300">Kit Actif (Vert)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-zinc-300">Kit Inactif / Suspendu (Rouge)</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-3 flex flex-col gap-5 h-[520px]">

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
                    <RechartsTooltip
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
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activity.status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(39, 39, 42, 0.6); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(113, 113, 122, 0.9); }
      `}} />
    </div>
  );
}