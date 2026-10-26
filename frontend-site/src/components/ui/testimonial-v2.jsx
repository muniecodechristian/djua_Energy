import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Pause, Play, Quote } from "lucide-react";

const reviews = [
  {
    tag: "Continuité énergétique",
    quote:
      "Le passage à une solution Djua nous apporte plus de sérénité au quotidien. Nos équipements restent alimentés et nous savons mieux ce qui se passe sur notre installation.",
    initials: "PM",
    name: "Patrick Mwemba",
    role: "Gérant de commerce · Kinshasa",
  },
  {
    tag: "Suivi à distance",
    quote:
      "Pouvoir suivre nos installations à distance change vraiment la façon dont nous organisons la maintenance. Les informations sont accessibles sans déplacement systématique.",
    initials: "NM",
    name: "Nadine Mwamba",
    role: "Responsable infrastructures · Lubumbashi",
  },
  {
    tag: "Accompagnement technique",
    quote:
      "L’équipe nous a aidés à mieux comprendre notre installation et à repérer les points à surveiller. On se sent accompagnés, même après la mise en service.",
    initials: "SI",
    name: "Serge Ilunga",
    role: "Directeur technique · Kolwezi",
  },
  {
    tag: "Équipements essentiels",
    quote:
      "Une alimentation plus stable est essentielle pour notre activité. La solution installée par Djua nous aide à mieux protéger nos équipements sensibles.",
    initials: "CK",
    name: "Dr. Christian Kalala",
    role: "Directeur médical · Kinshasa",
  },
  {
    tag: "Confort au quotidien",
    quote:
      "Nous voulions une solution discrète, confortable et adaptée à notre maison. L’installation solaire et le stockage nous simplifient la vie jour après jour.",
    initials: "TV",
    name: "Thérèse Vangu",
    role: "Cliente résidentielle · Kinshasa",
  },
  {
    tag: "Projet professionnel",
    quote:
      "Djua a pris le temps de comprendre nos besoins avant de proposer une solution. L’accompagnement, de l’étude jusqu’au suivi, a fait la différence.",
    initials: "FB",
    name: "Francine Bokungu",
    role: "Responsable des opérations · Kinshasa",
  },
  {
    tag: "Installation connectée",
    quote:
      "Le suivi sur téléphone rend l’installation plus simple à comprendre. Nous pouvons consulter les informations utiles et mieux planifier les interventions.",
    initials: "MT",
    name: "Marc Tshilombo",
    role: "Responsable de site · Kinshasa",
  },
  {
    tag: "Sites éloignés",
    quote:
      "Pour un site loin de la ville, la fiabilité et le suivi à distance comptent énormément. Djua nous a accompagnés pour trouver une solution pensée pour le terrain.",
    initials: "EM",
    name: "Eric Mukendi",
    role: "Responsable de projet · RDC",
  },
];

const rows = [reviews.slice(0, 4), reviews.slice(4)];

function ReviewCard({ review }) {
  return (
    <article className="flex min-h-52 w-[min(82vw,22rem)] shrink-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg sm:min-h-56 sm:w-[23rem] sm:p-6">
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <Quote size={20} className="shrink-0 text-slate-500" aria-hidden="true" />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700 sm:text-xs">
            {review.tag}
          </span>
        </div>
        <blockquote className="text-sm leading-6 text-slate-700 sm:text-[15px] sm:leading-7">
          “{review.quote}”
        </blockquote>
      </div>
      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-700">
          {review.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{review.name}</p>
          <p className="text-xs leading-5 text-slate-500">{review.role}</p>
        </div>
      </div>
    </article>
  );
}

function ReviewMarquee({ reviews: rowReviews, reverse, paused }) {
  return (
    <div className="testimonial-marquee overflow-hidden py-2">
      <div
        className={`testimonial-marquee-track flex w-max gap-4 ${
          reverse ? "testimonial-marquee-reverse" : ""
        } ${paused ? "testimonial-marquee-paused" : ""}`}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 gap-4"
          >
            {rowReviews.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestimonialV2() {
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { margin: "80px" });
  const paused = isPaused || prefersReducedMotion || !isInView;

  return (
    <section
      ref={sectionRef}
      id="temoignages"
      className="scroll-mt-16 overflow-hidden border-y border-slate-200/70 bg-slate-50 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
            Leurs projets, leur expérience
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Une énergie plus sereine, ça change tout.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Découvrez les retours de personnes accompagnées par Djua pour leur
            maison, leur activité ou leurs installations en RDC.
          </p>
          <button
            type="button"
            aria-label={
              prefersReducedMotion
                ? "Défilement arrêté selon la préférence de mouvement réduit"
                : isPaused
                  ? "Reprendre le défilement"
                  : "Mettre le défilement en pause"
            }
            aria-pressed={paused}
            disabled={prefersReducedMotion}
            onClick={() => setIsPaused((value) => !value)}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-default disabled:opacity-70"
          >
            {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            {prefersReducedMotion
              ? "Défilement arrêté"
              : isPaused
                ? "Reprendre"
                : "Mettre en pause"}
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-5">
        {rows.map((row, index) => (
          <ReviewMarquee
            key={index}
            reviews={row}
            reverse={index === 1}
            paused={paused}
          />
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-7xl px-5 text-center text-[11px] leading-5 text-slate-500 sm:px-8 sm:text-xs">
        Témoignages repris des contenus Djua existants. Vérifiez les autorisations
        de publication des citations et des noms avant mise en ligne.
      </p>
    </section>
  );
}
