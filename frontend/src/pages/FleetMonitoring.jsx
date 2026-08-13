<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
=======
import React, { useState } from 'react';
import { motion } from 'framer-motion';
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';
import {
  LineChart, Line, ResponsiveContainer
} from 'recharts';
import {
  Search, Filter, MapPin, Layers,
  Plus, Minus, Box, Calendar,
<<<<<<< HEAD
  Activity, ArrowRight, ExternalLink, ShieldAlert
} from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import api from '../api/axios.js';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// KPI statiques de la flotte — la carte Géofence sera dynamique
const staticKpis = [
=======
  Activity, ArrowRight, ExternalLink
} from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const kpis = [
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
  { title: 'KITS ACTIFS', value: '158,742', sub: '+2.1% ce mois', color: 'text-orange-400', stroke: '#f97316', spark: [12, 14, 13, 15, 16, 15, 18] },
  { title: 'EN LIGNE', value: '147,510', sub: '92.9% de la flotte', color: 'text-orange-400', stroke: '#f97316', spark: [100, 105, 102, 110, 115, 120, 125] },
  { title: 'AVERTISSEMENT', value: '7,810', sub: '4.9% de la flotte', color: 'text-orange-400', stroke: '#f97316', spark: [18, 16, 14, 15, 12, 13, 11] },
  { title: 'HORS LIGNE / ERREUR', value: '3,422', sub: '2.2% de la flotte', color: 'text-orange-400', stroke: '#f97316', spark: [8, 9, 7, 10, 6, 8, 5] },
  { title: 'PROD. MOY. / JOUR', value: '1.24 kWh', sub: '+12% vs 30j', color: 'text-orange-400', stroke: '#f97316', spark: [0.8, 0.9, 1.1, 1.0, 1.2, 1.24] },
  { title: 'NIVEAU DE BATTERIE MOY.', value: '78%', sub: 'État optimal', color: 'text-orange-400', stroke: '#f97316', spark: [70, 72, 75, 74, 76, 78] },
];

const mapMarkers = [
  { id: 1, name: 'Hub Kinshasa (Ngaliema)', lat: -4.4419, lng: 15.2663, status: 'normal', count: 54200 },
  { id: 2, name: 'Secteur Lubumbashi', lat: -11.6876, lng: 27.4847, status: 'normal', count: 32100 },
  { id: 3, name: 'Réseau Est Goma', lat: -1.6585, lng: 29.2230, status: 'warning', count: 18400 },
  { id: 4, name: 'Cluster Bukavu', lat: -2.5083, lng: 28.8608, status: 'normal', count: 12300 },
  { id: 5, name: 'Hub Kisangani', lat: 0.5153, lng: 25.1909, status: 'normal', count: 14200 },
  { id: 6, name: 'Station Mbuji-Mayi', lat: -6.1360, lng: 23.5898, status: 'critical', count: 8900 },
  { id: 7, name: 'Zone Kananga', lat: -5.8962, lng: 22.4166, status: 'normal', count: 6700 },
  { id: 8, name: 'Réseau Port Matadi', lat: -5.8167, lng: 13.4500, status: 'warning', count: 9100 },
  { id: 9, name: 'Zone Minière Kolwezi', lat: -10.7148, lng: 25.4664, status: 'normal', count: 15800 },
  { id: 10, name: 'Hub Kikwit', lat: -5.0410, lng: 18.8162, status: 'normal', count: 4100 },
];

<<<<<<< HEAD
// Événements initiaux statiques (maintenu pour le fallback)
const initialLiveFeedEvents = [
  { id: 'static-1', type: 'alert',   text: 'KIT-K-87391 Alerte Surchauffe (Kinshasa)',          time: '14:08', badge: 'Avertissement', color: 'text-orange-400 border-orange-500/20', isGeofence: false },
  { id: 'static-2', type: 'connect', text: 'KIT-K-10293 Télémétrie rétablie (Goma)',              time: '14:05', badge: 'En ligne',       color: 'text-orange-400 border-orange-500/20', isGeofence: false },
  { id: 'static-3', type: 'maint',   text: 'KIT-K-99210 Maintenance terminée (Lubumbashi)',       time: '13:58', badge: 'Résolu',         color: 'text-orange-400 border-orange-500/20', isGeofence: false },
  { id: 'static-4', type: 'install', text: 'KIT-K-33410 Nouveau kit activé (Matadi)',             time: '13:45', badge: 'Actif',          color: 'text-orange-400 border-orange-500/20', isGeofence: false },
  { id: 'static-5', type: 'alert',   text: 'KIT-K-00129 Batterie Critique <15% (Mbuji-Mayi)',    time: '13:30', badge: 'Critique',       color: 'text-orange-400 border-orange-500/20', isGeofence: false },
=======
const liveFeedEvents = [
  { id: 1, type: 'alert', text: 'KIT-K-87391 Alerte Surchauffe (Kinshasa)', time: '14:08', badge: 'Avertissement', color: 'text-orange-400 border-orange-500/20' },
  { id: 2, type: 'connect', text: 'KIT-K-10293 Télémétrie rétablie (Goma)', time: '14:05', badge: 'En ligne', color: 'text-orange-400 border-orange-500/20' },
  { id: 3, type: 'maint', text: 'KIT-K-99210 Maintenance terminée (Lubumbashi)', time: '13:58', badge: 'Résolu', color: 'text-orange-400 border-orange-500/20' },
  { id: 4, type: 'install', text: 'KIT-K-33410 Nouveau kit activé (Matadi)', time: '13:45', badge: 'Actif', color: 'text-orange-400 border-orange-500/20' },
  { id: 5, type: 'alert', text: 'KIT-K-00129 Batterie Critique <15% (Mbuji-Mayi)', time: '13:30', badge: 'Critique', color: 'text-orange-400 border-orange-500/20' },
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
];

const MiniSparkline = ({ data, stroke }) => (
  <div className="h-6 w-16">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.map(v => ({ v }))}>
        <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function FleetMonitoring() {
<<<<<<< HEAD
  const [selectedKit, setSelectedKit]         = useState('KIT-K-87391');
  const [mapTab, setMapTab]                   = useState('VUE CARTE');
  const [feedFilter, setFeedFilter]           = useState('Tous');
  const [liveFeedEvents, setLiveFeedEvents]   = useState(initialLiveFeedEvents);
  const [geofenceAlertCount, setGeofenceAlertCount] = useState(0);
  // IDs des kits en infraction géofencing (pour teinter le panneau kit sélectionné)
  const [breachedKitIds, setBreachedKitIds]   = useState(new Set());

  // ─── Chargement des alertes géofencing déjà existantes en BDD ────────────────
  useEffect(() => {
    const loadExistingGeofenceAlerts = async () => {
      try {
        const response = await api.get('/api/alerts');
        if (response.data?.success) {
          const geoAlerts = response.data.data.filter(
            a => a.type === 'geofence_exit' && a.status === 'active'
          );
          setGeofenceAlertCount(geoAlerts.length);

          // Injecter les alertes BDD dans le live feed comme événements géofence
          if (geoAlerts.length > 0) {
            const injected = geoAlerts.map(a => ({
              id: `geo-db-${a._id}`,
              type: 'geofence',
              text: `${a.kitId} — Sortie de périmètre (${a.metadata?.distanceMeters ?? '2000+'}m)`,
              time: new Date(a.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              badge: 'GÉOFENCE',
              color: 'text-red-400 border-red-500/30',
              isGeofence: true,
              kitId: a.kitId,
            }));
            setLiveFeedEvents(prev => [...injected, ...prev]);
            setBreachedKitIds(new Set(geoAlerts.map(a => a.kitId)));
          }
        }
      } catch (err) {
        console.error('[FleetMonitoring] Erreur chargement alertes géofence :', err);
      }
    };
    loadExistingGeofenceAlerts();
  }, []);

  // ─── Socket.io — écoute en temps réel des alertes de géorepérage ─────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      console.log('[FleetMonitoring] Socket connecté — en attente d\'alertes géofence...');
    });

    socket.on('geofence_alert', (alert) => {
      console.log('[FleetMonitoring] Alerte géofence reçue :', alert);

      // Toast critique visible immédiatement
      toast.error(`🛡️ ALERTE GÉOFENCE — ${alert.kitId}`, {
        description: `Kit hors du périmètre autorisé. Distance : ${alert.metadata?.distanceMeters ?? '?'} m.`,
        duration: 9000,
      });

      // Injecter dans le flux en tête de liste
      const newEvent = {
        id: `geo-live-${alert._id || Date.now()}`,
        type: 'geofence',
        text: `${alert.kitId} — Sortie de périmètre (${alert.metadata?.distanceMeters ?? '?'}m)`,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        badge: 'GÉOFENCE',
        color: 'text-red-400 border-red-500/30',
        isGeofence: true,
        kitId: alert.kitId,
      };

      setLiveFeedEvents(prev => [newEvent, ...prev].slice(0, 20)); // max 20 événements
      setGeofenceAlertCount(prev => prev + 1);
      setBreachedKitIds(prev => new Set([...prev, alert.kitId]));
    });

    return () => socket.disconnect();
  }, []);

  // ─── Filtrage du flux d'événements selon l'onglet actif ──────────────────────
  const filteredEvents = feedFilter === 'Géofence'
    ? liveFeedEvents.filter(e => e.isGeofence)
    : liveFeedEvents;
=======
  const [selectedKit, setSelectedKit] = useState('KIT-K-87391');
  const [mapTab, setMapTab] = useState('Vue Carte');
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

<<<<<<< HEAD
  // ─── KPI dynamique : on ajoute la carte géofence en tête des KPIs ────────────
  const kpis = [
    {
      title: 'ALERTES GÉOFENCE',
      value: geofenceAlertCount.toString(),
      sub: geofenceAlertCount > 0 ? '⚠ Kits hors périmètre' : 'Tous en zone',
      color: geofenceAlertCount > 0 ? 'text-red-400' : 'text-orange-400',
      stroke: geofenceAlertCount > 0 ? '#ef4444' : '#f97316',
      spark: [0, 0, 0, 0, 0, 0, geofenceAlertCount],
      isLive: true,
    },
    ...staticKpis,
  ];

  const isKitBreached = breachedKitIds.has(selectedKit);

  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-6 font-['Montserrat',sans-serif] space-y-5">

=======
  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-6 font-['Montserrat',sans-serif] space-y-5">
      
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
      {/* HEADER BAR */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            SUPERVISION DE LA FLOTTE RDC
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Télémétrie en temps réel, géolocalisation et performance des kits solaires</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un kit, client..."
              className="pl-8 pr-4 py-1.5 bg-transparent border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500 w-48 lg:w-64"
            />
          </div>
          <button className="px-3 py-1.5 bg-transparent border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-slate-500 flex items-center gap-2 cursor-pointer">
            <Calendar size={14} /> 21 Avr 2026 - 19 Mai 2026
          </button>
          <button className="px-3 py-1.5 border border-orange-600 text-orange-500 hover:bg-orange-600/10 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Filter size={14} /> FILTRER
          </button>
        </div>
      </motion.div>

<<<<<<< HEAD
      {/* KPI CARDS — inclut maintenant la carte GÉOFENCE dynamique */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((kpi, idx) => (
          <motion.div key={idx} variants={fadeUp}>
            <div className={`bg-transparent rounded-xl p-3 flex flex-col justify-between hover:border-slate-600 transition-colors border ${
              kpi.isLive && geofenceAlertCount > 0
                ? 'border-red-800/60 shadow-[0_0_12px_rgba(239,68,68,0.08)]'
                : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5">
                {kpi.isLive && <ShieldAlert size={10} className={`flex-shrink-0 ${geofenceAlertCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />}
                <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase truncate">{kpi.title}</span>
              </div>
              <div className="my-1.5">
                <span className={`text-lg font-bold tracking-tight ${kpi.isLive && geofenceAlertCount > 0 ? 'text-red-400' : 'text-white'}`}>{kpi.value}</span>
=======
      {/* KPI CARDS */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <motion.div key={idx} variants={fadeUp}>
            <div className="bg-transparent border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-600 transition-colors">
              <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase truncate">{kpi.title}</span>
              <div className="my-1.5">
                <span className="text-lg font-bold text-white tracking-tight">{kpi.value}</span>
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
                <span className={`block text-[9px] ${kpi.color} font-medium mt-0.5`}>{kpi.sub}</span>
              </div>
              <div className="flex justify-end mt-1">
                <MiniSparkline data={kpi.spark} stroke={kpi.stroke} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* MAIN GRID */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
<<<<<<< HEAD

=======
        
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
        {/* PANNEAU DE FILTRES */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="bg-transparent border border-slate-800 rounded-xl p-4 flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Filter size={14} className="text-orange-400" /> FILTRES
              </h3>
              <button className="text-[10px] text-orange-400 hover:text-orange-300 cursor-pointer font-medium">RÉINITIALISER</button>
            </div>

            <div className="space-y-3 flex-1 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-medium">Recherche Kit ou Client</label>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Numéro de série, Nom..."
                    className="w-full pl-7 pr-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-medium">Espace Régional RDC</label>
                <select className="w-full px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500">
                  <option className="bg-slate-900">Toutes les régions</option>
                  <option className="bg-slate-900">Kinshasa & Kongo Central</option>
                  <option className="bg-slate-900">Grand Katanga</option>
                  <option className="bg-slate-900">Grand Kivu</option>
                  <option className="bg-slate-900">Grand Kasaï</option>
                  <option className="bg-slate-900">Grand Équateur & Orientale</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-medium">Ville / Province</label>
                <select className="w-full px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500">
                  <option className="bg-slate-900">Toutes les villes</option>
                  <option className="bg-slate-900">Kinshasa</option>
                  <option className="bg-slate-900">Lubumbashi</option>
                  <option className="bg-slate-900">Goma</option>
                  <option className="bg-slate-900">Bukavu</option>
                  <option className="bg-slate-900">Kisangani</option>
                  <option className="bg-slate-900">Mbuji-Mayi</option>
                  <option className="bg-slate-900">Kananga</option>
                  <option className="bg-slate-900">Matadi</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-2 uppercase tracking-wider font-medium">Statut Opérationnel</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-transparent text-orange-600 focus:ring-0 accent-orange-500" />
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> En ligne / Actif
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-transparent text-orange-600 focus:ring-0 accent-orange-500" />
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Avertissement
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-transparent text-orange-600 focus:ring-0 accent-orange-500" />
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Hors ligne / Critique
                  </label>
<<<<<<< HEAD
                  {/* Filtre géofencing */}
                  <label className="flex items-center gap-2 text-[11px] text-red-400 cursor-pointer border border-red-900/30 rounded-lg px-2 py-1 mt-1 bg-red-950/10">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-transparent focus:ring-0 accent-red-500" />
                    <ShieldAlert size={11} className="text-red-400" /> Sortie de Géofence
                  </label>
=======
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-medium">Score de Santé</label>
                <select className="w-full px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500">
                  <option className="bg-slate-900">Tous les scores</option>
                  <option className="bg-slate-900">Excellent (&gt;80)</option>
                  <option className="bg-slate-900">Moyen (50-80)</option>
                  <option className="bg-slate-900">Critique (&lt;50)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-medium">Niveau de Charge (SoC)</label>
                <select className="w-full px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500">
                  <option className="bg-slate-900">Tous niveaux</option>
                  <option className="bg-slate-900">&gt; 50%</option>
                  <option className="bg-slate-900">20% - 50%</option>
                  <option className="bg-slate-900">&lt; 20%</option>
                </select>
              </div>
            </div>

            <button className="w-full py-2 border border-orange-600 text-orange-500 hover:bg-orange-600/10 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors mt-auto cursor-pointer">
              APPLIQUER LES FILTRES
            </button>
          </div>
        </motion.div>

        {/* CARTE DYNAMIQUE RDC */}
        <motion.div variants={fadeUp} className="lg:col-span-6">
          <div className="bg-transparent border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[460px] relative">
<<<<<<< HEAD

=======
            
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
            <div className="p-3 border-b border-slate-800 flex items-center justify-between z-10">
              <div className="flex gap-4">
                {['VUE CARTE', 'VUE GRILLE'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMapTab(tab)}
                    className={`text-xs font-bold tracking-wider pb-1 relative transition-colors cursor-pointer ${
                      mapTab === tab ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                    {mapTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
<<<<<<< HEAD
                {/* Badge géofence si alertes actives */}
                {geofenceAlertCount > 0 && (
                  <span className="text-[10px] text-red-400 border border-red-800/50 bg-red-950/20 px-2 py-1 rounded flex items-center gap-1.5 animate-pulse font-semibold">
                    <ShieldAlert size={11} />
                    {geofenceAlertCount} GÉOFENCE
                  </span>
                )}
=======
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
                <span className="text-[10px] text-slate-300 border border-slate-800 px-2 py-1 rounded uppercase tracking-wider font-medium">
                  ZONE : RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                </span>
                <button className="p-1 border border-slate-800 rounded hover:border-slate-600 text-slate-400 cursor-pointer">
                  <Layers size={14} />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden flex items-center justify-center">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: 1350,
                  center: [23.5, -2.8]
                }}
                className="w-full h-full min-h-[360px]"
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="transparent"
<<<<<<< HEAD
                        stroke="#334155"
=======
                        stroke="#334155" // slate-700
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
                        strokeWidth={0.6}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "rgba(51, 65, 85, 0.2)", outline: "none" },
                          pressed: { fill: "rgba(249, 115, 22, 0.2)", outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {mapMarkers.map((marker) => (
                  <Marker
                    key={marker.id}
                    coordinates={[marker.lng, marker.lat]}
                    onClick={() => setSelectedKit(`KIT-K-${marker.id}8739`)}
                    className="cursor-pointer group"
                  >
                    <g transform="translate(-10, -10)">
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        className="opacity-40 animate-ping fill-orange-500"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        className="fill-transparent stroke-orange-500 stroke-2"
                      />
                      <text
                        x="10"
                        y="12.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="6.5"
                        fontWeight="bold"
                      >
                        {marker.count > 10000 ? `${Math.round(marker.count/1000)}k` : marker.count}
                      </text>
                    </g>
                  </Marker>
                ))}
              </ComposableMap>

              {/* Boutons Zoom Overlay */}
              <div className="absolute right-3 bottom-3 flex flex-col border border-slate-800 rounded-lg overflow-hidden z-10">
                <button className="p-1.5 text-slate-300 hover:bg-slate-800/50 border-b border-slate-800 cursor-pointer"><Plus size={14} /></button>
                <button className="p-1.5 text-slate-300 hover:bg-slate-800/50 cursor-pointer"><Minus size={14} /></button>
              </div>

<<<<<<< HEAD
              {/* Légende */}
=======
              {/* Légende en bas à gauche */}
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
              <div className="absolute left-3 bottom-3 border border-slate-800 p-2.5 rounded-lg text-[10px] space-y-1 z-10 font-medium backdrop-blur-sm">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Normal (147,510)</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Avertissement (7,810)</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Critique (3,422)</div>
<<<<<<< HEAD
                {geofenceAlertCount > 0 && (
                  <div className="flex items-center gap-2 text-red-400 border-t border-slate-700/50 pt-1">
                    <ShieldAlert size={10} /> Géofence ({geofenceAlertCount})
                  </div>
                )}
              </div>
=======
              </div>

>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
            </div>
          </div>
        </motion.div>

        {/* DÉTAILS DU KIT SÉLECTIONNÉ */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
<<<<<<< HEAD
          <div className={`bg-transparent rounded-xl p-4 flex flex-col h-full justify-between space-y-4 border transition-colors ${
            isKitBreached ? 'border-red-800/60 shadow-[0_0_15px_rgba(239,68,68,0.06)]' : 'border-slate-800'
          }`}>

=======
          <div className="bg-transparent border border-slate-800 rounded-xl p-4 flex flex-col h-full justify-between space-y-4">
            
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">KIT SÉLECTIONNÉ</h3>
                <span className="text-[10px] text-orange-400 hover:text-orange-300 cursor-pointer flex items-center gap-0.5 font-medium">
                  DÉTAILS <ExternalLink size={10} />
                </span>
              </div>

<<<<<<< HEAD
              {/* Alerte géofence sur le kit */}
              {isKitBreached && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 flex items-center gap-2 bg-red-950/20 border border-red-800/40 rounded-xl px-3 py-2"
                  >
                    <ShieldAlert size={14} className="text-red-400 flex-shrink-0 animate-pulse" />
                    <span className="text-[10px] text-red-400 font-semibold leading-snug">
                      Ce kit a quitté son périmètre autorisé (2000m)
                    </span>
                  </motion.div>
                </AnimatePresence>
              )}

=======
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
              <div className="flex items-center gap-3 border border-slate-800 p-3 rounded-xl">
                <div className="w-12 h-14 bg-transparent rounded-lg flex items-center justify-center border border-slate-800 flex-shrink-0">
                  <Box size={24} className="text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{selectedKit}</h4>
                    <span className="px-1.5 py-0.2 text-orange-400 border border-orange-500/50 text-[9px] rounded font-semibold uppercase tracking-wide">● En ligne</span>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">SN: RN87391V22K41</p>
                  <p className="text-[9px] text-slate-400 truncate">Modèle: Djua Home 200X</p>
                  <p className="text-[9px] text-slate-500 truncate">Client: Jean-Baptiste K.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-medium">SCORE DE SANTÉ</span>
                <span className="text-sm font-bold text-orange-400">89<span className="text-[9px] text-slate-500">/100</span></span>
                <span className="text-[8px] text-orange-400/90 block font-medium uppercase">Bon état</span>
              </div>
              <div className="border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-medium">BATTERIE (SOC)</span>
                <span className="text-sm font-bold text-white">42%</span>
                <span className="text-[8px] text-slate-400 block uppercase font-medium">Charge actuelle</span>
              </div>
              <div className="border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-medium">PRODUCTION</span>
                <span className="text-sm font-bold text-white">1.8 kWh</span>
                <span className="text-[8px] text-slate-400 block uppercase font-medium">Aujourd'hui</span>
              </div>
              <div className="border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-medium">DERNIER CONTACT</span>
                <span className="text-xs font-bold text-white">il y a 2 min</span>
                <span className="text-[8px] text-slate-400 block uppercase font-medium">14:10</span>
              </div>
            </div>

            <div className="space-y-2 text-[10px] border border-slate-800 p-3 rounded-xl font-medium">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin size={12} className="text-orange-500 flex-shrink-0" />
                <span className="truncate">Ngaliema, Macampagne, Kinshasa, RDC</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 uppercase">
                <span>Moy. jour: <strong className="text-slate-300">1.24 kWh</strong></span>
                <span>Capacité: <strong className="text-slate-300">2.5 kWh</strong></span>
              </div>
            </div>

            <button className="w-full py-2 border border-orange-600 text-orange-500 hover:bg-orange-600/10 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors mt-auto flex items-center justify-center gap-1.5 cursor-pointer">
              INSPECTER LE KIT <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>

      </motion.div>

<<<<<<< HEAD
      {/* FLUX D'ACTIVITÉ EN TEMPS RÉEL — avec onglet GÉOFENCE dédié */}
=======
      {/* FLUX D'ACTIVITÉ EN TEMPS RÉEL */}
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="bg-transparent border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
<<<<<<< HEAD
                <Activity size={14} className="text-orange-400" /> ÉVÉNEMENTS EN DIRECT
              </h3>
              <div className="flex gap-2 flex-wrap">
                {['Tous', 'Géofence', 'Erreurs', 'Maintenance', 'Installations'].map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setFeedFilter(f)}
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer transition-all ${
                      feedFilter === f
                        ? f === 'Géofence'
                          ? 'border border-red-600 text-red-400 bg-red-950/10'
                          : 'border border-orange-600 text-orange-400'
                        : 'bg-transparent text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {f === 'Géofence' && geofenceAlertCount > 0 ? `${f} (${geofenceAlertCount})` : f}
=======
                <Activity size={14} className="text-orange-400" /> ÉVÉNEMENTS TÉLÉMÉTRIE EN DIRECT
              </h3>
              <div className="flex gap-2">
                {['Tous', 'Erreurs', 'Maintenance', 'Installations'].map((f, i) => (
                  <button key={i} className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer transition-colors ${i === 0 ? 'border border-orange-600 text-orange-400' : 'bg-transparent text-slate-400 hover:text-slate-200 border border-slate-800'}`}>
                    {f}
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
                  </button>
                ))}
              </div>
            </div>
<<<<<<< HEAD
=======

>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
            <button className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
              VOIR LE JOURNAL COMPLET <ArrowRight size={10} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
<<<<<<< HEAD
            <AnimatePresence mode="popLayout">
              {filteredEvents.slice(0, 5).map((evt) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className={`bg-transparent p-2.5 rounded-xl border flex items-center justify-between gap-2 hover:border-slate-700 transition-colors ${
                    evt.isGeofence
                      ? 'border-red-900/50 bg-red-950/5'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border inline-flex items-center gap-1 mb-1 ${evt.color}`}>
                      {evt.isGeofence && <ShieldAlert size={8} />}
                      {evt.badge}
                    </span>
                    <p className="text-[10px] font-bold text-slate-200 truncate">{evt.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">{evt.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
=======
            {liveFeedEvents.map((evt) => (
              <div key={evt.id} className="bg-transparent p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors">
                <div className="min-w-0">
                  <span className={`text-[8px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider border inline-block mb-1 ${evt.color}`}>
                    {evt.badge}
                  </span>
                  <p className="text-[10px] font-bold text-slate-200 truncate">{evt.text}</p>
                </div>
                <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">{evt.time}</span>
              </div>
            ))}
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
          </div>
        </div>
      </motion.div>

    </div>
  );
}