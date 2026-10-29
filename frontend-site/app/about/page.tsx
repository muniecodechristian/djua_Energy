"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sun, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const commitments = [
  { icon: Sun, title: "Étudier avant d’équiper", text: "Nous partons de vos appareils et de votre consommation pour proposer un système adapté." },
  { icon: ShieldCheck, title: "Installer avec soin", text: "Chaque composant est posé et vérifié par notre équipe technique." },
  { icon: Wrench, title: "Rester à vos côtés", text: "Nous assurons le suivi et vous accompagnons pour l’entretien de votre installation." },
];

export default function AboutPage() {
  const reducedMotion = useReducedMotion();
  const reveal = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

  return (
    <main className="min-h-screen bg-white text-[#17211e]">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 pb-5 pt-12 sm:pt-20">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="max-w-3xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-[#ff8a00]">À propos de Djua</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Nous rendons l’énergie solaire plus simple à adopter.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#59665c]">Djua Energy accompagne les foyers et les entreprises en RDC, du premier diagnostic jusqu’au suivi de leur installation.</p>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-16">
        <motion.div initial={reducedMotion ? false : { opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.65 }} className="relative min-h-[300px] overflow-hidden rounded-md sm:min-h-[440px]">
          <Image src="/images/solar-array.jpg" alt="Installation de panneaux solaires" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
        </motion.div>
        <motion.div initial={reducedMotion ? false : { opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.65 }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Notre mission</p>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Une installation adaptée, un accompagnement qui continue.</h2>
          <p className="mt-5 text-sm leading-7 text-[#59665c]">Les besoins d’une maison ne sont pas ceux d’un commerce. Nous prenons le temps de comprendre votre site, vos priorités et les contraintes du réseau pour vous recommander une solution cohérente.</p>
          <p className="mt-4 text-sm leading-7 text-[#59665c]">Notre travail ne s’arrête pas à la pose : nous restons disponibles pour le suivi, le diagnostic et la maintenance.</p>
          <Link href="/services" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#c96500] hover:text-[#8f4700]">Voir nos services <ArrowRight size={16} /></Link>
        </motion.div>
      </section>

      <section className="bg-[#fff8f0] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div initial={reducedMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.p variants={reveal} className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Nos engagements</motion.p>
            <motion.h2 variants={reveal} className="max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">Du premier conseil au service après installation.</motion.h2>
            <div className="mt-10 grid gap-7 md:grid-cols-3">
              {commitments.map(({ icon: Icon, title, text }, index) => (
                <motion.article key={title} variants={reveal} className="border-t border-[#17211e]/20 pt-5">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#879288]">0{index + 1}</span><Icon className="size-5 text-[#ff8a00]" strokeWidth={1.7} /></div>
                  <h3 className="mt-7 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#657168]">{text}</p>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} className="flex flex-col gap-6 border-b border-[#17211e]/15 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Votre projet</p><h2 className="mt-3 text-3xl font-semibold">Parlons de l’énergie dont vous avez besoin.</h2></div>
          <Link href="/#contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#ff8a00] px-5 text-sm font-bold text-[#17191b] hover:bg-[#ffad45]">Contacter Djua <ArrowRight size={16} /></Link>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
