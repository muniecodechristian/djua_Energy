import React from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  MoreHorizontal,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// --- VARIANTS FRAMER MOTION ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] } 
  }
};

// --- DONNÉES MOCKÉES ---
const ordersData = [
  { profile: "Priss", address: "London", date: "22.08.2022", status: "Delivered", price: "$620", avatar: "P" },
  { profile: "Marina", address: "Man city", date: "24.08.2022", status: "Processed", price: "$412", avatar: "M" },
  { profile: "Alex", address: "Unknown", date: "19.08.2022", status: "Cancelled", price: "$1,200", avatar: "A" },
  { profile: "Robert", address: "New York", date: "03.08.2022", status: "Delivered", price: "$1,235", avatar: "R" },
];

const salesData = [40, 60, 30, 80, 50, 70, 90, 40, 60, 100, 80, 50];

// --- COMPOSANT METRIC CARD ANIME ---
const MetricCard = ({ title, value, icon: Icon, trendValue, isPositive }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
    <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
          </div>
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-slate-700 dark:text-slate-200">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center text-xs font-medium">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
            isPositive 
              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' 
              : 'text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {trendValue}
          </span>
          <span className="text-slate-400 dark:text-slate-500 ml-2">depuis le mois dernier</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Dashboard() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full space-y-6"
    >
      {/* HEADER LOCAL DU DASHBOARD */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Vue d'ensemble</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Performances et activités clés en temps réel</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-3.5 py-1.5 rounded-xl shadow-xs text-xs font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>01.08.2022 - 31.08.2022</span>
        </div>
      </motion.div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* LIGNE 1 : TOP METRICS */}
        <MetricCard title="Commandes" value="201" icon={Package} trendValue="+0.2%" isPositive={true} />
        <MetricCard title="Approuvées" value="36" icon={MoreHorizontal} trendValue="+2.4%" isPositive={true} />
        <MetricCard title="Total Mensuel" value="$25,410" icon={DollarSign} trendValue="-0.2%" isPositive={false} />
        <MetricCard title="Revenus" value="$1,352" icon={CreditCard} trendValue="-1.2%" isPositive={false} />

        {/* LIGNE 2 : DEUX PETITES STATS + BAR CHART */}
        <motion.div variants={itemVariants} whileHover={{ y: -2 }} className="lg:col-span-1">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Utilisateurs</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">4,890</h3>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-400 rounded-full"></div>62% Nouveaux</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-800 dark:bg-slate-200 rounded-full"></div>26% Récurrents</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-300 dark:bg-slate-700 rounded-full"></div>12% Inactifs</div>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-r-slate-800 dark:border-r-slate-200 border-t-slate-300 dark:border-t-slate-700 shrink-0"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -2 }} className="lg:col-span-1">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Abonnements</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">1,201</h3>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>70% Payants</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-800 dark:bg-slate-300 rounded-full"></div>30% Essais</div>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-l-slate-800 dark:border-l-slate-300 shrink-0"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* BAR CHART AVEC ANIMATION DES BARRES */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 border-b border-slate-100 dark:border-slate-800/50">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Dynamique des ventes</CardTitle>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">2022</span>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-40 flex items-end justify-between gap-1.5">
                {salesData.map((h, i) => (
                  <div key={i} className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-lg h-full flex items-end overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                      className="w-full bg-slate-900 dark:bg-slate-100 rounded-t-lg hover:bg-blue-600 dark:hover:bg-blue-400 transition-colors"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-3 px-1">
                <span>JAN</span><span>FEV</span><span>MAR</span><span>AVR</span><span>MAI</span><span>JUN</span><span>JUL</span><span>AOU</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* LIGNE 3 : CARTE FINANCIÈRES + LIVRAISONS & ACTIVITÉ */}
        <motion.div variants={itemVariants} whileHover={{ y: -2 }} className="lg:col-span-1">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl">
            <CardContent className="p-5 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-700 dark:text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  +15%
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Factures Payées</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">$30,256.23</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -2 }} className="lg:col-span-1">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl">
            <CardContent className="p-5 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  +59%
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fonds Reçus</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">$150,256.23</h3>
            </CardContent>
          </Card>
        </motion.div>

        {/* LINE CHART ACTIVITÉ */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-0 p-5">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" /> Activité Générale
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 h-28 relative overflow-hidden">
              <svg className="w-full h-full stroke-amber-500 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  d="M0,80 Q15,40 35,70 T65,30 T100,20" 
                  fill="none" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* TABLEAU DES COMMANDES RECENTES */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/50">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Commandes Récentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 dark:border-slate-800/60 hover:bg-transparent">
                    <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider pl-5">Profil</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Ville</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Statut</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-right pr-5">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.map((order, i) => (
                    <motion.tr 
                      key={i}
                      whileHover={{ backgroundColor: "rgba(148, 163, 184, 0.05)" }}
                      className="border-b border-slate-100/60 dark:border-slate-800/40 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700">
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold">
                              {order.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{order.profile}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-500 dark:text-slate-400 py-3.5">{order.address}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-500 dark:text-slate-400 py-3.5">{order.date}</TableCell>
                      <TableCell className="py-3.5">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] font-semibold border-none px-2 py-0.5 rounded-md ${
                            order.status === 'Delivered' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            order.status === 'Cancelled' ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400' :
                            'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-white text-right py-3.5 pr-5">{order.price}</TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}