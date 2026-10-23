import React, { useState } from 'react';

const FAQS = [
  {
    id: 'faq-1',
    question: "En quoi l'approche pré-dimensionnée Djua est-elle différente ?",
    answer:
      "Contrairement aux installations artisanales non normalisées, nos solutions sont pré-câblées et testées en usine selon les normes de protection parafoudre et thermique adaptées au climat équatorial de la RDC. Le raccordement sur site s'effectue en quelques heures, sans aucun risque d'échauffement ou de court-circuit.",
  },
  {
    id: 'faq-2',
    question: "Combien d'argent puis-je économiser par rapport à un groupe électrogène ?",
    answer:
      "En moyenne, un client commercial à Kinshasa réduit sa facture de carburant de 65% à 85%. Avec un litre de gasoil avoisinant 1.5$ et des heures d'usage prolongées, le retour sur investissement d'un kit Djua s'opère généralement entre 14 et 24 mois.",
  },
  {
    id: 'faq-3',
    question: 'Quelle est la durée de vie des batteries et des panneaux ?',
    answer:
      'Nous utilisons exclusivement des cellules Lithium Fer Phosphate (LiFePO4) garantissant plus de 6 000 cycles à 80% de décharge (soit plus de 10 à 12 ans d\'usage quotidien). Nos panneaux solaires monocristallins sont garantis sur une performance minimale de 25 ans.',
  },
  {
    id: 'faq-4',
    question: 'Peut-on faire évoluer le système au fur et à mesure que la consommation augmente ?',
    answer:
      "Absolument. L'architecture modulaire du contrôleur intelligent Djua permet d'ajouter des modules de batteries LiFePO4 supplémentaires ou d'adjoindre de nouveaux strings photovoltaïques sans devoir remplacer l'infrastructure centrale existante.",
  },
  {
    id: 'faq-5',
    question: 'Assurez-vous la maintenance et le suivi technique à distance ?',
    answer:
      'Oui. Chaque boîtier Djua est muni d\'une carte SIM industrielle multi-opérateurs et d\'un lien satellite de secours. Notre centre d\'astreinte basé à Kinshasa Gombe surveille l\'installation 24h/24 et intervient sous 4h en cas d\'alerte critique.',
  },
];

export const Faq: React.FC = () => {
  // First item open by default like in original HTML
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-1': true });

  const toggle = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200/80" data-purpose="faq-accordion" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">
            Foire Aux Questions
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Tout ce que vous devez savoir sur la solution solaire intégrée Djua.
          </p>
        </div>

        {/* Accordion Items */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = !!openIds[faq.id];
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full text-left p-6 font-semibold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transform transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 9l-7 7-7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed dj-tab">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
