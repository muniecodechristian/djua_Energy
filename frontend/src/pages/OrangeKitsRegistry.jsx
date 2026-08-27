import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreVertical, Check, RefreshCw, Wifi, WifiOff, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Button } from "../components/ui/button";
import { useKitsQuery } from '../hooks/tanstack/useKitQueries.js';

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

const orangeKitToNotification = (kit) => {
  const kitIdentifier = kit.kitId || `Kit #${kit._id.substring(18)}`;

  const priorityMap = {
    active: 'Normale',
    suspended: 'Haute',
    terminated: 'Critique',
  };

  const statusMap = {
    active: 'Actif',
    suspended: 'Suspendu',
    terminated: 'Résilié',
  };

  return {
    id: kit.kitId || kit._id,
    user: kitIdentifier,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${kit.kitId || kit._id}`,
    desc: `Offre: ${kit.offerName || 'Inconnue'} | Mensualité: ${kit.periodicAmountUSD || 0}$ | Payé: ${kit.paidMonthsCount || 0} mois`,
    date: kit.installationDate
      ? new Date(kit.installationDate).toLocaleDateString('fr-FR')
      : 'Non renseignée',
    status: statusMap[kit.status] ?? kit.status ?? '—',
    rawStatus: kit.status,
    assignee: kit.gpsCoordinates 
      ? `Lat: ${kit.gpsCoordinates.latitude.toFixed(4)}, Lon: ${kit.gpsCoordinates.longitude.toFixed(4)}`
      : 'Aucun GPS',
    value: priorityMap[kit.status] ?? 'Normale',
    checked: false,
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
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colorMap[rawStatus] ?? 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
      {status}
    </span>
  );
};

const RowSkeleton = () => (
  <div className="grid grid-cols-[40px_120px_1.5fr_2fr_2fr_100px_1.5fr_100px_40px] gap-4 px-4 py-3 items-center rounded border border-zinc-900 animate-pulse">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="h-3.5 bg-zinc-900 rounded" />
    ))}
  </div>
);

const tabs = ["Toutes les offres", "Actives", "Suspendues", "Résiliées"];

export default function OrangeKitsRegistry() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Toutes les offres");
  const [checkedIds, setCheckedIds] = useState(new Set());

  const {
    data: kitsData = [],
    isLoading,
    isError,
    refetch,
  } = useKitsQuery();

  const allNotifications = useMemo(() => {
    return kitsData.map((kit) => orangeKitToNotification(kit));
  }, [kitsData]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "Actives":
        return allNotifications.filter((n) => n.rawStatus === 'active');
      case "Suspendues":
        return allNotifications.filter((n) => n.rawStatus === 'suspended');
      case "Résiliées":
        return allNotifications.filter((n) => n.rawStatus === 'terminated');
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

  return (
    <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto text-zinc-300 font-sans">
      
      <div className="mb-6 flex items-center justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#FF7900]" />
            Registre d'Abonnement Orange Energy
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isLoading ? 'Mise à jour...' : `${filteredNotifications.length} kits synchronisés depuis l'API Orange`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 rounded text-xs gap-1.5"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Synchroniser API
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/notification')}
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 rounded text-xs gap-1.5"
          >
            <Info size={12} />
            Voir les notifications
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

      <div className="hidden lg:grid grid-cols-[40px_120px_1.5fr_2fr_2fr_100px_1.5fr_100px_40px] gap-4 px-4 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900">
        <div className="flex justify-center">
          <div className="w-3.5 h-3.5 rounded border border-zinc-850" />
        </div>
        <div>Kit ID</div>
        <div>Identifiant Kit</div>
        <div>Description Offre</div>
        <div>Date Installation</div>
        <div>Statut Orange</div>
        <div>Coordonnées GPS</div>
        <div>Priorité</div>
        <div className="text-center">Options</div>
      </div>

      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertTriangle size={24} className="text-zinc-500" />
          <p className="text-xs text-zinc-400">Erreur lors de la synchronisation avec l'API Orange Energy.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2 border-zinc-850 text-zinc-300 hover:bg-zinc-900 rounded text-xs">
            Réessayer la synchronisation
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && filteredNotifications.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-xs text-zinc-500">Aucun kit répertorié pour cette catégorie.</p>
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
                onClick={() => navigate(`/SmartKitdetails?kitId=${encodeURIComponent(notif.user)}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate('/SmartKitdetails');
                  }
                }}
                role="button"
                tabIndex={0}
                className={`
                  grid grid-cols-1 lg:grid-cols-[40px_120px_1.5fr_2fr_2fr_100px_1.5fr_100px_40px]
                  gap-4 px-4 py-3 items-center transition-all border-b border-zinc-900/40
                  ${isChecked ? 'bg-zinc-950/60' : 'bg-transparent'} cursor-pointer hover:bg-zinc-900/30
                `}
              >
                <div className="hidden lg:flex justify-center" onClick={(event) => {
                  event.stopPropagation();
                  toggleCheck(notif.id);
                }}>
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

                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/SmartKitdetails?kitId=${encodeURIComponent(notif.user)}`);
                    }}
                    title={`Voir les informations de ${notif.user}`}
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded"
                  >
                    <Info size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
