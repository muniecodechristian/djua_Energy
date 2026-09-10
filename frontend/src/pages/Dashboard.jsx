import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import {
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
import { useFleetLiveStatus } from '@/hooks/tanstack/useFleetLiveStatus';

const createKitIcon = (status) => L.divIcon({
  className: 'dashboard-kit-marker',
  html: `<span class="dashboard-kit-marker__pulse dashboard-kit-marker__pulse--${status}"></span><span class="dashboard-kit-marker__dot dashboard-kit-marker__dot--${status}"></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// kpiData removed to be generated dynamically inside the component

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
  <div className={`bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${className}`}>
    {children}
  </div>
);

const parseCoordinate = (val) => {
  if (val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeHub, setActiveHub] = useState(null);
  const [physicalAddress, setPhysicalAddress] = useState("");
  const addressCache = useRef({});

  const { data: kits, isLoading: kitsLoading } = useKitsQuery();
  const { data: clients } = useClientsQuery();
  const { data: alerts } = useAlertsQuery();
  const { data: devices } = useDevicesQuery();
  const { data: telemetry } = useTelemetryQuery();

  // ── Compteur temps réel via Socket.io ────────────────────────────────────────
  // activeKitIds = Set des kitIds qui ont envoyé une télémétrie ESP32 dans les 5 dernières minutes
  const { activeKitIds, activeCount, isSocketConnected } = useFleetLiveStatus();

  /**
   * SENIOR LOGIC: Compute KPI stats from real DB data.
   * - totalKits     : COUNT documents in the Kits collection
   * - onlineKits    : kits currently emitting ESP32 telemetry (Socket.io real-time, TTL 5min)
   * - offlineKits   : kits in DB with NO recent telemetry signal
   * - atRiskKits    : kits with at least one active alert
   */
  const kpiStats = useMemo(() => {
    const allKits = Array.isArray(kits) ? kits : [];
    const totalKits = allKits.length;

    // En ligne = kits dont le kitId est dans le Set temps réel (Socket.io)
    const onlineKits = activeCount;

    // Hors ligne = kits en DB qui ne sont PAS dans le Set des kits actifs live
    const offlineKits = allKits.filter((k) => !activeKitIds.has(k.kitId)).length;

    // At-risk = kits avec une alerte active dans le système
    const alertKitIds = new Set(
      Array.isArray(alerts)
        ? alerts.map((a) => a.kitId).filter(Boolean)
        : []
    );
    const atRiskKits = allKits.filter((k) => alertKitIds.has(k.kitId)).length;

    const onlinePct = totalKits > 0 ? ((onlineKits / totalKits) * 100).toFixed(1) : '0.0';
    const offlinePct = totalKits > 0 ? ((offlineKits / totalKits) * 100).toFixed(1) : '0.0';
    const atRiskPct = totalKits > 0 ? ((atRiskKits / totalKits) * 100).toFixed(1) : '0.0';

    return { totalKits, onlineKits, offlineKits, atRiskKits, onlinePct, offlinePct, atRiskPct };
  }, [kits, activeKitIds, activeCount, alerts]);

  // Construct dynamic KPI card data from live stats
  const kpiData = useMemo(() => [
    {
      title: 'Total Kits',
      value: kpiStats.totalKits.toLocaleString('fr-FR'),
      change: 'Total DB enregistrés',
      isPositive: true,
      icon: <Box size={18} className="text-[#FF7900]" />,
    },
    {
      title: 'En Ligne (Live)',
      value: kpiStats.onlineKits.toLocaleString('fr-FR'),
      change: `${kpiStats.onlinePct}% du parc · ESP32 actifs`,
      isPositive: true,
      icon: <CheckCircle2 size={18} className="text-emerald-400" />,
      isLive: true,
      socketConnected: isSocketConnected,
    },
    {
      title: 'À Risque',
      value: kpiStats.atRiskKits.toLocaleString('fr-FR'),
      change: `${kpiStats.atRiskPct}% du parc · Alertes actives`,
      isPositive: false,
      icon: <AlertTriangle size={18} className="text-amber-400" />,
    },
    {
      title: 'Hors Ligne',
      value: kpiStats.offlineKits.toLocaleString('fr-FR'),
      change: `${kpiStats.offlinePct}% du parc · Sans télémétrie`,
      isPositive: false,
      icon: <XCircle size={18} className="text-rose-400" />,
    },
  ], [kpiStats]);

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

        const isKitActive = activeKitIds.has(kit.kitId) || kit.status === 'active';

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
  }, [kits, activeKitIds]);

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
    <div className="min-h-screen text-[var(--foreground)] p-4 md:p-8 font-sans bg-transparent selection:bg-[#FF7900]/30 selection:text-white relative">
      <div className="space-y-6 relative z-10 max-w-[1600px] mx-auto">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="min-h-[190px] p-6 md:p-7 flex flex-col justify-between cursor-default">
              <div>
                <div className="flex items-center justify-between mb-7">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">{kpi.title}</span>
                  <div className="flex items-center gap-1.5">
                    {/* Badge Socket.io temps réel uniquement sur la card 'En Ligne' */}
                    {kpi.isLive && (
                      <span
                        title={kpi.socketConnected ? 'Socket.io connecté — données ESP32 en direct' : 'Socket.io déconnecté'}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                          kpi.socketConnected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-500/10 border-zinc-600/30 text-zinc-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${kpi.socketConnected ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                        {kpi.socketConnected ? 'Live' : 'Off'}
                      </span>
                    )}
                    <div className="p-2.5 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] shadow-sm">
                      {React.cloneElement(kpi.icon, { size: 20 })}
                    </div>
                  </div>
                </div>

                {/* Skeleton loader tant que les kits ne sont pas chargés */}
                {kitsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-7 w-24 bg-[var(--secondary)] rounded-lg mb-2" />
                    <div className="h-3 w-32 bg-[var(--secondary)] rounded-md opacity-60" />
                  </div>
                ) : (
                  <>
                    <div className="text-4xl md:text-[2.65rem] leading-none font-bold text-[var(--foreground)] tracking-tight font-mono">{kpi.value}</div>
                    <div className="text-xs mt-3 font-medium flex items-center gap-1 text-[var(--muted-foreground)]">
                      {kpi.change}
                    </div>
                  </>
                )}
              </div>

            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          <Card className="lg:col-span-3 flex flex-col p-0 h-[520px]">
            <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card)]/95 backdrop-blur-md">
              <h2 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                Alertes Actives
                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {Array.isArray(alerts) ? alerts.length : alertsData.length}
                </span>
              </h2>
              <button onClick={() => navigate('/notification')} className="text-[11px] font-medium text-[#FF7900] hover:text-orange-400 transition-colors">Tout voir</button>
            </div>

            <div className="divide-y divide-[var(--border)] flex-1 overflow-y-auto custom-scrollbar">
              {alertsData.map((alert, i) => {
                const isCritical = alert.type === 'critical';
                const isHigh = alert.type === 'high';

                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/notification?alertLabel=${encodeURIComponent(alert.label)}&alertDesc=${encodeURIComponent(alert.desc)}`)}
                    className="p-4 hover:bg-[var(--secondary)] transition-colors cursor-pointer flex items-start gap-3.5 group"
                  >
                    <div className="mt-0.5">
                      {isCritical ? (
                        <ShieldAlert size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
                      ) : isHigh ? (
                        <AlertTriangle size={16} className="text-orange-500 group-hover:scale-110 transition-transform" />
                      ) : alert.type === 'medium' ? (
                        <AlertTriangle size={16} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                      ) : (
                        <Activity size={16} className="text-slate-400 group-hover:text-[var(--foreground)] transition-colors" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold px-0 py-1 text-[var(--foreground)]">
                          {alert.severity}
                        </span>
                        <h3 className="text-[11px] font-semibold text-[var(--foreground)] truncate">{alert.label}</h3>
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] truncate mb-1">{alert.desc}</p>
                      <span className="text-[10px] font-medium text-[var(--muted-foreground)] font-mono">{alert.time}</span>
                    </div>

                    {/* Voir plus button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/notification?alertLabel=${encodeURIComponent(alert.label)}&alertDesc=${encodeURIComponent(alert.desc)}`);
                      }}
                      className={`
                        flex-shrink-0 self-center
                        flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                        text-[10px] font-semibold tracking-wide
                        border transition-all duration-200
                        opacity-0 group-hover:opacity-100
                        translate-x-1 group-hover:translate-x-0
                        ${isCritical
                          ? 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                          : isHigh
                            ? 'bg-orange-500 border-orange-400 text-white hover:bg-orange-600'
                            : alert.type === 'medium'
                              ? 'bg-yellow-400 border-yellow-300 text-slate-950 hover:bg-yellow-500'
                              : 'bg-slate-500 border-slate-400 text-white hover:bg-slate-600'
                        }
                      `}
                    >
                      Voir plus
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                        <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="lg:col-span-6 flex flex-col p-0 relative overflow-hidden group h-[520px]">
            <div className="px-5 py-4 flex justify-between items-center bg-[var(--card)]/95 border-b border-[var(--border)] z-20 absolute top-0 left-0 right-0 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-[#FF7900]" />
                <h2 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-widest">
                  Parc RDC ({dynamicMarkers.length} Détectés)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {kitsLoading ? (
                  <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-2 animate-pulse font-mono">
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

            <div className="flex-1 bg-[var(--app-surface)] relative flex items-center justify-center overflow-hidden pt-12">
              <MapContainer
                center={[-2.9, 23.6]}
                zoom={5}
                minZoom={4}
                maxZoom={16}
                scrollWheelZoom
                className="dashboard-map"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {dynamicMarkers.map((marker) => (
                  <Marker
                    key={marker.id}
                    position={[marker.coordinates[1], marker.coordinates[0]]}
                    icon={createKitIcon(marker.status)}
                    eventHandlers={{ click: () => setActiveHub(marker) }}
                  >
                    <Popup>
                      <div className="dashboard-map-popup">
                        <strong>{marker.name}</strong>
                        <span>{marker.status === 'operational' ? 'Kit actif' : 'Kit à vérifier'}</span>
                        <small>{marker.model}</small>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {activeHub && (
                <div className="absolute top-16 right-5 bg-[var(--panel)] backdrop-blur-xl border border-[var(--panel-border)] rounded-xl shadow-2xl z-30 min-w-[260px] animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-[var(--foreground)] truncate">{activeHub.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${activeHub.rawStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : activeHub.rawStatus === 'suspended'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                        {activeHub.rawStatus}
                      </span>
                      <button onClick={() => setActiveHub(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 text-[12px] text-[var(--muted-foreground)] space-y-3 font-mono">
                    <div className="flex justify-between items-center gap-2 border-b border-[var(--border)] pb-2">
                      <span>Offre:</span>
                      <strong className="text-[var(--foreground)]">{activeHub.model}</strong>
                    </div>
                    <div className="flex justify-between items-center gap-2 border-b border-[var(--border)] pb-2">
                      <span>ID Client:</span>
                      <strong className="text-[var(--foreground)]">{activeHub.owner}</strong>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]"><MapPin size={12} /> Localisation (Live):</span>
                      <strong className="text-[#FF7900] leading-snug">{physicalAddress}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-3 space-y-2 text-[11px] font-medium z-[500] shadow-lg">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span style={{ color: '#334155' }} className="font-semibold">Kit actif</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span style={{ color: '#334155' }} className="font-semibold">Kit à vérifier</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-3 flex flex-col gap-5 h-[520px]">

            <Card className="p-4 flex-1 flex flex-col justify-between">
              <h2 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-widest mb-1">Incidents Hubs</h2>

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
                  <span className="text-xl font-bold text-[var(--foreground)] font-mono leading-none">1 247</span>
                  <span className="text-[9px] font-medium text-[var(--muted-foreground)] mt-1 uppercase tracking-widest">Total</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border)]">
                {donutData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                    <span className="text-[var(--foreground)] truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 flex-1 flex flex-col justify-center">
              <h2 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-widest mb-4">Statut Cloud & IoT</h2>
              <div className="space-y-3.5">
                {systemStatusData.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-2.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                        <Icon size={14} className="text-[var(--muted-foreground)] group-hover:text-[#FF7900] transition-colors" />
                        <span className="font-medium text-[11px]">{item.label}</span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-[var(--foreground)] group-hover:text-emerald-400 transition-colors">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>
        </div>


      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(39, 39, 42, 0.6); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(113, 113, 122, 0.9); }
        .dashboard-map { height: 100%; width: 100%; min-height: 100%; z-index: 1; }
        .dashboard-map .leaflet-control-zoom { border: 0; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.16); }
        .dashboard-map .leaflet-control-zoom a { color: #334155; border-color: #e2e8f0; background: #ffffff; }
        .dashboard-map .leaflet-control-zoom a:hover { color: #ea580c; background: #fff7ed; }
        .dashboard-kit-marker { background: transparent; border: 0; }
        .dashboard-kit-marker__pulse,
        .dashboard-kit-marker__dot { position: absolute; display: block; border-radius: 999px; }
        .dashboard-kit-marker__pulse { inset: 3px; opacity: 0.2; }
        .dashboard-kit-marker__pulse--operational { background: #10b981; }
        .dashboard-kit-marker__pulse--critical { background: #ef4444; }
        .dashboard-kit-marker__dot { inset: 9px; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.35); }
        .dashboard-kit-marker__dot--operational { background: #059669; }
        .dashboard-kit-marker__dot--critical { background: #dc2626; }
        .dashboard-map-popup { display: grid; gap: 4px; min-width: 120px; color: #334155; font: 12px/1.35 sans-serif; }
        .dashboard-map-popup strong { color: #0f172a; font-size: 13px; }
        .dashboard-map-popup span { color: #ea580c; font-weight: 600; }
        .dashboard-map-popup small { color: #64748b; }
      `}} />
    </div>
  );
}