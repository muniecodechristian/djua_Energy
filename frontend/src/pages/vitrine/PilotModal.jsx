import React, { useState } from 'react';

export default function PilotModal({
  isOpen,
  onClose,
  preselectedPlan = 'Pro & PME',
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+243 ');
  const [city, setCity] = useState('Kinshasa');
  const [segment, setSegment] = useState(preselectedPlan);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-bold">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Demande enregistrée !</h3>
            <p className="text-slate-600 text-sm max-w-sm mx-auto">
              Notre équipe d'ingénieurs basée à Kinshasa Gombe vous recontacte sous 2 heures ouvrées pour configurer votre essai pilote.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Essai Pilote sans engagement
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Démarrer votre pilote solaire Djua
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Bénéficiez d'une étude d'ensoleillement et d'une installation test supervisée 24/7 en RDC.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nom complet / Société
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Patrick Mwemba (Supermarché Express)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Numéro Téléphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+243 850 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ville / Province
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 bg-white"
                  >
                    <option value="Kinshasa">Kinshasa</option>
                    <option value="Lubumbashi">Lubumbashi (Haut-Katanga)</option>
                    <option value="Kolwezi">Kolwezi (Lualaba)</option>
                    <option value="Goma">Goma (Nord-Kivu)</option>
                    <option value="Autre RDC">Autre province</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Gamme ou intensité souhaitée
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 bg-white"
                >
                  <option value="Résidentiel & Villas">Résidentiel &amp; Villas (Kit 5kVA)</option>
                  <option value="Entreprises & Médical">Pro &amp; PME (10kVA - Zéro coupure)</option>
                  <option value="Industrie & Mini-Grids">Industrie &amp; Mini-Grids (50 kWc - 2 MWc)</option>
                  <option value="Santé & Établissements">Santé, Cliniques &amp; Maternités</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 hover:text-white shadow-soft transition-all duration-200 text-sm cursor-pointer"
                >
                  Valider ma demande d'essai pilote
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-400 mt-2">
                Assistance téléphonique directe : +243 850 000 000 (Gombe, Kinshasa)
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
