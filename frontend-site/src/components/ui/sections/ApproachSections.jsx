import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ClipboardCheck,
  Compass,
  Wrench,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Comprendre vos usages",
    description:
      "Nous échangeons sur votre consommation, vos équipements et les contraintes de votre site.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Concevoir la bonne solution",
    description:
      "Nous définissons une configuration cohérente avec vos priorités, votre autonomie souhaitée et votre budget.",
    icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "Installer et mettre en service",
    description:
      "Les équipements sont installés et configurés pour répondre au fonctionnement prévu de votre système.",
    icon: Wrench,
  },
  {
    number: "04",
    title: "Suivre dans la durée",
    description:
      "Selon votre solution, le suivi vous aide à garder une meilleure visibilité sur votre installation.",
    icon: Activity,
  },
];

export default function ApproachSections() {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? false : { opacity: 0, y: 20 };

  return (
    <section
      id="demarche"
      className="scroll-mt-20 overflow-hidden bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={initial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-12 max-w-3xl text-center sm:mb-16"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 sm:text-sm">
            Une démarche claire, à chaque étape
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Votre projet solaire,{" "}
            <span className="text-slate-400">sans avancer à l’aveugle.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
            De la première conversation au suivi de l’installation, nous faisons
            avancer votre projet avec des choix expliqués et adaptés à votre
            réalité.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, title, description, icon: Icon }, index) => (
            <motion.article
              key={number}
              initial={initial}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: prefersReducedMotion ? 0 : index * 0.08 }}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.07] sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-[0.16em] text-slate-500">
                  {number}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-slate-200 transition-colors group-hover:bg-amber-400 group-hover:text-slate-950">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-7 text-lg font-bold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {description}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={initial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:p-7"
        >
          <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Chaque site est différent. Le bon point de départ, c’est une
            conversation sur vos besoins réels.
          </p>
          <a
            href="#contact"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
          >
            Parlons de votre projet
          </a>
        </motion.div>
      </div>
    </section>
  );
}
