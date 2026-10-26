"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, HeartPulse, House, Network } from "lucide-react";

const solutions = [
  {
    title: "Maisons & villas",
    description:
      "Gagnez en confort avec une installation solaire et un stockage dimensionnés selon votre quotidien.",
    icon: House,
  },
  {
    title: "Commerces & PME",
    description:
      "Gardez vos équipements, vos espaces de travail et votre activité alimentés avec une solution adaptée.",
    icon: Building2,
  },
  {
    title: "Sites isolés",
    description:
      "Apportez une énergie fiable aux sites éloignés grâce au solaire et aux solutions de stockage.",
    icon: Network,
  },
  {
    title: "Santé & services",
    description:
      "Renforcez la continuité énergétique des cliniques, laboratoires et autres services essentiels.",
    icon: HeartPulse,
  },
];

export default function NosStatistiques() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="solutions" className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
            À chaque besoin, la bonne énergie
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Le solaire qui s’adapte à votre vie.
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Particuliers, entrepreneurs ou responsables de sites : parlons de
            votre réalité et construisons une solution à votre mesure.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {solutions.map(({ title, description, icon: Icon }, index) => (
            <motion.article
              key={title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.4,
                delay: prefersReducedMotion ? 0 : index * 0.06,
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg sm:p-6"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon size={21} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
