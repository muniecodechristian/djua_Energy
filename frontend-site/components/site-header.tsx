"use client";

import { Menu, PhoneCall, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DJUA_LOGO_URL } from "@/lib/brand";

const links = [
  ["Accueil", "/#accueil"],
  ["Solutions", "/#solutions"],
  ["Suivi", "/#suivi"],
  ["Approche", "/#approche"],
  ["Parcours", "/#parcours"],
  ["Équipe", "/#equipe"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b text-[#17211e] backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${scrolled ? "border-[#ff8a00]/25 bg-white/95 shadow-md shadow-[#17211e]/10" : "border-[#17211e]/10 bg-white shadow-sm shadow-transparent"}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 transition-[padding] duration-300 ${scrolled ? "py-2.5" : "py-3.5"}`}>
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center text-lg font-bold tracking-tight" aria-label="Djua Energy - Accueil">
          <span className="rounded-sm bg-white px-1.5 py-0.5"><img src={DJUA_LOGO_URL} alt="Djua" className="h-12 w-[102px] object-contain" /></span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-semibold xl:flex" aria-label="Navigation principale">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap text-[#34443a] transition-colors hover:text-[#c96500]">
              {label}
            </Link>
          ))}
        </nav>


        <Link
          href="/#contact"
          className="hidden min-h-11 items-center gap-2 rounded-md bg-[#ff8a00] px-4 text-sm font-bold text-[#17211e] transition-colors hover:bg-[#ff9d26] xl:inline-flex"
        >
          <PhoneCall size={14} /> Contact
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-[#17211e] transition-colors hover:bg-[#17211e]/5 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-[#17211e]/10 bg-white xl:hidden"
            aria-label="Navigation mobile"
          >
            <div className="mx-auto flex max-w-7xl flex-col px-6 pb-5 pt-2">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="border-b border-[#17211e]/10 py-4 text-base font-medium text-[#34443a] hover:text-[#c96500]"
                >
                  {label}
                </Link>
              ))}
              <a href="tel:+243995424606" onClick={() => setOpen(false)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#ff8a00] px-4 text-base font-bold text-[#17211e]">
                <PhoneCall size={15} /> Contact
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
