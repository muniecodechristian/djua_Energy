"use client";

import { ArrowUpRight, Check, HeartHandshake, Lightbulb, Target, Users } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const values = [
  {
    icon: Target,
    title: "Vision à 360°",
    text: "Nous prenons en charge l’ensemble de votre communication : stratégie, création, diffusion et mesure. Un seul partenaire pour tout gérer.",
  },
  {
    icon: HeartHandshake,
    title: "Approche sur mesure",
    text: "Chaque client est unique. Nous refusons les solutions génériques et adaptons chaque stratégie à la réalité spécifique de votre organisation.",
  },
  {
    icon: Lightbulb,
    title: "Créativité au service des objectifs",
    text: "Nos idées ne sont pas faites pour impressionner mais pour produire des résultats concrets. La créativité est un outil, pas une fin en soi.",
  },
  {
    icon: Users,
    title: "Accompagnement de proximité",
    text: "Basés à Kinshasa, nous connaissons les codes, les médias et les publics locaux. Nous sommes proches de vous à chaque étape du projet.",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#ffffff] text-[#0f172a]">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div
          className="relative flex min-h-[330px] items-center overflow-hidden rounded-2xl bg-[#0f172a] bg-cover bg-center px-8 text-white sm:px-16"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(87,20,38,.98), rgba(87,20,38,.48)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI')",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#fbbf24]">
              Tech+ RDC
            </p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
              À propos de nous
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
              Une agence de communication congolaise engagée à transformer les idées en marques fortes avec de l’impact.
            </p>
          </motion.div>
        </div>
        <p className="mt-3 text-right text-[10px] text-[#0f172a]/50">
          <Link href="/">Accueil</Link>　/　<span className="text-[#f59e0b]">À propos</span>
        </p>
      </section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={reveal}
        transition={{ duration: 0.7 }}
        className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28"
      >
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">
            Notre histoire
          </p>
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Née de la conviction que les marques congolaises méritent mieux.
          </h2>
        </div>
        <div className="text-sm leading-7 text-[#0f172a]/70">
          <p>
            Tech+ est une agence de communication stratégique et de conseil basée à Kinshasa, en République Démocratique du Congo. Nous accompagnons les marques, institutions et entrepreneurs qui veulent construire une communication forte, cohérente et adaptée à leur réalité.
          </p>
          <p className="mt-5">
            Notre approche associe stratégie, créativité et une connaissance profonde du terrain congolais. Nous créyons que chaque organisation, quelle que soit sa taille, mérite une communication professionnelle, authentique et efficace.
          </p>
          <div className="mt-7 grid gap-3 text-xs sm:grid-cols-2">
            {["Conseil en communication", "Branding & identité visuelle", "Production audiovisuelle", "Relations publiques", "Communication digitale", "Formation & coaching"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="size-4 text-[#f59e0b]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
          className="min-h-[430px] rounded-2xl bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(87,20,38,.05), rgba(87,20,38,.35)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI')",
          }}
        />
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col justify-center"
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">
            Notre mission
          </p>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Donner aux marques congolaises une voix forte et un impact réel.
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#0f172a]/65">
            Nous rendons la communication plus claire, plus créative et plus proche des réalités africaines. De la stratégie à la production, chaque projet est une occasion de connecter une vision à son public cible avec authenticité et professionnalisme.
          </p>
          <Link
            href="/services"
            className="mt-7 inline-flex w-fit items-center gap-3 rounded-full bg-[#f59e0b] px-5 py-3 text-[11px] font-bold text-white transition-transform hover:scale-105"
          >
            Découvrir nos services <ArrowUpRight size={14} />
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">
            Ce qui nous guide
          </p>
          <h2 className="text-3xl font-semibold sm:text-5xl">Nos valeurs fondatrices</h2>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {values.map(({ icon: Icon, title, text }) => (
            <motion.article
              key={title}
              variants={reveal}
              whileHover={{ y: -7 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <span className="grid size-11 place-items-center rounded-full bg-[#fbbf24] text-[#0f172a]">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-6 text-base font-bold">{title}</h3>
              <p className="mt-3 text-xs leading-5 text-[#0f172a]/60">{text}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="mx-6 mb-20 overflow-hidden rounded-2xl bg-[#0f172a] px-6 py-14 text-center text-white sm:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">Parlons de votre projet</p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-5xl">Votre prochaine histoire de marque commence ici.</h2>
          <p className="mt-4 text-sm text-white/65">Contactez-nous pour un premier échange. Kinshasa, RDC — Techplus643@gmail.com</p>
          <Link
            href="/#contact"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#f59e0b] px-5 py-3 text-[11px] font-bold text-white"
          >
            Échangeons ensemble <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
