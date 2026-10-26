import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Download,
  X,
  QrCode,
  Printer,
  ShieldCheck,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// --- DONNÉES ÉTUDIANTS ---
const studentsData = [
  {
    id: 1,
    name: "Jonathan Mukendi",
    course: "Génie Logiciel",
    country: "RDC",
    guardian: "Maman Vicky",
    email: "jonathan.m@isp.cd",
    status: "Activated",
    date: "11 Mar 2026",
    time: "09:37",
    balance: "1,500.00 $",
    initials: "JM"
  },
  {
    id: 2,
    name: "Alice Meli",
    course: "Réseaux & Télécoms",
    country: "RDC",
    guardian: "Papa Jean",
    email: "alice.barker@isp.cd",
    status: "Pending",
    date: "11 Mar 2026",
    time: "09:37",
    balance: "0.00 $",
    initials: "AM"
  },
  {
    id: 3,
    name: "Sarah Kalombo",
    course: "Design UI/UX",
    country: "Sénégal",
    guardian: "M. Lambert",
    email: "sarah.smith@isp.cd",
    status: "Blocked",
    date: "11 Mar 2026",
    time: "09:37",
    balance: "500.00 $",
    initials: "SK"
  },
  {
    id: 4,
    name: "David Ngalula",
    course: "Cybersécurité",
    country: "France",
    guardian: "Mme Daniels",
    email: "david.d@isp.cd",
    status: "Deactivated",
    date: "11 Mar 2026",
    time: "09:37",
    balance: "0.00 $",
    initials: "DN"
  }
];

// --- VARIANTS ANIMATION ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } 
  }
};

// --- COMPOSANT : CARTE D'ÉLÈVE OFFICIELLE ---
export function StudentCardOfficial({ student }) {
  if (!student) return null;

  return (
    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans relative">
      {/* Texture de fond de sécurité subtile */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* En-tête Institutionnel */}
      <div className="bg-slate-900 text-white p-5 pb-4 flex items-center justify-between border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0 backdrop-blur-md">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-100 leading-tight">
              Carte d'Étudiant
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Institut Supérieur Pédagogique</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] px-2 py-0.5 tracking-wider font-mono font-bold">
          2025 - 2026
        </Badge>
      </div>

      {/* Corps de la carte */}
      <div className="p-5 relative z-10">
        <div className="flex gap-4 items-start">
          {/* Photo / Avatar avec style Pass */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 font-black text-2xl shadow-inner relative overflow-hidden">
              {student.initials}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent" />
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
              ID-{202600 + student.id}
            </span>
          </div>

          {/* Infos personnelles */}
          <div className="flex-1 space-y-2.5 min-w-0">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nom & Prénom</p>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug truncate">
                {student.name}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Filière</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">{student.course}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nationalité</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{student.country}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tuteur</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] truncate">{student.guardian}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Matricule</p>
                <p className="font-mono text-slate-900 dark:text-slate-100 text-[10px] font-bold">ETU-2026-0{student.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de carte avec QR Code */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40 -mx-5 -mb-5 p-3 px-5">
          <div className="flex items-center gap-2.5">
            <QrCode className="h-8 w-8 text-slate-900 dark:text-white p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs" />
            <div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Vérifié & Authentique
              </div>
              <p className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">Scannez pour valider le statut</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">Délivré le</p>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">{student.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function StudentDetails() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Activated':
        return (
          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs shadow-none">
            Actif
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs shadow-none">
            En attente
          </Badge>
        );
      case 'Blocked':
        return (
          <Badge variant="outline" className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs shadow-none">
            Bloqué
          </Badge>
        );
      case 'Deactivated':
        return (
          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold px-2.5 py-0.5 rounded-md text-xs shadow-none">
            Désactivé
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full space-y-6"
    >
      {/* EN-TÊTE PRINCIPAL */}
      <motion.header variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestion des Étudiants
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sélectionnez un étudiant pour générer et vérifier sa carte d'identité académique.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" className="h-9 px-3 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs rounded-xl text-xs font-semibold transition-all">
            <Download className="mr-2 h-3.5 w-3.5 text-slate-400" />
            Exporter
          </Button>
          <Button className="h-9 px-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs rounded-xl text-xs font-bold transition-all">
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvel Étudiant
          </Button>
        </div>
      </motion.header>

      {/* BARRE DE RECHERCHE & FILTRES */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
          <Input 
            type="text" 
            placeholder="Rechercher par nom, filière, email..." 
            className="pl-9 h-9 bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-400 shadow-xs backdrop-blur-md"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl shadow-xs text-xs font-medium">
            <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
            Filtres
          </Button>
        </div>
      </motion.div>

      {/* TABLEAU DES ÉTUDIANTS */}
      <motion.div variants={itemVariants} className="bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3.5 px-5">Étudiant</th>
                <th scope="col" className="py-3.5 px-5">Pays</th>
                <th scope="col" className="py-3.5 px-5">Tuteur</th>
                <th scope="col" className="py-3.5 px-5">Email</th>
                <th scope="col" className="py-3.5 px-5">Statut</th>
                <th scope="col" className="py-3.5 px-5">Inscription</th>
                <th scope="col" className="py-3.5 px-5">Solde</th>
                <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {studentsData.map((student) => (
                <motion.tr 
                  key={student.id} 
                  whileHover={{ backgroundColor: "rgba(148, 163, 184, 0.05)" }}
                  onClick={() => setSelectedStudent(student)}
                  className="cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
                        {student.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{student.course}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {student.country}
                  </td>

                  <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                    {student.guardian}
                  </td>

                  <td className="py-3.5 px-5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {student.email}
                  </td>

                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {getStatusBadge(student.status)}
                  </td>

                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{student.date}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{student.time}</div>
                  </td>

                  <td className="py-3.5 px-5 whitespace-nowrap font-bold text-slate-900 dark:text-white font-mono">
                    {student.balance}
                  </td>

                  <td className="py-3.5 px-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* MODAL ET CARTE ÉLÈVE ANIMÉE */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Flouté */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md"
            />

            {/* Carte animée */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 320 }}
              className="relative z-10 flex flex-col items-center gap-4 max-w-sm w-full"
            >
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute -top-11 right-0 p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
              >
                <X className="h-4 w-4" />
              </button>

              <StudentCardOfficial student={selectedStudent} />

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="flex items-center gap-2.5 w-full"
              >
                <Button 
                  onClick={() => window.print()} 
                  variant="outline" 
                  className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 rounded-xl text-xs font-bold shadow-sm"
                >
                  <Printer className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  Imprimer
                </Button>
                <Button 
                  onClick={() => setSelectedStudent(null)} 
                  className="flex-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white h-9 rounded-xl text-xs font-bold shadow-sm"
                >
                  Fermer
                </Button>
              </motion.div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}