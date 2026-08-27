import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Check, RefreshCw, Wifi, WifiOff, AlertTriangle, Info, Zap, X, ShieldAlert } from 'lucide-react';
import { Button } from "../components/ui/button";
import { useDevicesQuery, useTelemetryQuery, useAlertsQuery } from '../hooks/tanstack/useKitQueries.js';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 18 } }
};

const deviceToNotification = (deviceId, device) => {
  const isOnline = device.status === 'online';
  const tel = device.telemetry;

  let desc = 'Aucune donnée reçue';
  let assigneeStr = 'ESP32 IoT';

  if (tel) {
    const batVolt = tel.batteryVoltage != null ? `${tel.batteryVoltage.toFixed(1)}V` : '?';
    const batSoc = tel.batterySOC != null ? `${tel.batterySOC}%` : '?';
    const pnlVolt = tel.panelVoltage != null ? `${tel.panelVoltage.toFixed(1)}V` : '?';
    const pnlPwr = tel.panelPower != null ? `${tel.panelPower.toFixed(1)}W` : '?';

    desc = `Batterie: ${batVolt} (${batSoc}) | Panneau: ${pnlVolt} (${pnlPwr})`;
    
    if (tel.latitude != null && tel.longitude != null) {
      assigneeStr = `GPS: ${tel.latitude.toFixed(4)}, ${tel.longitude.toFixed(4)}`;
    }
  }

  return {
    id: deviceId,
    user: deviceId,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${deviceId}`,
    desc: desc,
    date: device.lastSeen ? new Date(device.lastSeen).toLocaleString('fr-FR') : '—',
    status: isOnline ? 'En ligne' : 'Hors ligne',
    rawStatus: isOnline ? 'active' : 'suspended',
    assignee: assigneeStr,
    assigneeAvatar: `https://i.pravatar.cc/150?u=system`,
    value: isOnline ? 'Normale' : 'Haute',
    checked: false,
    source: 'kit',
    raw: device,
  };
};

const alertToNotification = (alert, index) => {
  const alertData = alert.data || {};
  
  // Mapper la sévérité selon le type d'alerte configuré dans l'ESP32
  const alertType = alertData.alertType || 'Alerte inconnue';
  const details = alertData.details || 'Aucun détail fourni';
  
  let severity = 'medium';
  if (alertType === 'enclosureOpened') severity = 'critical'; // Sabotage boîtier = critique
  if (alertType === 'vibration') severity = 'high';           // Secousse = haute

  const severityPriorityMap = {
    critical: 'Critique',
    high: 'Haute',
    medium: 'Normale',
    low: 'Basse',
  };

  let assigneeStr = 'Système';
  if (alertData.latitude != null && alertData.longitude != null) {
    assigneeStr = `GPS: ${alertData.latitude.toFixed(4)}, ${alertData.longitude.toFixed(4)}`;
  }

  return {
    id: `ALRT-${index.toString().padStart(5, '0')}`,
    user: alert.deviceId || 'Appareil IoT',
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${alert.deviceId}`,
    desc: `[${alertType}] ${details}`,
    date: alert.timestamp
      ? new Date(alert.timestamp).toLocaleString('fr-FR')
      : new Date().toLocaleString('fr-FR'),
    status: 'Non traité',
    rawStatus: 'alert',
    assignee: assigneeStr,
    assigneeAvatar: `https://i.pravatar.cc/150?u=system`,
    value: severityPriorityMap[severity] ?? 'Normale',
    checked: false,
    source: 'alert',
    raw: alert,
  };
};

const PriorityBadge = ({ priority }) => {
  const colorMap = {
    Critique: 'bg-zinc-900 text-red-400 border-zinc-800',
    Haute: 'bg-zinc-900 text-amber-500 border-zinc-800',
    Normale: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    Basse: 'bg-zinc-900 text-zinc-500 border-zinc-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colorMap[priority] ?? colorMap['Normale']}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status, rawStatus }) => {
  const colorMap = {
    active: 'bg-zinc-900 text-emerald-400 border-zinc-800',
    suspended: 'bg-zinc-900 text-amber-500 border-zinc-800',
    terminated: 'bg-zinc-900 text-red-400 border-zinc-800',
    alert: 'bg-zinc-900 text-orange-400 border-zinc-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colorMap[rawStatus] ?? 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
      {status}
    </span>
  );
};

const RowSkeleton = () => (
  <div className="grid grid-cols-[40px_100px_1.5fr_2fr_2fr_100px_1.5fr_100px_40px] gap-4 px-4 py-3 items-center rounded border border-zinc-900 animate-pulse">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="h-3.5 bg-zinc-900 rounded" />
    ))}
  </div>
);

const tabs = ["Toutes", "Kits actifs", "Alertes IoT", "Suspendus"];

export default function FleetStatusFeed() {
  const [activeTab, setActiveTab] = useState("Toutes");
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [selectedNotification, setSelectedNotification] = useState(null);

  const {
    data: devicesData = {},
    isLoading: devicesLoading,
    isError: devicesError,
    refetch: refetchDevices,
  } = useDevicesQuery();

  const {
    data: alertsData = [],
    isLoading: alertsLoading,
    isError: alertsError,
    refetch: refetchAlerts,
  } = useAlertsQuery();

  const isLoading = devicesLoading || alertsLoading;

  const allNotifications = useMemo(() => {
    // Transformer l'objet devices en tableau
    const deviceNotifs = Object.entries(devicesData).map(([deviceId, device]) => 
      deviceToNotification(deviceId, device)
    );
    const alertNotifs = alertsData.map((alert, i) => alertToNotification(alert, i));
    
    // Concaténer toutes les notifications
    const combined = [...alertNotifs, ...deviceNotifs];

    // N'afficher qu'une seule ligne par kit (la plus récente)
    const unique = [];
    const seen = new Set();
    for (const notif of combined) {
      if (!seen.has(notif.user)) {
        seen.add(notif.user);
        unique.push(notif);
      }
    }
    return unique;
  }, [devicesData, alertsData]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "Kits actifs":
        return allNotifications.filter((n) => n.rawStatus === 'active');
      case "Alertes IoT":
        return allNotifications.filter((n) => n.source === 'alert');
      case "Suspendus":
        return allNotifications.filter((n) => n.rawStatus === 'suspended' || n.rawStatus === 'terminated');
      default:
        return allNotifications;
    }
  }, [allNotifications, activeTab]);

  const toggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    refetchDevices();
    refetchAlerts();
  };

  return (
    <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto text-zinc-300 font-sans">
      
      <div className="mb-6 flex items-center justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Suivi des Alertes et Equipements</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isLoading ? 'Mise a jour...' : `${filteredNotifications.length} evenements répertoriés`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!alertsError ? (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span> Offline
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 rounded text-xs gap-1.5"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Rafraichir
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap relative ${
              activeTab === tab
                ? "text-zinc-100 border-b-2 border-zinc-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="hidden lg:grid grid-cols-[40px_100px_1.5fr_2fr_2fr_100px_1.5fr_100px_40px] gap-4 px-4 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900">
        <div className="flex justify-center">
          <div className="w-3.5 h-3.5 rounded border border-zinc-850" />
        </div>
        <div>ID</div>
        <div>Equipement</div>
        <div>Description</div>
        <div>Date</div>
        <div>Statut</div>
        <div>Affectation</div>
        <div>Priorite</div>
        <div className="text-center">Options</div>
      </div>

      {((devicesError && alertsError) && !isLoading) && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertTriangle size={24} className="text-zinc-500" />
          <p className="text-xs text-zinc-400">Une erreur est survenue lors de la synchronisation.</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2 border-zinc-850 text-zinc-300 hover:bg-zinc-900 rounded text-xs">
            Reessayer
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && filteredNotifications.length === 0 && !(devicesError && alertsError) && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-xs text-zinc-500">Aucun signalement disponible.</p>
        </div>
      )}

      {!isLoading && filteredNotifications.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="divide-y divide-zinc-900/50"
        >
          {filteredNotifications.map((notif) => {
            const isChecked = checkedIds.has(notif.id);
            return (
              <motion.div
                key={notif.id}
                variants={rowVariants}
                onClick={() => setSelectedNotification(notif)}
                className={`
                  grid grid-cols-1 lg:grid-cols-[40px_100px_1.5fr_2fr_2fr_100px_1.5fr_100px_40px]
                  gap-4 px-4 py-5 items-center transition-all border-b border-zinc-900/40 cursor-pointer hover:bg-zinc-900/20
                  ${isChecked ? 'bg-zinc-950/60' : 'bg-transparent'}
                `}
              >
                <div className="hidden lg:flex justify-center" onClick={(e) => { e.stopPropagation(); toggleCheck(notif.id); }}>
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    isChecked ? 'bg-zinc-300 border-zinc-300' : 'border border-zinc-800 hover:border-zinc-600'
                  }`}>
                    {isChecked && <Check size={10} className="text-zinc-950" strokeWidth={4} />}
                  </div>
                </div>

                <div className="text-xs font-semibold text-zinc-500">
                  {notif.id}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200 truncate">{notif.user}</span>
                </div>

                <div className="text-xs text-zinc-400 truncate">{notif.desc}</div>

                <div className="text-[11px] text-zinc-500">{notif.date}</div>

                <div>
                  <StatusBadge status={notif.status} rawStatus={notif.rawStatus} />
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs text-zinc-400 truncate">{notif.assignee}</span>
                </div>

                <div className="hidden lg:block">
                  <PriorityBadge priority={notif.value} />
                </div>

                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded"
                  >
                    <MoreVertical size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      {/* ── Modal Détails Alerte / Équipement ── */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
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
                    {selectedNotification.source === 'alert' ? <AlertTriangle size={14} /> : <Zap size={14} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Détails de l'Événement</h3>
                    <p className="text-[9px] text-zinc-500 font-mono">{selectedNotification.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-400">
                {/* Métriques */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Équipement</span>
                    <span className="text-xs font-bold text-white font-mono">{selectedNotification.user}</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Priorité / Gravité</span>
                    <span className="block mt-0.5"><PriorityBadge priority={selectedNotification.value} /></span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Statut</span>
                    <span className="block mt-0.5"><StatusBadge status={selectedNotification.status} rawStatus={selectedNotification.rawStatus} /></span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 col-span-2">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Détails d'Affectation</span>
                    <span className="text-xs font-semibold text-zinc-300 block mt-1">{selectedNotification.assignee}</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Horodatage</span>
                    <span className="text-xs font-medium text-zinc-300 block mt-1">{selectedNotification.date}</span>
                  </div>
                </div>

                {/* Description de l'événement */}
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Message d'événement</span>
                  <p className="text-xs text-zinc-200 bg-zinc-900/40 border border-zinc-900 p-3 rounded-xl">
                    {selectedNotification.desc}
                  </p>
                </div>

                {/* Données Brutes JSON */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Payload Brut Reçu</span>
                  <pre className="text-[10px] font-mono bg-zinc-950 p-4 rounded-xl overflow-x-auto border border-zinc-900 text-zinc-300 leading-relaxed">
                    {JSON.stringify(selectedNotification.raw, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Pied de page */}
              <div className="p-3 border-t border-zinc-900 bg-zinc-900/20 flex justify-end gap-2">
                <Button onClick={() => setSelectedNotification(null)} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
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
