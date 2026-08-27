import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  Search,
  Wrench,
  Activity,
  UserCheck,
  HardHat,
  Battery,
  BatteryLow,
  AlertCircle,
  Radio,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

// --- DONNÉES MÉTIER ---
const kits = [
  {
    id: "DJUA-KIN-000001",
    place: "Kinshasa · Ngaliema",
    status: "online",
    battery: 82,
    lastPing: "Il y a 4 min",
    issue: "Tension stable — Contrôle périodique",
  },
  {
    id: "DJUA-LUB-000009",
    place: "Lubumbashi · Golf",
    status: "warning",
    battery: 64,
    lastPing: "Il y a 12 min",
    issue: "Chute de rendement mesurée (MPPT)",
  },
  {
    id: "DJUA-GOM-000014",
    place: "Goma · Karisimbi",
    status: "critical",
    battery: 31,
    lastPing: "Il y a 1h",
    issue: "Batterie sous le seuil critique (30%)",
  },
];

const technicians = [
  {
    id: "tech-1",
    name: "Kouassi Yao",
    role: "Ingénieur Systèmes Solaires",
    zone: "Kinshasa",
    initials: "KY",
    available: true,
  },
  {
    id: "tech-2",
    name: "Amina Mukendi",
    role: "Technicienne Terrain Senior",
    zone: "Kinshasa",
    initials: "AM",
    available: true,
  },
  {
    id: "tech-3",
    name: "Patrick Ilunga",
    role: "Spécialiste Haute Tension",
    zone: "Lubumbashi",
    initials: "PI",
    available: false,
  },
];

const reasons = [
  {
    id: "preventive",
    label: "Maintenance préventive",
    detail: "Inspection planifiée, nettoyage et calibration des capteurs",
    icon: Activity,
  },
  {
    id: "corrective",
    label: "Maintenance corrective",
    detail: "Dépannage ciblé suite à une alerte télémétrique",
    icon: Wrench,
  },
  {
    id: "audit",
    label: "Audit & Visite client",
    detail: "Relevé technique sur site et accompagnement de l'usager",
    icon: UserCheck,
  },
  {
    id: "deployment",
    label: "Déploiement / Remplacement",
    detail: "Installation d'un nouveau kit ou changement de composant",
    icon: HardHat,
  },
];

const steps = [
  { title: "Équipement", subtitle: "Sélection du kit" },
  { title: "Diagnostique", subtitle: "Motif d'intervention" },
  { title: "Affectation", subtitle: "Technicien & Date" },
  { title: "Validation", subtitle: "Confirmation" },
];

export default function InterventionWizard() {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [kit, setKit] = useState(kits[0]);
  const [reason, setReason] = useState(reasons[0]);
  const [technician, setTechnician] = useState(technicians[0]);
  const [date, setDate] = useState("2026-08-28");
  const [time, setTime] = useState("09:00");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const filteredKits = useMemo(
    () =>
      kits.filter((item) =>
        `${item.id} ${item.place}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const next = () =>
    step < 4 ? setStep((prev) => prev + 1) : setConfirmed(true);
  const previous = () => setStep((prev) => Math.max(1, prev - 1));

  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-6">
            <Check size={24} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-mono font-medium uppercase text-emerald-400 tracking-wider">
            Ordre de mission émis
          </span>
          <h1 className="mt-1 text-2xl font-bold text-white tracking-tight">
            Intervention enregistrée
          </h1>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Ordre transmis à{" "}
            <strong className="text-zinc-200">{technician.name}</strong> pour
            l'équipement{" "}
            <span className="font-mono text-zinc-200">{kit.id}</span> prévu le{" "}
            <strong className="text-zinc-200">
              {date} à {time}
            </strong>
            .
          </p>

          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-xs font-mono text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>RÉFÉRENCE:</span>
              <span className="text-zinc-200">INT-2026-0882</span>
            </div>
            <div className="flex justify-between">
              <span>STATUT:</span>
              <span className="text-amber-400">
                EN ATTENTE DE CONFIRMATION TERRAIN
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmed(false);
              setStep(1);
            }}
            className="mt-8 w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            Créer un autre ordre de mission
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-200 antialiased selection:bg-orange-500/30 selection:text-white">
      {/* Top Header Section */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Radio size={18} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">
                Gestion des Interventions
              </h1>
              <p className="text-xs text-zinc-400">
                Djua Energy Telemetry & Operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> SYSTEM
            ONLINE
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Stepper Progress */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {steps.map((s, idx) => {
              const num = idx + 1;
              const isDone = num < step;
              const isCurrent = num === step;

              return (
                <li key={s.title} className="relative">
                  <button
                    type="button"
                    onClick={() => num <= step && setStep(num)}
                    disabled={num > step}
                    className={`flex w-full flex-col border-l-2 py-2 pl-4 text-left transition-colors ${
                      isCurrent
                        ? "border-orange-500 bg-orange-500/5"
                        : isDone
                          ? "border-zinc-500 hover:border-zinc-400"
                          : "border-zinc-800 opacity-50"
                    }`}
                  >
                    <span className="text-[11px] font-mono font-medium uppercase text-zinc-500">
                      Étape 0{num}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Main Workspace Layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form Container */}
          <main className="flex min-h-[520px] flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-xl overflow-hidden">
            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* STEP 1: KIT SELECTION */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Sélectionner l'équipement cible
                        </h2>
                        <p className="mt-1 text-xs text-zinc-400">
                          Filtrez les kits solaires par identifiant ou zone
                          géographique.
                        </p>
                      </div>

                      <div className="relative">
                        <Search
                          className="absolute left-3.5 top-3 text-zinc-500"
                          size={16}
                        />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Rechercher ID kit (ex: DJUA-KIN...) ou zone..."
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
                        />
                      </div>

                      <div className="space-y-2">
                        {filteredKits.map((item) => {
                          const isSelected = kit.id === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setKit(item)}
                              className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                isSelected
                                  ? "border-orange-500/80 bg-orange-500/5"
                                  : "border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-sm font-bold text-white">
                                    {item.id}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                                    <MapPin
                                      size={13}
                                      className="text-zinc-500"
                                    />
                                    {item.place}
                                  </span>
                                </div>
                                <span
                                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                                    item.status === "online"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : item.status === "warning"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs">
                                <div className="flex items-center gap-2 text-zinc-400">
                                  {item.battery < 40 ? (
                                    <BatteryLow
                                      size={15}
                                      className="text-rose-400"
                                    />
                                  ) : (
                                    <Battery
                                      size={15}
                                      className="text-emerald-400"
                                    />
                                  )}
                                  <span>
                                    Charge :{" "}
                                    <strong className="text-zinc-200">
                                      {item.battery}%
                                    </strong>
                                  </span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-zinc-500">
                                    {item.issue}
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] text-zinc-500">
                                  {item.lastPing}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: REASON SELECTION */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Motif de l'intervention
                        </h2>
                        <p className="mt-1 text-xs text-zinc-400">
                          Définissez la nature de la mission pour préparer
                          l'outillage adapté.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {reasons.map((item) => {
                          const IconComponent = item.icon;
                          const isSelected = reason.id === item.id;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => setReason(item)}
                              className={`flex flex-col justify-between rounded-lg border p-4 text-left transition-all ${
                                isSelected
                                  ? "border-orange-500/80 bg-orange-500/5"
                                  : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <IconComponent
                                  size={18}
                                  className={
                                    isSelected
                                      ? "text-orange-500"
                                      : "text-zinc-400"
                                  }
                                />
                                {isSelected && (
                                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                                )}
                              </div>
                              <div className="mt-4">
                                <span className="block text-sm font-semibold text-white">
                                  {item.label}
                                </span>
                                <span className="mt-1 block text-xs text-zinc-400 leading-relaxed">
                                  {item.detail}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                          Notes et instructions particulières
                        </label>
                        <textarea
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Relevés télémétriques, instructions d'accès au bâtiment, équipement spécifique à prévoir..."
                          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: TECHNICIAN & TIME */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Affectation du technicien & horaire
                        </h2>
                        <p className="mt-1 text-xs text-zinc-400">
                          Sélectionnez un intervenant disponible et fixez le
                          créneau.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {technicians.map((item) => {
                          const isSelected = technician.id === item.id;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              disabled={!item.available}
                              onClick={() => setTechnician(item)}
                              className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-all ${
                                !item.available
                                  ? "cursor-not-allowed opacity-40 border-zinc-900 bg-zinc-950/20"
                                  : isSelected
                                    ? "border-orange-500/80 bg-orange-500/5"
                                    : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 font-mono text-xs font-bold text-zinc-200">
                                  {item.initials}
                                </div>
                                <div>
                                  <strong className="block text-sm font-medium text-white">
                                    {item.name}
                                  </strong>
                                  <span className="text-xs text-zinc-400">
                                    {item.role} •{" "}
                                    <span className="text-zinc-300">
                                      {item.zone}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`font-mono text-[11px] ${
                                  item.available
                                    ? "text-emerald-400"
                                    : "text-zinc-500"
                                }`}
                              >
                                {item.available ? "DISPONIBLE" : "OCCUPÉ"}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid gap-4 pt-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                            Date d'intervention
                          </label>
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
                            style={{ colorScheme: "dark" }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                            Heure de début
                          </label>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
                            style={{ colorScheme: "dark" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: SUMMARY */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Récapitulatif de l'ordre de mission
                        </h2>
                        <p className="mt-1 text-xs text-zinc-400">
                          Vérifiez les paramètres avant l'émission finale.
                        </p>
                      </div>

                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 font-mono text-xs divide-y divide-zinc-800/80">
                        <div className="flex justify-between p-3.5">
                          <span className="text-zinc-500">EQUIPEMENT_ID</span>
                          <span className="font-bold text-white">{kit.id}</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="text-zinc-500">LOCALISATION</span>
                          <span className="text-zinc-200">{kit.place}</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="text-zinc-500">MOTIF</span>
                          <span className="text-zinc-200">{reason.label}</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="text-zinc-500">INTERVENANT</span>
                          <span className="text-zinc-200">
                            {technician.name} ({technician.role})
                          </span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="text-zinc-500">DATE_PLANIFIEE</span>
                          <span className="text-amber-400">
                            {date} À {time}
                          </span>
                        </div>
                      </div>

                      {note && (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                          <span className="block text-[10px] font-mono font-semibold text-zinc-500 uppercase">
                            Notes attachées
                          </span>
                          <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                            {note}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/80 px-6 py-4">
              <button
                type="button"
                onClick={previous}
                disabled={step === 1}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
              >
                <ChevronLeft size={14} /> Retour
              </button>

              <button
                type="button"
                onClick={next}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  step === 4
                    ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {step === 4 ? "Émettre l'ordre de mission" : "Continuer"}
                {step !== 4 && <ArrowRight size={14} />}
              </button>
            </div>
          </main>

          {/* Side Telemetry Panel */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-zinc-400">
                <SlidersHorizontal size={14} className="text-orange-500" />
                Détails du Kit
              </div>
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-500 block">Identifiant:</span>
                  <span className="font-bold text-white">{kit.id}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Dernière mesure:</span>
                  <span className="text-zinc-300">{kit.issue}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Niveau Batterie:</span>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full ${
                          kit.battery < 40 ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${kit.battery}%` }}
                      />
                    </div>
                    <span className="text-zinc-300">{kit.battery}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 leading-relaxed">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-300 mb-1">
                <AlertCircle size={14} className="text-amber-500" /> Note
                d'exploitation
              </span>
              Toute intervention sur le terrain met à jour automatiquement le
              statut du kit dans le hub IoT de suivi.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
