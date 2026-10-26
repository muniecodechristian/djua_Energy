"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Users, ShieldCheck } from "lucide-react";

export default function HomeSection2() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="expertise" className="relative scroll-mt-20 overflow-hidden bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-10 md:flex-row md:gap-14 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
          className="w-full flex-1 space-y-5 text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
            <ShieldCheck size={14} />
            Votre projet, notre expertise
          </div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Du soleil à vos équipements,{" "}
            <span className="text-amber-600">Djua est à vos côtés.</span>
          </h2>

          {/* Subtitle */}
          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Nous vous accompagnons de l’étude de vos besoins au choix des
            équipements, jusqu’à l’installation et au suivi de votre système
            solaire. Une approche claire, humaine et adaptée à votre budget.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2 md:justify-start">
            {["Étude", "Installation", "Supervision"].map((step) => (
              <span
                key={step}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                {step}
              </span>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9 }}
          className="relative w-full min-w-0 flex-1"
        >
          <div className="relative mx-auto w-full max-w-[440px]">
            <Card className="overflow-hidden rounded-3xl border border-slate-200 p-2 shadow-xl shadow-slate-200/70">
              <img
                src="/brand/djua-hub.png"
                alt="Boîtier solaire Djua Hub"
                loading="lazy"
                className="aspect-video w-full rounded-2xl object-contain"
              />
            </Card>
            <motion.div
              animate={prefersReducedMotion ? false : { y: [0, -10, 0] }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }
              className="absolute -bottom-6 left-2 sm:-left-5 md:-bottom-7 md:-left-7"
            >
              <Card className="border bg-white p-3 shadow-lg sm:p-4">
                <div className="flex items-center gap-3">
                  <Users className="shrink-0 text-slate-700" />
                  <div>
                    <p className="text-sm font-semibold">Une équipe à vos côtés</p>
                    <p className="text-xs text-slate-500">Du premier échange au suivi</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}