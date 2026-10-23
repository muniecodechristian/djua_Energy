import React from 'react';

const PARTNERS = [
  { name: 'Vodacom Congo', dotColor: 'bg-red-600' },
  { name: 'Rawbank RDC', dotColor: 'bg-blue-700' },
  { name: 'Orange Énergie', dotColor: 'bg-orange-500' },
  { name: 'BGFIBank RDC', dotColor: 'bg-emerald-600' },
  { name: 'Bboxx RDC', dotColor: 'bg-sky-500' },
  { name: 'USAID Power Africa', dotColor: 'bg-blue-900' },
  { name: 'SNEL Projets Hybrides', dotColor: 'bg-amber-600' },
];

export const PartnersMarquee: React.FC = () => {
  return (
    <section className="py-12 bg-slate-50/70 border-b border-slate-200/60 overflow-hidden" data-purpose="partner-marquee">
      <div className="max-w-7xl mx-auto px-4 text-center mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Reconnu et adopté par les leaders de l'énergie et des télécoms en Afrique Centrale
        </p>
      </div>

      <div className="relative w-full mask-radial overflow-hidden py-2">
        <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
          {/* First loop */}
          <div className="flex items-center gap-12 text-slate-700 font-bold text-sm sm:text-base shrink-0">
            {PARTNERS.map((partner, idx) => (
              <div
                key={`p1-${idx}`}
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white shadow-xs border border-slate-200/60"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${partner.dotColor}`} />
                <span>{partner.name}</span>
              </div>
            ))}
          </div>

          {/* Duplicated items for seamless continuous marquee */}
          <div className="flex items-center gap-12 text-slate-700 font-bold text-sm sm:text-base shrink-0">
            {PARTNERS.map((partner, idx) => (
              <div
                key={`p2-${idx}`}
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white shadow-xs border border-slate-200/60"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${partner.dotColor}`} />
                <span>{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
