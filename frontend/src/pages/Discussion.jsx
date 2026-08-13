import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Search,
  Bell,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  User,
  Clock,
  Terminal,
  Battery,
  Signal,
  Server,
  ArrowRight,
  ChevronDown,
  Phone,
  Circle,
  Sparkles,
  Zap,
  Cpu
} from 'lucide-react';

// --- Données de test ---

const fraudTrendData = [
  { time: '00:00', value: 20 },
  { time: '04:00', value: 25 },
  { time: '08:00', value: 45 },
  { time: '12:00', value: 50 },
  { time: '16:00', value: 70 },
  { time: '20:00', value: 85 },
  { time: 'Maint.', value: 98 },
];

const timelineData = [
  { status: 'En attente de confirmation manuelle', time: 'Maint.', type: 'warning', desc: 'En attente d\'examen par l\'opérateur' },
  { status: 'Action IA exécutée : Suspendre le service', time: '14:23', type: 'ai', desc: 'Le système a verrouillé le hub automatiquement' },
  { status: 'Client contacté par SMS', time: '14:22', type: 'success', desc: 'Alerte automatique envoyée au +225 01...' },
  { status: 'Incident assigné à l\'IA', time: '14:20', type: 'ai', desc: 'Routage vers la résolution automatique' },
  { status: 'Risque de fraude élevé détecté', time: '14:15', type: 'critical', desc: 'Déclenchement initial par détection d\'anomalies' },
];

// --- Sous-composants ---

const Card = ({ children, className = "", title, action, badge }) => (
  <div className={`bg-transparent border border-slate-800/90 hover:border-slate-700/80 transition-all duration-300 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/20 ${className}`}>
    {(title || action || badge) && (
      <div className="px-5 py-3.5 border-b border-slate-800/60 flex justify-between items-center bg-[#161f32]/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {title && <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{title}</h3>}
          {badge && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">{badge}</span>}
        </div>
        {action && <div className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer flex items-center gap-1">{action}</div>}
      </div>
    )}
    <div className="p-5 flex-1 flex flex-col min-w-0">{children}</div>
  </div>
);

const ProgressBar = ({ label, value, colorClass, valueText }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-300 font-medium">{label}</span>
      <span className="font-semibold text-slate-100">{valueText || `${value}%`}</span>
    </div>
    <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/30">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${colorClass}`}
      />
    </div>
  </div>
);

// --- Composant Principal ---

export default function Discussion() {
  const [activeTab, setActiveTab] = useState('VUE D\'ENSEMBLE');
  const tabs = ['VUE D\'ENSEMBLE', 'DÉTAILS', 'CLIENT', 'RÉSEAU', 'INCIDENTS LIÉS', 'ACTIONS'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-6 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* HEADER / NAVIGATION */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6"
      >
        <div className="flex items-center text-sm text-slate-400">
          <span className="hover:text-white transition-colors cursor-pointer">Décisions</span>
          <ChevronRight size={14} className="mx-2 text-slate-600" />
          <span className="text-slate-200 font-medium">Incident #INC-29331</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-transparent border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-orange-500/50 transition-colors w-64 text-slate-200 placeholder-slate-500"
            />
          </div>
          <button className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-4 ring-[#0B0F19]"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800/80 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" alt="Utilisateur" />
            </div>
            <div className="hidden md:block text-xs">
              <p className="font-medium text-white leading-tight">Marcus Doe</p>
              <p className="text-slate-500 leading-tight">Admin Niveau 4</p>
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </div>
        </div>
      </motion.header>

      {/* INCIDENT HEADER */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <ShieldAlert size={14} className="animate-pulse" /> CRITIQUE
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Risque de fraude élevé détecté</h1>
          </div>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            Appareil <span className="text-slate-200 font-semibold bg-slate-800/60 px-2 py-0.5 rounded text-xs">HUB-83331</span> • 
            Créé le 12 Mai 2026, 14:23 WAT • 
            ID : <span className="font-mono text-slate-300">#INC-29331</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg text-sm font-medium text-slate-200 transition-colors">
            Marquer comme résolu
          </button>
          <button className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg text-sm font-medium text-slate-200 transition-colors flex items-center gap-2">
            <User size={16} /> Assigner
          </button>
          <div className="flex shadow-lg shadow-orange-600/20">
            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-l-lg text-sm font-medium text-white transition-colors flex items-center gap-2 border-r border-orange-700">
              <Phone size={16} /> Contacter le client
            </button>
            <button className="px-2 py-2 bg-orange-600 hover:bg-orange-500 rounded-r-lg text-white transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ONGLETS */}
      <div className="border-b border-slate-800/80 mb-6 flex overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold tracking-wider whitespace-nowrap transition-colors relative ${
              activeTab === tab ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* GRILLE DE CONTENU PRINCIPALE */}
      <motion.div 
        variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 xl:grid-cols-12 gap-5"
      >
        
        {/* COLONNE GAUCHE ET CENTRE (9 / 12) */}
        <div className="xl:col-span-9 flex flex-col gap-5">
          
          {/* NIVEAU 1 : CARDS 1, 2, 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* CARTE 1: Détails de l'incident */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Détails de l'incident" badge="Priorité Absolue">
                <div className="flex items-center gap-5 my-2">
                  <div className="relative w-16 h-16 shrink-0 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle cx="30" cy="30" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-orange-500/20" />
                      <circle cx="30" cy="30" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-orange-500" strokeDasharray="163" strokeDashoffset="12" strokeLinecap="round" />
                    </svg>
                    <div className="text-center z-10">
                      <span className="block text-xl font-extrabold text-orange-500 leading-none">98</span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">Risque Critique</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Action immédiate de l'opérateur requise</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs mt-auto pt-4 border-t border-slate-800/60">
                  <div className="bg-transparent p-2.5 rounded-lg border border-slate-800/50">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Service Affecté</span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-200"><Server size={14} className="text-orange-400"/> Hub OS</span>
                  </div>
                  <div className="bg-transparent p-2.5 rounded-lg border border-slate-800/50">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Assigné À</span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-200"><User size={14} className="text-slate-400"/> Non assigné</span>
                  </div>
                  <div className="bg-transparent p-2.5 rounded-lg border border-slate-800/50">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Priorité</span>
                    <span className="text-orange-400 font-bold">P1 - Max</span>
                  </div>
                  <div className="bg-transparent p-2.5 rounded-lg border border-slate-800/50">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ouvert depuis</span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-200"><Clock size={14} className="text-orange-400"/> 14 min</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* CARTE 2: Cause IA */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Cause Profonde (IA)" action={<span className="flex items-center gap-1">Journaux <ArrowRight size={12}/></span>} badge="Confiance à 94%">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs mb-2">
                      <Sparkles size={14} /> Résumé de l'Analyse IA
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-transparent p-3 rounded-lg border border-slate-800/60">
                      Multiples tentatives de contournement physique détectées, suivies de schémas de consommation d'énergie anormaux.
                    </p>
                  </div>

                  <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-3 mt-4">
                    <p className="text-xs text-orange-200/90 flex items-start gap-2 leading-relaxed">
                      <Terminal size={14} className="mt-0.5 shrink-0 text-orange-400" />
                      Corrélation identifiée avec 3 autres hubs dans le secteur 4B sous 48h. Possible falsification coordonnée.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* CARTE 3: Actif affecté */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Actif Affecté" action={<span className="flex items-center gap-1">Gérer <ArrowRight size={12}/></span>}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg border border-slate-600/50 flex items-center justify-center shadow-md relative">
                      <Cpu size={22} className="text-orange-400" />
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">HUB-83331</h4>
                      <p className="text-xs text-slate-400">ID Client : <span className="font-mono text-slate-300">#44321</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> En ligne
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-auto pt-2">
                  <div className="bg-transparent rounded-lg p-2.5 text-center border border-slate-800/60">
                    <span className="block text-emerald-400 font-bold text-sm">44.5</span>
                    <span className="block text-[9px] font-semibold text-slate-500 uppercase">Volts</span>
                  </div>
                  <div className="bg-transparent rounded-lg p-2.5 text-center border border-slate-800/60">
                    <span className="block text-emerald-400 font-bold text-sm">23.1</span>
                    <span className="block text-[9px] font-semibold text-slate-500 uppercase">Ampères</span>
                  </div>
                  <div className="bg-transparent rounded-lg p-2.5 text-center border border-slate-800/60">
                    <span className="block text-orange-400 font-bold text-sm">42°C</span>
                    <span className="block text-[9px] font-semibold text-slate-500 uppercase">Temp</span>
                  </div>
                  <div className="bg-transparent rounded-lg p-2.5 text-center border border-slate-800/60">
                    <span className="block text-emerald-400 font-bold text-sm">89%</span>
                    <span className="block text-[9px] font-semibold text-slate-500 uppercase">Batt</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* NIVEAU 2 : CARDS 4 & 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* CARTE 4: Tendance Fraude */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Tendance de Probabilité de Fraude" action={
                <div className="flex gap-1 bg-transparent p-0.5 rounded-md border border-slate-800">
                  {['1H', '24H', '7J'].map(t => (
                    <button key={t} className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${t==='24H' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              }>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-2xl font-black text-white">98%</span>
                    <span className="text-xs text-orange-400 font-medium ml-2">▲ +28% ces 4 dernières h</span>
                  </div>
                  <span className="text-xs text-slate-400">Pic détecté à <strong className="text-slate-200">20:00</strong></span>
                </div>

                <div className="h-[175px] w-full relative pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fraudTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fb923c', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorValueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* CARTE 5: Profil Risque Client */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Profil de Risque Client" action={<span className="flex items-center gap-1">Voir Profil <ArrowRight size={12}/></span>}>
                <div className="flex flex-col justify-between h-full space-y-3.5 py-1">
                  <ProgressBar label="Probabilité de Vol d'Énergie" value={98} colorClass="bg-orange-500" valueText="Critique (98%)" />
                  <ProgressBar label="Probabilité de Défaut de Paiement" value={85} colorClass="bg-orange-600" valueText="Élevée (85%)" />
                  <ProgressBar label="Évaluation du Statut de Compte" value={60} colorClass="bg-amber-500" valueText="Moyenne (60%)" />
                  <ProgressBar label="Score de Crédit" value={40} colorClass="bg-emerald-500" valueText="Bon (720)" />
                </div>
              </Card>
            </motion.div>

          </div>

          {/* NIVEAU 3 : CARDS SECONDAIRES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Statut Équipement */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Statut de l'Équipement" action="Diagnostics">
                <div className="flex flex-col h-full justify-between space-y-3 py-1">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                    <span className="text-xs text-slate-400 flex items-center gap-2"><ShieldAlert size={14} className="text-orange-400"/> Alerte de Contournement</span>
                    <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">Détecté</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/60 py-2.5">
                    <span className="text-xs text-slate-400 flex items-center gap-2"><Signal size={14} className="text-amber-400"/> Qualité du Signal</span>
                    <span className="text-xs font-semibold text-amber-400">Moyenne (-82 dBm)</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-2"><Battery size={14} className="text-amber-400"/> État de la Batterie</span>
                    <span className="text-xs font-semibold text-amber-400">72% (En dégradation)</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Actions Recommandées IA */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Actions Recommandées par l'IA">
                <div className="flex flex-col h-full justify-between">
                  <p className="text-xs text-slate-300 leading-relaxed bg-transparent p-3 rounded-lg border border-slate-800/60">
                    Suspendre le service immédiatement pour empêcher la consommation non autorisée. Envoyer un agent sur le terrain pour l'inspection des scellés.
                  </p>
                  <button className="w-full mt-3 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2">
                    <Zap size={14} /> Exécuter les Actions <ArrowRight size={14} />
                  </button>
                </div>
              </Card>
            </motion.div>

            {/* Actions Manuelles */}
            <motion.div variants={itemVariants} className="h-full">
              <Card title="Actions Manuelles">
                <div className="space-y-2.5 my-auto">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-emerald-500"><CheckCircle2 size={16} /></div>
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors line-through">Verrouiller le hub à distance</span>
                    <span className="ml-auto text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">AUTO</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-slate-600 group-hover:text-slate-400 transition-colors"><Circle size={16} /></div>
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors">Créer un ticket</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-slate-600 group-hover:text-slate-400 transition-colors"><Circle size={16} /></div>
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors">Envoyer un SMS d'avertissement</span>
                  </label>
                </div>
              </Card>
            </motion.div>

          </div>
        </div>

        {/* COLONNE DROITE : Historique (3 / 12) */}
        <motion.div variants={itemVariants} className="xl:col-span-3">
          <Card title="Historique d'Activité" className="h-full">
            <div className="relative pl-3 mt-2">
              <div className="absolute left-[17px] top-2 bottom-4 w-px bg-slate-800"></div>
              
              <div className="space-y-5 relative">
                {timelineData.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start group">
                    <div className="flex flex-col items-center mt-0.5 relative z-10">
                      {item.type === 'warning' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#0B0F19]"></div>}
                      {item.type === 'ai' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-[#0B0F19]"></div>}
                      {item.type === 'success' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#0B0F19]"></div>}
                      {item.type === 'critical' && <div className="w-2.5 h-2.5 rounded-full bg-orange-600 ring-4 ring-[#0B0F19]"></div>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800 px-1 rounded">{item.time}</span>
                        <h4 className={`text-xs font-semibold truncate ${item.time === 'Maint.' ? 'text-white' : 'text-slate-300'}`}>
                          {item.status}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-auto pt-6 text-center">
              <button className="text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors inline-flex items-center gap-1">
                Voir l'Historique Complet <ArrowRight size={12} />
              </button>
            </div>
          </Card>
        </motion.div>

      </motion.div>
      
      {/* Styles globaux légers pour masquer la scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}