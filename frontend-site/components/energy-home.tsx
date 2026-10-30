"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BatteryCharging, Check, Cpu, MapPin, PhoneCall, ShieldCheck, Sun, Wrench } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import solarAnimation from "@/lib/lottie/solar.json";
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

const heroSlides = [
  {
    eyebrow: "Énergie solaire · RDC",
    title: "Une énergie fiable,",
    highlight: "pensée pour votre quotidien.",
    text: "Djua vous accompagne de l’étude à l’installation pour alimenter votre maison ou votre activité en toute confiance.",
  },
  {
    eyebrow: "Maison · Commerce · Entreprise",
    title: "Le courant reste là,",
    highlight: "même quand le réseau s’arrête.",
    text: "Une installation pensée pour vos appareils essentiels, vos horaires et votre budget.",
  },
  {
    eyebrow: "Étude · Installation · Suivi",
    title: "Du premier conseil",
    highlight: "au système qui vous ressemble.",
    text: "Notre équipe vous accompagne pour choisir, installer et suivre votre solution solaire.",
  },
];


export default function EnergyHome() {
  const reducedMotion = useReducedMotion();
  const [activeSlide, setActiveSlide] = useState(0);
  const reveal = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
  const revealIn = { hidden: { opacity: 0, x: -32 }, visible: { opacity: 1, x: 0 } };

  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = window.setInterval(() => setActiveSlide(index => (index + 1) % heroSlides.length), 6800);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);
  const slide = heroSlides[activeSlide];

  return (
    <main className="overflow-hidden bg-white text-[#17211e]">
      <SiteHeader />

      <section className="relative isolate flex min-h-[min(760px,88svh)] items-center justify-center overflow-hidden bg-[#17191b] text-white">
        <Image
          src="/images/solar-array.jpg"
          alt="Panneaux solaires installés sous le ciel de la RDC"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[#15181c]/55" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSlide}
            initial={reducedMotion ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -18, filter: 'blur(6px)' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-28 pt-36 text-center sm:pb-32"
          >
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white/85">
              <span className="h-px w-8 bg-[#ff8a00]" /> {slide.eyebrow} <span className="h-px w-8 bg-[#ff8a00]" />
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] sm:text-7xl">
              {slide.title}<span className="block text-[#ffad45]">{slide.highlight}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{slide.text}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="#contact" className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#ff8a00] px-5 text-sm font-bold text-[#17191b] transition-colors hover:bg-[#ffad45]">
                Parlons de votre projet <ArrowRight size={16} />
              </a>
              <a href="#solutions" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/55 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Nos solutions <ArrowDown size={15} />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2.5" role="group" aria-label="Choisir le message d’accueil">
          {heroSlides.map((item, index) => <button key={item.eyebrow} type="button" onClick={() => setActiveSlide(index)} aria-label={`Afficher le message ${index + 1}`} aria-pressed={activeSlide === index} className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === index ? 'w-10 bg-[#ff8a00]' : 'w-2.5 bg-white/55 hover:bg-white'}`} />)}
        </div>
        <div className="absolute bottom-7 right-6 hidden items-center gap-2 text-xs text-white/80 sm:flex sm:right-10">
          <MapPin size={14} className="text-[#ff8a00]" /> Kinshasa et provinces
        </div>
      </section>

      <section className="border-b border-[#17211e]/10 bg-[#fffaf4]">
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
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[#ff8a00]"><Check size={15} /></span>
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
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Nos solutions</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">
              Le solaire qui répond à vos besoins réels.
            </h2>
          </motion.div>
          <motion.div variants={reveal} className="relative min-h-[170px] overflow-hidden rounded-md md:justify-self-end md:w-full flex items-center justify-center bg-[#17191b]">
            <Lottie animationData={solarAnimation} loop autoplay className="h-full w-full max-h-[220px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#17191b]/65 to-transparent pointer-events-none" />
            <p className="absolute bottom-4 left-4 text-sm font-semibold text-white">Une solution étudiée pour votre site.</p>
          </motion.div>
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
                <Icon className="size-6 text-[#ff8a00] transition-transform duration-300 group-hover:rotate-[-8deg]" strokeWidth={1.6} />
              </div>
              <h3 className="mt-10 text-xl font-semibold">{title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#657168]">{text}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="bg-[#fff8f0] px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-[#17211e]/10 bg-[#0d1311] p-6 shadow-xl sm:min-h-[420px]"
            aria-label="Interface de suivi Djua"
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#ff8a0015 1px, transparent 1px), linear-gradient(90deg, #ff8a0015 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative w-full h-[300px] sm:h-[380px] flex items-center justify-center">
              <Image
                src="/Djua_Pr.png"
                alt="Interface du boîtier connecté Djua"
                fill
                className="object-contain object-center drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-md shadow-lg">
              <span className="size-2 rounded-full bg-[#39a96b] animate-pulse" />
              Suivi de l&apos;installation en direct
            </div>
          </motion.div>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Votre installation, connectée</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">Gardez un œil sur votre énergie.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#59615b]">Le boîtier Djua transmet les données de votre kit pour suivre la production solaire, l’état de la batterie et les alertes techniques depuis la plateforme.</p>
            <Link href="/services" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#c96500] hover:text-[#8f4700]">Découvrir le suivi Djua <ArrowRight size={16} /></Link>
          </motion.div>
        </div>
      </section>

      <section id="approche" className="bg-[#fffaf4] px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={revealIn}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Notre expertise</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">
              La bonne installation, sans complication.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#59665c]">
              Nous étudions votre consommation, choisissons les équipements adaptés et prenons en charge l’installation. Vous savez ce qui est prévu et pourquoi.
            </p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#c96500] hover:text-[#8f4700]">
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
                <Icon className="size-5 text-[#ff8a00]" strokeWidth={1.7} />
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
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Votre parcours</p>
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
                <span className="text-xs font-bold text-[#ff8a00]">0{index + 1}</span>
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
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffad45]">Parlons de votre installation</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Faites le premier pas vers une énergie plus stable.</h2>
          </div>
          <a href="#contact" className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-md bg-[#ff8a00] px-5 text-sm font-bold text-[#17191b] hover:bg-[#ffad45]">
            <PhoneCall size={16} /> Contactez Djua <ArrowRight size={16} />
          </a>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
