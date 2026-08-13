import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Zap, Activity, ShieldAlert, CheckCircle2, DollarSign, Leaf,
  TrendingUp, TrendingDown, Layers, MapPin, RefreshCw, Sparkles,
  ChevronRight, Download, BarChart2, Users, ArrowUpRight, ArrowDownRight,
  Sliders, Calendar, Info
} from 'lucide-react';

// --- MOCK DATA ---

const topKpis = [
  { title: 'Kits Actifs Totaux', value: '158,742', change: '+2.1%', isPos: true, icon: Zap, color: 'text-blue-400 border-blue-500/30', stroke: '#3b82f6', spark: [12,14,13,15,16,15,18,17,19] },
  { title: 'Énergie Totale Générée', value: '147,510 MWh', change: '+4.8%', isPos: true, icon: Activity, color: 'text-green-400 border-green-500/30', stroke: '#22c55e', spark: [100,110,105,120,125,130,147] },
  { title: 'Incidents Critiques', value: '11', change: '-12.5%', isPos: true, icon: ShieldAlert, color: 'text-orange-400 border-orange-500/30', stroke: '#f97316', spark: [18,16,14,15,12,13,11] },
  { title: 'Interventions Résolues', value: '712', change: '+8.5%', isPos: true, icon: CheckCircle2, color: 'text-purple-400 border-purple-500/30', stroke: '#a855f7', spark: [50,55,62,58,65,70,71.2] },
  { title: 'Revenu Total (FCFA)', value: '312.5M', change: '+5.2%', isPos: true, icon: DollarSign, color: 'text-emerald-400 border-emerald-500/30', stroke: '#10b981', spark: [280,290,285,300,305,312] },
  { title: 'CO2 Économisé', value: '127.4 t', change: '+10.1%', isPos: true, icon: Leaf, color: 'text-cyan-400 border-cyan-500/30', stroke: '#06b6d4', spark: [90,95,102,110,115,127] },
];

const operationalPerformanceData = [
  { time: '01 Aoû', sla: 98, availability: 99, efficiency: 88, maint: 42 },
  { time: '05 Aoû', sla: 97, availability: 98.5, efficiency: 89, maint: 40 },
  { time: '10 Aoû', sla: 98.5, availability: 99.2, efficiency: 87, maint: 43 },
  { time: '15 Aoû', sla: 99, availability: 99, efficiency: 90, maint: 41 },
  { time: '20 Aoû', sla: 98.2, availability: 98.8, efficiency: 89, maint: 44 },
  { time: '25 Aoû', sla: 98.7, availability: 99.4, efficiency: 91, maint: 42 },
];

const gridDistributionData = [
  { name: 'Micro-réseau / Sur réseau', value: 41.2, color: '#3b82f6' },
  { name: 'Autonome hors réseau', value: 22.8, color: '#a855f7' },
  { name: 'Hubs commerciaux intelligents', value: 18.5, color: '#22c55e' },
  { name: 'Hubs communautaires', value: 12.1, color: '#f97316' },
  { name: 'Hybride', value: 5.4, color: '#06b6d4' },
];

const regionPerformance = [
  { name: 'Hub Région Ouest 01', region: 'Abidjan, CIV', avail: '99.4%', load: '78%', eff: '92%', health: '98%', status: 'Nominal' },
  { name: 'Sous-station Centrale 02', region: 'Yamoussoukro, CIV', avail: '98.2%', load: '84%', eff: '89%', health: '91%', status: 'Nominal' },
  { name: 'Hub Région Sud 03', region: 'San Pédro, CIV', avail: '97.8%', load: '65%', eff: '86%', health: '88%', status: 'Avertissement' },
  { name: 'Sous-station Nord 04', region: 'Korhogo, CIV', avail: '99.1%', load: '72%', eff: '94%', health: '96%', status: 'Nominal' },
];

const financialImpact = [
  { metric: 'Revenu Mensuel Total', value: '1.2M $', change: '+12.4%', isUp: true },
  { metric: 'Taux de Recouvrement', value: '94.2%', change: '+1.8%', isUp: true },
  { metric: 'Revenu Moyen par Kit', value: '18,500 FCFA', change: '+3.1%', isUp: true },
  { metric: 'Taux de Désabonnement', value: '1.2%', change: '-0.4%', isUp: true },
];

const aiSystemInsights = [
  { title: 'Maintenance Prédictive', desc: 'Forte charge sur la sous-station 02', status: 'Actionnable', color: 'text-indigo-400 bg-transparent border-indigo-500/30' },
  { title: 'Fidélisation Client', desc: 'Cibler la prévention du désabonnement au Sud', status: 'En attente', color: 'text-yellow-400 bg-transparent border-yellow-500/30' },
  { title: 'Efficacité Énergétique', desc: 'Optimiser le cycle de décharge de la batterie', status: 'En attente', color: 'text-green-400 bg-transparent border-green-500/30' },
  { title: 'Équilibre du Réseau', desc: 'Redirection de l\'excédent solaire prête', status: 'Résolu', color: 'text-purple-400 bg-transparent border-purple-500/30' },
];

// --- REUSABLE COMPONENTS ---

const Card = ({ children, className = "", title, action, titleRight }) => (
  <div className={`bg-transparent border border-slate-800/80 rounded-xl flex flex-col overflow-hidden ${className}`}>
    {(title || action || titleRight) && (
      <div className="px-4 py-3 border-b border-slate-800/50 flex justify-between items-center bg-transparent">
        {title && <h3 className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">{title}</h3>}
        <div className="flex items-center gap-2">
          {titleRight && <span className="text-[10px] text-slate-500">{titleRight}</span>}
          {action && <div className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">{action}</div>}
        </div>
      </div>
    )}
    <div className="p-4 flex-1 flex flex-col">{children}</div>
  </div>
);

const MiniSparkline = ({ data, stroke }) => (
  <div className="h-6 w-16">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.map(v => ({ v }))}>
        <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// --- MAIN OPERATIONS OVERVIEW COMPONENT ---

export default function OperationsOverview() {
  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <div className="min-h-screen bg-transparent text-slate-200 p-4 md:p-6 font-sans space-y-5">
      
      {/* TOP HEADER BAR */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Supervision des Opérations et de la Flotte
          </h1>
          <p className="text-xs text-slate-400">Analytique télémétrique en temps réel, impact financier et performance de santé du réseau</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-300 hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer">
            <Calendar size={14} /> Aoû 2026
          </button>
          <button className="px-3 py-1.5 bg-transparent border border-slate-800 rounded-lg text-xs text-slate-300 hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer">
            <Sliders size={14} /> Filtres
          </button>
          <button className="px-3 py-1.5 bg-[#FF7900] hover:bg-[#e06c00] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,121,0,0.3)]">
            <Download size={14} /> Exporter le Rapport
          </button>
        </div>
      </motion.div>

      {/* TOP 6 KPI METRICS BAR */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {topKpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={idx} variants={fadeUp}>
              <div className="bg-transparent border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-slate-400 font-medium leading-tight truncate pr-1">{kpi.title}</span>
                  <div className={`p-1 rounded bg-transparent border ${kpi.color}`}>
                    <Icon size={14} />
                  </div>
                </div>
                
                <div>
                  <div className="text-base font-bold text-white tracking-tight">{kpi.value}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-green-400 flex items-center font-medium">
                      <TrendingUp size={10} className="mr-0.5" /> {kpi.change} <span className="text-slate-500 font-normal ml-1">vs 30j</span>
                    </span>
                    <MiniSparkline data={kpi.spark} stroke={kpi.stroke} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* MIDDLE SECTION: PERFORMANCE CHART, DONUT CHART, ENERGY IMPACT */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* OPERATIONAL PERFORMANCE CHART (5 cols) */}
        <motion.div variants={fadeUp} className="lg:col-span-5">
          <Card title="PERFORMANCE OPÉRATIONNELLE" titleRight="Aoû 2026 ▾" className="h-full">
            <div className="flex flex-wrap gap-4 text-[10px] mb-3">
              <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-green-500"></span><span className="text-slate-400">Disponibilité Réseau %</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-purple-500"></span><span className="text-slate-400">Maint. Préventive %</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-blue-500"></span><span className="text-slate-400">SLA Respecté %</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-orange-500"></span><span className="text-slate-400">Efficacité %</span></span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={operationalPerformanceData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} domain={[30, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="availability" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="sla" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="efficiency" stroke="#f97316" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="maint" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-[10px] mt-auto">
              <div><span className="text-slate-500 block">SLA Moyen</span><span className="text-white font-bold">98.7% <span className="text-green-400 font-normal">+0.4%</span></span></div>
              <div><span className="text-slate-500 block">MTTR</span><span className="text-white font-bold">2.1 h <span className="text-green-400 font-normal">-12m</span></span></div>
              <div><span className="text-slate-500 block">Résolution 1ère Int.</span><span className="text-white font-bold">91.2% <span className="text-green-400 font-normal">+1.5%</span></span></div>
              <div><span className="text-slate-500 block">Techniciens Actifs</span><span className="text-white font-bold">142 <span className="text-slate-400 font-normal">Actifs</span></span></div>
            </div>
          </Card>
        </motion.div>

        {/* GRID STATUS & DISTRIBUTION DONUT (3 cols) */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card title="ÉTAT ET DISTRIBUTION DU RÉSEAU" className="h-full">
            <div className="relative h-40 flex items-center justify-center my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gridDistributionData} innerRadius={50} outerRadius={68} paddingAngle={4} dataKey="value">
                    {gridDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white leading-none">184</span>
                <span className="text-[9px] text-slate-500">Hubs Totaux</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[10px] mt-auto pt-2 border-t border-slate-800/60">
              {gridDistributionData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </span>
                  <span className="text-slate-200 font-mono font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
            
            <div className="mt-2 text-center">
              <button className="text-[10px] text-[#FF7900] hover:text-[#e06c00] cursor-pointer">Voir la carte topologique -&gt;</button>
            </div>
          </Card>
        </motion.div>

        {/* ENERGY IMPACT (4 cols) */}
        <motion.div variants={fadeUp} className="lg:col-span-4">
          <Card title="IMPACT ÉNERGÉTIQUE" className="h-full justify-between">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-transparent p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-500 block">Énergie Propre</span>
                <span className="text-sm font-bold text-white">2.4 GWh</span>
                <span className="text-[8px] text-green-400 block mt-0.5">+8.2%</span>
              </div>
              <div className="bg-transparent p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-500 block">Comp. CO2</span>
                <span className="text-sm font-bold text-white">127.4 t</span>
                <span className="text-[8px] text-green-400 block mt-0.5">+10.1%</span>
              </div>
              <div className="bg-transparent p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-500 block">Efficacité Réseau</span>
                <span className="text-sm font-bold text-white">89%</span>
                <span className="text-[8px] text-purple-400 block mt-0.5">Optimal</span>
              </div>
            </div>

            <div className="bg-transparent rounded-xl p-3 border border-slate-800/80 flex items-center gap-3">
              <div className="p-2.5 bg-transparent border border-green-500/30 rounded-lg text-green-400 flex-shrink-0">
                <Leaf size={20} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Impact Environnemental</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Équivalent à <strong>12,450 arbres plantés</strong> et <strong>124.4t</strong> d'émissions de CO2 évitées ce mois-ci.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] pt-3 border-t border-slate-800/80 mt-auto">
              <span className="text-slate-500">Indice de Durabilité ESG</span>
              <span className="text-green-400 font-bold bg-transparent border border-green-500/30 px-2 py-0.5 rounded">94.4 / 100</span>
            </div>
          </Card>
        </motion.div>

      </motion.div>

      {/* LOWER SECTION: REGION PERFORMANCE, FINANCIAL IMPACT, AI RECOMMENDATIONS */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        
        {/* SUB-STATION / REGION PERFORMANCE TABLE (5 cols) */}
        <motion.div variants={fadeUp} className="xl:col-span-5">
          <Card title="PERFORMANCE DES SOUS-STATIONS ET RÉGIONS" action="Voir toutes les régions -&gt;" className="h-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[9px] text-slate-500 uppercase">
                    <th className="pb-2 font-semibold">Nom</th>
                    <th className="pb-2 font-semibold">Dispo.</th>
                    <th className="pb-2 font-semibold">Charge</th>
                    <th className="pb-2 font-semibold">Eff.</th>
                    <th className="pb-2 font-semibold text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[10px]">
                  {regionPerformance.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 pr-2">
                        <span className="font-bold text-slate-200 block truncate max-w-[120px]">{row.name}</span>
                        <span className="text-[9px] text-slate-500 block truncate">{row.region}</span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-mono">{row.avail}</td>
                      <td className="py-2.5 text-slate-300 font-mono">{row.load}</td>
                      <td className="py-2.5 text-slate-300 font-mono">{row.eff}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium bg-transparent border ${
                          row.status === 'Nominal' ? 'text-green-400 border-green-500/30' : 'text-orange-400 border-orange-500/30'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* FINANCIAL IMPACT (3 cols) */}
        <motion.div variants={fadeUp} className="xl:col-span-3">
          <Card title="IMPACT FINANCIER" action="Voir le rapport financier -&gt;" className="h-full">
            <div className="space-y-3 my-auto">
              {financialImpact.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-transparent p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[9px] text-slate-500 block">{item.metric}</span>
                    <span className="text-xs font-bold text-white">{item.value}</span>
                  </div>
                  <span className="text-[9px] font-bold text-green-400 bg-transparent border border-green-500/30 px-1.5 py-0.5 rounded">
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* AI SYSTEM RECOMMENDATIONS (4 cols) */}
        <motion.div variants={fadeUp} className="xl:col-span-4">
          <Card 
            title="RECOMMANDATIONS DU SYSTÈME IA" 
            titleRight={<span className="text-[9px] text-[#FF7900] flex items-center gap-1"><Sparkles size={10} /> IA D3LIA</span>}
            action="Voir toutes les recommandations -&gt;" 
            className="h-full"
          >
            <div className="space-y-2.5 my-auto">
              {aiSystemInsights.map((rec, idx) => (
                <div key={idx} className="bg-transparent p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-bold text-slate-200">{rec.title}</h4>
                    <p className="text-[9px] text-slate-400 truncate">{rec.desc}</p>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded font-medium border flex-shrink-0 ${rec.color}`}>
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

      </motion.div>

      {/* BOTTOM BANNER / ACTIONABLE INSIGHT BAR */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="bg-gradient-to-r from-[#1b120a]/40 via-transparent to-transparent border border-[#FF7900]/30 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-transparent border border-[#FF7900]/30 text-[#FF7900] rounded-lg flex-shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                Bannière d'Action des Recommandations IA
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Fort excédent solaire attendu aujourd'hui (+15% vs moy.) dans la région Ouest. Suggère d'activer la précharge du stockage par batterie.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="px-3 py-1.5 bg-transparent border border-slate-700 hover:bg-slate-800/50 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer">
              Voir le Rapport Détaillé
            </button>
            <button className="px-3 py-1.5 bg-[#FF7900] hover:bg-[#e06c00] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,121,0,0.3)]">
              Activer la Précharge Auto
            </button>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}