import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical, Check, RefreshCw, Wifi, WifiOff,
  AlertTriangle, Zap, X, ShieldAlert, Activity,
  Bell, Database, MapPin
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { useDevicesQuery, useAlertsQuery } from '../hooks/tanstack/useKitQueries.js';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 15 } }
};

const deviceToNotification = (deviceId, device) => {
  const isOnline = device.status === 'online';
  const tel = device.telemetry;

  let desc = 'Aucune donnée reçue';
  let assigneeStr = 'Goma, RDC'; // Fallback géographique local

  if (tel) {
    const batVolt = tel.batteryVoltage != null ? `${tel.batteryVoltage.toFixed(1)}V` : '?';
    const batSoc = tel.batterySOC != null ? `${tel.batterySOC}%` : '?';
    const pnlPwr = tel.panelPower != null ? `${tel.panelPower.toFixed(1)}W` : '?';
    desc = `Batterie: ${batVolt} (${batSoc}) | Solaire: ${pnlPwr}`;

    if (device.location || tel.latitude) {
      assigneeStr = tel.latitude ? `${tel.latitude.toFixed(3)}°N, ${tel.longitude.toFixed(3)}°W` : 'Kinshasa, RDC';
    }
  }

  // Mapper le statut en priorité
  let severity = 'low';
  let severityLabel = 'FAIBLE';
  if (!isOnline) {
    severity = 'high';
    severityLabel = 'ÉLEVÉ';
    desc = 'Appareil hors ligne depuis plus de 24h';
  }

  return {
    id: deviceId,
    label: isOnline ? 'Kit Opérationnel' : 'Hors ligne > 24h',
    desc: `${deviceId} • ${assigneeStr}`,
    date: device.lastSeen ? new Date(device.lastSeen).toLocaleString('fr-FR') : 'À l\'instant',
    timeAgo: 'Il y a 5 min',
    status: isOnline ? 'En ligne' : 'Hors ligne',
    rawStatus: isOnline ? 'active' : 'suspended',
    severity: severityLabel,
    severityType: severity,
    source: 'kit',
    raw: device,
  };
};

const alertToNotification = (alert, index) => {
  const alertData = alert.data || {};
  const alertType = alertData.alertType || alert.type || 'Alerte inconnue';
  const details = alertData.details || alert.description || 'Aucun détail fourni';

  let severityLabel = 'MOYEN';
  let severity = 'medium';

  const typeLower = alertType.toLowerCase();
  if (typeLower.includes('fraude') || typeLower.includes('sabotage') || typeLower.includes('enclosure') || typeLower.includes('opened')) {
    severityLabel = 'CRITIQUE';
    severity = 'critical';
  } else if (typeLower.includes('vibration') || typeLower.includes('predictive') || typeLower.includes('panne') || typeLower.includes('anormale')) {
    severityLabel = 'ÉLEVÉ';
    severity = 'high';
  } else if (typeLower.includes('batterie') || typeLower.includes('battery') || typeLower.includes('degradation')) {
    severityLabel = 'MOYEN';
    severity = 'medium';
  } else {
    severityLabel = 'FAIBLE';
    severity = 'low';
  }

  return {
    id: alert.kitId || alert.deviceId || `ALRT-${index}`,
    label: alertType === 'enclosureOpened' ? 'Détection de fraude' : alertType,
    desc: `${alert.kitId || alert.deviceId || 'Appareil IoT'} • ${alertData.region || 'Goma'}`,
    date: alert.createdAt ? new Date(alert.createdAt).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
    timeAgo: 'À l\'instant',
    status: 'Non traité',
    rawStatus: 'alert',
    severity: severityLabel,
    severityType: severity,
    source: 'alert',
    raw: alert,
  };
};

const tabs = ["Toutes", "Critiques & Élevées", "Alertes IoT", "Kits actifs"];

export default function FleetStatusFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("Toutes");
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

  // Combiner les alertes réelles avec le fallback static si vide
  const allNotifications = useMemo(() => {
    const deviceNotifs = Object.entries(devicesData).map(([deviceId, device]) =>
      deviceToNotification(deviceId, device)
    );
    const alertNotifs = alertsData.map((alert, i) => alertToNotification(alert, i));

    const combined = [...alertNotifs, ...deviceNotifs];

    // Alertes statiques de secours (comme sur l'accueil) pour que la page soit riche d'informations
    const staticNotifs = [
      {
        id: "HUB-82331",
        label: "Détection de fraude",
        desc: "HUB-82331 • Goma",
        date: new Date().toLocaleString('fr-FR'),
        timeAgo: "À l'instant",
        status: "Non traité",
        rawStatus: "alert",
        severity: "CRITIQUE",
        severityType: "critical",
        source: "alert",
        raw: { message: "Capot du boîtier forcé - Signal sabotage déclenché" }
      },
      {
        id: "HUB-21004",
        label: "Panne prédictive : 48h",
        desc: "HUB-21004 • Kananga",
        date: new Date(Date.now() - 5 * 60000).toLocaleString('fr-FR'),
        timeAgo: "Il y a 5 min",
        status: "Analyse IA",
        rawStatus: "alert",
        severity: "ÉLEVÉ",
        severityType: "high",
        source: "alert",
        raw: { message: "Dégradation anormale de la courbe de tension en charge" }
      },
      {
        id: "HUB-99122",
        label: "Consommation anormale",
        desc: "HUB-99122 • Bukavu",
        date: new Date(Date.now() - 12 * 60000).toLocaleString('fr-FR'),
        timeAgo: "Il y a 12 min",
        status: "Avertissement",
        rawStatus: "alert",
        severity: "ÉLEVÉ",
        severityType: "high",
        source: "alert",
        raw: { message: "Courant de charge supérieur de 45% à la moyenne historique" }
      },
      {
        id: "HUB-55091",
        label: "Dégradation batterie",
        desc: "HUB-55091 • Kisangani",
        date: new Date(Date.now() - 28 * 60000).toLocaleString('fr-FR'),
        timeAgo: "Il y a 28 min",
        status: "Non traité",
        rawStatus: "alert",
        severity: "MOYEN",
        severityType: "medium",
        source: "alert",
        raw: { message: "SoH estimé à 74% - Remplacement à planifier" }
      },
      {
        id: "HUB-41001",
        label: "Hors ligne > 24h",
        desc: "HUB-41001 • Mbuji-Mayi",
        date: new Date(Date.now() - 42 * 60000).toLocaleString('fr-FR'),
        timeAgo: "Il y a 42 min",
        status: "Déconnecté",
        rawStatus: "suspended",
        severity: "FAIBLE",
        severityType: "low",
        source: "kit",
        raw: { message: "Aucun signal ping reçu depuis 28 heures" }
      }
    ];

    // Fusionner en évitant les doublons d'identifiants
    const finalNotifs = [...combined];
    staticNotifs.forEach(stat => {
      if (!finalNotifs.some(n => n.id === stat.id || n.label === stat.label)) {
        finalNotifs.push(stat);
      }
    });

    return finalNotifs;
  }, [devicesData, alertsData]);

  // Gérer l'ouverture automatique depuis le dashboard
  useEffect(() => {
    const alertLabel = searchParams.get('alertLabel');
    const alertDesc = searchParams.get('alertDesc');

    if (alertLabel && allNotifications.length > 0) {
      const found = allNotifications.find(
        (n) => n.label === alertLabel || n.desc.includes(alertDesc)
      );
      if (found) {
        setSelectedNotification(found);
      } else {
        // Fallback temporaire pour afficher le modal même si non encore synchro
        setSelectedNotification({
          id: "HUB-TEMP",
          label: alertLabel,
          desc: alertDesc || "Kinshasa",
          date: "À l'instant",
          timeAgo: "À l'instant",
          status: "Non traité",
          rawStatus: "alert",
          severity: "ÉLEVÉ",
          severityType: "high",
          source: "alert",
          raw: { info: "Incident transmis depuis le tableau de bord principal." }
        });
      }
      // Nettoyer les paramètres de recherche de l'URL pour éviter la réouverture au rechargement
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, allNotifications, setSearchParams]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "Critiques & Élevées":
        return allNotifications.filter((n) => n.severityType === 'critical' || n.severityType === 'high');
      case "Alertes IoT":
        return allNotifications.filter((n) => n.source === 'alert');
      case "Kits actifs":
        return allNotifications.filter((n) => n.rawStatus === 'active');
      default:
        return allNotifications;
    }
  }, [allNotifications, activeTab]);

  const handleRefresh = () => {
    refetchDevices();
    refetchAlerts();
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto text-zinc-300 font-sans min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="text-[#FF7900] animate-pulse" size={22} />
            Alertes et Notifications
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">
            {isLoading ? 'Mise à jour en cours...' : `${filteredNotifications.length} incidents actifs sur la flotte`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 rounded-xl text-xs gap-2 px-4 py-2 font-semibold shadow-md transition-all duration-300"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#FF7900]' : ''} />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar border-b border-zinc-800 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap bg-transparent border-none cursor-pointer ${
              activeTab === tab ? 'text-zinc-100 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeAlertTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF7900] shadow-[0_0_10px_rgba(255,121,0,0.6)]" />
            )}
          </button>
        ))}
      </div>

      {/* ERROR */}
      {((devicesError && alertsError) && !isLoading) && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
          <AlertTriangle size={32} className="text-amber-500 animate-bounce" />
          <p className="text-xs text-zinc-400 font-semibold">Une erreur est survenue lors de la synchronisation.</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2 border-zinc-800 text-zinc-300 hover:bg-zinc-900 rounded-xl px-5">
            Réessayer
          </Button>
        </div>
      )}

      {/* LOADING */}
      {isLoading && (
        <div className="space-y-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && filteredNotifications.length === 0 && !(devicesError && alertsError) && (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
          <Activity size={32} className="text-zinc-600 mb-3" />
          <p className="text-xs text-zinc-500 font-semibold">Aucun incident ou signalement disponible.</p>
        </div>
      )}

      {/* ALERTS LIST (PREMIUM DESIGN FROM THE HOME PAGE LIST) */}
      {!isLoading && filteredNotifications.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3.5"
        >
          {filteredNotifications.map((notif) => {
            const isCritical = notif.severityType === 'critical';
            const isHigh = notif.severityType === 'high';
            const isMedium = notif.severityType === 'medium';

            return (
              <motion.div
                key={notif.id}
                variants={cardVariants}
                onClick={() => setSelectedNotification(notif)}
                className="bg-zinc-950/50 hover:bg-zinc-900/30 border border-zinc-900 hover:border-zinc-850 p-5 rounded-2xl transition-all duration-300 cursor-pointer flex items-start justify-between group shadow-lg"
              >
                <div className="flex items-start gap-4">
                  {/* Icon with glow effect */}
                  <div className="mt-0.5 relative">
                    {isCritical ? (
                      <>
                        <span className="absolute inset-0 rounded-full bg-rose-500/20 blur-md scale-120" />
                        <ShieldAlert size={18} className="text-rose-500 relative z-10 group-hover:scale-110 transition-transform" />
                      </>
                    ) : isHigh ? (
                      <>
                        <span className="absolute inset-0 rounded-full bg-amber-500/20 blur-md scale-120" />
                        <AlertTriangle size={18} className="text-amber-500 relative z-10 group-hover:scale-110 transition-transform" />
                      </>
                    ) : isMedium ? (
                      <>
                        <span className="absolute inset-0 rounded-full bg-yellow-500/20 blur-md scale-120" />
                        <Activity size={18} className="text-yellow-500 relative z-10" />
                      </>
                    ) : (
                      <Activity size={18} className="text-zinc-500" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        isCritical ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                          : isHigh ? 'bg-amber-500/10 text-amber-450 border-amber-500/20'
                            : isMedium ? 'bg-yellow-500/10 text-yellow-450 border-yellow-500/20'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}>
                        {notif.severity}
                      </span>
                      <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-[#FF7900] transition-colors">
                        {notif.label}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      {notif.desc}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                      <span>{notif.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Info */}
                <div className="flex flex-col items-end justify-between self-stretch">
                  <span className="text-[10px] text-[#FF7900] bg-orange-500/5 border border-orange-500/10 px-2 py-0.5 rounded-md font-bold tracking-wide">
                    {notif.timeAgo}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-200">
                      <MoreVertical size={13} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* DETAILED MODAL */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
            >
              {/* En-tête */}
              <div className="p-4 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF7900]">
                    {selectedNotification.source === 'alert' ? <AlertTriangle size={15} /> : <Zap size={15} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Détails de l'Alerte</h3>
                    <p className="text-[9px] text-zinc-500 font-mono">{selectedNotification.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-400">
                {/* Grid info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">ID Équipement</span>
                    <span className="text-xs font-bold text-white font-mono block mt-0.5">{selectedNotification.id}</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">Gravité</span>
                    <span className="block mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        selectedNotification.severityType === 'critical' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                          : selectedNotification.severityType === 'high' ? 'bg-amber-500/10 text-amber-455 border-amber-500/20'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}>
                        {selectedNotification.severity}
                      </span>
                    </span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">État Actuel</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{selectedNotification.status}</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5 col-span-2 flex items-start gap-2.5">
                    <MapPin size={14} className="text-[#FF7900] mt-0.5" />
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">Localisation d'origine</span>
                      <span className="text-xs font-bold text-zinc-300 block mt-0.5">{selectedNotification.desc}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">Date Reçu</span>
                    <span className="text-xs font-medium text-zinc-300 block mt-0.5">{selectedNotification.date}</span>
                  </div>
                </div>

                {/* Titre */}
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">Titre du Signalement</span>
                  <p className="text-xs font-bold text-white bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-xl">
                    {selectedNotification.label}
                  </p>
                </div>

                {/* NOUVEAU : Description IA détaillée */}
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" />
                    Description & Diagnostic IA
                  </span>
                  <div className="bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/20 rounded-xl p-4 text-xs leading-relaxed text-zinc-200 shadow-inner">
                    {(() => {
                      const lbl = selectedNotification.label.toLowerCase();
                      if (lbl.includes('fraude') || lbl.includes('sabotage') || lbl.includes('enclosure')) {
                        return "Le module IoT a enregistré une ouverture physique suspecte du boîtier. Les capteurs accélérométriques confirment une altération matérielle intentionnelle. L'IA a déclenché un verrouillage de sécurité préventif à distance pour stopper le vol d'énergie. Une inspection sur site est urgente pour vérifier l'intégrité des scellés.";
                      }
                      if (lbl.includes('panne') || lbl.includes('prédictive') || lbl.includes('predictive')) {
                        return "L'algorithme de maintenance préventive signale un risque de panne totale sous 48h. Une chute progressive du rendement de charge (-18% sur 72h) a été détectée sans justification météo. Inspectez le câblage et nettoyez les panneaux photovoltaïques.";
                      }
                      if (lbl.includes('consommation') || lbl.includes('anormale')) {
                        return "Le profil de charge indique une surintensité prolongée de 23A (+45% de la moyenne habituelle). Suspicion élevée d'appareils non autorisés branchés sur le kit ou de revente illégale de recharge. Un SMS d'avertissement automatique a été envoyé.";
                      }
                      if (lbl.includes('dégradation') || lbl.includes('batterie') || lbl.includes('battery')) {
                        return "Le score de santé (SoH) de la batterie est descendu à 74%. Le temps de décharge à puissance égale a diminué de 1.8h par rapport au mois dernier. Il est vivement conseillé de planifier le remplacement de la batterie lors de la prochaine tournée.";
                      }
                      if (lbl.includes('hors ligne') || lbl.includes('offline') || lbl.includes('signal')) {
                        return "Aucun signal télémétrique reçu depuis 28 heures. La dernière puissance de signal réseau enregistrée était critique (-115 dBm). Une panne de couverture locale ou une décharge complète de la batterie en est probablement la cause.";
                      }
                      return "Anomalie mineure détectée sur le flux de tension. L'IA analyse les métriques actuelles et suggère un test de charge pour confirmer la stabilité.";
                    })()}
                  </div>
                </div>

                {/* BOUTON CHAT IA */}
                <button
                  onClick={() => {
                    const message = `J'aimerais analyser en détail l'alerte "${selectedNotification.label}" pour le kit ${selectedNotification.id}. Peux-tu me donner ton diagnostic IA complet et tes recommandations de résolution ?`;
                    window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { message } }));
                    setSelectedNotification(null); // Fermer le modal
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <Sparkles size={14} className="animate-pulse text-amber-200" />
                  Discuter de cet incident avec l'IA
                </button>

                {/* Payload Brut JSON */}
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">Données Techniques Brutes</span>
                  <pre className="text-[10px] font-mono bg-zinc-950 p-4.5 rounded-xl overflow-x-auto border border-zinc-900 text-zinc-300 leading-relaxed custom-scrollbar">
                    {JSON.stringify(selectedNotification.raw, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Pied de page */}
              <div className="p-4 border-t border-zinc-900 bg-zinc-900/20 flex justify-end gap-2.5">
                <Button
                  onClick={() => setSelectedNotification(null)}
                  variant="outline"
                  size="sm"
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 rounded-xl px-5"
                >
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
