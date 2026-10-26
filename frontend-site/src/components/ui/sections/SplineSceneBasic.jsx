"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { SplineScene } from "@/components/ui/SplineScene";

export default function SplineSceneBasic() {
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true, margin: "100px" });
  const [sceneRequested, setSceneRequested] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      ref={heroRef}
      id="accueil"
      className="relative isolate overflow-hidden bg-slate-950 text-white"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full opacity-90 brightness-[1.35] contrast-105 saturate-110 sm:opacity-100 lg:w-[82%]">
        {isInView && sceneRequested && (
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full min-h-[34rem] w-full sm:min-h-[40rem] lg:scale-110 lg:translate-x-[8%]"
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-slate-950 via-slate-950/55 to-slate-950/0" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/30 via-transparent to-slate-950/5" />
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 md:gap-10 lg:grid-cols-2 lg:px-10 lg:py-24">
        <div className="relative z-10">
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-amber-400 sm:text-sm"
          >
            L’énergie, en mieux.
          </motion.p>
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl"
          >
            Reprenez le contrôle de votre{" "}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              énergie.
            </span>
          </motion.h1>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8"
          >
            Djua imagine, installe et suit des solutions solaires adaptées à
            votre maison, votre activité ou votre site isolé. Une énergie plus
            sereine, pensée pour les réalités de la RDC.
          </motion.p>
          <motion.a
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            href="#contact"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-amber-500 px-7 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-400 sm:text-base"
          >
            Nous contacter
          </motion.a>
          <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-3 sm:gap-4">
            {["Étude personnalisée", "Installation solaire", "Suivi connecté"].map(
              (service) => (
                <p key={service} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {service}
                </p>
              ),
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scale: [1, 1.015, 1],
                    y: [0, -9, 0],
                    rotateZ: [0, 1, 0],
                  }
            }
            transition={
              prefersReducedMotion
                ? { opacity: { duration: 0.3 } }
                : {
                    opacity: { duration: 0.75, delay: 0.1 },
                    scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                    rotateZ: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  }
            }
            whileHover={prefersReducedMotion ? {} : { scale: 1.04, rotateZ: 0 }}
            className="relative mx-auto flex w-[min(76vw,19rem)] items-center justify-center [perspective:1200px] sm:w-[min(60vw,21rem)] lg:translate-y-7"
          >
            <div className="relative w-full">
            <svg
              className="pointer-events-none absolute -inset-6 z-0 h-[calc(100%+3rem)] w-[calc(100%+3rem)] overflow-visible motion-reduce:hidden"
              viewBox="0 0 600 380"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 190C120 190 90 35 280 65C410 85 390 300 590 230"
                stroke="url(#hub-energy-path)"
                strokeWidth="1.5"
                strokeDasharray="5 9"
                className="animate-[dash-flow_14s_linear_infinite]"
              />
              <defs>
                <linearGradient id="hub-energy-path" x1="10" y1="190" x2="590" y2="230">
                  <stop stopColor="#f59e0b" stopOpacity=".08" />
                  <stop offset=".55" stopColor="#fbbf24" stopOpacity=".8" />
                  <stop offset="1" stopColor="#fb923c" stopOpacity=".12" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-3 z-0 rounded-[2rem] bg-gradient-to-br from-amber-400/30 via-orange-400/10 to-transparent blur-2xl sm:inset-6" />
            <div className="relative z-10 w-full rounded-[1.15rem] border border-white/60 bg-slate-950/90 p-1 shadow-[0_22px_60px_-24px_rgba(245,158,11,0.6)] sm:rounded-[1.35rem] sm:p-1.5">
              <img
                src="/brand/djua-hub.png"
                alt="Boîtier solaire Djua Hub, au cœur de votre installation"
                width="1280"
                height="720"
                fetchPriority="high"
                decoding="async"
                className="aspect-video w-full rounded-[0.9rem] object-contain sm:rounded-[1.05rem]"
              />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 sm:px-3">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white sm:text-[10px]">
                  Djua Hub
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-medium text-amber-100 sm:text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 motion-safe:animate-pulse" />
                  L’énergie sous contrôle
                </span>
              </div>
            </div>
            </div>
          </motion.div>
          <button
            type="button"
            aria-pressed={sceneRequested}
            onClick={() => setSceneRequested(true)}
            disabled={sceneRequested}
            className="relative z-20 mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-default disabled:opacity-70"
          >
            {sceneRequested
              ? "Animation 3D en cours de chargement"
              : "Afficher le robot en 3D"}
          </button>
        </div>
      </div>
    </section>
  );
}