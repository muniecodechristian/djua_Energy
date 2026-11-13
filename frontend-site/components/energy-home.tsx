"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BatteryCharging, Bell, MapPin, PhoneCall, ShieldCheck, Sun, Wrench } from "lucide-react";
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

const teamMembers = [
  { name: "Carmel Kongolo", role: "Porteur du projet", initials: "CK", tone: "bg-[#f5dfc4] text-[#7b3d19]", image: null },
  { name: "Christian Munie", role: "Développeur full-stack", initials: "CM", tone: "bg-[#dce9df] text-[#27553b]", image: "/images/christian-munie.jpg" },
  { name: "Elie Salumu", role: "Ingénieur IoT, IA & data", initials: "ES", tone: "bg-[#f6e5bb] text-[#79520a]", image: "/images/elie-salumu.jpg" },
  { name: "Eunice Kapinga", role: "Business project manager", initials: "EK", tone: "bg-[#eadfd8] text-[#754a3a]", image: null },
  { name: "Guylain Boka", role: "Designer", initials: "GB", tone: "bg-[#dce7e9] text-[#31545b]", image: "/images/guylain.jpg" },
  { name: "Toussaint Madimba", role: "Ingénieur IoT", initials: "TM", tone: "bg-[#e2e6f5] text-[#394b7a]", image: "/images/toussaint-madimba.jpg" },
  { name: "Dieu Merci Nvemba", role: "Ingénieur IoT", initials: "DMN", tone: "bg-[#dcebe7] text-[#285b4a]", image: null },
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
    <main className="overflow-x-clip bg-white text-[#17211e]">
      <SiteHeader />

      <section id="accueil" className="scroll-mt-24 relative isolate flex h-[calc(100svh-65px)] items-center justify-center overflow-hidden bg-[#17191b] text-white">
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
            className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-16 text-center sm:py-20"
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

      <section id="about" className="scroll-mt-24 bg-[#fffaf4] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1440px]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="mb-9 text-center"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">À propos de Djua</p>
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
              Nous rendons l’énergie solaire plus simple à adopter.
            </h2>
          </motion.div>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="relative min-h-[260px] overflow-hidden rounded-2xl shadow-[0_12px_32px_rgba(23,33,30,0.12)] sm:min-h-[360px]"
            >
              <Image
                src="/images/solar-farm.jpg"
                alt="Rangée de panneaux solaires produisant de l’énergie propre"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="mt-5 text-sm leading-7 text-[#59665c]">
                Djua Energy accompagne les foyers et les entreprises en RDC, du premier diagnostic jusqu’au suivi de leur installation. Nous prenons le temps de comprendre vos besoins et les contraintes de votre site pour vous proposer une solution adaptée.
              </p>
              <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#c96500] hover:text-[#8f4700]">
                En savoir plus sur Djua <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20">
        <motion.div
          initial={reducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-col items-center gap-8"
        >
          <motion.div variants={reveal} className="text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Nos solutions</p>
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
              Le solaire qui répond à vos besoins réels.
            </h2>
          </motion.div>
          <motion.div variants={reveal} className="relative min-h-[170px] w-full overflow-hidden rounded-md flex items-center justify-center bg-[#17191b]">
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

      <section id="suivi" className="scroll-mt-24 bg-[#fff8f0] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1440px]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Le suivi de votre système, à distance</p>
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">Suivez la production solaire et l’état de votre batterie depuis votre espace Djua.</h2>
          </motion.div>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
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
              Les données de votre installation
            </div>
          </motion.div>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <p className="max-w-lg text-sm leading-7 text-[#59615b]">Le boîtier connecté envoie les informations de votre installation à la plateforme Djua. Vous pouvez consulter la production des panneaux, vérifier la charge de la batterie et repérer les alertes techniques, sans vous déplacer jusqu’à votre équipement.</p>
            <ul className="mt-6 grid gap-3 text-sm text-[#34443a]">
              <li className="flex items-center gap-3"><Sun size={17} className="shrink-0 text-[#ff8a00]" />Production solaire de votre installation</li>
              <li className="flex items-center gap-3"><BatteryCharging size={17} className="shrink-0 text-[#ff8a00]" />État de charge de la batterie</li>
              <li className="flex items-center gap-3"><Bell size={17} className="shrink-0 text-[#ff8a00]" />Alertes techniques à consulter</li>
            </ul>
            <Link href="/services" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#c96500] hover:text-[#8f4700]">Comprendre le suivi de votre installation <ArrowRight size={16} /></Link>
          </motion.div>
          </div>
        </div>
      </section>

      <section id="approche" className="bg-[#fffaf4] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1280px]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55 }}
            className="mx-auto mb-11 max-w-3xl text-center sm:mb-14"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#c96500]">Notre expertise</p>
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
              La bonne installation, sans complication.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#59665c] sm:text-base">
              Nous étudions votre consommation, sélectionnons les équipements adaptés et prenons en charge l’installation. Vous savez ce qui est prévu, et pourquoi.
            </p>
            <Link href="/about" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#c96500] transition-colors hover:text-[#8f4700]">
              Découvrir notre approche <ArrowRight size={16} />
            </Link>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                className="group min-h-[220px] rounded-2xl border border-[#17211e]/8 bg-white p-6 shadow-[0_6px_22px_rgba(23,33,30,0.045)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(23,33,30,0.1)] sm:p-7"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#fff3e5] text-[#e8790b] transition-colors group-hover:bg-[#ff8a00] group-hover:text-white">
                  <Icon className="size-5" strokeWidth={1.7} />
                </span>
                <p className="mt-6 text-[11px] font-bold tracking-[0.14em] text-[#a0a89f]">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold leading-snug">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#667168]">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="parcours" className="scroll-mt-24 mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20">
        <div>
          <motion.div initial={reducedMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true }} variants={revealIn} className="mb-12 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a00]">Votre parcours</p>
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">Simple, du besoin à la mise en service.</h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map(([title, text], index) => (
              <motion.article
                key={title}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.1, duration: 0.45 }}
                className="rounded-xl border border-[#17211e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(23,33,30,0.07)] transition-shadow hover:shadow-[0_14px_32px_rgba(23,33,30,0.12)] sm:p-7"
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
          className="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffad45]">Parlons de votre installation</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Faites le premier pas vers une énergie plus stable.</h2>
          </div>
          <a href="#contact" className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-md bg-[#ff8a00] px-5 text-sm font-bold text-[#17191b] hover:bg-[#ffad45]">
            <PhoneCall size={16} /> Contactez Djua <ArrowRight size={16} />
          </a>
        </motion.div>
      </section>

      <section id="equipe" className="scroll-mt-24 relative overflow-hidden bg-white px-5 py-14 sm:px-8 sm:py-20">
        <div className="relative mx-auto max-w-[1440px]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            className="mb-10 text-center md:mb-14"
          >
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#c96500]">L’équipe Djua</p>
              <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">Des expertises réunies autour d’un même projet.</h2>
            </div>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#657168]">De la conception à l’énergie connectée, notre équipe construit Djua avec des compétences complémentaires.</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-7 lg:gap-x-3 xl:gap-x-4">
            {teamMembers.map((member, index) => (
              <motion.article
                key={member.name}
                initial={reducedMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.07, duration: 0.45 }}
                className="group min-w-0"
              >
                <div className={`relative grid aspect-[4/4.6] w-full place-items-center overflow-hidden rounded-md ${member.tone}`}>
                  {member.image && (
                    <>
                      <Image
                        src={member.image}
                        alt={`Portrait de ${member.name}`}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 24vw"
                        className="object-cover object-[center_30%]"
                      />
                      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                    </>
                  )}
                  <span aria-hidden="true" className="absolute inset-3 border border-current/15" />
                  <span aria-hidden="true" className="absolute -right-7 -top-7 size-24 rounded-full border border-current/20 transition-transform duration-500 group-hover:scale-125" />
                  {!member.image && <span className="relative font-semibold tracking-[0.08em] text-4xl sm:text-5xl">{member.initials}</span>}
                  <span className={`absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 ${member.image ? "text-white drop-shadow-md" : ""}`}>Djua · {String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-4 whitespace-nowrap text-xs font-semibold leading-snug xl:text-sm">{member.name}</h3>
                <p className="mt-1 text-sm leading-5 text-[#657168]">{member.role}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
