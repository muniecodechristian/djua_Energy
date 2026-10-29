"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BatteryCharging, Check, Home, Store, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const services = [
  { icon: Home, title: "Solaire résidentiel", text: "Alimentez l’essentiel de votre maison avec un système dimensionné selon vos appareils et vos habitudes." },
  { icon: Store, title: "Solaire professionnel", text: "Sécurisez l’activité de votre commerce, bureau ou entreprise avec une solution adaptée à votre site." },
  { icon: Wrench, title: "Maintenance et dépannage", text: "Faites contrôler votre installation, identifiez les pannes et prolongez la durée de vie de vos équipements." },
];

const included = [
  "Évaluation de vos besoins et de votre site",
  "Choix des panneaux, batteries et onduleur",
  "Installation et vérification du système",
  "Suivi technique après mise en service",
];

export default function ServicesPage() {
  const reducedMotion = useReducedMotion();
  const reveal = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

  return (
    <main className="min-h-screen bg-white text-[#17211e]">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-14 sm:pb-16 sm:pt-20">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-[#ff8a00]">Nos services</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Le solaire, de l’étude à la maintenance.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#59665c]">Une équipe pour vous conseiller, installer les bons équipements et rester disponible après la mise en service.</p>
          <a href="#contact" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#17211e] px-5 text-sm font-bold text-white hover:bg-[#34443a]">Demander une étude <ArrowRight size={16} /></a>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:pb-28">
        <motion.div initial={reducedMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }} className="grid gap-8 md:grid-cols-3">
          {services.map(({ icon: Icon, title, text }, index) => (
            <motion.article key={title} variants={reveal} whileHover={reducedMotion ? undefined : { y: -6 }} transition={{ duration: 0.35 }} className="group border-t border-[#17211e]/20 pt-6">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#879288]">0{index + 1}</span><Icon className="size-6 text-[#ff8a00]" strokeWidth={1.6} /></div>
              <h2 className="mt-9 text-xl font-semibold">{title}</h2>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#657168]">{text}</p>
              <a href="#contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#c96500]">Parler à un conseiller <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></a>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="bg-[#fff8f0] px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <motion.div initial={reducedMotion ? false : { opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.55 }} className="relative min-h-[300px] overflow-hidden rounded-md sm:min-h-[420px]">
            <Image src="/images/solar-array.jpg" alt="Panneaux solaires pour une installation fiable" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </motion.div>
          <motion.div initial={reducedMotion ? false : { opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.55 }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Votre installation</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Un accompagnement clair, à chaque étape.</h2>
            <ul className="mt-7 grid gap-4">
              {included.map(item => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#59665c]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white text-[#ff8a00]"><Check size={13} /></span>{item}</li>)}
            </ul>
            <p className="mt-8 flex items-center gap-2 text-sm font-medium text-[#52604f]"><BatteryCharging size={17} className="text-[#ff8a00]" />Équipements choisis selon votre dimensionnement</p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} className="flex flex-col gap-5 border-b border-[#17211e]/15 pb-9 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Besoin d’un système solaire ?</p><h2 className="mt-3 text-3xl font-semibold">Parlons de votre projet.</h2></div>
          <Link href="/#contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#ff8a00] px-5 text-sm font-bold text-[#17191b] hover:bg-[#ffad45]">Contacter Djua <ArrowRight size={16} /></Link>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
