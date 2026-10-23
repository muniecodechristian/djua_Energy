import React, { useState } from 'react';

interface PricingProps {
  onSelectTier?: (tierName: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectTier }) => {
  const [isAnnual, setIsAnnual] = useState(false);

  const starterPrice = isAnnual ? '67 $' : '79 $';
  const proPrice = isAnnual ? '169 $' : '199 $';

  return (
    <section
      className="py-20 md:py-28 bg-white border-t border-slate-100"
      data-purpose="pricing-section"
      id="tarifs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Des forfaits adaptés à chaque échelle d'autonomie
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            Du kit résidentiel clé en main au parc énergétique multi-sites d'entreprise. Choisissez entre l'acquisition directe ou l'abonnement mensuel tout compris.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                !isAnnual
                  ? 'tab-active-btn text-slate-900 bg-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Facturation Mensuelle
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                isAnnual
                  ? 'tab-active-btn text-slate-900 bg-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Facturation Annuelle</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing 3-Grid Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {/* Tier 1: Starter / Résidentiel */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-card hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  Starter
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Résidentiel &amp; Villas
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 min-h-[40px]">
                Idéal pour villas, domiciles de cadres et petites équipes sans groupe électrogène.
              </p>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {starterPrice}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">/ mois</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  ou 1 890 $ kit complet clé en main
                </p>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700 mb-8">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Contrôleur intelligent Djua Hub 5kVA</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Batteries LiFePO4 48V (6 000 cycles)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Télémétrie GSM incluse 24/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>App mobile iOS &amp; Android en temps réel</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Support réactif Kinshasa &amp; Lubumbashi</span>
                </li>
              </ul>
            </div>
            <a
              href="#contact"
              onClick={() => onSelectTier?.('Résidentiel & Villas')}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all duration-200 text-sm cursor-pointer"
            >
              Choisir Résidentiel
            </a>
          </div>

          {/* Tier 2: Pro & PME (Featured / Highlighted) */}
          <div className="bg-white rounded-3xl p-8 border-2 border-amber-400 shadow-xl relative flex flex-col justify-between group">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[11px] tracking-wider uppercase shadow-md flex items-center gap-1.5">
              <span>★</span> Le Plus Populaire
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs uppercase tracking-wider border border-amber-200/60">
                  Pro &amp; PME
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Entreprises &amp; Médical
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 min-h-[40px]">
                Pour supermarchés, bureaux, cliniques, chambres froides et banques à zéro coupure.
              </p>
              <div className="mb-6 pb-6 border-b border-amber-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {proPrice}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">/ mois</span>
                </div>
                <p className="text-xs text-amber-700 font-semibold mt-1">
                  ou 4 800 $ pack pro tout inclus
                </p>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700 mb-8">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    ✓
                  </span>
                  <span className="font-medium text-slate-900">
                    Contrôleur Djua Hybride 10kVA tropicalisé
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    ✓
                  </span>
                  <span>Stockage LiFePO4 haute densité extensible</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    ✓
                  </span>
                  <span className="font-medium text-slate-900">
                    Copilot IA : détection prédictive des pannes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    ✓
                  </span>
                  <span>Télémétrie GSM + Satellite continue</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    ✓
                  </span>
                  <span className="font-medium text-emerald-700">
                    SLA astreinte &lt; 4h garantie en RDC
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    ✓
                  </span>
                  <span>Dashboard multi-utilisateurs &amp; rapports certifiés</span>
                </li>
              </ul>
            </div>
            <a
              href="#contact"
              onClick={() => onSelectTier?.('Entreprises & Médical')}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 hover:text-white shadow-soft transition-all duration-200 text-sm hover:-translate-y-0.5 cursor-pointer"
            >
              Démarrer l'essai pilote
            </a>
          </div>

          {/* Tier 3: Entreprise & Multi-Sites */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-card hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                  Custom &amp; Échelle
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Entreprise &amp; Multi-Sites
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 min-h-[40px]">
                Pour mines, sites télécoms, sièges bancaires et micro-réseaux industriels.
              </p>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Sur Mesure
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  À partir de 450 $ / mois selon la puissance
                </p>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700 mb-8">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Architecture modulaire jusqu'à 2 MWc</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Télémétrie satellite dédiée sans réseau GSM</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Gestionnaire de compte &amp; ingénieur dédié RDC</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>API REST &amp; Webhooks pour vos ERP / SCADA</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <span>Remplacement garanti à vie sous contrat</span>
                </li>
              </ul>
            </div>
            <a
              href="#contact"
              onClick={() => onSelectTier?.('Entreprise & Multi-Sites')}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all duration-200 text-sm cursor-pointer"
            >
              Contacter l'équipe Grands Comptes
            </a>
          </div>
        </div>

        {/* Guarantee Trust Footer Banner */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-600">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              ✓
            </span>
            Déploiement en 72h à Kinshasa &amp; Lubumbashi
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              ✓
            </span>
            Garantie matériel 10 ans certifiée
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              ✓
            </span>
            Zéro coupure &amp; aucun frais cachés
          </span>
        </div>
      </div>
    </section>
  );
};
