import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BatteryCharging, ClipboardCheck, Sun } from "lucide-react";

const highlights = [
  {
    icon: ClipboardCheck,
    title: "Une étude adaptée",
    description: "Un projet pensé selon vos besoins réels.",
  },
  {
    icon: BatteryCharging,
    title: "Du solaire au stockage",
    description: "Des équipements choisis pour votre usage.",
  },
];

export default function AboutEnergy() {
  const prefersReducedMotion = useReducedMotion();
  const reveal = prefersReducedMotion ? false : { opacity: 0, y: 20 };

  return (
    <section
      id="qui-sommes-nous"
      className="scroll-mt-20 overflow-hidden bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div
          initial={reveal}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="min-w-0"
        >
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 p-3 shadow-xl shadow-slate-200/70 sm:p-5">
            <img
              src="/brand/djua-hub.png"
              alt="Le boîtier Djua Hub au cœur d’une solution énergétique connectée"
              width="1280"
              height="720"
              loading="lazy"
              decoding="async"
              className="aspect-video w-full rounded-[1.2rem] object-contain"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4">
            {highlights.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={reveal}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.4,
                  delay: prefersReducedMotion ? 0 : index * 0.08,
                }}
                className={`min-w-0 rounded-2xl p-4 sm:p-5 ${
                  index === 0
                    ? "bg-slate-100"
                    : "border border-slate-200 bg-white"
                }`}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-bold leading-5 text-slate-900 sm:text-base">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={reveal}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : 0.08 }}
          className="min-w-0 lg:pl-2"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Qui sommes-nous ?
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Votre partenaire pour une énergie plus fiable.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Nous accompagnons les particuliers et les organisations en RDC pour
            concevoir des solutions solaires cohérentes avec leurs usages. De
            l’étude à la mise en service, chaque choix part de votre réalité.
          </p>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <a
              href="#demarche"
              className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
            >
              Découvrir notre démarche
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <p className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Sun size={18} aria-hidden="true" />
              </span>
              Un accompagnement à chaque étape
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-slate-100 p-4 sm:p-5">
              <p className="text-sm font-bold text-slate-900 sm:text-base">
                Nos solutions
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm">
                Résidentiel, professionnel et sites isolés.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-sm font-bold text-slate-900 sm:text-base">
                Notre approche
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm">
                Étude, installation et suivi adapté au projet.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
