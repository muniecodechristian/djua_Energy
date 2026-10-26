"use client";

import {
  ArrowUpRight,
  CircleCheck,
  Megaphone,
  Globe2,
  ShieldCheck,
  Palette,
  Phone,
  CreativeCommons,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PartnersMarquee } from "@/components/partners-marquee";
import { useEffect, useState } from "react";

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const duration = 1400;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value]);

  return (
    <motion.span
      onViewportEnter={() => setStarted(true)}
      viewport={{ once: true }}
    >
      {count}
      {suffix}
    </motion.span>
  );
}

const services = [
  {
    icon: Megaphone,
    title: "Conseil en\ncommunication",
    text: "Nous élaborons votre stratégie de communication : positionnement, messages clés et plan d'action pour une marque forte et cohérente.",
    style: "bg-white text-[#38131b]",
  },
  {
    icon: Palette,
    title: "Branding &\nIdentité visuelle",
    text: "Conception de logos, chartes graphiques et univers visuels qui reflètent authentiquement votre organisation et inspirent confiance.",
    style: "bg-[#fbbf24] text-[#571426]",
  },
  {
    icon: Globe2,
    title: "Communication\ndigitale",
    text: "Stratégie réseaux sociaux, création de contenu et présence en ligne adaptées aux publics congolais et africains.",
    style: "bg-[#571426] text-white",
  },
];

function AccentButton({ children }: { children: ReactNode }) {
  const mailtoHref = `mailto:Techplus643@gmail.com?subject=${encodeURIComponent("Demande de projet")}&body=${encodeURIComponent("Bonjour Techplus,\n\nJe souhaite discuter d'un projet.\n\nMerci de me recontacter.")}`;

  return (
    <motion.a
      href={mailtoHref}
      className="group inline-flex cursor-pointer items-center gap-3 rounded-full bg-[#f59e0b] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
      <span className="grid size-6 place-items-center rounded-full bg-[#571426] text-[#fbbf24] transition-transform group-hover:rotate-45">
        <ArrowUpRight size={14} />
      </span>
    </motion.a>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#fff7f7] text-[#38131b]">
      <div className="bg-[#fbbf24] px-6 py-2 text-[10px] font-medium text-[#571426]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>Agence de communication et conseil</span>
          <span className="hidden sm:inline">✉ Techplus643@gmail.com</span>
          <span className="hidden sm:inline">Suivez-nous</span>
        </div>
      </div>
      <SiteHeader />

      <section className="relative min-h-[650px] bg-[#571426]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(87,20,38,.98) 0%, rgba(87,20,38,.88) 39%, rgba(87,20,38,.15) 75%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI')",
          }}
        />
        <div className="relative z-10 mx-auto flex max-w-7xl items-center px-6 pb-28 pt-24">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .12, delayChildren: .25 } } }} className="max-w-xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px]">
              <span className="text-[#fbbf24]">4,9/5</span> • 5 000 avis clients
            </div>
            <motion.h1 variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .7 }} className="text-5xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-7xl">
              Transformer les idées en marques qui font de l&apos;<span className="text-[#fbbf24]">impact</span>
            </motion.h1>
            <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .6 }} className="mt-6 max-w-md text-sm leading-6 text-white/70">
              Tech+ accompagne les marques, institutions et entrepreneurs congolais avec une communication stratégique, créative et ancrée dans les réalités de la RDC.
            </motion.p>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .6 }} className="mt-8 flex flex-wrap items-center gap-6">
              <AccentButton>Prendre rendez-vous</AccentButton>
              <div className="flex items-center gap-3 text-[10px] text-white/70">
                <span className="grid size-10 place-items-center rounded-full bg-[#d7263d] text-white"><Phone size={16} /></span>
                <span>
                  APPELEZ-NOUS<br />
                  <a href="tel:+243995424606" className="text-white font-bold">0995424606</a>
                  <span className="mx-1">/</span>
                  <a href="tel:+243837807301" className="text-white font-bold">+243 837 807 301</a>
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        className="border-b border-[#571426]/10 bg-white"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {[
            ["Projets accompagnés", 120, "+"],
            ["Villes couvertes", 8, ""],
            ["Taux de satisfaction", 95, "%"],
            ["Années d'expérience", 6, "+"],
          ].map(([label, value, suffix]) => (
            <div key={label} className="text-center sm:text-left">
              <p className="text-3xl font-semibold tracking-tight text-[#d7263d] sm:text-4xl">
                <CountUp value={value as number} suffix={suffix as string} />
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#38131b]/55">{label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .6 }} className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#d7263d]">Nos services phares</p>
            <h2 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">Une communication qui crée de la valeur</h2>
          </div>
          <p className="max-w-sm text-xs leading-5 text-[#38131b]/60">Du conseil en communication au branding en passant par le digital, nous couvrons tous les aspects de votre présence de marque en RDC.</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: .14 } } }} className="grid gap-4 md:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.article key={service.title} variants={{ hidden: { opacity: 0, y: 35 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .6 }} whileHover={{ y: -8 }} className={`group flex min-h-[250px] flex-col justify-between rounded-xl p-7 shadow-sm ${service.style}`}>
                <Icon className="size-8 stroke-[1.3]" />
                <div>
                  <h3 className="whitespace-pre-line text-lg font-medium leading-tight">{service.title}</h3>
                  <p className="mt-3 max-w-xs text-xs leading-5 opacity-60">{service.text}</p>
                </div>
                <a href="/about" className="mt-5 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#fff1f2] px-3 py-2 text-[10px] font-semibold text-[#571426]">En savoir plus <ArrowUpRight size={13} /></a>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <section id="about" className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, x: -35 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .7 }} className="space-y-4">
            <motion.div whileHover={{ scale: 1.02 }} className="overflow-hidden rounded-[28px] bg-cover bg-center shadow-[0_30px_80px_rgba(87,20,38,0.12)]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI')", height: "430px" }} />
            <div className="grid grid-cols-[1fr_1.2fr] gap-4">
              <div className="grid place-items-center rounded-[24px] bg-[#f7d5dc] p-6 text-[#38131b]">
                <div className="flex items-center justify-center rounded-full border border-[#38131b]/15 bg-white/40 p-3 text-xl">
                  <CircleCheck className="size-6" />
                </div>
                <div className="mt-4 text-4xl font-semibold">10K+</div>
                <div className="text-[10px] uppercase tracking-[0.18em]">Completed works</div>
              </div>
              <div className="overflow-hidden rounded-[24px] bg-cover bg-center shadow-[0_20px_60px_rgba(87,20,38,0.08)]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI')", minHeight: "180px" }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 35 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .7 }} className="lg:pl-4">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#d7263d]">Qui sommes-nous ?</p>
            <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#1b1b1b] sm:text-[4.1rem]">Votre partenaire pour l&apos;excellence professionnelle</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#38131b]/65">Nous aidons les entrepreneurs et organisations congolaises à clarifier leur vision, améliorer leur performance et construire une croissance solide.</p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <AccentButton>À propos de nous</AccentButton>
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-[#f7d5dc] text-[#d7263d]">
                  <CreativeCommons className="size-4" />
                </span>
                <span className="text-sm">
                  <b className="block">Créativité utile</b>
                  <small className="text-[#38131b]/50">Des idées originales au service de vos objectifs.</small>
                </span>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] bg-[#f7d5dc] p-5 text-[#38131b]">
                <div className="text-5xl font-semibold leading-none">4.9</div>
                <div className="mt-2 text-sm font-medium">/ 5.0</div>
                <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#38131b]/60">Note moyenne</p>
              </div>
              <div className="rounded-[20px] bg-[#fff1f2] p-5 text-[#38131b]">
                <p className="text-xl font-semibold">Nos expertises</p>
                <p className="mt-4 text-[11px] leading-6 text-[#38131b]/60">STRATÉGIE — CONSEIL<br />CROISSANCE — FORMATION<br />ORGANISATION</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#fff1f2] px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <motion.div initial={{ opacity: 0, x: -25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .25 }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#d7263d]">Notre expertise</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">La communication qui donne une voix forte à vos idées.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#38131b]/65">De la stratégie à la production, nous bâtissons une présence de marque cohérente et authentique — adaptée aux réalités congolaises — pour créer de la confiance et générer des opportunités concrètes.</p>
            <a href="/about" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-[#d7263d]">Découvrir notre approche <ArrowUpRight size={14} /></a>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: .1 } } }} className="grid gap-3 sm:grid-cols-2">
            {[
              [Megaphone, "Conseil en communication", "Stratégie de marque, messages clés et plan de communication sur mesure pour votre organisation."],
              [Globe2, "Communication digitale", "Réseaux sociaux, contenus web et présence numérique pensés pour les publics congolais et africains."],
              [ShieldCheck, "Relations publiques", "Gestion de réputation, relations médias et communication événementielle pour renforcer votre image."],
              [CreativeCommons, "Branding & Identité visuelle", "Logos, chartes graphiques et univers visuels qui incarnent votre marque avec authenticité."],
            ].map(([Icon, title, text]) => {
              const ServiceIcon = Icon as typeof Megaphone;
              return (
                <motion.article key={title as string} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="rounded-xl bg-white p-5">
                  <ServiceIcon className="size-6 text-[#f59e0b]" />
                  <h3 className="mt-5 text-sm font-bold">{title as string}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#38131b]/60">{text as string}</p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section id="insights" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">Notre méthode</p>
            <h2 className="text-3xl font-semibold sm:text-5xl">Du premier échange à l&apos;impact.</h2>
          </div>
          <p className="max-w-sm text-xs leading-5 text-[#38131b]/60">Un processus simple et éprouvé pour transformer vos enjeux de communication en résultats concrets et durables.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Comprendre & Stratégie", "Nous commençons par écouter vos objectifs, analyser votre contexte et élaborer un plan de communication sur mesure adapté à votre réalité."],
            ["02", "Créer & Déployer", "Nous concevons les contenus, supports et actions — visuels, vidéos, posts, campagnes — et les déployons avec rigueur selon le plan établi."],
            ["03", "Mesurer & Améliorer", "Nous suivons les résultats avec des indicateurs clairs, partageons les bilans et ajustons continuellement les actions pour maximiser l'impact."],
          ].map(([number, title, text], index) => (
            <motion.article key={number} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .12 }} className="rounded-xl border border-[#571426]/10 bg-white p-7">
              <span className="text-4xl font-semibold text-[#fbbf24]">{number}</span>
              <h3 className="mt-8 text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-xs leading-5 text-[#38131b]/60">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <PartnersMarquee />

      <section className="mx-6 mb-20 overflow-hidden rounded-2xl bg-[#571426] px-6 py-14 text-center text-white sm:px-12">
        <motion.div initial={{ opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: .6 }} className="mx-auto max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">Parlons de votre projet</p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-5xl">Donnons ensemble une voix forte à votre marque.</h2>
          <p className="mt-4 text-sm text-white/65">Contactez-nous pour un premier échange sans engagement. Kinshasa, RDC — Techplus643@gmail.com</p>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
