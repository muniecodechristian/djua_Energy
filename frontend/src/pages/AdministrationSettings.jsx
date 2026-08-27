import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Sliders, Cpu, Link as LinkIcon, Bell, Shield, Settings, FileText,
  CreditCard, RefreshCw, UserPlus, Download,
  Terminal, ShieldCheck, ChevronRight, Headphones
} from 'lucide-react';

// --- DONNÉES FICTIVES ---
const configCards = [
  { id: 'users', title: 'Utilisateurs & Rôles', desc: 'Gérez les utilisateurs, rôles, permissions et accès.', status: '128 Utilisateurs • 12 Actifs', icon: Users },
  { id: 'grid', title: 'Options de la Grille', desc: 'Configurez les paramètres par défaut de la grille.', status: '6 Domaines • 2 Défauts', icon: Sliders },
  { id: 'ai', title: 'Modèles d\'IA', desc: 'Gérez les modèles d\'IA, les seuils et fréquences.', status: '3 Modèles • 1 Entraînement', icon: Cpu },
  { id: 'integrations', title: 'Intégrations', desc: 'Connectez des systèmes externes et des webhooks.', status: '8 Actives • 2 Inactives', icon: LinkIcon },
  { id: 'alerts', title: 'Alertes', desc: 'Configurez les règles, canaux et escalades.', status: '24 Règles', icon: Bell },
  { id: 'security', title: 'Sécurité', desc: 'SSO, MFA, Gestion de session et liste blanche d\'IP.', status: 'MFA Activé', icon: Shield },
  { id: 'system', title: 'Système', desc: 'Paramètres généraux, localisation et identité visuelle.', status: 'v2.4.1 Production', icon: Settings },
  { id: 'audit', title: 'Journaux d\'Audit', desc: 'Consultez les journaux détaillés et actions d\'administration.', status: '2 410 Événements', icon: FileText },
  { id: 'billing', title: 'Facturation', desc: 'Utilisation, factures, limites et moyens de paiement.', status: 'Plan Entreprise', icon: CreditCard }
];

const healthServices = [
  { name: 'Services API', status: 'Opérationnel', isHealthy: true },
  { name: 'Cluster de Base de données', status: 'Opérationnel', isHealthy: true },
  { name: 'Inférence IA', status: 'Dégradé', isHealthy: false },
  { name: 'Moteur de Télémétrie', status: 'Opérationnel', isHealthy: true },
  { name: 'Webhooks', status: 'Opérationnel', isHealthy: true },
];

const platformUsage = [
  { metric: 'Utilisateurs Actifs', value: '128', change: '+12.4%', isPositive: true },
  { metric: 'Appels API (24h)', value: '542.1K', change: '+5.2%', isPositive: true },
  { metric: 'Ingestion de Données', value: '1.2 TB', change: '-2.1%', isPositive: false },
  { metric: 'Stockage Utilisé', value: '4.8 TB', change: '+3.4%', isPositive: true },
];

const adminActivities = [
  { user: 'Alice Martin', role: 'Admin Système', action: 'Mise à jour des limites SLA', target: 'Défauts Système', time: 'Il y a 10m', status: 'Succès' },
  { user: 'Jean Kouassi', role: 'Opérations', action: 'Changement de rôle', target: 'Spécialiste Terrain', time: 'Il y a 25m', status: 'Succès' },
  { user: 'Système', role: 'Tâche Automatisée', action: 'Sauvegarde programmée', target: 'BDD Principale', time: 'Il y a 1h', status: 'Succès' },
  { user: 'Alex Meli', role: 'Ingénieur IA', action: 'Promotion du modèle', target: 'Modèle v2.4', time: 'Il y a 2h', status: 'Échec' },
];

const quickActionTools = [
  { label: 'Ajouter', icon: UserPlus },
  { label: 'Paramètres', icon: Settings },
  { label: 'Journaux', icon: FileText },
  { label: 'Sécurité', icon: ShieldCheck },
  { label: 'Cache', icon: RefreshCw },
  { label: 'Exporter', icon: Download },
  { label: 'Arrêter', icon: Terminal, danger: true },
];

// --- COMPOSANT CARTE RÉUTILISABLE (TRANSPARENT & ÉPURÉ) ---
const Card = ({ children, className = "", title, action, titleRight }) => (
  <div className={`bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md ${className}`}>
    {(title || action || titleRight) && (
      <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
        {title && <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{title}</h3>}
        <div className="flex items-center gap-3">
          {titleRight && <div className="text-xs text-slate-400">{titleRight}</div>}
          {action && <button className="text-xs font-medium text-[#FF7900] hover:text-[#e06900] transition-colors">{action}</button>}
        </div>
      </div>
    )}
    <div className="p-5 flex-1 flex flex-col">{children}</div>
  </div>
);

// --- COMPOSANT PRINCIPAL ---
export default function ParametresAdministration() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Vue d\'ensemble');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const tabs = ['Vue d\'ensemble', 'Utilisateurs & Rôles', 'Options de la Grille', 'Intégrations', 'Alertes & Notifications', 'Sécurité', 'Journaux d\'Audit', 'Facturation'];

  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

  return (
    <div className="w-full text-slate-200 p-4 md:p-8 font-sans selection:bg-[#FF7900]/30">
      
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* EN-TÊTE */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Administration</h1>
            <p className="text-sm text-slate-400 mt-1">Configurez les paramètres de la plateforme, gérez les utilisateurs et surveillez l'état du système.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/OperationsOverview')} className="px-4 py-2 bg-transparent border border-[#FF7900]/40 hover:border-[#FF7900] hover:bg-[#FF7900]/10 rounded-xl text-sm font-medium text-[#FF7900] transition-all flex items-center gap-2">
              <Terminal size={16} /> Opérations
            </button>
            <button className="px-4 py-2 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl text-sm font-medium text-white transition-all flex items-center gap-2">
              <Download size={16} /> Exporter
            </button>
            <button className="px-4 py-2 bg-[#FF7900] hover:bg-[#e06900] rounded-xl text-sm font-medium text-white transition-all flex items-center gap-2 shadow-sm">
              <UserPlus size={16} /> Ajouter un utilisateur
            </button>
          </div>
        </motion.div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-white/10 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF7900]" />
              )}
            </button>
          ))}
        </div>

        {/* CONTENU PRINCIPAL */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* CONFIGURATION DE LA PLATEFORME */}
            <motion.div variants={fadeUp} className="xl:col-span-7">
              <Card title="Configuration" action="Voir tous les modules →" className="h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 h-full">
                  {configCards.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="bg-transparent p-4 rounded-xl border border-white/10 hover:border-[#FF7900]/50 hover:bg-[#FF7900]/[0.03] transition-all duration-200 flex flex-col justify-between group cursor-pointer">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-[#FF7900] group-hover:bg-[#FF7900]/10 transition-colors">
                              <Icon size={18} strokeWidth={2} />
                            </div>
                            <ChevronRight size={16} className="text-slate-600 group-hover:text-[#FF7900] transition-colors" />
                          </div>
                          <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{item.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1.5 line-clamp-2">{item.desc}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <span className="text-[11px] font-medium text-slate-400">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            {/* ÉTAT DU SYSTÈME & UTILISATION */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              
              {/* ÉTAT DU SYSTÈME */}
              <motion.div variants={fadeUp} className="flex-1">
                <Card title="État du Système" className="h-full">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-full">
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="currentColor" className="text-white/10" strokeWidth="6" fill="none" />
                        <motion.circle 
                          initial={{ strokeDashoffset: 301 }}
                          animate={{ strokeDashoffset: mounted ? 0 : 301 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="56" cy="56" r="48" stroke="currentColor" className="text-emerald-500" strokeWidth="6" fill="none" strokeDasharray="301" strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-semibold text-white">99.9%</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Dispo</span>
                      </div>
                    </div>

                    <div className="space-y-3 w-full">
                      {healthServices.map((srv, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-slate-400 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${srv.isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {srv.name}
                          </span>
                          <span className={`text-xs font-medium ${srv.isHealthy ? 'text-slate-300' : 'text-rose-400'}`}>
                            {srv.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* MÉTRIQUES DE LA PLATEFORME */}
              <motion.div variants={fadeUp}>
                <Card title="Métriques de la Plateforme">
                  <div className="grid grid-cols-2 gap-4">
                    {platformUsage.map((u, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-xs text-slate-500 mb-1">{u.metric}</span>
                        <div className="flex items-end gap-2">
                          <span className="text-lg font-medium text-white">{u.value}</span>
                          <span className={`text-[11px] font-medium mb-0.5 ${u.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {u.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* ACTIVITÉ RÉCENTE */}
            <motion.div variants={fadeUp} className="xl:col-span-8">
              <Card title="Activité Récente" action="Voir tous les journaux →" className="h-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-slate-500">
                        <th className="pb-3 font-medium">Utilisateur & Rôle</th>
                        <th className="pb-3 font-medium">Action Effectuée</th>
                        <th className="pb-3 font-medium">Cible</th>
                        <th className="pb-3 font-medium text-right">Heure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {adminActivities.map((act, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 pr-4">
                            <span className="font-medium text-slate-200 block">{act.user}</span>
                            <span className="text-xs text-slate-500">{act.role}</span>
                          </td>
                          <td className="py-3 text-slate-400">{act.action}</td>
                          <td className="py-3">
                            <span className="text-xs text-slate-400 font-mono">
                              {act.target}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-slate-500">{act.time}</span>
                              <span className={`text-[10px] font-medium ${act.status === 'Succès' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {act.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* OUTILS RAPIDES & SUPPORT */}
            <motion.div variants={fadeUp} className="xl:col-span-4 flex flex-col gap-6">
              <Card title="Outils Rapides" className="flex-1">
                <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-3">
                  {quickActionTools.map((tool, idx) => {
                    const ToolIcon = tool.icon;
                    return (
                      <button
                        key={idx}
                        className={`p-3 bg-transparent border border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 group ${
                          tool.danger ? 'hover:border-rose-500/50 hover:bg-rose-500/10' : 'hover:border-[#FF7900]/50 hover:bg-[#FF7900]/10'
                        }`}
                      >
                        <ToolIcon size={18} className={`${tool.danger ? 'text-rose-400' : 'text-slate-400 group-hover:text-[#FF7900]'} transition-colors`} />
                        <span className={`text-[11px] font-medium w-full text-center truncate ${tool.danger ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {tool.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Bannière de Support */}
              <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors hover:border-white/20">
                <div className="flex items-center gap-4">
                  <div className="text-slate-400">
                    <Headphones size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Besoin d'aide ?</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Contactez l'assistance technique.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors">
                  Contacter
                </button>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}