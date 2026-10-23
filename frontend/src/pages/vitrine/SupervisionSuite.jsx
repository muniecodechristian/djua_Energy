import React, { useState } from 'react';

const TABS = [
  { id: 1, label: 'Supervision Plateforme' },
  { id: 2, label: "Centre d'alertes & IA" },
  { id: 3, label: 'Contrôleur Djua Hub & Hardware' },
];

export default function SupervisionSuite() {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <section className="py-28 md:py-36 bg-white" data-purpose="product-suite" id="supervision">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Une suite tout-en-un pour piloter l'autonomie électrique
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            Fini les installations artisanales aveugles. Djua connecte votre matériel sur site à un cockpit cloud intelligent accessible partout, même en zone à faible réseau.
          </p>
        </div>

        {/* Segmented Interactive Switcher */}
        <div className="flex justify-center mb-8 overflow-x-auto pb-2" role="tablist">
          <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl gap-1.5 border border-slate-200 shadow-sm">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'tab-active-btn text-slate-900 bg-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Showcase Container */}
        <div className="relative bg-slate-50/80 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm overflow-hidden min-h-[580px]">
          {/* Panel 1: Supervision Plateforme */}
          {activeTab === 1 && (
            <div className="dj-tab grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                  Visibilité chirurgicale sur chaque panneau, batterie et onduleur
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Consultez en temps réel les courbes d'ensoleillement, la puissance injectée, le taux de décharge des accumulateurs LiFePO4 et les économies de carburant cumulées.
                </p>
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      Calcul automatique des émissions de CO₂ évitées en RDC (34.6 kg/j)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      Suivi précis du State-of-Charge (96.8% SoC) et équilibrage dynamique
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      Rapports certifiés PDF et Excel en un clic pour la direction financière
                    </span>
                  </div>
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                    Signal GSM 4G actif (Moy. 142ms)
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                    Télémétrie satellitaire vérifiée
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="group relative bg-white p-2 sm:p-3 rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMS4G_gktyCywu5MMFniLgjIBvW_ouMTcW-wOscU5dRmA0fo7LeLqNP1o5vhu08zJLaVyexYD0piq03tlrYbm6tAtjRqvd4FxyWKDASR_gHc7yZ9qdO-yTgGLycSs-RzzSylEM3pV6t_FUA_eYH4EX2sUZYcPRaiiJc_keybRwBRHIn4UaSNqyfCVHlZh-NHhchjTAHIL9A59WrkJBvZOkDd9CK8Oc0DCesCstmcPdR2awS7kVoftud905Dc7O8lIAztE"
                    alt="Supervision du Parc Solaire Djua"
                    className="w-full h-auto rounded-xl object-contain shadow-xs transform group-hover:scale-[1.01] transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Panel 2: Centre d'alertes & IA */}
          {activeTab === 2 && (
            <div className="dj-tab grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Indice de confiance 96% • Copilot IA
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                  Diagnostic prédictif Copilot &amp; astreinte technique immédiate
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Le moteur IA analyse les micro-variations de tension en amont. En cas de dysfonctionnement thermique ou de surcharge inhabituelle, nos ingénieurs sont alertés instantanément.
                </p>
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      Détection automatique des baisses de tension critiques en fin de nuit (&lt; 23.4V)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      Bouton de contact direct du technicien d'astreinte sous contrat (SLA &lt; 4h)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      Journalisation télémétrique des incidents avec validation par QR code
                    </span>
                  </div>
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                    Astreinte Kinshasa &amp; Katanga
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                    99.2% de disponibilité opérationnelle
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="group relative bg-white p-2 sm:p-3 rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu-hCQ4il5XinaMjWmKG0oqWhRyDZzEp-5_LmoLJXU-7Tqit9ivDtXxaU66OaqJsVt8K-sAadQrtIcdObJxeHiPSGbuFiSSl79EQVBmfyweEp2yEZnsscKuhUs-uEJvPeXD_OSDtgGyuwlTZmIEF7WYuGXeNoRdBLked_gjoUNis6i1B8hqDRoKr_hMHZ9SzzCV5ubn5cNwseVySMKymaTKxazO9KH_O-eAUyaoSpTB3rXp8mcfmDQ0ULmIWSuJalJCAg"
                    alt="Centre d'alertes Djua Copilot"
                    className="w-full h-auto rounded-xl object-contain shadow-xs transform group-hover:scale-[1.01] transition-transform duration-300"
                  />
                  <div className="absolute bottom-5 right-5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Diagnostic IA Actif • Incident résolu en 1h15
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Panel 3: Contrôleur Djua Hub & Hardware */}
          {activeTab === 3 && (
            <div className="dj-tab grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Hardware Tropicalisé Breveté • Smart Solar Hub
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                  Le cœur névralgique conçu pour le climat équatorial de la RDC
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Fini les coupures lors des tempêtes et surtensions de réseau. Le boîtier Djua Hub intègre un convertisseur DC haute efficience, des protections parafoudres de pointe et une télémétrie double antenne GSM &amp; Satellite.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-400 font-bold uppercase">Connectivité</p>
                    <p className="font-bold text-slate-900 text-sm mt-1">4G LTE + Satellite</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-400 font-bold uppercase">Chimie Batterie</p>
                    <p className="font-bold text-slate-900 text-sm mt-1">LiFePO4 48V (6000+ cyl.)</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-400 font-bold uppercase">Boîtier</p>
                    <p className="font-bold text-slate-900 text-sm mt-1">Protection IP65 Étanche</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-400 font-bold uppercase">Installation</p>
                    <p className="font-bold text-slate-900 text-sm mt-1">Plug &amp; Play &lt; 3 heures</p>
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-800">
                    Contrôle DC Hub
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800">
                    Garantie 10 ans
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col items-center justify-center gap-4">
                <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 p-3 sm:p-4 border border-slate-800 shadow-2xl group">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxpkf7ZiysGVJ2AzRTzqMviQ8dD9RosCGIegjE68anjCXDiEf5zqE4GktFS4_yvIJy439UKA9D3ZpLlI6JXNlVdjPkZoCLpfSdqDTGeKy088ClfJfgL_6etvYfNq5Bgu9HtnSmnBbMOOE5wqKyTw3BscicIAdmGcxRgB42ZCRL8kkeafuo2CjFxlc4ub419s2Itsnj_3cJEQ0wHQh_bmComBurtd5ndx8I7o6GCdRhqpKe3UcyG6iXeKHFmjnS5q8pDFI"
                    alt="Contrôleur Solaire Djua Hub sur site"
                    className="w-full h-auto max-h-[460px] object-cover rounded-xl shadow-lg transform group-hover:scale-[1.01] transition-transform duration-500"
                  />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-white text-left">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-amber-400 animate-ping" />
                      <div>
                        <div className="text-xs font-medium text-slate-300">
                          Boîtier Djua Hub Tropicalisé
                        </div>
                        <div className="text-sm font-bold text-white">
                          Convertisseur DC &amp; Télémétrie GSM Satellite Active
                        </div>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-400/30">
                      48V LiFePO4
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
