import React, { useState, useRef } from 'react';

const CARDS = [
  {
    id: 'supervision',
    category: 'Supervision Cloud',
    tag: 'Télémétrie GSM & Satellite',
    subtag: '14 Kits Connectés',
    title: 'Supervision du Parc Solaire RDC',
    description: "Monitoring instantané de la production PV, courbes d'ensoleillement et état de charge des batteries LiFePO4.",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiNxlTi51y2tmnbFYaiJ8ifoxVDr0hkdhtgOX_pKRXIssUmoA-o5wvASVZWWGC4gfRruPEsVQmUMw1I5yr5B3tycqDIi2zN1JLEOtowfahRoRo0CzNTgwrv1fdq_DYZkHbvSEo49cJCCVR6vOAlNA_6mYiZdyTf7WVRLDaLtAPNSMWTKS39wIfcax2h8tPoW_GHk4oUjinA3XcyeQCOjT_sdhjMM-b2iTSpRkcqKHZYxyy7KLBDL7xqgHfyoCosrmZgVY',
    liveBadge: 'Cockpit Supervision Live',
    liveColor: 'bg-emerald-400',
  },
  {
    id: 'alertes',
    category: 'Copilot & Alertes',
    tag: 'Prédictif 96%',
    subtag: 'Alerte Critique Résolue',
    title: "Centre d'Alertes & Astreinte Technique",
    description: "Diagnostic automatique en amont des baisses de tension nocturnes et assignation directe aux équipes d'intervention.",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxJeDyx07NxkJogo3wezhNWuU6ggG1Jwv5U4m6NVU-CQfRluwcRj9hJjm7DTLuH4bZDVpmwQkXaFRX4mIy-2HqH5fNkJ2UKSbSj6mIHH4uzcEy_yOlPJQ3aKt88umW2MGGGXMdXNN5SrfIMLa8F31zSuGuiIKvBCW8XbPDV5ep9K3pJt7ETm4ok6Bw_QZ4wCQM4EC06nNZ0VHGeYNw8BNOvLbV0FvKKS85X5Ty9KNIXwT9nQFUw1xu36wW0k6itbbqbuU',
    liveBadge: 'IA Copilot & Diagnostic',
    liveColor: 'bg-amber-400',
  },
  {
    id: 'hardware',
    category: 'Matériel Hub Pro',
    tag: '48V LiFePO4',
    subtag: 'Garantie 10 ans',
    title: 'Contrôleur Djua Hub Pro & DC Hub',
    description: 'Convertisseur DC haute efficacité, parafoudre renforcé et double connectivité GSM & Satellite intégrée.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_6K9C2uWqz723ZgDJkcMNHEGloLIpz_if81bcIlXmgifNDQ6CfiMa6QlCc59uE8VKPSWHv2tUWCHZGI2Geg4xXj5_UhYlsTKca57wMtF_dLZqaccqizK2mOKDGtr_CiNyWmo2h0k_rrdtkbKzTyJpNqUwQOsMhB_oXbs6R35Q3BXx3394zEqcqSzWR_naVxBVrWhwRjSjNFBOeFRaCGh_FxmSV9QweJvSPe-FoJKIa22vUDjbaQdusxgEkUW4QkJ-mBM',
    liveBadge: 'Hardware Tropicalisé',
    isSingleProduct: true,
  },
  {
    id: 'mobile',
    category: 'App Mobile Terrain',
    tag: 'Opérations RDC',
    subtag: 'NFC & QR Code',
    title: 'Espace Technicien de Maintenance',
    description: "Identification rapide par badge ou QR, clôture instantanée des fiches d'intervention sur site sans papier.",
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCuTU67xQ9Cd5eqoVEAOjqLjU5oyhU01idm4fOnvEEuRg02NK7L9owHw8ubI6BUbeYLVv4mAbNu5_wnKetQuC9u39H9t9-3Qt9rRgNpogQpSaYCQqk_ZNyetpCwTaoL0ZP-q1j7Uo4yd7W4DgMBGiOET2QLgXoU44MsQ8oVyrfZedWSNiMdbmWzw8vwrOyiT06nw_cXtO3yjGfeQAFOvSamn4dJBLaxDLEH6rRsFTD3JSHOFpzstmTcHpL9ge3j0UylROg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBM_dgik3vj2rx6FZ_8CszV07Mt5Z9eyJCrFBXTFv_dlRlY2rAShFUTaccYUMGBfMohMjjECH2vXyA5niQFGLSG8u-JPn0Jkd7FOPIHHR7Ds2YJrKrnojzeVnQvU6FXzn98Chf5MZB44xSSu8Nb4dWMZvtE8C_1tApZfobjCZ-ls6Ft05U7IECRX8MKU7mAy1G8vtalMMlL28O8JePozbG9ppOiigsAm0KwwfaZLIDxO1yhJrktA_M7QRKaISA_cqnTrGc',
    ],
    liveBadge: 'App Terrain iOS & Android',
    isMobilePair: true,
  },
  {
    id: 'resilience',
    category: 'Matériel Hub Pro',
    tag: 'Haute Résilience',
    subtag: 'Norme IP65',
    title: 'Résistance aux Conditions Extrêmes',
    description: 'Boîtier conçu pour dissiper la chaleur équatoriale sans ventilateur fragile et résister aux tempêtes tropicales.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK_zThBDRY6eGwJvWFSLt6bZ9hj06Xp1zkioVP7CCN-Bmp4wMowEPelk-zKcagLrukfI9uMwlj4tAxoDW5aHqSQaHj4J7KqI3zOc3v3jN3yzlpmFGhbt2ArFw4RCAdcXikrnem_p8H5ZspkerEclbOP-Q_VLRtHR82B_mi3G19uGU6-U8rOtdRtAuvEM_U75jjz2_vp-XF23M6e_vHbCLQttyplKZAKDL8UaW4wYmYtlaDf4D4Ry1T8vm773pUPM32_Cg',
    liveBadge: 'Déploiement Extérieur',
    badgeType: 'amber',
  },
];

const TABS = [
  'Vue Complète',
  'Supervision Cloud',
  'Copilot & Alertes',
  'Matériel Hub Pro',
  'App Mobile Terrain',
];

export default function EcosystemTabs() {
  const [activeTab, setActiveTab] = useState('Vue Complète');
  const trackRef = useRef(null);

  const filteredCards = activeTab === 'Vue Complète'
    ? CARDS
    : CARDS.filter((c) => c.category === activeTab);

  const displayCards = activeTab === 'Vue Complète'
    ? [...CARDS, ...CARDS]
    : filteredCards;

  return (
    <section
      className="py-28 md:py-36 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-100 overflow-hidden"
      id="ecosysteme-monday"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Plus de maîtrise, avec vos installations et vos agents IA réunis
        </h2>
        <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Faites évoluer vos installations en continu 24 h/24 et 7 j/7 grâce au couplage en temps réel entre matériel connecté, cockpit cloud et IA opérationnelle.
        </p>

        {/* Filter Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'tab-active-btn text-slate-900'
                    : 'text-slate-600 bg-white border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {isActive && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="mt-14 relative w-full mask-radial overflow-x-auto py-4 scrollbar-none">
        <div
          ref={trackRef}
          className="carousel-track flex items-stretch gap-6 pl-6 cursor-grab active:cursor-grabbing"
          style={{ width: 'max-content' }}
        >
          {displayCards.map((card, idx) => (
            <div
              key={`${card.id}-${idx}`}
              className="w-[360px] sm:w-[460px] shrink-0 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-4">
                {card.isSingleProduct ? (
                  <div className="bg-gradient-to-tr from-slate-50 via-amber-50/30 to-white flex items-center justify-center p-4">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-64 w-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : card.isMobilePair && card.images ? (
                  <div className="bg-slate-900 border border-slate-800 flex items-center justify-center gap-3 p-4">
                    <img
                      src={card.images[0]}
                      alt={card.title}
                      className="h-64 w-auto object-contain rounded-xl shadow-md transform group-hover:-translate-y-1 transition-transform duration-300"
                    />
                    <img
                      src={card.images[1]}
                      alt="Connexion Technicien Terrain Djua"
                      className="h-64 w-auto object-contain rounded-xl shadow-md transform group-hover:translate-y-1 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-64 object-cover object-top transform group-hover:scale-[1.02] transition-transform duration-500"
                  />
                )}

                {/* Floating badge */}
                {card.liveBadge && (
                  <div
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
                      card.badgeType === 'amber'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md border-amber-400'
                        : 'bg-slate-950/80 backdrop-blur-md text-white border-white/10'
                    }`}
                  >
                    {card.liveColor && (
                      <span className={`w-2 h-2 rounded-full ${card.liveColor} animate-pulse`} />
                    )}
                    {card.badgeType === 'amber' && (
                      <span className="w-2 h-2 rounded-full bg-slate-950" />
                    )}
                    {card.liveBadge}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    {card.tag}
                  </span>
                  {card.subtag && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        card.subtag.includes('10 ans') || card.subtag.includes('Connectés')
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-200/60'
                          : card.subtag.includes('QR Code')
                          ? 'text-blue-700 bg-blue-50 border-blue-200/60'
                          : card.subtag.includes('IP65')
                          ? 'text-slate-700 bg-slate-100 border-slate-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200/60'
                      }`}
                    >
                      {card.subtag}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
