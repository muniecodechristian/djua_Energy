"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["Accueil", "/"],
  ["À propos", "/about"],
  ["Services", "/services"],
  ["Actualités", "/#insights"],
  ["Contact", "/#contact"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#fbbf24]/20 bg-[#0f172a] text-white shadow-xl shadow-[#0f172a]/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="rounded-md bg-white px-1.5 py-1">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjEVP6WMcrEsv2nLYSgS9v4WfV711u6ne8fa0aJHDt8jAPuumn7dzikn8PIFEYq7whxH5iUZF0Hp4b92Z9SI44LG4uRnir7pr0-ES6zx8j0xpVv2pEq-x2t_pioe64Plt7nSVa8R3qmC0HbNrrXrNmnwO6NR6nrr80S_g0KTAAhwU7TLDwQxylz9da34eGd7zyXiuyuz5ah02oKZx3i2MRdZVu6H3tfwGv5hNcm8A_UvHUSZdbWh7He3c3Alx5dlSJzww" alt="Djua" className="h-7 w-auto object-contain" />
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[11px] font-semibold md:flex" aria-label="Navigation principale">
          {links.map(([label, href]) => {
            const isActive = pathname === href || (href === "/#insights" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={`transition-colors hover:text-[#fbbf24] ${isActive ? "text-[#fbbf24]" : "text-white/80"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>


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
                const isActive = pathname === href || (href === "/#insights" && pathname === "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`border-b border-white/10 py-4 text-sm font-medium ${isActive ? "text-[#fbbf24]" : "text-white/80 hover:text-[#fbbf24]"}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
