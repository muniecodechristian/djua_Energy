"use client";

import { Menu, PhoneCall, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DJUA_LOGO_URL } from "@/lib/brand";

const links = [
  ["Accueil", "/"],
  ["À propos", "/about"],
  ["Services", "/services"],
  ["Notre approche", "/#approche"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b text-[#17211e] backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${scrolled ? "border-[#ff8a00]/25 bg-white/95 shadow-md shadow-[#17211e]/10" : "border-[#17211e]/10 bg-white shadow-sm shadow-transparent"}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 transition-[padding] duration-300 ${scrolled ? "py-2.5" : "py-3.5"}`}>
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="rounded-sm bg-white px-1.5 py-0.5"><img src={DJUA_LOGO_URL} alt="Djua" className="h-9 w-[76px] object-contain" /></span>
          <span className="text-xs font-semibold tracking-normal text-[#657168]">Energy</span>
        </Link>

        <nav className="hidden items-center gap-8 text-base font-semibold lg:flex" aria-label="Navigation principale">
          {links.map(([label, href]) => {
            const isActive = pathname === href || (href === "/#approche" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={`transition-colors hover:text-[#c96500] ${isActive ? "text-[#c96500]" : "text-[#34443a]"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>


        <a
          href="tel:+243995424606"
          className="hidden min-h-11 items-center gap-2 rounded-md bg-[#ff8a00] px-4 text-base font-bold text-[#17211e] transition-colors hover:bg-[#ff9d26] lg:inline-flex"
        >
          <PhoneCall size={14} /> Contact
        </a>

        <button
          type="button"
          className="rounded-lg p-2 text-[#17211e] transition-colors hover:bg-[#17211e]/5 lg:hidden"
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
            className="overflow-hidden border-t border-[#17211e]/10 bg-white lg:hidden"
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
                    className={`border-b border-[#17211e]/10 py-4 text-base font-medium ${isActive ? "text-[#c96500]" : "text-[#34443a] hover:text-[#c96500]"}`}
                  >
                    {label}
                  </Link>
                );
              })}
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
