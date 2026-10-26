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
    style: "bg-white text-[#0f172a]",
  },
  {
    icon: Palette,
    title: "Branding &\nIdentité visuelle",
    text: "Conception de logos, chartes graphiques et univers visuels qui reflètent authentiquement votre organisation et inspirent confiance.",
    style: "bg-[#fbbf24] text-[#0f172a]",
  },
  {
    icon: Globe2,
    title: "Communication\ndigitale",
    text: "Stratégie réseaux sociaux, création de contenu et présence en ligne adaptées aux publics congolais et africains.",
    style: "bg-[#0f172a] text-white",
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
      <span className="grid size-6 place-items-center rounded-full bg-[#0f172a] text-[#fbbf24] transition-transform group-hover:rotate-45">
        <ArrowUpRight size={14} />
      </span>
    </motion.a>
  );
}

export default function Home() {
  const slides = [
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI",
      title: "L'énergie solaire intelligente.",
      highlight: "Déployée sans friction",
      subtitle: "Supervisée en direct, sans coupure, pour votre entreprise.",
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAyUcQBWcIFaqXrsSLfFbokxuY2IgSQItTtw3UiH0WWL4JCcClVo5fI9vEPaB_QHrXTmiUXDDKotT8QmOwXhObVNjQE_rXXa5KyWrh8R3UPtBq6dmjXtRmGtg5o8G0AQ9MxMUyIK0IF0a6NX8SFn-J96s3kCRMHlJqXNaB-YCw1mrm9zRJehtVVC-GqvHbjI0-csBfaoAjkdNB0Fb85MFvPrW33xiCbzcGn6y0ZVMs64g0XfiGaAxcQaHs9gr6YzlkW258",
      title: "Une installation clé en main.",
      highlight: "De l'étude au déploiement",
      subtitle: "Nos techniciens certifiés vous accompagnent de bout en bout.",
    },
  ];
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <main className="overflow-hidden bg-[#ffffff] text-[#0f172a]">
      <div className="bg-[#fbbf24] px-6 py-2 text-[10px] font-medium text-[#0f172a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>Agence de communication et conseil</span>
          <span className="hidden sm:inline">✉ Techplus643@gmail.com</span>
          <span className="hidden sm:inline">Suivez-nous</span>
        </div>
      </div>
      <SiteHeader />

      <section className="relative min-h-[70vh] overflow-hidden bg-[#0f172a] text-white">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(15,23,42,.92) 0%, rgba(15,23,42,.75) 45%, rgba(15,23,42,.25) 80%), url('${s.image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl flex-col items-start justify-center px-6 py-24">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              {slides[slide].title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                {slides[slide].highlight}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-white/75">
              {slides[slide].subtitle}
            </p>
            <div className="mt-8">
              <a
                href="mailto:Techplus643@gmail.com"
                className="inline-flex items-center justify-center rounded-full bg-[#fbbf24] px-6 py-3 text-sm font-bold text-[#0f172a] transition-transform hover:-translate-y-0.5"
              >
                Nous contacter
              </a>
            </div>
          </motion.div>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${i === slide ? "bg-[#fbbf24]" : "bg-white/40"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        className="border-b border-[#0f172a]/10 bg-white"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {[
            ["Projets accompagnés", 120, "+"],
            ["Villes couvertes", 8, ""],
            ["Taux de satisfaction", 95, "%"],
            ["Années d'expérience", 6, "+"],
          ].map(([label, value, suffix]) => (
            <div key={label} className="text-center sm:text-left">
              <p className="text-3xl font-semibold tracking-tight text-[#f59e0b] sm:text-4xl">
                <CountUp value={value as number} suffix={suffix as string} />
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#0f172a]/55">{label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .6 }} className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">Nos services phares</p>
            <h2 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">Une communication qui crée de la valeur</h2>
          </div>
          <p className="max-w-sm text-xs leading-5 text-[#0f172a]/60">Du conseil en communication au branding en passant par le digital, nous couvrons tous les aspects de votre présence de marque en RDC.</p>
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
                <a href="/about" className="mt-5 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#fff1f2] px-3 py-2 text-[10px] font-semibold text-[#0f172a]">En savoir plus <ArrowUpRight size={13} /></a>
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
              <div className="grid place-items-center rounded-[24px] bg-[#f7d5dc] p-6 text-[#0f172a]">
                <div className="flex items-center justify-center rounded-full border border-[#0f172a]/15 bg-white/40 p-3 text-xl">
                  <CircleCheck className="size-6" />
                </div>
                <div className="mt-4 text-4xl font-semibold">10K+</div>
                <div className="text-[10px] uppercase tracking-[0.18em]">Completed works</div>
              </div>
              <div className="overflow-hidden rounded-[24px] bg-cover bg-center shadow-[0_20px_60px_rgba(87,20,38,0.08)]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI')", minHeight: "180px" }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 35 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .7 }} className="lg:pl-4">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#f59e0b]">Qui sommes-nous ?</p>
            <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#1b1b1b] sm:text-[4.1rem]">Votre partenaire pour l&apos;excellence professionnelle</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#0f172a]/65">Nous aidons les entrepreneurs et organisations congolaises à clarifier leur vision, améliorer leur performance et construire une croissance solide.</p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <AccentButton>À propos de nous</AccentButton>
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-[#f7d5dc] text-[#f59e0b]">
                  <CreativeCommons className="size-4" />
                </span>
                <span className="text-sm">
                  <b className="block">Créativité utile</b>
                  <small className="text-[#0f172a]/50">Des idées originales au service de vos objectifs.</small>
                </span>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] bg-[#f7d5dc] p-5 text-[#0f172a]">
                <div className="text-5xl font-semibold leading-none">4.9</div>
                <div className="mt-2 text-sm font-medium">/ 5.0</div>
                <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#0f172a]/60">Note moyenne</p>
              </div>
              <div className="rounded-[20px] bg-[#fff1f2] p-5 text-[#0f172a]">
                <p className="text-xl font-semibold">Nos expertises</p>
                <p className="mt-4 text-[11px] leading-6 text-[#0f172a]/60">STRATÉGIE — CONSEIL<br />CROISSANCE — FORMATION<br />ORGANISATION</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#fff1f2] px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <motion.div initial={{ opacity: 0, x: -25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .25 }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">Notre expertise</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">La communication qui donne une voix forte à vos idées.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#0f172a]/65">De la stratégie à la production, nous bâtissons une présence de marque cohérente et authentique — adaptée aux réalités congolaises — pour créer de la confiance et générer des opportunités concrètes.</p>
            <a href="/about" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-[#f59e0b]">Découvrir notre approche <ArrowUpRight size={14} /></a>
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
                  <p className="mt-2 text-xs leading-5 text-[#0f172a]/60">{text as string}</p>
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
          <p className="max-w-sm text-xs leading-5 text-[#0f172a]/60">Un processus simple et éprouvé pour transformer vos enjeux de communication en résultats concrets et durables.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Comprendre & Stratégie", "Nous commençons par écouter vos objectifs, analyser votre contexte et élaborer un plan de communication sur mesure adapté à votre réalité."],
            ["02", "Créer & Déployer", "Nous concevons les contenus, supports et actions — visuels, vidéos, posts, campagnes — et les déployons avec rigueur selon le plan établi."],
            ["03", "Mesurer & Améliorer", "Nous suivons les résultats avec des indicateurs clairs, partageons les bilans et ajustons continuellement les actions pour maximiser l'impact."],
          ].map(([number, title, text], index) => (
            <motion.article key={number} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .12 }} className="rounded-xl border border-[#0f172a]/10 bg-white p-7">
              <span className="text-4xl font-semibold text-[#fbbf24]">{number}</span>
              <h3 className="mt-8 text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-xs leading-5 text-[#0f172a]/60">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-6 mb-20 overflow-hidden rounded-2xl bg-[#0f172a] px-6 py-14 text-center text-white sm:px-12">
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
