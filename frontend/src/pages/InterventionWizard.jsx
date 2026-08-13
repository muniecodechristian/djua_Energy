import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Bell, Check, ChevronRight, ChevronLeft, MapPin, ShieldAlert,
  AlertTriangle, Activity, Filter, SlidersHorizontal, Bot, Clock,
  DollarSign, Box, ArrowRight, User, Calendar, CheckCircle2, FileText, Wrench
} from 'lucide-react';

// --- MOCK DATA ---

const smartKitsList = [
  { id: 'KIT-K-87391', sn: 'SN: RN87391V22K41', status: 'En ligne', health: 89, healthLabel: 'Bon', location: 'Abidjan, Côte d\'Ivoire\nYopougon, Niangon Sud', update: 'Il y a 2 min' },
  { id: 'KIT-K-27133', sn: 'SN: RN27133V75K67', status: 'En ligne', health: 76, healthLabel: 'Moyen', location: 'Bamako, Mali\nKoulikoro', update: 'Il y a 5 min' },
  { id: 'KIT-K-55481', sn: 'SN: RN55481V83K42', status: 'En ligne', health: 90, healthLabel: 'Excellent', location: 'Ouagadougou, Burkina Faso\nKossodo', update: 'Il y a 7 min' },
  { id: 'KIT-K-55291', sn: 'SN: RN55291V20K67', status: 'Hors ligne', health: 28, healthLabel: 'Mauvais', location: 'Niamey, Niger\nLamorde', update: 'Il y a 15 min' },
  { id: 'KIT-K-81011', sn: 'SN: RN81011V64K28', status: 'En ligne', health: 58, healthLabel: 'Moyen', location: 'Dakar, Sénégal\nPikine', update: 'Il y a 18 min' },
];

const recentAlarms = [
  { title: 'Risque de fraude élevé détecté', time: '21 Mai 2026, 09:31', severity: 'Critique', color: 'text-red-500 bg-red-500/10 border-red-500/25' },
  { title: 'Profil énergétique anormal', time: '21 Mai 2026, 08:40', severity: 'Élevé', color: 'text-[#FF7900] bg-[#FF7900]/10 border-[#FF7900]/25' },
  { title: 'Température de la batterie élevée', time: '21 Mai 2026, 07:12', severity: 'Moyen', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/25' },
];

const techniciansList = [
  { id: 'TECH-101', name: 'Kouassi Yao', zone: 'Abidjan Nord', load: '2 tâches actives', rating: '4.9', avatar: 'KY' },
  { id: 'TECH-102', name: 'Traoré Ibrahim', zone: 'Abidjan Sud', load: '1 tâche active', rating: '4.8', avatar: 'TI' },
  { id: 'TECH-103', name: 'Diallo Mamadou', zone: 'District Central', load: '3 tâches actives', rating: '4.7', avatar: 'DM' },
];

// --- REUSABLE COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-transparent border border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.24)] ${className}`}>
    {children}
  </div>
);

// --- MAIN WIZARD COMPONENT ---

export default function InterventionWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedKit, setSelectedKit] = useState(smartKitsList[0]);
  const [interventionReason, setInterventionReason] = useState('Maintenance Corrective');
  const [priorityLevel, setPriorityLevel] = useState('Critique');
  const [selectedTech, setSelectedTech] = useState(techniciansList[0]);
  const [scheduledDate, setScheduledDate] = useState('2026-05-22');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('Inspecter les bornes de la batterie et vérifier la configuration de l\'unité de télémétrie.');

  const steps = [
    { number: 1, label: 'Sélectionner le Kit' },
    { number: 2, label: 'Détails de l\'Intervention' },
    { number: 3, label: 'Assigner & Planifier' },
    { number: 4, label: 'Vérifier & Confirmer' }
  ];

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-6 font-sans flex flex-col justify-between">
      
      <div>
        {/* STEPS PROGRESS HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 overflow-x-auto hide-scrollbar"
        >
          <div className="flex items-center gap-6 min-w-max">
            {steps.map((step) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              return (
                <div key={step.number} className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentStep(step.number)}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted ? 'bg-[#FF7900] text-white' :
                    isCurrent ? 'bg-[#FF7900] text-white ring-4 ring-[#FF7900]/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isCompleted ? <Check size={12} /> : step.number}
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-white font-semibold' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {step.number < steps.length && <div className="w-8 h-px bg-slate-800 ml-4 hidden xl:block"></div>}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2">Étape {currentStep} sur 4</span>
            <button 
              onClick={handlePrev} 
              disabled={currentStep === 1}
              className="px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
            >
              <ChevronLeft size={14} /> Retour
            </button>
            <button 
              onClick={handleNext} 
              disabled={currentStep === 4}
              className="px-3 py-1.5 bg-[#FF7900] hover:bg-[#e06b00] rounded-lg text-xs text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm transition-colors"
            >
              {currentStep === 4 ? 'Confirmer & Déployer' : 'Suivant'} <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* MAIN LAYOUT (3 COLUMNS GRID) */}
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          animate="visible" 
          className="grid grid-cols-1 xl:grid-cols-12 gap-5"
        >
          
          {/* ================= STEP 1 VIEW ================= */}
          {currentStep === 1 && (
            <>
              {/* LEFT COLUMN: SELECT SMART KIT (Span 4) */}
              <motion.div variants={fadeUp} className="xl:col-span-4 flex flex-col gap-4">
                <Card className="p-4 flex-1">
                  <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-3">Sélectionner le Smart Kit</h3>
                  
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="text" 
                        placeholder="Rechercher un kit par SN, modèle ou client..." 
                        className="w-full bg-transparent border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FF7900]/50 shadow-inner"
                      />
                    </div>
                    <button className="px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-slate-400 hover:text-white flex items-center gap-1 text-xs shadow-sm">
                      <Filter size={12} /> Filtres
                    </button>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                    {smartKitsList.map((kit) => {
                      const isSelected = selectedKit.id === kit.id;
                      return (
                        <div 
                          key={kit.id}
                          onClick={() => setSelectedKit(kit)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                            isSelected ? 'bg-[#FF7900]/10 border-[#FF7900]/50' : 'bg-transparent border-slate-800/80 hover:bg-slate-800/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-10 bg-slate-800/50 rounded flex-shrink-0 flex items-center justify-center border border-slate-800">
                              <Box size={16} className="text-slate-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-white truncate">{kit.id}</h4>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full flex items-center gap-1 border ${
                                  kit.status === 'En ligne' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${kit.status === 'En ligne' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  {kit.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{kit.sn}</p>
                              <p className="text-[10px] text-slate-500 truncate">{kit.location.split('\n')[0]}</p>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="flex items-center gap-1 justify-end">
                              <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold flex items-center justify-center border border-green-500/30">
                                {kit.health}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 block mt-1">{kit.update}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500">
                    <span>Affichage de 1 à 5 sur 158 742 kits</span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:text-white disabled:opacity-30"><ChevronLeft size={14}/></button>
                      <button className="w-5 h-5 rounded bg-[#FF7900] text-white flex items-center justify-center text-[10px]">1</button>
                      <button className="w-5 h-5 rounded hover:bg-slate-800/50 flex items-center justify-center text-[10px]">2</button>
                      <button className="w-5 h-5 rounded hover:bg-slate-800/50 flex items-center justify-center text-[10px]">3</button>
                      <span>...</span>
                      <button className="w-5 h-5 rounded hover:bg-slate-800/50 flex items-center justify-center text-[10px]">31740</button>
                      <button className="p-1 hover:text-white"><ChevronRight size={14}/></button>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* CENTER COLUMN: SELECTED KIT OVERVIEW & RECENT ALARMS (Span 5) */}
              <motion.div variants={fadeUp} className="xl:col-span-5 flex flex-col gap-4">
                <Card className="p-4">
                  <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-3">Aperçu du Kit Sélectionné</h3>
                  
                  <div className="flex items-center justify-between bg-transparent rounded-xl p-3 border border-slate-800/80 mb-3 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gradient-to-br from-slate-200 to-slate-400 rounded flex items-center justify-center shadow relative">
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF7900] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{selectedKit.id}</h4>
                          <span className="text-[10px] text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {selectedKit.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{selectedKit.sn} • Modèle: D3LIA-RK-2.1</p>
                        <p className="text-[10px] text-slate-400">Client: ID-12397 • Installé le: 12 Fév 2026</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="bg-transparent border border-slate-800 rounded-lg p-2 text-center min-w-[50px] shadow-sm">
                        <span className="text-xs font-bold text-green-400 block">{selectedKit.health}<span className="text-[9px] text-slate-500">/100</span></span>
                        <span className="text-[8px] text-slate-500 uppercase">{selectedKit.healthLabel}</span>
                      </div>
                      <div className="bg-transparent border border-slate-800 rounded-lg p-2 text-center min-w-[50px] shadow-sm">
                        <span className="text-xs font-bold text-white block">42%</span>
                        <span className="text-[8px] text-slate-500 uppercase">Soc</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-32 bg-transparent rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-ping absolute"></div>
                      <MapPin size={16} className="text-green-500 fill-green-500" />
                      <span className="text-[10px] text-slate-200 bg-transparent px-1.5 py-0.5 rounded border border-slate-800 mt-1 shadow-sm">Yopougon</span>
                    </div>
                    <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-transparent px-2 py-0.5 rounded border border-slate-800 shadow-sm">
                      {selectedKit.location.replace('\n', ' • ')}
                    </div>
                    <div className="absolute top-2 right-2 text-[10px] text-[#FF7900] hover:text-[#ff9433] cursor-pointer bg-transparent px-2 py-0.5 rounded border border-slate-800 shadow-sm">
                      Voir sur la carte
                    </div>
                  </div>
                </Card>

                <Card className="p-4 flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase">Alarmes Récentes</h3>
                    <span className="text-[10px] text-[#FF7900] hover:text-[#ff9433] cursor-pointer">Voir toutes les alarmes -&gt;</span>
                  </div>
                  <div className="space-y-2.5">
                    {recentAlarms.map((alarm, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-transparent p-2.5 rounded-xl border border-slate-800/80 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert size={14} className={alarm.color.split(' ')[0]} />
                          <div>
                            <h4 className="text-xs font-medium text-slate-200">{alarm.title}</h4>
                            <p className="text-[10px] text-slate-500">{alarm.time}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${alarm.color}`}>
                          {alarm.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* RIGHT COLUMN: REASON, AI RECOMMENDATION, PRIORITY, ESTIMATES (Span 3) */}
              <motion.div variants={fadeUp} className="xl:col-span-3 flex flex-col gap-4">
                <Card className="p-4">
                  <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-3">Motif de l'Intervention</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: 'Maintenance Corrective', desc: 'Problème de fraude' },
                      { title: 'Maintenance Préventive', desc: 'Vérification planifiée' },
                      { title: 'Installation', desc: 'Installation de nouveau kit' },
                      { title: 'Mise à niveau', desc: 'Mise à niveau Matériel/Logiciel' },
                      { title: 'Inspection', desc: 'Inspection sur site' },
                      { title: 'Autre', desc: 'Motif personnalisé' },
                    ].map((reason, i) => {
                      const isSelected = interventionReason === reason.title;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setInterventionReason(reason.title)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all shadow-sm ${
                            isSelected ? 'bg-[#FF7900]/10 border-[#FF7900]/50 text-white' : 'bg-transparent border-slate-800/80 text-slate-400 hover:bg-slate-800/20'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#FF7900] bg-[#FF7900]' : 'border-slate-600'}`}>
                              {isSelected && <div className="w-1 h-1 rounded-full bg-white"></div>}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-200">{reason.title}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 pl-4">{reason.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <div className="bg-transparent border border-[#FF7900]/30 rounded-xl p-4 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.24)]">
                  <div className="absolute top-2 right-2 text-[9px] font-bold text-[#FF7900] bg-[#FF7900]/20 px-2 py-0.5 rounded border border-[#FF7900]/30 shadow-sm">
                    Recommandé
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={16} className="text-[#FF7900]" />
                    <h3 className="text-xs font-semibold text-[#FF7900] uppercase tracking-widest">Recommandation IA</h3>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-2">
                    Notre IA recommande une intervention de <strong className="text-white">maintenance préventive</strong>.
                  </p>
                  <div className="text-[10px] text-slate-400 space-y-1 mb-3">
                    <p>• Score de risque de fraude élevé (98)</p>
                    <p>• Profil de consommation d'énergie anormal détecté</p>
                    <p>• Efficacité de la batterie signalée</p>
                    <p>• Problèmes similaires résolus sur 23 kits dans cette zone</p>
                  </div>
                </div>

                <Card className="p-4">
                  <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-3">Niveau de Priorité</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Critique', time: 'Correspond directement', color: 'border-red-500/50 bg-red-500/10 text-red-400' },
                      { label: 'Élevé', time: 'Sous 24h', color: 'border-slate-800 bg-transparent text-slate-400' },
                      { label: 'Moyen', time: 'Sous 72h', color: 'border-slate-800 bg-transparent text-slate-400' },
                      { label: 'Faible', time: 'Standard', color: 'border-slate-800 bg-transparent text-slate-400' },
                    ].map((p, i) => {
                      const isSelected = priorityLevel === p.label;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setPriorityLevel(p.label)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all shadow-sm ${
                            isSelected ? 'border-[#FF7900]/50 bg-[#FF7900]/10' : 'border-slate-800 bg-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#FF7900] bg-[#FF7900]' : 'border-slate-600'}`}>
                              {isSelected && <div className="w-1 h-1 rounded-full bg-white"></div>}
                            </div>
                            <span className="text-[11px] font-bold text-slate-200">{p.label}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 pl-4 block">{p.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="mb-3">
                    <label className="text-[10px] text-slate-400 block uppercase mb-1">Urgence</label>
                    <select className="w-full bg-transparent border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none shadow-inner focus:border-[#FF7900]/50">
                      <option className="bg-slate-900">Dès que possible</option>
                      <option className="bg-slate-900">Créneau planifié</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-transparent border border-slate-800 text-[#FF7900] shadow-sm">
                        <Clock size={16} />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Durée Estimée</span>
                        <span className="text-xs font-bold text-white">2h 30m</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-transparent border border-slate-800 text-green-400 shadow-sm">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Coût Estimé</span>
                        <span className="text-xs font-bold text-white">25 000 FCFA</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </>
          )}

          {/* ================= STEP 2 VIEW ================= */}
          {currentStep === 2 && (
            <motion.div variants={fadeUp} className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="p-5 md:col-span-2">
                <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-4">Configuration Détaillée des Tâches d'Intervention</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Portée de l'Intervention & Liste de Contrôle</label>
                    <div className="space-y-2 bg-transparent p-3 rounded-xl border border-slate-800 shadow-inner">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-[#FF7900] focus:ring-0" />
                        Vérifier la sécurité du boîtier physique et les scellés de sécurité
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-[#FF7900] focus:ring-0" />
                        Vérifier le câblage des panneaux solaires et la stabilité des connexions
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-[#FF7900] focus:ring-0" />
                        Exécuter un test de charge diagnostic de la batterie
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-[#FF7900] focus:ring-0" />
                        Mettre à jour le firmware vers la version v2.4.1 si nécessaire
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Notes / Instructions de Diagnostic Supplémentaires</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4} 
                      className="w-full bg-transparent border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-[#FF7900]/50 shadow-inner"
                      placeholder="Ajouter des instructions spécifiques pour le technicien terrain..."
                    ></textarea>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-4">Résumé de la Sélection</h3>
                <div className="space-y-3 text-xs text-slate-300 bg-transparent p-4 rounded-xl border border-slate-800 shadow-inner">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-500">ID du Kit :</span>
                    <span className="font-bold text-white">{selectedKit.id}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-500">Motif :</span>
                    <span className="font-semibold text-[#FF7900]">{interventionReason}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-500">Priorité :</span>
                    <span className="font-semibold text-[#FF7900]">{priorityLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emplacement :</span>
                    <span className="text-right text-slate-200">{selectedKit.location.split('\n')[0]}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ================= STEP 3 VIEW ================= */}
          {currentStep === 3 && (
            <motion.div variants={fadeUp} className="xl:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-5">
                <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-4">Assigner un Technicien Terrain</h3>
                <div className="space-y-3">
                  {techniciansList.map((tech) => {
                    const isSelected = selectedTech.id === tech.id;
                    return (
                      <div 
                        key={tech.id}
                        onClick={() => setSelectedTech(tech)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                          isSelected ? 'bg-[#FF7900]/10 border-[#FF7900]/50' : 'bg-transparent border-slate-800 hover:bg-slate-800/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center font-bold text-xs text-[#FF7900]">
                            {tech.avatar}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{tech.name}</h4>
                            <p className="text-[10px] text-slate-400">{tech.zone} • {tech.load}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-400">★ {tech.rating}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Évaluation</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase mb-4">Planifier la Date & l'Heure</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Date de l'Intervention</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="date" 
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-transparent border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF7900]/50 shadow-inner"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Heure de l'Intervention</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="time" 
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-transparent border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF7900]/50 shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ================= STEP 4 VIEW ================= */}
          {currentStep === 4 && (
            <motion.div variants={fadeUp} className="xl:col-span-12 flex justify-center">
              <Card className="p-8 w-full max-w-2xl text-center border-[#FF7900]/30">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-white mb-2">Résumé de la Demande</h2>
                <p className="text-sm text-slate-400 mb-6">L'intervention a bien été configurée et est prête à être déployée.</p>
                <div className="grid grid-cols-2 gap-4 text-left bg-transparent p-4 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Technicien Assigné</p>
                    <p className="text-sm font-semibold text-slate-200">{selectedTech.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date d'Intervention</p>
                    <p className="text-sm font-semibold text-slate-200">{scheduledDate} à {scheduledTime}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}