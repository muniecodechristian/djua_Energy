import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useClientsQuery } from '../hooks/tanstack/useKitQueries.js';
import KitsInstallationsTab from '../components/KitsInstallationsTab.jsx';
import ClientHistoryTab from '../components/ClientHistoryTab.jsx';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Phone, Mail, MapPin, CreditCard, ChevronDown, Plus,
  MoreHorizontal, Sparkles, Clock, Box,
  TrendingUp, Edit3, DollarSign
} from 'lucide-react';

// --- DONNÉES FACTICES (MOCK DATA) ---

const energyData = [
  { date: '21 Avr', usage: 1.1 },
  { date: '25 Avr', usage: 1.4 },
  { date: '28 Avr', usage: 0.9 },
  { date: '02 Mai', usage: 1.8 },
  { date: '05 Mai', usage: 1.2 },
  { date: '09 Mai', usage: 1.5 },
  { date: '12 Mai', usage: 0.32 },
  { date: '15 Mai', usage: 2.10 },
  { date: '18 Mai', usage: 1.7 },
];

const paymentHistory = [
  { month: 'Déc 25', status: 'ontime' },
  { month: 'Jan 26', status: 'ontime' },
  { month: 'Fév 26', status: 'late' },
  { month: 'Mar 26', status: 'ontime' },
  { month: 'Avr 26', status: 'ontime' },
  { month: 'Mai 26', status: 'missed' },
];

const riskFactorsList = [
  { label: 'Comportement de paiement', level: 'Élevé', value: 85, color: 'bg-red-500', textColor: 'text-red-400' },
  { label: 'Faible consommation d\'énergie', level: 'Moyen', value: 60, color: 'bg-orange-500', textColor: 'text-orange-400' },
  { label: 'Déplacement du kit détecté', level: 'Moyen', value: 55, color: 'bg-orange-500', textColor: 'text-orange-400' },
  { label: 'Ancienneté inférieure à 18 mois', level: 'Faible', value: 30, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { label: 'Aucune réclamation formelle', level: 'Faible', value: 10, color: 'bg-slate-700', textColor: 'text-emerald-400' },
];

const interactionsList = [
  { date: '19 Mai 2026', title: 'Intervention créée', desc: 'Maintenance corrective pour KIT-K-87391', author: 'Vous', badgeColor: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  { date: '02 Mai 2026', title: 'Paiement reçu', desc: '25 000 FCFA via Mobile Money', author: 'Système', badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  { date: '12 Avr 2026', title: 'Appel client', desc: 'Demande de renseignement sur la date de facturation', author: 'Agent 0451', badgeColor: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  { date: '05 Avr 2026', title: 'Rappel envoyé', desc: 'Rappel de paiement pour l\'échéance d\'avril', author: 'Système', badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700' },
];

// --- COMPOSANT CARTE RÉUTILISABLE AVEC GESTES ---

const Card = ({ children, className = "", title, action, titleRight }) => (
  <motion.div 
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.995 }}
    className={`bg-transparent border border-slate-800/80 rounded-xl flex flex-col overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] ${className}`}
  >
    {(title || action || titleRight) && (
      <div className="px-4 py-3 border-b border-slate-800/50 flex justify-between items-center bg-transparent">
        {title && <h3 className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">{title}</h3>}
        <div className="flex items-center gap-2">
          {titleRight && <span className="text-[10px] text-slate-500">{titleRight}</span>}
          {action && (
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer font-medium"
            >
              {action}
            </motion.div>
          )}
        </div>
      </div>
    )}
    <div className="p-4 flex-1 flex flex-col">{children}</div>
  </motion.div>
);

// --- TABLEAU DE BORD PRINCIPAL DU PROFIL CLIENT ---

export default function CustomerProfile() {
  const [activeTab, setActiveTab] = useState('Aperçu');
  const tabs = ['Aperçu', 'Risque & Scoring', 'Kits & Installations', 'Paiements & Crédit', 'Interactions', 'Documents', 'Historique'];

  const { data: clients = [], isLoading } = useClientsQuery();
  const [selectedClientId, setSelectedClientId] = useState('');

  const selectedClient = useMemo(() => {
    if (selectedClientId) {
      return clients.find(c => c._id === selectedClientId) || clients[0];
    }
    return clients[0];
  }, [clients, selectedClientId]);

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-6">
      
      {/* FIL D'ARIANE ET ACTIONS SUPÉRIEURES */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">Profil Client</h1>
            {clients.length > 0 && (
              <select
                value={selectedClientId || (selectedClient?._id || '')}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs px-3 py-1 text-zinc-300 focus:outline-none focus:border-orange-500/50"
              >
                {clients.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.kitId} ({c.clientPhone})
                  </option>
                ))}
              </select>
            )}
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
              Actif
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {selectedClient ? `${selectedClient.kitId} • ${selectedClient.clientPhone}` : 'Aucun client sélectionné'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-1.5 bg-transparent border border-slate-700/80 rounded-lg text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-slate-600"
          >
            Actions <ChevronDown size={14} />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-1.5 bg-orange-600 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5 shadow-[0_4px_20px_rgba(234,88,12,0.4)]"
          >
            Créer une intervention
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 bg-transparent border border-slate-700/80 rounded-lg text-slate-400 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-slate-600"
          >
            <MoreHorizontal size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* ONGLETS DE NAVIGATION */}
      <div className="flex gap-6 mb-6 overflow-x-auto hide-scrollbar border-b border-slate-800/60 pb-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`pb-2 text-xs font-medium whitespace-nowrap transition-colors relative ${
              activeTab === tab ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeCustomerTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </motion.button>
        ))}
      </div>

      {/* GRILLE DE CONTENU PRINCIPALE */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
        {activeTab === 'Kits & Installations' ? (
          <KitsInstallationsTab client={selectedClient} />
        ) : activeTab === 'Historique' ? (
          <ClientHistoryTab client={selectedClient} />
        ) : (
          <>
            {/* LIGNE 1 : DÉTAILS CLIENT, SCORE DE RISQUE, RÉSUMÉ CLIENT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Carte Profil Client (5 cols) */}
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <Card className="p-0 h-full">
              <div className="p-4 flex items-start gap-4 border-b border-slate-800/50">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-slate-800/80 border-2 border-orange-500/30 flex items-center justify-center text-lg font-bold text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                    {selectedClient ? selectedClient.kitId.substring(selectedClient.kitId.lastIndexOf('-') + 1).substring(0,2) : 'JK'}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                      {selectedClient ? selectedClient.kitId : 'Jean Kouassi'}
                    </h2>
                  </div>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      selectedClient?.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></span> Client {selectedClient?.status === 'active' ? 'Actif' : 'Suspendu'}
                  </p>
                  
                  <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                    <p className="flex items-center gap-2 font-mono"><Phone size={12} className="text-orange-500/70" /> {selectedClient ? selectedClient.clientPhone : '+225 07 08 14 12 58'}</p>
                    <p className="flex items-center gap-2"><Mail size={12} className="text-orange-500/70" /> client@djua-energy.cd</p>
                    <p className="flex items-center gap-2"><MapPin size={12} className="text-orange-500/70" /> {selectedClient?.gpsCoordinates ? `Lat: ${selectedClient.gpsCoordinates.latitude.toFixed(4)}, Lon: ${selectedClient.gpsCoordinates.longitude.toFixed(4)}` : 'Yopougon, Abidjan, Côte d\'Ivoire'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-[10px] flex-1">
                <div><span className="text-slate-500 block">Offre Actuelle</span><span className="text-orange-400 font-medium truncate block max-w-[150px]">{selectedClient ? selectedClient.offerName : 'Résidentiel'}</span></div>
                <div><span className="text-slate-500 block">Type de contrat</span><span className="text-slate-200">Pay-As-You-Go</span></div>
                <div><span className="text-slate-500 block">Frais Activation</span><span className="text-slate-200">{selectedClient?.subscriptionFeePaid ? 'Payés' : 'Non payés'}</span></div>
                <div><span className="text-slate-500 block">Géré par</span><span className="text-slate-200">Orange API</span></div>
                <div><span className="text-slate-500 block">Installé le</span><span className="text-slate-300">{selectedClient?.installationDate ? new Date(selectedClient.installationDate).toLocaleDateString('fr-FR') : '12 Mar 2024'}</span></div>
                <div><span className="text-slate-500 block">ID Kit</span><span className="text-slate-300 font-mono">{selectedClient ? selectedClient.kitId : 'C-12987'}</span></div>
              </div>
            </Card>
          </motion.div>

          {/* Carte Score de Risque Client (3 cols) */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <Card title="SCORE DE RISQUE CLIENT" className="h-full">
              <div className="flex flex-col items-center justify-center my-1">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#1e293b" strokeWidth="8" fill="none" />
                    <circle cx="56" cy="56" r="46" stroke="#f97316" strokeWidth="8" fill="none" strokeDasharray="289" strokeDashoffset={289 - (289 * 0.72)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">72<span className="text-[10px] text-slate-500 font-normal">/100</span></span>
                    <span className="text-[9px] text-orange-400 font-medium">Risque Moyen</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] text-orange-400">
                  <TrendingUp size={12} />
                  <span>Tendance du risque : <strong>+12 pts</strong> <span className="text-slate-500">(30 derniers jours)</span></span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[10px]">
                <span className="text-slate-500 block font-medium uppercase text-[9px]">Facteurs de risque clés</span>
                <div className="flex justify-between items-center"><span className="text-slate-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Retards de paiement</span><span className="text-red-400 font-semibold">Élevé</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Faible consommation</span><span className="text-orange-400 font-semibold">Moyen</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Déplacement du kit</span><span className="text-orange-400 font-semibold">Moyen</span></div>
              </div>
            </Card>
          </motion.div>

          {/* Tuiles Résumé Client (4 cols) */}
          <motion.div variants={fadeUp} className="lg:col-span-4">
            <Card title="RÉSUMÉ CLIENT" className="h-full justify-between">
              <div className="grid grid-cols-2 gap-3 h-full">
                
                <motion.div whileHover={{ scale: 1.02 }} className="bg-transparent p-3 rounded-xl border border-slate-800/80 flex items-start gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400">
                    <Box size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Kits</span>
                    <span className="text-lg font-bold text-white">1</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Actif</span>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="bg-transparent p-3 rounded-xl border border-slate-800/80 flex items-start gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Interventions</span>
                    <span className="text-lg font-bold text-white">2</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">12 derniers mois</span>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="bg-transparent p-3 rounded-xl border border-slate-800/80 flex items-start gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Payé</span>
                    <span className="text-sm font-bold text-white">312 500 FCFA</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Total reçu</span>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="bg-transparent p-3 rounded-xl border border-slate-800/80 flex items-start gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Reste à payer</span>
                    <span className="text-sm font-bold text-red-400">18 000 FCFA</span>
                    <span className="text-[9px] text-red-400/80 block mt-0.5">En retard</span>
                  </div>
                </motion.div>

              </div>
            </Card>
          </motion.div>

        </div>

        {/* LIGNE 2 : COMPORTEMENT DE PAIEMENT, CONSOMMATION D'ÉNERGIE, KIT ACTIF, NOTES CLIENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
          
          {/* Comportement de paiement (3 cols) */}
          <motion.div variants={fadeUp} className="xl:col-span-3">
            <Card title="COMPORTEMENT DE PAIEMENT" action="Voir l'historique ->" className="h-full">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-[9px] text-slate-500 block">Ponctualité des paiements</span>
                  <span className="text-xl font-bold text-white">82%</span>
                  <span className="text-[9px] text-emerald-400 ml-1.5 font-medium">Bon</span>
                </div>
                <div className="text-right text-[10px] space-y-0.5">
                  <div className="text-slate-400"><strong className="text-white">9</strong> Paiements à temps</div>
                  <div className="text-slate-400"><strong className="text-orange-400">2</strong> Paiements tardifs</div>
                  <div className="text-slate-400"><strong className="text-red-400">1</strong> Paiement manqué</div>
                </div>
              </div>

              {/* Indicateurs mensuels sous forme de barres */}
              <div className="grid grid-cols-6 gap-1.5 mt-auto pt-3">
                {paymentHistory.map((item, idx) => (
                  <motion.div key={idx} whileHover={{ scale: 1.08 }} className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className={`w-full h-2 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
                      item.status === 'ontime' ? 'bg-emerald-500' :
                      item.status === 'late' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <span className="text-[8px] text-slate-500">{item.month}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 justify-center text-[9px] text-slate-400 mt-3 pt-2 border-t border-slate-800/50">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> À temps</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> En retard</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Manqué</span>
              </div>
            </Card>
          </motion.div>

          {/* Profil de consommation d'énergie (3 cols) */}
          <motion.div variants={fadeUp} className="xl:col-span-3">
            <Card title="PROFIL DE CONSOMMATION D'ÉNERGIE" titleRight="30 derniers jours ▾" action="Analytiques détaillées ->" className="h-full">
              <div className="flex items-baseline justify-between mb-1">
                <div>
                  <span className="text-[9px] text-slate-500 block">Consommation moyenne / jour</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white">1,24 kWh</span>
                    <span className="text-[9px] text-emerald-400 flex items-center">
                      <TrendingUp size={10} className="mr-0.5" /> +12% vs 30 jours précédents
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphique en aire */}
              <div className="h-20 w-full my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <Area type="monotone" dataKey="usage" stroke="#f97316" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[9px] pt-2 border-t border-slate-800/50">
                <div><span className="text-slate-500 block">Régularité</span><span className="text-slate-200 font-medium">70% <span className="text-emerald-400">Bonne</span></span></div>
                <div><span className="text-slate-500 block">Jour le plus bas</span><span className="text-slate-200 font-mono">0,32 kWh</span></div>
                <div><span className="text-slate-500 block">Jour le plus haut</span><span className="text-slate-200 font-mono">2,10 kWh</span></div>
              </div>
            </Card>
          </motion.div>

          {/* Kit Actif (3 cols) */}
          <motion.div variants={fadeUp} className="xl:col-span-3">
            <Card title="KIT ACTIF" action="Détails du kit ->" className="h-full">
              <motion.div whileHover={{ scale: 1.01 }} className="flex items-center gap-3 bg-transparent p-2.5 rounded-xl border border-slate-800/80 mb-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                <div className="w-10 h-12 bg-slate-900/80 rounded flex items-center justify-center flex-shrink-0 border border-slate-800">
                  <Box size={20} className="text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">KIT-K-87391</h4>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> En ligne
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">N° Série : RN87391V22K41</p>
                  <p className="text-[9px] text-slate-500 truncate">Installé le : 12 Fév 2025</p>
                  <p className="text-[9px] text-slate-500 truncate">Emplacement : Yopougon, Niangon Sud</p>
                </div>
              </motion.div>

              <div className="grid grid-cols-3 gap-2 text-center mt-auto">
                <div className="bg-transparent p-2 rounded-lg border border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  <span className="text-[8px] text-slate-500 block">État de santé</span>
                  <span className="text-xs font-bold text-emerald-400">89<span className="text-[8px] text-slate-500">/100</span></span>
                  <span className="text-[8px] text-emerald-400/80 block">Bon</span>
                </div>
                <div className="bg-transparent p-2 rounded-lg border border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  <span className="text-[8px] text-slate-500 block">Niveau Charge (SoC)</span>
                  <span className="text-xs font-bold text-white">42%</span>
                </div>
                <div className="bg-transparent p-2 rounded-lg border border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  <span className="text-[8px] text-slate-500 block">Dernier contact</span>
                  <span className="text-xs font-bold text-white">Il y a 2 min</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notes Client (3 cols) */}
          <motion.div variants={fadeUp} className="xl:col-span-3">
            <Card 
              title="NOTES CLIENT" 
              action="Toutes les notes ->" 
              titleRight={
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium">
                  <Plus size={10} /> Ajouter
                </motion.button>
              } 
              className="h-full"
            >
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[140px] pr-1">
                
                <motion.div whileHover={{ scale: 1.01 }} className="bg-transparent p-2.5 rounded-xl border border-slate-800/80 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-orange-600 text-[8px] text-white font-bold flex items-center justify-center">AK</div>
                      <span className="text-[10px] font-semibold text-slate-200">Alex KOUASSI</span>
                    </div>
                    <span className="text-[8px] text-slate-500">19 Mai 2026, 11:32</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Client informé des astuces d'économie d'énergie, intéressé par une mise à niveau de la batterie.
                  </p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="bg-transparent p-2.5 rounded-xl border border-slate-800/80 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-slate-800 text-[8px] text-slate-300 font-bold flex items-center justify-center border border-slate-700">04</div>
                      <span className="text-[10px] font-semibold text-slate-200">Agent 0451</span>
                    </div>
                    <span className="text-[8px] text-slate-500">02 Mar 2026, 16:15</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Installation terminée avec succès. Client satisfait.
                  </p>
                </motion.div>

              </div>
            </Card>
          </motion.div>

        </div>

        {/* LIGNE 3 : FACTEURS DE RISQUE, CHRONOLOGIE DES INTERACTIONS, RECOMMANDATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-12 gap-5">
          
          {/* Facteurs de risque (4 cols) */}
          <motion.div variants={fadeUp} className="xl:col-span-4">
            <Card title="FACTEURS DE RISQUE" action="Tous les facteurs ->" className="h-full">
              <div className="space-y-3 my-auto">
                {riskFactorsList.map((rf, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-300">{rf.label}</span>
                      <span className={`font-semibold ${rf.textColor}`}>{rf.level}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${rf.value}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className={`h-full ${rf.color}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Chronologie des interactions (4 cols) */}
          <motion.div variants={fadeUp} className="xl:col-span-4">
            <Card title="CHRONOLOGIE DES INTERACTIONS" action="Toutes les interactions ->" className="h-full">
              <div className="relative pl-3 space-y-3 my-auto">
                {/* Ligne verticale de la chronologie */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-800"></div>

                {interactionsList.map((item, idx) => (
                  <motion.div key={idx} whileHover={{ x: 3 }} className="flex gap-3 relative z-10">
                    <div className="w-12 pt-0.5 text-right flex-shrink-0">
                      <span className="text-[8px] text-slate-500 block leading-tight">{item.date}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-orange-500 ring-4 ring-[#030712] mt-1 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-slate-200 truncate">{item.title}</h4>
                        <span className={`text-[8px] px-1.5 py-0.2 rounded font-medium ${item.badgeColor}`}>{item.author}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Recommandations (Propulsé par D3LIA AI) (4 cols) */}
          <motion.div variants={fadeUp} className="xl:col-span-4">
            <Card 
              title="RECOMMANDATIONS" 
              titleRight={
                <span className="text-[9px] text-orange-400 flex items-center gap-1 font-medium">
                  <Sparkles size={10} /> Propulsé par D3LIA AI
                </span>
              } 
              action="Toutes les recommandations ->" 
              className="h-full"
            >
              <div className="space-y-2.5 my-auto">
                
                <motion.div whileHover={{ scale: 1.01 }} className="bg-transparent p-2.5 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="flex items-start gap-2 min-w-0">
                    <Sparkles size={12} className="text-orange-400 mt-0.5 flex-shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-200">Proposer des conseils d'efficacité énergétique</h4>
                      <p className="text-[9px] text-slate-400 leading-tight">Faible consommation détectée. Partager des astuces pour optimiser l'usage.</p>
                    </div>
                  </div>
                  <span className="text-[8px] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium flex-shrink-0">Recommandé</span>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="bg-transparent p-2.5 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="flex items-start gap-2 min-w-0">
                    <Sparkles size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-200">Ajustement du plan de paiement</h4>
                      <p className="text-[9px] text-slate-400 leading-tight">Le client a 2 paiements en retard. Proposer des options de paiement flexibles.</p>
                    </div>
                  </div>
                  <span className="text-[8px] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium flex-shrink-0">Recommandé</span>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="bg-transparent p-2.5 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                  <div className="flex items-start gap-2 min-w-0">
                    <Sparkles size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-200">Promouvoir le surclassement de batterie</h4>
                      <p className="text-[9px] text-slate-400 leading-tight">Selon le profil d'utilisation, le client bénéficierait d'une capacité supérieure.</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </>
    )}
  </motion.div>
</div>
  );
}