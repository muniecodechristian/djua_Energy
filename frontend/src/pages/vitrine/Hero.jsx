import React from 'react';

const CONTROLLER_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuAyUcQBWcIFaqXrsSLfFbokxuY2IgSQItTtw3UiH0WWL4JCcClVo5fI9vEPaB_QHrXTmiUXDDKotT8QmOwXhObVNjQE_rXXa5KyWrh8R3UPtBq6dmjXtRmGtg5o8G0AQ9MxMUyIK0IF0a6NX8SFn-J96s3kCRMHlJqXNaB-YCw1mrm9zRJehtVVC-GqvHbjI0-csBfaoAjkdNB0Fb85MFvPrW33xiCbzcGn6y0ZVMs64g0XfiGaAxcQaHs9gr6YzlkW258";

export default function Hero({ onOpenPilot }) {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden subtle-dots border-b border-slate-100">
      {/* Background ambient orbs */}
      <i className="dj-orb a" aria-hidden="true" />
      <i className="dj-orb b" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] max-w-5xl mx-auto">
          L'énergie solaire intelligente. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
            Déployée sans friction
          </span>
          , supervisée en direct.
        </h1>

        {/* CTA Action Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={onOpenPilot}
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 hover:text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            Démarrer un essai pilote
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M14 5l7 7m0 0l-7 7m7-7H3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          <a
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            href="#supervision"
          >
            essaie demo
          </a>
        </div>

        {/* Visual Hero Media Showcase */}
        <div
          className="mt-14 sm:mt-18 relative max-w-5xl mx-auto"
          data-purpose="hero-media-showcase"
        >
          {/* Floating Badge Right */}
          <div className="hidden lg:flex absolute -bottom-8 -right-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-float border border-slate-200/80 items-center gap-3.5 animate-float-delayed">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">
                  IA Prédictive Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Télémétrie GSM &amp; Satellite 24/7
              </p>
            </div>
          </div>

          {/* Main Device Showcase Frame */}
          <div className="relative rounded-2xl md:rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-slate-100/90 to-slate-200/40 shadow-2xl border border-slate-200/80">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 group">
              <img
                alt="Contrôleur solaire intelligent Djua"
                className="w-full h-auto object-cover max-h-[580px] rounded-xl transform transition-transform duration-700 group-hover:scale-[1.01]"
                src={CONTROLLER_IMG}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
