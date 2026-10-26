import React, { useState } from 'react';
import StudentCard from "./student-cards/StudentCard";
import StudentCardOfficial from "./student-cards/StudentCardOfficial";
import StudentCardPremium from "./student-cards/StudentCardPremium";

export default function CardStyleOnboarding({ onSelect }) {
  const [selected, setSelected] = useState('');

  const styles = [
    { id: 'classique', name: 'Standard', component: <StudentCard />, desc: 'Simple, efficace, idéal pour une gestion rapide.' },
    { id: 'officiel', name: 'Officiel RDC', component: <StudentCardOfficial />, desc: 'Style administratif aux normes du Ministère.' },
    { id: 'premium', name: 'Premium', component: <StudentCardPremium />, desc: 'Look moderne, élégant, pour une image de marque forte.' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Personnalisez votre identité scolaire</h2>
        <p className="text-gray-500">Choisissons le style de carte qui correspond le mieux à votre école.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {styles.map((style) => (
          <div 
            key={style.id}
            onClick={() => setSelected(style.id)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selected === style.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
          >
            <div className="scale-[0.4] origin-top pointer-events-none overflow-hidden h-[300px]">
  {/* Le composant de carte sera automatiquement réduit à 40% de sa taille */}
  {style.component} 
</div>
            <h3 className="font-bold text-gray-900">{style.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{style.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={() => onSelect(selected)}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          Confirmer ce style pour mon école
        </button>
      </div>
    </div>
  );
}