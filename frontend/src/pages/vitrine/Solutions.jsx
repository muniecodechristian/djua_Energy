import React from 'react';

export default function Solutions({ onSelectSolution }) {
  return (
    <section
      className="py-28 md:py-36 bg-slate-50/70 border-y border-slate-200/70"
      data-purpose="use-cases"
      id="solutions"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Des solutions adaptées à chaque intensité
          </h2>
          <p className="mt-3 text-slate-600">
            Conçu sur mesure pour les résidences, les commerces et les infrastructures critiques en RDC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-card transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Résidentiel &amp; Villas
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Maisons d'architectes et villas : alimentation ininterrompue, stockage lithium sans odeur ni nuisance de groupe électrogène.
              </p>
            </div>
            <a
              className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              href="#contact"
              onClick={() => onSelectSolution?.('Résidentiel & Villas')}
            >
              En savoir plus
              <svg className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </a>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-card transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Commercial &amp; PME
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Supermarchés, agences bancaires et bureaux : protégez vos serveurs, terminaux de paiement et chambres froides sans coupure.
              </p>
            </div>
            <a
              className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              href="#contact"
              onClick={() => onSelectSolution?.('Commercial & PME')}
            >
              En savoir plus
              <svg className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </a>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-card transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Industrie &amp; Mini-Grids
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Micro-réseaux conteneurisés de 50 kWc à 2 MWc pour sites miniers, télécoms et communautés isolées au Katanga et Kivu.
              </p>
            </div>
            <a
              className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              href="#contact"
              onClick={() => onSelectSolution?.('Industrie & Mini-Grids')}
            >
              En savoir plus
              <svg className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </a>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-card transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M17 21v-8H7v8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Santé &amp; Établissements
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Cliniques, laboratoires et maternités : sécurisation zéro délestage des blocs opératoires et conservation vaccinale.
              </p>
            </div>
            <a
              className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              href="#contact"
              onClick={() => onSelectSolution?.('Santé & Établissements')}
            >
              En savoir plus
              <svg className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
