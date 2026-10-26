"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Accueil", href: "#accueil" },
  { label: "Nos solutions", href: "#solutions" },
  { label: "Notre démarche", href: "#demarche" },
  { label: "Notre approche", href: "#expertise" },
  { label: "Témoignages", href: "#temoignages" },
  { label: "Questions", href: "#questions" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a
          href="#accueil"
          aria-label="Djua Energy, accueil"
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src="/brand/djua-logo.png"
            alt=""
            className="h-10 w-[4.5rem] rounded-lg bg-white object-contain p-1"
          />
          <span className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
            DJUA ENERGY
          </span>
        </a>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-amber-700"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="hidden rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 lg:inline-flex"
        >
          Nous contacter
        </a>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((isOpen) => !isOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Navigation mobile"
          className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-amber-50 hover:text-amber-800"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Nous contacter
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
