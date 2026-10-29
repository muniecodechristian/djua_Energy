"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BatteryCharging, Check, MapPin, PhoneCall, ShieldCheck, Sun, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const services = [
  {
    number: "01",
    icon: Sun,
    title: "Solaire pour la maison",
    text: "Une installation pensée autour de vos usages quotidiens, de vos pièces et de votre budget.",
  },
  {
    number: "02",
    icon: BatteryCharging,
    title: "Énergie pour les activités",
    text: "Des équipements adaptés aux commerces, bureaux et sites qui ont besoin de rester opérationnels.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Suivi et maintenance",
    text: "Un accompagnement après l’installation pour garder votre système fiable dans la durée.",
  },
];

const steps = [
  ["Échange", "Nous écoutons vos besoins et vos contraintes."],
  ["Étude", "Nous dimensionnons un système adapté à votre site."],
  ["Installation", "Notre équipe installe et vérifie votre équipement."],
];

export default function EnergyHome() {
  const reducedMotion = useReducedMotion();
  const reveal = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
  const revealIn = { hidden: { opacity: 0, x: -32 }, visible: { opacity: 1, x: 0 } };

  return (
    <main className="overflow-hidden bg-white text-[#17211e]">
      <SiteHeader />

      <section className="relative isolate flex min-h-[min(760px,88svh)] items-end overflow-hidden bg-[#17211e] text-white">
        <Image
          src="/images/solar-array.jpg"
          alt="Panneaux solaires installés sous le ciel de la RDC"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#101d18]/90 via-[#101d18]/62 to-[#101d18]/10" />
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-7xl px-6 pb-24 pt-36 sm:pb-32"
        >
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c9e06d]">
            <span className="h-px w-8 bg-[#c9e06d]" /> Énergie solaire · RDC
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] sm:text-7xl">
            Une énergie fiable,
            <span className="block text-[#d9e8a7]">pensée pour votre quotidien.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            Djua vous accompagne de l’étude à l’installation pour alimenter votre maison ou votre activité en toute confiance.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#contact" className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d9e8a7] px-5 text-sm font-bold text-[#17211e] transition-colors hover:bg-white">
              Parlons de votre projet <ArrowRight size={16} />
            </a>
            <a href="#solutions" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/45 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Nos solutions <ArrowDown size={15} />
            </a>
          </div>
        </motion.div>
        <div className="absolute bottom-7 right-6 hidden items-center gap-2 text-xs text-white/75 sm:flex sm:right-10">
          <MapPin size={14} /> Kinshasa et provinces
        </div>
      </section>

      <section className="border-b border-[#17211e]/10 bg-[#f5f7f3]">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-7 text-sm sm:grid-cols-3 sm:py-8">
          {[
            "Étude adaptée à vos usages",
            "Installation par des techniciens",
            "Suivi après mise en service",
          ].map((item, index) => (
            <motion.p
              key={item}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="flex items-center gap-3 font-medium text-[#34443a]"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[#557641]"><Check size={15} /></span>
              {item}
            </motion.p>
          ))}
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <motion.div
          initial={reducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end"
        >
          <motion.div variants={reveal}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6b8249]">Nos solutions</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">
              Le solaire qui répond à vos besoins réels.
            </h2>
          </motion.div>
          <motion.p variants={reveal} className="max-w-xl text-sm leading-6 text-[#58645c] md:justify-self-end">
            Du premier échange au suivi de votre système, nous vous aidons à choisir la bonne installation, sans équipement superflu.
          </motion.p>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {services.map(({ number, icon: Icon, title, text }) => (
            <motion.article
              key={number}
              variants={reveal}
              whileHover={reducedMotion ? undefined : { y: -7 }}
              transition={{ duration: 0.35 }}
              className="group min-h-[245px] border-t border-[#17211e]/20 bg-white py-6 pr-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tabular-nums text-[#8b978c]">{number}</span>
                <Icon className="size-6 text-[#638048] transition-transform duration-300 group-hover:rotate-[-8deg]" strokeWidth={1.6} />
              </div>
              <h3 className="mt-10 text-xl font-semibold">{title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#657168]">{text}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section id="approche" className="bg-[#f3f6f1] px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={revealIn}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6b8249]">Notre expertise</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">
              La bonne installation, sans complication.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#59665c]">
              Nous étudions votre consommation, choisissons les équipements adaptés et prenons en charge l’installation. Vous savez ce qui est prévu et pourquoi.
            </p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#49643b] hover:text-[#263d2b]">
              Découvrir notre approche <ArrowRight size={16} />
            </Link>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Sun, title: "Étude personnalisée", text: "Un système dimensionné selon vos appareils et vos horaires." },
              { icon: ShieldCheck, title: "Matériel sélectionné", text: "Des composants choisis pour leur compatibilité et leur fiabilité." },
              { icon: Wrench, title: "Pose soignée", text: "Une installation vérifiée par notre équipe technique." },
              { icon: BatteryCharging, title: "Accompagnement", text: "Un interlocuteur pour le suivi et la maintenance." },
            ].map(({ icon: Icon, title, text }, index) => (
              <motion.article
                key={title}
                initial={reducedMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="min-h-[170px] rounded-md border border-[#17211e]/8 bg-white p-5"
              >
                <Icon className="size-5 text-[#6b8249]" strokeWidth={1.7} />
                <h3 className="mt-6 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-5 text-[#667168]">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <motion.div initial={reducedMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true }} variants={revealIn}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6b8249]">Votre parcours</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">Simple, du besoin à la mise en service.</h2>
          </motion.div>
          <div className="grid gap-0 sm:grid-cols-3">
            {steps.map(([title, text], index) => (
              <motion.article
                key={title}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.1, duration: 0.45 }}
                className="border-t border-[#17211e]/20 py-5 sm:mr-5"
              >
                <span className="text-xs font-bold text-[#6b8249]">0{index + 1}</span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#657168]">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#17211e] px-6 py-16 text-white sm:py-20">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c9e06d]">Parlons de votre installation</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Faites le premier pas vers une énergie plus stable.</h2>
          </div>
          <a href="#contact" className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-md bg-[#d9e8a7] px-5 text-sm font-bold text-[#17211e] hover:bg-white">
            <PhoneCall size={16} /> Contactez Djua <ArrowRight size={16} />
          </a>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
