import React from 'react';

const REVIEWS_ROW1 = [
  {
    tag: 'Zéro coupure',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200/60',
    quote: "« Pour un supermarché à Gombe, une panne de froid de 3 heures équivaut à des milliers de dollars de pertes. Le basculement sans coupure et l'alerte temps réel du Djua Hub ont totalement éliminé ce risque. »",
    initials: 'PM',
    avatarBg: 'bg-amber-100 text-amber-800 border-amber-200',
    name: 'Patrick Mwemba',
    role: 'Gérant • Supermarché Express',
    city: 'Kinshasa',
  },
  {
    tag: 'Télémétrie GSM 24/7',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    quote: "« Le monitoring à distance par carte SIM GSM est bluffant. Depuis nos bureaux de Lubumbashi, nous suivons en direct la santé des kits installés sur 6 entrepôts sans déplacer de techniciens. »",
    initials: 'NM',
    avatarBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    name: 'Nadine Mwamba',
    role: 'Resp. Infra • Katanga Hub',
    city: 'Lubumbashi',
  },
  {
    tag: 'Intervention préventive',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200/60',
    quote: "« La télémétrie prédictive a détecté une anomalie thermique sur un bornier avant même qu'un incident ne se produise. L'équipe Djua est intervenue en amont. C'est le standard de fiabilité qui manquait. »",
    initials: 'SI',
    avatarBg: 'bg-blue-100 text-blue-800 border-blue-200',
    name: 'Serge Ilunga',
    role: 'Dir. Technique • Mines Kolwezi',
    city: 'Kolwezi',
  },
  {
    tag: 'Bloc Opératoire Sécurisé',
    tagColor: 'bg-red-50 text-red-700 border-red-200/60',
    quote: "« Dès l'installation du contrôleur Djua, nos blocs opératoires et nos banques de sang ont enfin une alimentation sans micro-coupures destructrices pour nos équipements biomédicaux. »",
    initials: 'CK',
    avatarBg: 'bg-red-100 text-red-800 border-red-200',
    name: 'Dr. Christian Kalala',
    role: 'Directeur Médical • Ngaliema',
    city: 'Kinshasa',
  },
];

const REVIEWS_ROW2 = [
  {
    tag: 'Économie -75% Diesel',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200/60',
    quote: "« Nos clients exigent un silence absolu et zéro coupure de climatisation. Djua a divisé notre facture de carburant diesel par quatre tout en assurant une bascule invisible. »",
    initials: 'FB',
    avatarBg: 'bg-amber-100 text-amber-800 border-amber-200',
    name: 'Francine Bokungu',
    role: 'Dir. Opérations • Fleuve Congo',
    city: 'Kinshasa',
  },
  {
    tag: 'Zéro perte data',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    quote: "« Plus aucune perte de données sur nos serveurs lors des délestages intempestifs. L'interface SaaS est claire et accessible directement sur smartphone. »",
    initials: 'MT',
    avatarBg: 'bg-purple-100 text-purple-800 border-purple-200',
    name: 'Marc Tshilombo',
    role: 'Associé • Audit & Fiscalité',
    city: 'Kinshasa',
  },
  {
    tag: 'Disponibilité 99.8%',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    quote: "« Gérer des relais isolés à l'intérieur du pays était un cauchemar logistique. Grâce au suivi hybride GSM + Satellite de Djua, notre disponibilité réseau atteint 99.8%. »",
    initials: 'EM',
    avatarBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    name: 'Eric Mukendi',
    role: 'Projet Télécom • TowerCo RDC',
    city: 'Multi-provinces',
  },
  {
    tag: 'Silence absolu',
    tagColor: 'bg-slate-100 text-slate-800 border-slate-200',
    quote: "« Finis le bruit assourdissant et l'odeur du groupe électrogène la nuit. L'onduleur et les batteries lithium Djua gèrent tout automatiquement dans un silence parfait. »",
    initials: 'TV',
    avatarBg: 'bg-amber-100 text-amber-800 border-amber-200',
    name: 'Thérèse Vangu',
    role: 'Propriétaire • Villa Macampagne',
    city: 'Kinshasa',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section
      className="py-20 md:py-28 bg-slate-50/60 border-t border-slate-200/70"
      data-purpose="social-proof-testimonials"
      id="temoignages"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Adopté par les entreprises exigeantes en RDC
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            Découvrez comment les gestionnaires d'infrastructures, médecins et directeurs d'opérations sécurisent leur alimentation avec Djua.
          </p>
        </div>

        {/* Featured Testimonial Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm mb-12 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-100/40 rounded-full blur-2xl pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center gap-1 text-amber-400">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                <span className="ml-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Client Partenaire Certifié
                </span>
              </div>
              <blockquote className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                « Avant Djua, notre groupe électrogène consommait plus de 2 800 $ de gasoil par mois avec des micro-coupures destructrices pour nos équipements biomédicaux. Depuis l'installation du contrôleur et de la télémétrie Djua, nos coupures ont chuté de 85% et le suivi sur smartphone apporte une sérénité totale à nos équipes. »
              </blockquote>
              <div className="pt-2">
                <p className="text-base font-bold text-slate-900">
                  Dr. Christian Kalala
                </p>
                <p className="text-sm text-slate-500">
                  Directeur Médical Adjoint • Centre Hospitalier Ngaliema, Kinshasa
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-amber-600 tracking-tight mb-1">
                -85%
              </div>
              <p className="text-sm font-bold text-slate-800">
                de dépenses en carburant
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Retour sur investissement réalisé en 15 mois d'exploitation continue.
              </p>
              <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-center justify-center gap-2 text-xs font-semibold text-amber-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Installation hybride 30 kWc + Stockage 48 kWh
              </div>
            </div>
          </div>
        </div>

        {/* Dual Marquee Reviews */}
        <div className="marquee-container relative w-full overflow-hidden space-y-6 mask-radial py-4">
          {/* Row 1 - Left Marquee */}
          <div className="animate-marquee-left flex items-stretch gap-6">
            {[...REVIEWS_ROW1, ...REVIEWS_ROW1].map((review, i) => (
              <div
                key={`r1-${i}`}
                className="w-80 sm:w-96 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-card hover:border-amber-400/80 transition-all duration-300 flex flex-col justify-between shrink-0 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${review.tagColor}`}>
                      {review.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {review.quote}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${review.avatarBg}`}>
                      {review.initials}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {review.name}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {review.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {review.city}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 - Right Marquee */}
          <div className="animate-marquee-right flex items-stretch gap-6">
            {[...REVIEWS_ROW2, ...REVIEWS_ROW2].map((review, i) => (
              <div
                key={`r2-${i}`}
                className="w-80 sm:w-96 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-card hover:border-amber-400/80 transition-all duration-300 flex flex-col justify-between shrink-0 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${review.tagColor}`}>
                      {review.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {review.quote}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${review.avatarBg}`}>
                      {review.initials}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {review.name}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {review.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {review.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
