"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const partners = [
  { id: 1, src: "/images/IMG-20260911-WA0015.jpg", alt: "Partenaire 1" },
  { id: 2, src: "/images/IMG-20260911-WA0016.jpg", alt: "Partenaire 2" },
  { id: 3, src: "/images/IMG-20260911-WA0017.jpg", alt: "Partenaire 3" },
  { id: 4, src: "/images/IMG-20260911-WA0018%20-%20Copie.jpg", alt: "Partenaire 4" },
  { id: 5, src: "/images/IMG-20260911-WA0019.jpg", alt: "Partenaire 5" },
];

export function PartnersMarquee() {
  return (
    <section className="bg-white py-14 border-b border-[#571426]/10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-10 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#d7263d]">
          Ils nous font confiance
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#38131b] sm:text-3xl">
          Nos partenaires de référence
        </h2>
      </div>

      <div className="relative flex w-full justify-center overflow-hidden bg-white">
        {/* Gradient fade gauche */}
        <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        {/* Gradient fade droite */}
        <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />

        <motion.div
          className="flex w-max items-center gap-8 sm:gap-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 30,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {/* Duplication ×2 pour défilement infini sans saut */}
          {[...partners, ...partners].map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="group shrink-0"
            >
              <div className="relative h-24 w-36 sm:h-28 sm:w-44 overflow-hidden rounded-2xl border border-[#571426]/10 bg-[#fff7f7] shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:border-[#d7263d]/25 group-hover:scale-105">
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  fill
                  sizes="(max-width: 768px) 144px, 176px"
                  className="object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                {/* Overlay subtil au hover */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#d7263d]/0 group-hover:ring-[#d7263d]/20 transition-all duration-300" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
