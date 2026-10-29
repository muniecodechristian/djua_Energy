"use client";

import { Menu, PhoneCall, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DJUA_LOGO_URL } from "@/lib/brand";

const links = [
  ["Accueil", "/"],
  ["À propos", "/about"],
  ["Services", "/services"],
  ["Notre approche", "/#approche"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#ff8a00]/25 bg-[#0f172a] text-white shadow-xl shadow-[#0f172a]/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-3.5">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="rounded-sm bg-white px-1.5 py-0.5"><img src={DJUA_LOGO_URL} alt="Djua" className="h-9 w-[76px] object-contain" /></span>
          <span className="text-xs font-semibold tracking-normal text-white/75">Energy</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex" aria-label="Navigation principale">
          {links.map(([label, href]) => {
            const isActive = pathname === href || (href === "/#approche" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={`transition-colors hover:text-[#ffb24d] ${isActive ? "text-[#ffb24d]" : "text-white/85"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>


        <a
          href="tel:+243995424606"
          className="hidden min-h-10 items-center gap-2 rounded-md bg-[#ff8a00] px-4 text-sm font-bold text-[#17211e] transition-colors hover:bg-[#ff9d26] lg:inline-flex"
        >
          <PhoneCall size={14} /> Contact
        </a>

        <button
          type="button"
          className="rounded-lg p-2 lg:hidden"
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
            className="overflow-hidden border-t border-white/10 lg:hidden"
            aria-label="Navigation mobile"
          >
            <div className="mx-auto flex max-w-7xl flex-col px-6 pb-5 pt-2">
              {links.map(([label, href]) => {
                const isActive = pathname === href || (href === "/#approche" && pathname === "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`border-b border-white/10 py-4 text-sm font-medium ${isActive ? "text-[#ffb24d]" : "text-white/80 hover:text-[#ffb24d]"}`}
                  >
                    {label}
                  </Link>
                );
              })}
              <a href="tel:+243995424606" onClick={() => setOpen(false)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#ff8a00] px-4 text-sm font-bold text-[#17211e]">
                <PhoneCall size={15} /> Contact
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
