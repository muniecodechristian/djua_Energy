import React from 'react';

export default function ControlFeatures({ onOpenPilot }) {
  return (
    <section
      className="py-20 md:py-28 bg-white border-t border-slate-100"
      id="controle-total"
      data-purpose="controle-total-features"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 md:mb-20 max-w-4xl">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">
            Contrôle<br className="hidden sm:inline" /> total
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
            Supervisez chaque watt, automatisez vos bascules et sécurisez votre approvisionnement énergétique en temps réel dans toute la RDC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {/* Feature 1 */}
          <div className="space-y-3.5">
            <div className="text-amber-500 mb-4 inline-flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Activité de la flotte
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Suivez chaque kilowattheure et l'état de charge de vos batteries au sein de vos sites en temps réel grâce à un journal d'événements certifié.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-3.5">
            <div className="text-amber-500 mb-4 inline-flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Autorisations &amp; Rôles
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Définissez exactement les droits de télécommande des inverseurs et délestages par technicien, superviseur ou administrateur.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="space-y-3.5">
            <div className="text-amber-500 mb-4 inline-flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Supervision humaine &amp; IA
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Validez les recommandations du Djua Copilot avant bascule automatique ou laissez le système opérer en mode simulation autonome.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="space-y-3.5">
            <div className="text-amber-500 mb-4 inline-flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Centre d'économies &amp; Carburant
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Suivez l'amortissement face au groupe électrogène, les dépenses en gasoil évitées par site et définissez des seuils d'alerte.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="space-y-3.5">
            <div className="text-amber-500 mb-4 inline-flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Propriété intégrale des données
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Vous conservez la pleine propriété de votre télémétrie énergétique, des historiques de production et des rapports d'audit.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="space-y-3.5">
            <div className="text-amber-500 mb-4 inline-flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Aucune dépendance réseau externe
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Vos automates fonctionnent en circuit local même en cas de coupure Internet ou GSM grâce à la mémoire tampon embarquée.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenPilot}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 hover:text-white shadow-soft transition-all duration-200 text-sm cursor-pointer"
            >
              Démarrer un essai pilote
            </button>
            <a
              href="tel:+243850000000"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all duration-200 text-sm"
            >
              Planifier une démo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
