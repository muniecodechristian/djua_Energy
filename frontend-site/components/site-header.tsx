"use client";

import { Menu, PhoneCall, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
    <header className="sticky top-0 z-50 border-b border-[#fbbf24]/20 bg-[#0f172a] text-white shadow-xl shadow-[#0f172a]/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-md bg-[#d9e8a7] text-sm font-extrabold text-[#17211e]">D</span>
          <span>Djua <span className="font-medium text-white/65">Energy</span></span>
        </Link>

        <nav className="hidden items-center gap-8 text-[11px] font-semibold md:flex" aria-label="Navigation principale">
          {links.map(([label, href]) => {
            const isActive = pathname === href || (href === "/#approche" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={`transition-colors hover:text-[#d9e8a7] ${isActive ? "text-[#d9e8a7]" : "text-white/80"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>


        <a
          href="tel:+243995424606"
          className="mr-2 hidden min-h-10 items-center gap-2 rounded-md bg-[#d9e8a7] px-4 text-xs font-bold text-[#17211e] transition-colors hover:bg-white md:inline-flex"
        >
          <PhoneCall size={14} /> Contact
        </a>

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
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
            className="overflow-hidden border-t border-white/10 md:hidden"
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
                    className={`border-b border-white/10 py-4 text-sm font-medium ${isActive ? "text-[#d9e8a7]" : "text-white/80 hover:text-[#d9e8a7]"}`}
                  >
                    {label}
                  </Link>
                );
              })}
              <a href="tel:+243995424606" onClick={() => setOpen(false)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d9e8a7] px-4 text-sm font-bold text-[#17211e]">
                <PhoneCall size={15} /> Contact
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
