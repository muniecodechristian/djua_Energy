import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Compass, MapPin, Navigation, Clock, CheckCircle2, RotateCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import api from '../api/axios.js';

// Leaflet styles
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

// Component to dynamically adjust map center when selected alert changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function GeofencingAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial alerts
  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/alerts');
      if (response.data?.success) {
        // Filter only geofencing alerts
        const geoAlerts = response.data.data.filter(a => a.type === 'geofence_exit');
        setAlerts(geoAlerts);
        if (geoAlerts.length > 0) {
          setSelectedAlert(geoAlerts[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement des alertes geofence:', error);
      toast.error('Impossible de charger les alertes de géorepérage.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Setup Socket.io client connection
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('[Socket] Connecté au serveur de flux en temps réel');
    });

    socket.on('geofence_alert', (newAlert) => {
      console.log('[Socket] Nouvelle alerte geofence reçue :', newAlert);
      toast.error(`⚠️ ALERTE CRITIQUE GEOFENCE`, {
        description: `Le Kit ${newAlert.kitId} a dépassé les limites autorisées.`,
        duration: 8000,
      });

      setAlerts((prev) => {
        if (prev.some(a => a._id === newAlert._id)) return prev;
        const updated = [newAlert, ...prev];
        // Select it automatically
        setSelectedAlert(newAlert);
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleResolveAlert = async (alertId) => {
    try {
      // Simulate resolving alert (or API request if route exists)
      toast.success('Alerte marquée comme résolue');
      setAlerts(prev => prev.filter(a => a._id !== alertId));
      if (selectedAlert?._id === alertId) {
        setSelectedAlert(null);
      }
    } catch (error) {
      toast.error("Erreur lors de la résolution de l'alerte");
    }
  };

  // Get coordinates for map
  const getMapData = () => {
    if (!selectedAlert || !selectedAlert.metadata) return null;
    const meta = selectedAlert.metadata;
    const refPos = meta.referencePosition || { latitude: -4.32761, longitude: 15.31352 };
    const currentPos = meta.currentPosition || { latitude: -4.33, longitude: 15.32 };

    return {
      refCenter: [refPos.latitude, refPos.longitude],
      currentLoc: [currentPos.latitude, currentPos.longitude],
      distance: meta.distanceMeters || 2000,
    };
  };

  const mapData = getMapData();

  return (
    <div className="h-[calc(100vh-70px)] bg-black text-zinc-100 flex flex-col font-sans overflow-hidden">
      {/* Sub Header */}
      <div className="border-b border-zinc-900 bg-zinc-950/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldAlert size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white">Supervision du Géorepérage (Geofencing)</h1>
            <p className="text-xs text-zinc-400">Suivi en temps réel des kits solaires hors du périmètre autorisé de 2000m</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{alerts.length} Alerte{alerts.length > 1 ? 's' : ''} Active{alerts.length > 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={fetchAlerts}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Rafraîchir"
          >
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Alerts Sidebar */}
        <div className="w-96 border-r border-zinc-900 bg-zinc-950/20 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-zinc-900/60 bg-zinc-950/40">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Flux des Alertes</span>
          </div>

          <div className="flex-1 p-3 space-y-2">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-[#FF7900] animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-xs text-zinc-400">Aucune sortie de zone détectée actuellement.</p>
              </div>
            ) : (
              <AnimatePresence>
                {alerts.map((alert) => {
                  const isSelected = selectedAlert?._id === alert._id;
                  const distanceStr = alert.metadata?.distanceMeters
                    ? `${(alert.metadata.distanceMeters / 1000).toFixed(2)} km`
                    : '2+ km';
                  return (
                    <motion.div
                      key={alert._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedAlert(alert)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected
                          ? 'bg-red-950/20 border-red-800/80 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                          : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-white tracking-wider uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-md">
                          {alert.kitId}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold bg-red-950/40 px-2 py-0.5 rounded-full border border-red-900/30">
                          <Compass size={11} className="animate-spin" style={{ animationDuration: '6s' }} />
                          <span>{distanceStr}</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900/50 text-[10px] text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>{new Date(alert.createdAt).toLocaleTimeString('fr-FR')}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveAlert(alert._id);
                          }}
                          className="text-[#FF7900] hover:text-orange-400 transition-colors font-bold uppercase tracking-wider"
                        >
                          Résoudre
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Map Panel */}
        <div className="flex-1 bg-zinc-950 relative">
          {mapData ? (
            <div className="w-full h-full relative">
              <MapContainer
                center={mapData.refCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#09090b' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Reference Center (2000m radius limit) */}
                <Circle
                  center={mapData.refCenter}
                  radius={2000}
                  pathOptions={{ color: '#FF7900', fillColor: '#FF7900', fillOpacity: 0.05, dashArray: '5, 8' }}
                />

                {/* Initial position marker */}
                <Marker position={mapData.refCenter}>
                  <Popup>
                    <div className="text-xs font-sans text-zinc-800">
                      <strong className="text-[#FF7900]">Position Initiale Autorisée</strong>
                      <br />
                      Kit: {selectedAlert?.kitId}
                    </div>
                  </Popup>
                </Marker>

                {/* Out-of-bounds actual position */}
                <Marker position={mapData.currentLoc}>
                  <Popup>
                    <div className="text-xs font-sans text-zinc-800">
                      <strong className="text-red-600">Alerte : Position Actuelle</strong>
                      <br />
                      Distance: {selectedAlert?.metadata?.distanceMeters} mètres du périmètre.
                    </div>
                  </Popup>
                </Marker>

                {/* Line indicating breach path */}
                <Polyline
                  positions={[mapData.refCenter, mapData.currentLoc]}
                  pathOptions={{ color: '#ef4444', weight: 2, dashArray: '4, 4' }}
                />

                <MapRecenter center={mapData.refCenter} />
              </MapContainer>

              {/* Float Map Card Details */}
              <div className="absolute bottom-6 left-6 z-[1000] bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl w-96 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                <h3 className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-3">Détails Géographiques</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-400">Coordonnées Enregistrées</h4>
                      <p className="text-xs font-semibold text-white mt-0.5">
                        {mapData.refCenter[0].toFixed(5)}, {mapData.refCenter[1].toFixed(5)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
                      <Navigation size={14} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-400">Position Détectée</h4>
                      <p className="text-xs font-semibold text-red-400 mt-0.5">
                        {mapData.currentLoc[0].toFixed(5)}, {mapData.currentLoc[1].toFixed(5)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-900 pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Dépassement</span>
                    <span className="text-xs font-extrabold text-red-500">
                      +{Math.round(selectedAlert.metadata.distanceMeters - 2000)} mètres hors limite
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
                <Compass size={28} />
              </div>
              <h2 className="text-sm font-bold text-zinc-400">Aucune alerte sélectionnée</h2>
              <p className="text-xs text-zinc-600 mt-1 max-w-xs">Sélectionnez une alerte à gauche pour visualiser les coordonnées de l'appareil sur la carte.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
