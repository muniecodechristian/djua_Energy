"use client";

import { ArrowUpRight, Check, CircleCheck, Megaphone, Palette, Radio, Film, Globe2, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const services = [
  {
    icon: Megaphone,
    title: "Conseil en communication",
    text: "Nous élaborons votre stratégie de communication de A à Z : positionnement, messages clés, plan d'action et identité de marque cohérente.",
    image: "/images/mission.jpg",
    color: "bg-[#571426]",
    textColor: "text-white",
  },
  {
    icon: Palette,
    title: "Branding & Identité visuelle",
    text: "Conception de logos, chartes graphiques et univers visuels qui reflètent authentiquement votre organisation et inspirent confiance.",
    image: "/images/services-why.jpg",
    color: "bg-[#fbbf24]",
    textColor: "text-[#38131b]",
  },
  {
    icon: Radio,
    title: "Relations publiques",
    text: "Gestion de votre réputation, relations médias, organisation d'événements et communication de crise pour protéger votre image.",
    image: "/images/about-hero.jpg",
    color: "bg-white",
    textColor: "text-[#38131b]",
  },
  {
    icon: Film,
    title: "Production audiovisuelle",
    text: "Films d'entreprise, spots publicitaires, reportages photo et contenus vidéo de haute qualité pour valoriser votre marque.",
    image: "/images/hero.jpg",
    color: "bg-[#fff1f2]",
    textColor: "text-[#38131b]",
  },
  {
    icon: Globe2,
    title: "Communication digitale",
    text: "Stratégie réseaux sociaux, création de contenu, community management et présence en ligne adaptés aux publics congolais et africains.",
    image: "/images/about-portrait-woman.jpg",
    color: "bg-[#571426]",
    textColor: "text-white",
  },
  {
    icon: GraduationCap,
    title: "Formation & Coaching",
    text: "Ateliers sur mesure, coaching d'équipes et programmes de renforcement des capacités pour professionnaliser votre communication.",
    image: "/images/about-portrait-man.jpg",
    color: "bg-[#fbbf24]",
    textColor: "text-[#38131b]",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#fff7f7] text-[#38131b]">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6">
        <div
          className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-[#571426] bg-cover bg-center text-center text-white"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(87,20,38,.97) 0%, rgba(87,20,38,.60) 60%), url('/images/about-hero.jpg')",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl px-6"
          >
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#fbbf24]">
              Ce que nous faisons
            </p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
              Nos services
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Des solutions de communication complètes pour les marques, institutions et entrepreneurs en RDC.
            </p>
          </motion.div>
        </div>
        <p className="mt-3 text-right text-[10px] text-[#38131b]/50">
          <Link href="/">Accueil</Link>　/　
          <span className="text-[#d7263d]">Services</span>
        </p>
      </section>

      {/* Intro */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={reveal}
        transition={{ duration: 0.7 }}
        className="mx-auto grid max-w-5xl gap-10 px-6 py-20 lg:grid-cols-2"
      >
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#d7263d]">
            Notre mission
          </p>
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Transformer les idées en marques qui{" "}
            <span className="text-[#d7263d]">font de l&apos;impact</span>
          </h2>
        </div>
        <div className="text-sm leading-6 text-[#38131b]/65">
          <p>
            Chez Tech+, nous croyons que chaque organisation mérite une communication claire, cohérente et authentique. Nous accompagnons les entreprises, institutions et entrepreneurs congolais avec des solutions adaptées à leur réalité et à leurs ambitions.
          </p>
          <p className="mt-4">
            De la stratégie à la production, notre équipe prend en charge votre communication de bout en bout pour vous permettre de vous concentrer sur l&apos;essentiel : votre activité.
          </p>
          <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2">
            {[
              "Expertise locale RDC",
              "Approche sur mesure",
              "Vision à 360°",
              "Résultats mesurables",
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="size-4 text-[#d7263d]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pourquoi nous choisir */}
      <section className="mx-auto grid max-w-6xl gap-12 rounded-2xl bg-white px-6 py-12 sm:px-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#d7263d]">
            Pourquoi nous choisir ?
          </p>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Votre image mérite un partenaire qui comprend votre réalité.
          </h2>
          <div
            className="mt-7 h-64 rounded-xl bg-cover bg-center"
            style={{
              backgroundImage:
                "url('/images/services-why.jpg')",
            }}
          />
        </motion.div>
        <div className="grid content-center gap-3">
          {[
            [
              "Expertise terrain en RDC",
              "Une compréhension concrète des réalités culturelles, médiatiques et économiques du marché congolais.",
            ],
            [
              "Une approche 360°",
              "De la stratégie à l'exécution, nous couvrons tous les aspects de votre communication sans que vous ayez à multiplier les prestataires.",
            ],
            [
              "Des livrables concrets",
              "Chaque mission se termine par des supports professionnels, une stratégie documentée et des résultats mesurables.",
            ],
            [
              "Un accompagnement humain",
              "Nous sommes à vos côtés à chaque étape, avec écoute, réactivité et un vrai souci du détail.",
            ],
          ].map(([title, text], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 rounded-xl bg-[#fff7f7] p-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ffb3bd]">
                <CircleCheck className="size-4 text-[#571426]" />
              </span>
              <div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#38131b]/60">{text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Grille des 6 vrais services */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-lg text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#d7263d]">
            Nos expertises
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Une offre complète pour votre communication
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#38131b]/60">
            Six domaines d&apos;expertise pour couvrir l&apos;ensemble de vos besoins en communication.
          </p>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map(({ icon: Icon, title, text, image, color, textColor }) => (
            <motion.article
              key={title}
              variants={reveal}
              whileHover={{ y: -7 }}
              transition={{ duration: 0.45 }}
              className={`group flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl p-6 shadow-sm ${color} ${textColor}`}
            >
              <div>
                <div
                  className="mb-5 h-28 w-full rounded-xl bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundImage: `linear-gradient(rgba(87,20,38,.25),rgba(87,20,38,.25)),url('${image}')`,
                  }}
                />
                <span className="mb-3 inline-grid size-10 place-items-center rounded-full bg-white/20">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-base font-bold leading-snug">{title}</h3>
                <p className="mt-2 text-[11px] leading-5 opacity-70">{text}</p>
              </div>
              <Link
                href="/#contact"
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[10px] font-bold transition-colors hover:bg-[#f59e0b] hover:text-white"
              >
                En savoir plus <ArrowUpRight className="size-3" />
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-6 mb-20 overflow-hidden rounded-2xl bg-[#571426] px-6 py-14 text-center text-white sm:px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">
            Prêt à collaborer ?
          </p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-5xl">
            Parlons de votre projet de communication.
          </h2>
          <p className="mt-4 text-sm text-white/65">
            Contactez-nous pour un premier échange sans engagement. Nous sommes à Kinshasa et prêts à vous accompagner.
          </p>
          <Link
            href="/#contact"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#f59e0b] px-6 py-3 text-[11px] font-bold text-white transition-transform hover:scale-105"
          >
            Contactez-nous <ArrowUpRight size={14} />
          </Link>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
