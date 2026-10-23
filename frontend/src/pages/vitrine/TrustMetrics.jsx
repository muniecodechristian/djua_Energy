import React from 'react';

export default function TrustMetrics() {
  return (
    <section className="border-b border-slate-100 bg-white py-20 md:py-24" data-purpose="metrics-banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="pt-4 md:pt-0">
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              99.2%
            </p>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Disponibilité opérationnelle
            </p>
          </div>
          <div className="pt-4 md:pt-0">
            <p className="text-3xl lg:text-4xl font-extrabold text-amber-500 tracking-tight">
              &lt; 5 min
            </p>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Détection &amp; diagnostic IA
            </p>
          </div>
          <div className="pt-4 md:pt-0">
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              -80%
            </p>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Dépenses en gasoil évitées
            </p>
          </div>
          <div className="pt-4 md:pt-0">
            <p className="text-3xl lg:text-4xl font-extrabold text-emerald-600 tracking-tight">
              24/7
            </p>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Supervision GSM &amp; Satellite
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
