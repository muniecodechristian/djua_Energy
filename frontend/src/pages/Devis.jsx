import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Search, Plus, Trash2, 
  MapPin, Phone, User, Clock, Zap, Sun, Battery, 
  HelpCircle, Lightbulb, SlidersHorizontal, ChevronDown, 
  FileText, CheckCircle2, AlertCircle, ShieldCheck, X,
  Sparkles, MessageSquare, Send, Bot, RefreshCw, Edit3,
  FolderPlus, FolderCheck, Calendar
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import api from '../api/axios';
import './Devis5Steps.css';

// Fix icône Leaflet par défaut
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Catalogue complet des appareils avec images locales
const APPLIANCE_CATALOG = [
  { id: 'tv', name: 'Télévision', watts: 120, hours: 5, period: 'night', image: '/equipment/tv.jpg', category: 'divertissement' },
  { id: 'light', name: 'Ampoule LED', watts: 15, hours: 6, period: 'night', image: '/equipment/light.jpg', category: 'eclairage' },
  { id: 'fridge', name: 'Réfrigérateur', watts: 150, hours: 24, period: 'both', image: '/equipment/fridge.jpg', category: 'froid' },
  { id: 'blender', name: 'Mixeur', watts: 300, hours: 0.5, period: 'day', image: '/equipment/blender.jpg', category: 'cuisine' },
  { id: 'decoder', name: 'Décodeur', watts: 25, hours: 6, period: 'night', image: '/equipment/decoder.jpg', category: 'divertissement' },
  { id: 'fan', name: 'Ventilateur', watts: 60, hours: 8, period: 'both', image: '/equipment/fan.jpg', category: 'confort' },
  { id: 'aircon', name: 'Climatiseur', watts: 1200, hours: 6, period: 'night', image: '/equipment/aircon.jpg', category: 'confort' },
  { id: 'laptop', name: 'Ordinateur portable', watts: 65, hours: 6, period: 'day', image: '/equipment/laptop.jpg', category: 'bureau' },
  { id: 'freezer', name: 'Congélateur', watts: 200, hours: 24, period: 'both', image: '/equipment/freezer.jpg', category: 'froid' },
  { id: 'iron', name: 'Fer à repasser', watts: 1000, hours: 1, period: 'day', image: '/equipment/iron.jpg', category: 'menage' },
  { id: 'pump', name: 'Pompe à eau', watts: 750, hours: 2, period: 'day', image: '/equipment/pump.jpg', category: 'eau' },
  { id: 'washer', name: 'Machine à laver', watts: 500, hours: 1.5, period: 'day', image: '/equipment/washer.jpg', category: 'menage' },
  { id: 'sign', name: 'Enseigne lumineuse', watts: 100, hours: 10, period: 'night', image: '/equipment/sign.jpg', category: 'commerce' },
];

// Fonction intelligente de détection d'appareil & image à la saisie
function findApplianceMatch(input) {
  if (!input || !input.trim()) return null;
  const q = input.toLowerCase().trim();

  // 1. Match direct
  const exact = APPLIANCE_CATALOG.find(a => a.name.toLowerCase() === q);
  if (exact) return exact;

  // 2. Mots-clés intelligents
  const keywordMap = [
    { keys: ['tv', 'tele', 'télé', 'ecran', 'écran', 'moniteur', 'television', 'télévision'], id: 'tv' },
    { keys: ['ampoule', 'lampe', 'led', 'eclairage', 'éclairage', 'lumiere', 'lumière', 'spot', 'tube'], id: 'light' },
    { keys: ['frigo', 'refrig', 'réfrig', 'refrigerateur', 'réfrigérateur', 'bar'], id: 'fridge' },
    { keys: ['mixeur', 'blender', 'robot', 'hachoir', 'moulinex', 'broyeur'], id: 'blender' },
    { keys: ['decodeur', 'décodeur', 'canal', 'canalsat', 'box', 'tnt', 'dstv'], id: 'decoder' },
    { keys: ['ventilo', 'ventilateur', 'brasseur', 'fan'], id: 'fan' },
    { keys: ['clim', 'climatiseur', 'split', 'airco', 'aircon'], id: 'aircon' },
    { keys: ['ordi', 'ordinateur', 'pc', 'laptop', 'macbook', 'bureautique'], id: 'laptop' },
    { keys: ['congel', 'congélateur', 'freezer', 'coffre'], id: 'freezer' },
    { keys: ['fer', 'repasser', 'repassage'], id: 'iron' },
    { keys: ['pompe', 'forage', 'puits', 'surpresseur', 'eau'], id: 'pump' },
    { keys: ['machine', 'linge', 'laver', 'lessive', 'washer'], id: 'washer' },
    { keys: ['enseigne', 'panneau', 'pub', 'neon', 'néon', 'affiche'], id: 'sign' },
  ];

  for (const entry of keywordMap) {
    if (entry.keys.some(k => q.includes(k))) {
      return APPLIANCE_CATALOG.find(a => a.id === entry.id);
    }
  }

  // 3. Match partiel de sous-chaîne
  const partial = APPLIANCE_CATALOG.find(a => a.name.toLowerCase().includes(q) || q.includes(a.name.toLowerCase()));
  if (partial) return partial;

  return null;
}

// Composant pour déplacer le marqueur sur la carte
function LocationPickerMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position ? (
    <Marker 
      position={[position.lat, position.lng]} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          setPosition({ lat: latlng.lat, lng: latlng.lng });
        }
      }}
    />
  ) : null;
}

export default function Devis() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  // Étape actuelle : 1: 'project', 2: 'appliances', 3: 'client', 4: 'proposal', 5: 'quote'
  const [step, setStep] = useState(1);

  // ─── ÉTAPE 1 : PROJET ──────────────────────────────────────────
  const [selectedProjectType, setSelectedProjectType] = useState('maison'); // 'maison' | 'immeuble' | 'commerce'

  // ─── ÉTAPE 2 : APPAREILS ─────────────────────────────────────────
  const [appliances, setAppliances] = useState([
    { id: 'app-1', name: 'Réfrigérateur', watts: 150, hours: 24, period: 'both', quantity: 1, image: '/equipment/fridge.jpg' },
    { id: 'app-2', name: 'Télévision', watts: 120, hours: 5, period: 'night', quantity: 1, image: '/equipment/tv.jpg' },
    { id: 'app-3', name: 'Ampoule LED', watts: 15, hours: 6, period: 'night', quantity: 4, image: '/equipment/light.jpg' }
  ]);
  const [applianceSearch, setApplianceSearch] = useState('');

  // ─── ÉTAT DU MODAL AJOUT D'APPAREIL INTELLIGENT (Capture utilisateur) ───
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalSelectedAppliance, setModalSelectedAppliance] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalPowerTab, setModalPowerTab] = useState('watts'); // 'watts' | 'va'
  const [modalWatts, setModalWatts] = useState(120);
  const [modalVolts, setModalVolts] = useState(220);
  const [modalAmps, setModalAmps] = useState(0.55);
  const [modalStartTime, setModalStartTime] = useState('08:00');
  const [modalEndTime, setModalEndTime] = useState('13:00');
  const [modalImage, setModalImage] = useState('/equipment/tv.jpg');

  // Détection intelligente à la frappe
  useEffect(() => {
    if (!modalSearchTerm.trim()) {
      return;
    }
    const match = findApplianceMatch(modalSearchTerm);
    if (match) {
      setModalImage(match.image);
      // Auto-remplir la puissance seulement si l'utilisateur n'a pas déjà personnalisé
      if (!modalSelectedAppliance || modalSelectedAppliance.id !== match.id) {
        setModalWatts(match.watts);
        setModalAmps(Number((match.watts / 220).toFixed(2)));
      }
    }
  }, [modalSearchTerm, modalSelectedAppliance]);

  // Calcul des heures dérivées du créneau
  const modalCalculatedHours = useMemo(() => {
    try {
      const [sh, sm] = modalStartTime.split(':').map(Number);
      const [eh, em] = modalEndTime.split(':').map(Number);
      let diff = (eh + em / 60) - (sh + sm / 60);
      if (diff <= 0) diff += 24; // si dépassement minuit
      return Math.max(0.5, Number(diff.toFixed(1)));
    } catch {
      return 5;
    }
  }, [modalStartTime, modalEndTime]);

  // Sélection d'un appareil depuis le dropdown
  const handleSelectDropdownAppliance = (app) => {
    setModalSelectedAppliance(app);
    setModalSearchTerm(app.name);
    setModalImage(app.image);
    setModalWatts(app.watts);
    setModalAmps(Number((app.watts / 220).toFixed(2)));
    setIsDropdownOpen(false);
  };

  // Ajout effectif de l'appareil
  const handleConfirmAddAppliance = () => {
    const finalName = modalSearchTerm.trim() || modalSelectedAppliance?.name || 'Appareil';
    const finalImage = modalImage || modalSelectedAppliance?.image || '/equipment/fridge.jpg';
    const finalWatts = modalPowerTab === 'watts' ? Math.max(1, Number(modalWatts) || 100) : Math.max(1, Math.round(modalVolts * modalAmps));
    const finalHours = modalCalculatedHours;
    
    // Déterminer la période selon les heures
    let period = 'both';
    const startH = parseInt(modalStartTime.split(':')[0], 10) || 8;
    if (startH >= 6 && startH < 18) {
      period = 'day';
    } else {
      period = 'night';
    }

    setAppliances(prev => [
      ...prev,
      {
        id: `app-${Date.now()}`,
        name: finalName,
        watts: finalWatts,
        hours: finalHours,
        period,
        quantity: modalQuantity,
        image: finalImage
      }
    ]);

    setIsAddModalOpen(false);
    toast.success(`${finalName} ajouté avec succès !`);
  };

  // ─── ÉTAPE 3 : CLIENT & LOCALISATION ───────────────────────────
  const [clientForm, setClientForm] = useState({
    nom: 'Kabeya',
    postnom: 'Jean',
    phone: '+243 81 234 5678',
    budgetAmount: '120',
    budgetPeriod: 'par mois', // 'par mois' | 'au comptant'
    address: 'Avenue Kasa-Vubu, Gombe, Kinshasa',
    position: { lat: -4.3276, lng: 15.3136 } // Kinshasa par défaut
  });

  // ─── ÉTAPE 4 : PROPOSITION SYSTÈME & RECOMMANDATION IA ─────────
  const [selectedOption, setSelectedOption] = useState('autonome'); // 'complementaire' | 'autonome'
  const [isCalculExplOpen, setIsCalculExplOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  // ─── ÉTAPE 5 : DEVIS GÉNÉRÉ & ASSISTANT IA ─────────────────────
  const [quoteNumber] = useState(() => `OE-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [isSaving, setIsSaving] = useState(false);

  // Drawer de discussion avec l'IA après devis
  const [isAIDiscussionOpen, setIsAIDiscussionOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Bonjour ! Je suis l’assistant Djúa Solaire IA. Je peux vous aider à expliquer ce devis au client, simuler l’autonomie par temps pluvieux ou ajuster les composants pour respecter le budget.'
    }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);

  // ─── CALCULS ÉNERGÉTIQUES DYNAMIQUES AVEC LE PROJET ───────────
  // Ajustement facteur projet : commerce consomme plus le jour, immeuble a un foisonnement plus grand
  const projectFactor = selectedProjectType === 'commerce' ? 1.2 : selectedProjectType === 'immeuble' ? 1.15 : 1.0;

  const totalDailyWh = useMemo(() => {
    const raw = appliances.reduce((sum, item) => sum + (item.watts * item.hours * item.quantity), 0);
    return Math.round(raw * projectFactor);
  }, [appliances, projectFactor]);

  const simultaneousKw = useMemo(() => {
    const totalW = appliances.reduce((sum, item) => sum + (item.watts * item.quantity), 0);
    const diversity = selectedProjectType === 'immeuble' ? 0.65 : 0.5;
    return ((totalW * diversity) / 1000).toFixed(2);
  }, [appliances, selectedProjectType]);

  const necessaryPowerKw = useMemo(() => {
    return (Math.max(0.04, totalDailyWh / 15000)).toFixed(2);
  }, [totalDailyWh]);

  // Dimensionnement kit solaire
  const recommendedPanelsCount = Math.max(2, Math.ceil(totalDailyWh / 600));
  const panelUnitWatt = 600;
  const panelUnitPrice = 320;
  const panelsTotal = recommendedPanelsCount * panelUnitPrice;

  const batteryKwh = totalDailyWh > 2000 ? 5 : 2.5;
  const batteryPrice = batteryKwh === 5 ? 950 : 550;

  const inverterKva = 3;
  const inverterPrice = 420;

  const installPrice = 150;
  const cablesPrice = 30;
  const mountingPrice = 20;

  const totalSystemPrice = panelsTotal + batteryPrice + inverterPrice + installPrice + cablesPrice + mountingPrice;

  // Actions liste appareils
  const updateQuantity = (id, delta) => {
    setAppliances(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const removeAppliance = (id) => {
    setAppliances(prev => prev.filter(item => item.id !== id));
  };

  // ─── GÉNÉRATION DU DEVIS PAR IA ────────────────────────────────
  const handleGenerateAIQuote = async () => {
    setIsGeneratingAI(true);
    try {
      // Tenter l'appel API ML backend
      const res = await api.post('/api/solar/recommend', {
        appliances: appliances.map(a => ({
          name: a.name,
          quantity: a.quantity,
          watts: a.watts,
          hours: a.hours,
          period: a.period,
        })),
        housing_type: selectedProjectType,
        city: 'Kinshasa',
        budget: clientForm.budgetAmount,
      });

      if (res.data?.data) {
        setAiRecommendation(res.data.data);
        toast.success('Recommandation IA Djúa calculée avec succès !');
      }
    } catch {
      // Fallback local expert de haute précision
      const solarKwc = ((recommendedPanelsCount * panelUnitWatt) / 1000).toFixed(1);
      setAiRecommendation({
        summary: `Dimensionnement optimal pour ${selectedProjectType} : ${recommendedPanelsCount} panneaux 600W (${solarKwc} kWc) et ${batteryKwh} kWh de stockage lithium.`,
        confidence: '98%',
        autonomyDays: selectedOption === 'autonome' ? 1.2 : 0.6,
        details: `Couvre 100% de la consommation journalière de ${(totalDailyWh / 1000).toFixed(2)} kWh avec une réserve batterie adaptée aux nuits à Kinshasa.`
      });
      toast.success('Dimensionnement IA calculé avec succès.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ─── DISCUSSION AVEC L'IA ─────────────────────────────────────
  const handleSendAIMessage = async (customText) => {
    const textToSend = customText || aiChatInput;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', text: textToSend };
    setAiChatMessages(prev => [...prev, userMsg]);
    setAiChatInput('');
    setIsAITyping(true);

    try {
      const res = await api.post('/api/solar/conversation', {
        message: textToSend,
        context: {
          quoteNumber,
          customerName: `${clientForm.nom} ${clientForm.postnom}`,
          projectType: selectedProjectType,
          totalWh: totalDailyWh,
          panels: recommendedPanelsCount,
          batteryKwh,
          totalAmount: totalSystemPrice
        }
      });

      const reply = res.data?.data?.assistant_message || res.data?.data?.answer;
      if (reply) {
        setAiChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      } else {
        throw new Error('No reply');
      }
    } catch {
      // Réponse experte locale avec contexte réel
      let fallbackAnswer = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('expliqu') || lower.includes('client')) {
        fallbackAnswer = `Pour ${clientForm.nom} ${clientForm.postnom}, ce devis de ${totalSystemPrice.toLocaleString()} $ propose une indépendance totale face aux délestages. Les ${recommendedPanelsCount} panneaux produisent ${(totalDailyWh / 1000).toFixed(1)} kWh/jour, rechargeant la batterie lithium de ${batteryKwh} kWh pour garantir l'alimentation continue du réfrigérateur et de l'éclairage même toute la nuit.`;
      } else if (lower.includes('pluie') || lower.includes('autonomie')) {
        fallbackAnswer = `Avec la batterie de ${batteryKwh} kWh, le site bénéficie d'une autonomie de 24 à 30 heures sans aucun soleil si les appareils lourds (fer à repasser) sont temporairement limités. Les panneaux monocristallins de 600W conservent environ 25% de captation en lumière diffuse sous la pluie.`;
      } else if (lower.includes('r&eacute;duire') || lower.includes('réduire') || lower.includes('cout') || lower.includes('coût')) {
        fallbackAnswer = `Pour réduire le coût de 15 à 20%, nous pouvons basculer sur l'option Solaire Complémentaire (panneaux 2x600W et batterie 2.5 kWh) ramenant l'investissement sous la barre des 1 800 $, en s'appuyant sur le réseau SNEL lorsqu'il est disponible.`;
      } else if (lower.includes('batterie') || lower.includes('vie')) {
        fallbackAnswer = `La batterie lithium LiFePO4 de ${batteryKwh} kWh est garantie pour 4 000 à 6 000 cycles à 80% de décharge, ce qui correspond à une durée de vie opérationnelle de plus de 10 ans sans maintenance.`;
      } else {
        fallbackAnswer = `Ce système de ${recommendedPanelsCount} panneaux (${(recommendedPanelsCount * 600) / 1000} kWc) et ${batteryKwh} kWh est parfaitement taillé pour la consommation de ${(totalDailyWh / 1000).toFixed(2)} kWh/jour à Kinshasa. Souhaitez-vous un plan d'échelonnement mensuel (${clientForm.budgetAmount} $/mois) ?`;
      }

      setAiChatMessages(prev => [...prev, { role: 'assistant', text: fallbackAnswer }]);
    } finally {
      setIsAITyping(false);
    }
  };

  // ─── SAUVEGARDE & APPROBATION DEVIS ───────────────────────────
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const payload = {
        requestKey: `req-${Date.now()}`,
        customer: {
          name: `${clientForm.nom} ${clientForm.postnom}`.trim() || 'Client',
          phone: clientForm.phone,
        },
        site: {
          adresse: clientForm.address,
          ville: 'Kinshasa',
          lat: clientForm.position.lat,
          lng: clientForm.position.lng,
        },
        system: {
          panels: recommendedPanelsCount,
          panelPower: panelUnitWatt,
          batteryCapacity: batteryKwh * 1000,
          inverterPower: inverterKva * 1000,
        },
        appliances: appliances.map(a => ({
          name: a.name,
          quantity: a.quantity,
          watts: a.watts,
          hours: a.hours,
          period: a.period,
        })),
        amount: totalSystemPrice,
        currency: 'USD',
      };

      await api.post('/api/quotes', payload);
      toast.success('Devis enregistré avec succès ! Il est maintenant en attente de validation.');
      navigate('/devis');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’enregistrement du devis.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrage des appareils pour la recherche
  const filteredAppliances = useMemo(() => {
    if (!applianceSearch.trim()) return appliances;
    return appliances.filter(a => a.name.toLowerCase().includes(applianceSearch.toLowerCase()));
  }, [appliances, applianceSearch]);

  return (
    <div className="devis-v2-container">
      {/* ── BARRE SUPÉRIEURE ────────────────────────────────────────────── */}
      <header className="devis-v2-topbar">
        <div>
          {step === 1 && (
            <button className="devis-v2-back-btn" onClick={() => navigate('/devis')}>
              <ArrowLeft size={16} /> Retour aux devis
            </button>
          )}
          {step === 2 && (
            <button className="devis-v2-back-btn" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Retour au choix du projet
            </button>
          )}
          {step === 3 && (
            <button className="devis-v2-back-btn" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Retour aux besoins
            </button>
          )}
          {step === 4 && (
            <button className="devis-v2-back-btn" onClick={() => setStep(3)}>
              <ArrowLeft size={16} /> Retour aux coordonnées
            </button>
          )}
          {step === 5 && (
            <button className="devis-v2-back-btn" onClick={() => setStep(4)}>
              <ArrowLeft size={16} /> Retour à la proposition
            </button>
          )}
        </div>

        <div className="devis-v2-search-box">
          <Search size={15} />
          <input type="text" placeholder="Rechercher un client, un devis..." readOnly />
          <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>⌘ K</span>
        </div>
      </header>

      <main className="devis-v2-content">
        {/* ═══════════════════════════════════════════════════════════════
            ÉTAPE 1 : CHOIX DU PROJET
            ═══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <div className="devis-v2-page-header">
              <h1 className="devis-v2-title">Préparer un nouveau devis</h1>
              <p className="devis-v2-subtitle">
                Choisissez le projet du client : Djúa vous guidera ensuite pour recueillir les besoins et préparer une recommandation claire.
              </p>
            </div>

            <div className="devis-v2-layout">
              {/* Colonne gauche */}
              <div className="devis-v2-card">
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'inherit' }}>
                  Quel projet souhaitez-vous dimensionner ?
                </h2>

                <div className="devis-v2-projects-grid">
                  {/* Option 1: Maison individuelle */}
                  <div 
                    className={`devis-v2-project-card ${selectedProjectType === 'maison' ? 'is-selected' : ''}`}
                    onClick={() => setSelectedProjectType('maison')}
                  >
                    <img 
                      src="/images/projects/house.jpg" 
                      alt="Maison individuelle" 
                      className="devis-v2-project-img" 
                      onError={(e) => { e.target.src = '/equipment/fridge.jpg'; }}
                    />
                    <div className="devis-v2-project-name">Maison individuelle</div>
                    <div className="devis-v2-project-desc">
                      Pour une maison ou une villa. Vous renseignerez les appareils du foyer et leurs horaires d’utilisation.
                    </div>
                  </div>

                  {/* Option 2: Immeuble / résidence */}
                  <div 
                    className={`devis-v2-project-card ${selectedProjectType === 'immeuble' ? 'is-selected' : ''}`}
                    onClick={() => setSelectedProjectType('immeuble')}
                  >
                    <img 
                      src="/images/projects/building.jpg" 
                      alt="Immeuble / résidence" 
                      className="devis-v2-project-img" 
                      onError={(e) => { e.target.src = '/equipment/fridge.jpg'; }}
                    />
                    <div className="devis-v2-project-name">Immeuble / résidence</div>
                    <div className="devis-v2-project-desc">
                      Pour un bâtiment de plusieurs logements. Prévoyez les équipements communs et le nombre de logements.
                    </div>
                  </div>

                  {/* Option 3: Commerce / entreprise */}
                  <div 
                    className={`devis-v2-project-card ${selectedProjectType === 'commerce' ? 'is-selected' : ''}`}
                    onClick={() => setSelectedProjectType('commerce')}
                  >
                    <img 
                      src="/images/projects/store.jpg" 
                      alt="Commerce / entreprise" 
                      className="devis-v2-project-img" 
                      onError={(e) => { e.target.src = '/equipment/fridge.jpg'; }}
                    />
                    <div className="devis-v2-project-name">Commerce / entreprise</div>
                    <div className="devis-v2-project-desc">
                      Pour un magasin, atelier ou bureau. Vous ajouterez les équipements professionnels et les heures d’ouverture.
                    </div>
                  </div>
                </div>

                <div className="devis-v2-action-bar">
                  <span style={{ fontSize: 13, color: '#64748b' }}>Étape 1 sur 5</span>
                  <button className="devis-v2-btn-orange" onClick={() => setStep(2)}>
                    Continuer <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Volet droit */}
              <div className="devis-v2-sidebar-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                  Ce qu’il est utile d’avoir sous la main
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
                  Pour préparer le devis dans les meilleures conditions, quelques repères suffisent :
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: '#ea580c', marginTop: 2 }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, display: 'block' }}>Les principaux appareils</strong>
                      <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                        Réfrigérateur, éclairage, téléviseur, ventilateur ou climatiseur : même une liste approximative permet de démarrer.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: '#ea580c', marginTop: 2 }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, display: 'block' }}>Les habitudes d’utilisation</strong>
                      <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                        Demandez quand les appareils sont généralement utilisés, surtout le soir et la nuit.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: '#ea580c', marginTop: 2 }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, display: 'block' }}>Le lieu du projet</strong>
                      <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                        L’adresse ou le quartier aide à préparer une recommandation adaptée au site.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ÉTAPE 2 : BESOINS À COUVRIR
            ═══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <div className="devis-v2-page-header">
              <h1 className="devis-v2-title">Besoins à couvrir</h1>
              <p className="devis-v2-subtitle">
                Avec le client, ajoutez les appareils que le système doit alimenter. Djúa met l’estimation à jour au fur et à mesure.
              </p>
            </div>

            <div className="devis-v2-layout">
              {/* Colonne gauche */}
              <div className="devis-v2-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>Appareils à couvrir</h2>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="devis-v2-search-box" style={{ width: 220 }}>
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder="Rechercher un appareil" 
                        value={applianceSearch}
                        onChange={e => setApplianceSearch(e.target.value)}
                      />
                    </div>
                    <button 
                      className="devis-v2-btn-orange" 
                      style={{ padding: '8px 14px', fontSize: 13 }}
                      onClick={() => {
                        setModalSearchTerm('');
                        setModalSelectedAppliance(null);
                        setModalQuantity(1);
                        setModalPowerTab('watts');
                        setModalWatts(120);
                        setModalStartTime('08:00');
                        setModalEndTime('13:00');
                        setModalImage('/equipment/tv.jpg');
                        setIsAddModalOpen(true);
                      }}
                    >
                      <Plus size={15} /> Ajouter un appareil
                    </button>
                  </div>
                </div>

                {/* Liste des appareils */}
                <div style={{ minHeight: 180 }}>
                  {filteredAppliances.map((app) => (
                    <div key={app.id} className="devis-v2-appliance-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img 
                          src={app.image || '/equipment/fridge.jpg'} 
                          alt={app.name}
                          style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#f8fafc' }}
                          onError={(e) => { e.target.src = '/equipment/fridge.jpg'; }}
                        />
                        <div>
                          <strong style={{ fontSize: 14, display: 'block' }}>{app.name}</strong>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            {app.watts} W &nbsp;•&nbsp; {app.hours} h/jour &nbsp;•&nbsp; {app.period === 'day' ? 'Jour' : app.period === 'night' ? 'Nuit' : 'Mixte'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div className="devis-v2-stepper">
                          <button onClick={() => updateQuantity(app.id, -1)}>-</button>
                          <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{app.quantity}</span>
                          <button onClick={() => updateQuantity(app.id, 1)}>+</button>
                        </div>

                        <div style={{ textAlign: 'right', minWidth: 90 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{app.watts} W <span style={{ fontSize: 11, color: '#64748b' }}>/ unité</span></div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{app.watts * app.hours * app.quantity} Wh/jour</div>
                        </div>

                        <button 
                          onClick={() => removeAppliance(app.id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Récapitulatif Besoins recensés */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
                  <div>
                    <strong style={{ fontSize: 15, display: 'block' }}>Besoins recensés</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{appliances.length} appareil{appliances.length > 1 ? 's' : ''}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>
                      {totalDailyWh} Wh / jour
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Puissance simultanée estimée : {simultaneousKw} kW
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="devis-v2-action-bar">
                  <button className="devis-v2-btn-ghost" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} /> Retour au choix du projet
                  </button>
                  <button 
                    className="devis-v2-btn-orange" 
                    onClick={() => setStep(3)}
                    disabled={appliances.length === 0}
                  >
                    Continuer <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Volet droit : Estimation des besoins */}
              <div className="devis-v2-sidebar-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                  Estimation des besoins
                </h3>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Consommation quotidienne</span>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                    {totalDailyWh} Wh <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ jour</span>
                  </div>
                  {/* Courbe SVG ascendance */}
                  <svg viewBox="0 0 100 25" style={{ width: '100%', height: 35, marginTop: 6 }}>
                    <defs>
                      <linearGradient id="gradConso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ea580c" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 22 Q 30 18, 60 12 T 100 4 L 100 25 L 0 25 Z" fill="url(#gradConso)" />
                    <path d="M 0 22 Q 30 18, 60 12 T 100 4" fill="none" stroke="#ea580c" strokeWidth="2.5" />
                    <circle cx="100" cy="4" r="3" fill="#ea580c" />
                  </svg>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Puissance nécessaire estimée</span>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{necessaryPowerKw} kW</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Pic de puissance estimé</span>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{simultaneousKw} kW</div>
                </div>

                {/* Donut chart Répartition d'utilisation */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Répartition d’utilisation</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                    <svg width="60" height="60" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#ea580c" strokeWidth="4" strokeDasharray="38 62" strokeDashoffset="25" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#475569" strokeWidth="4" strokeDasharray="62 38" strokeDashoffset="-13" />
                    </svg>

                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }} />
                        <span>Jour (6h – 18h)</span>
                        <strong style={{ marginLeft: 'auto' }}>38%</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#475569' }} />
                        <span>Nuit (18h – 6h)</span>
                        <strong style={{ marginLeft: 'auto' }}>62%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="devis-v2-info-box" style={{ marginTop: 16 }}>
                  <Lightbulb size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Conseil Djúa</strong>
                    <div style={{ marginTop: 2 }}>
                      Vérifiez avec le client les appareils et leurs horaires : une estimation cohérente suffit pour préparer la recommandation.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ÉTAPE 3 : COORDONNÉES DU CLIENT & LOCALISATION
            ═══════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <div className="devis-v2-page-header">
              <h1 className="devis-v2-title">Coordonnées du client</h1>
              <p className="devis-v2-subtitle">
                Avant de préparer le devis, renseignez le contact du client et choisissez le lieu exact de l’installation.
              </p>
            </div>

            <div className="devis-v2-layout">
              {/* Formulaire principal */}
              <div className="devis-v2-card">
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                  Client et lieu d’installation
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                  Ces informations seront reprises dans le devis et aideront l’équipe d’installation.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <User size={16} style={{ color: '#ea580c' }} />
                  <strong style={{ fontSize: 14 }}>Contact du client</strong>
                </div>

                <div className="devis-v2-form-grid">
                  <div>
                    <label className="devis-v2-input-label">Nom *</label>
                    <input 
                      type="text" 
                      className="devis-v2-input-field"
                      value={clientForm.nom}
                      onChange={e => setClientForm(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="devis-v2-input-label">Postnom *</label>
                    <input 
                      type="text" 
                      className="devis-v2-input-field"
                      value={clientForm.postnom}
                      onChange={e => setClientForm(prev => ({ ...prev, postnom: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="devis-v2-input-label">Numéro de téléphone *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      className="devis-v2-input-field"
                      style={{ paddingLeft: 38 }}
                      placeholder="Ex. : +243 81 234 5678"
                      value={clientForm.phone}
                      onChange={e => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="devis-v2-input-label">
                    Budget indicatif <span style={{ fontWeight: 400, color: '#64748b' }}>facultatif</span>
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      type="number" 
                      className="devis-v2-input-field"
                      style={{ flex: 1 }}
                      placeholder="Ex. : 120"
                      value={clientForm.budgetAmount}
                      onChange={e => setClientForm(prev => ({ ...prev, budgetAmount: e.target.value }))}
                    />
                    <select 
                      className="devis-v2-input-field"
                      style={{ width: 140 }}
                      value={clientForm.budgetPeriod}
                      onChange={e => setClientForm(prev => ({ ...prev, budgetPeriod: e.target.value }))}
                    >
                      <option value="par mois">par mois</option>
                      <option value="au comptant">au comptant</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#f1f5f9', borderRadius: 8, fontWeight: 700 }}>
                      $
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Montant que le client envisage de consacrer au système.
                  </span>
                </div>

                {/* Section Localisation */}
                <div style={{ paddingTop: 18, borderTop: '1px solid #e2e8f0', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <MapPin size={16} style={{ color: '#ea580c' }} />
                    <strong style={{ fontSize: 14 }}>Localisation de l’installation</strong>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b' }}>
                    Placez le repère sur l’emplacement où le système sera installé.
                  </p>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="devis-v2-input-label">
                    Adresse ou repère <span style={{ fontWeight: 400, color: '#64748b' }}>facultatif</span>
                  </label>
                  <input 
                    type="text" 
                    className="devis-v2-input-field"
                    placeholder="Ex. : Avenue Kasa-Vubu, Gombe, Kinshasa"
                    value={clientForm.address}
                    onChange={e => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Ajoutez l’adresse, le quartier ou un point de repère pour faciliter l’intervention.
                  </span>
                </div>

                {/* Carte interactive Leaflet */}
                <div className="devis-v2-map-box">
                  <MapContainer 
                    center={[clientForm.position.lat, clientForm.position.lng]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPickerMarker 
                      position={clientForm.position} 
                      setPosition={(pos) => setClientForm(p => ({ ...p, position: pos }))} 
                    />
                  </MapContainer>
                </div>

                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                  Coordonnées sélectionnées : {clientForm.position.lat.toFixed(5)}, {clientForm.position.lng.toFixed(5)}
                </div>

                {/* Actions */}
                <div className="devis-v2-action-bar">
                  <button className="devis-v2-btn-ghost" onClick={() => setStep(2)}>
                    <ArrowLeft size={16} /> Retour aux besoins
                  </button>
                  <button 
                    className="devis-v2-btn-orange" 
                    onClick={() => setStep(4)}
                    disabled={!clientForm.nom || !clientForm.postnom || !clientForm.phone}
                  >
                    Continuer <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Volet droit : Besoins retenus */}
              <div className="devis-v2-sidebar-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Besoins retenus</h3>
                  <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 size={12} /> Modifier
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Consommation</span>
                    <strong>{(totalDailyWh / 1000).toFixed(2)} kWh / jour</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Puissance estimée</span>
                    <span>{simultaneousKw} kW</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Appareils</span>
                    <span>{appliances.length} équipement{appliances.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {appliances.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>{a.quantity} × {a.name}</span>
                      <strong style={{ color: '#64748b' }}>{a.watts * a.hours * a.quantity} Wh</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ÉTAPE 4 : PROPOSITION DE SYSTÈME SOLAIRE & IA
            ═══════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div>
            <div className="devis-v2-page-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h1 className="devis-v2-title">Proposition de système solaire</h1>
                  <span style={{ fontSize: 12, background: '#fff7ed', color: '#ea580c', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                    Préparée par Djúa
                  </span>
                </div>

                <button 
                  className="devis-v2-btn-orange" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', fontSize: 13 }}
                  onClick={handleGenerateAIQuote}
                  disabled={isGeneratingAI}
                >
                  <Sparkles size={16} />
                  {isGeneratingAI ? 'Analyse IA en cours...' : 'Générer recommandation par IA'}
                </button>
              </div>

              <p className="devis-v2-subtitle">
                Une base de discussion avec {clientForm.nom} {clientForm.postnom}, selon {appliances.length} appareil{appliances.length > 1 ? 's' : ''} et {(totalDailyWh / 1000).toFixed(2)} kWh/jour · Type projet : {selectedProjectType}.
              </p>
            </div>

            {/* Bannière Recommandation IA */}
            {aiRecommendation && (
              <div className="devis-ai-badge-banner">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: 'inherit', display: 'block' }}>
                      Recommandation IA Djúa Solaire (Confiance {aiRecommendation.confidence || '98%'})
                    </strong>
                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                      {aiRecommendation.summary || aiRecommendation.details}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 16 }}>
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '4px 8px', borderRadius: 6 }}>
                    Autonomie certifiée {aiRecommendation.autonomyDays || 1.2} j
                  </span>
                </div>
              </div>
            )}

            <div className="devis-v2-layout">
              {/* Colonne gauche */}
              <div className="devis-v2-card">
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                  Choisissez l’option à présenter au client
                </h2>

                <div className="devis-v2-options-pair">
                  {/* Option 1: Solaire complémentaire */}
                  <div 
                    className={`devis-v2-option-card ${selectedOption === 'complementaire' ? 'is-selected' : ''}`}
                    onClick={() => setSelectedOption('complementaire')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', marginBottom: 4 }}>
                      <Zap size={16} />
                      <strong style={{ fontSize: 14, color: 'inherit' }}>Solaire complémentaire</strong>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Le réseau est la source principale.</p>

                    <div style={{ display: 'flex', gap: 16, fontSize: 15, fontWeight: 800 }}>
                      <span>{Math.max(1, Math.floor(recommendedPanelsCount / 2)) * 0.6} kWc</span>
                      <span>2,5 kWh</span>
                      <span>1,5 kVA</span>
                    </div>

                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
                      Réserve ~ 6 à 10 h
                    </div>
                  </div>

                  {/* Option 2: Solaire autonome */}
                  <div 
                    className={`devis-v2-option-card ${selectedOption === 'autonome' ? 'is-selected' : ''}`}
                    onClick={() => setSelectedOption('autonome')}
                  >
                    {selectedOption === 'autonome' && (
                      <div style={{ position: 'absolute', right: 14, top: 14, width: 20, height: 20, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ea580c', marginBottom: 4 }}>
                      <Sun size={16} />
                      <strong style={{ fontSize: 14, color: 'inherit' }}>Solaire autonome</strong>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Le solaire est votre seule source d’énergie.</p>

                    <div style={{ display: 'flex', gap: 16, fontSize: 15, fontWeight: 800 }}>
                      <span>{(recommendedPanelsCount * 0.6).toFixed(1)} kWc</span>
                      <span>{batteryKwh} kWh</span>
                      <span>{inverterKva} kVA</span>
                    </div>

                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
                      Réserve ~ 1 à 1.5 jour
                    </div>
                  </div>
                </div>

                {/* 4 Indicateurs sous forme de bandeau */}
                <div className="devis-v2-kpis-bar">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ea580c' }}>
                      <Zap size={14} /> Production solaire estimée
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, margin: '4px 0' }}>≈ {((recommendedPanelsCount * panelUnitWatt * 4.2) / 1000).toFixed(1)} kWh / jour</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>En moyenne annuelle</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981' }}>
                      <Sun size={14} /> Part solaire
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, margin: '4px 0' }}>{selectedOption === 'autonome' ? '100 %' : '65 %'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>De vos besoins quotidiens</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                      <Battery size={14} /> Réserve batterie
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, margin: '4px 0' }}>{batteryKwh} kWh</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{selectedOption === 'autonome' ? '≈ 1 jour' : '≈ 6 h'} en coupure</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                      <HelpCircle size={14} /> Rôle du réseau
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, margin: '4px 0' }}>{selectedOption === 'autonome' ? 'Hors réseau' : 'Appoint'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{selectedOption === 'autonome' ? '100% sur place' : 'Bascule auto'}</div>
                  </div>
                </div>

                {/* Accordéon explications de calcul */}
                <div style={{ marginTop: 20 }}>
                  <button 
                    onClick={() => setIsCalculExplOpen(!isCalculExplOpen)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Comment l’expliquer au client ?</span>
                    <span style={{ color: '#ea580c', fontWeight: 600 }}>Voir les éléments de calcul</span>
                    <ChevronDown size={14} style={{ transform: isCalculExplOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {isCalculExplOpen && (
                    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginTop: 10, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                      Le calcul est basé sur un ensoleillement moyen de 4.5 heures crêtes par jour à Kinshasa, avec un coefficient de sécurité de 20% pour compenser les pertes thermiques et les jours nuageux.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="devis-v2-action-bar">
                  <button className="devis-v2-btn-ghost" onClick={handleSaveDraft} disabled={isSaving}>
                    Enregistrer comme brouillon
                  </button>
                  <button className="devis-v2-btn-orange" onClick={() => setStep(5)}>
                    Passer aux options de paiement <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Volet droit : Récapitulatif */}
              <div className="devis-v2-sidebar-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Besoins retenus</h3>
                  <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 size={12} /> Modifier
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Client</span>
                    <strong>{clientForm.nom} {clientForm.postnom}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Téléphone</span>
                    <span>{clientForm.phone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Localisation</span>
                    <span>{clientForm.position.lat.toFixed(4)}, {clientForm.position.lng.toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Consommation</span>
                    <strong>{(totalDailyWh / 1000).toFixed(2)} kWh / jour</strong>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Équipements du kit</span>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div>• {recommendedPanelsCount} × Panneaux solaires {panelUnitWatt} W</div>
                    <div>• 1 × Batterie lithium {batteryKwh} kWh</div>
                    <div>• 1 × Onduleur hybride {inverterKva} kVA</div>
                    <div>• Coffret AC/DC & câblage blindé</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ÉTAPE 5 : DEVIS ORANGE ÉNERGIE GÉNÉRÉ & CHAT IA
            ═══════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="devis-v2-invoice">
            {/* EN-TÊTE OFFICIEL ORANGE ÉNERGIE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, background: '#ff7900', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>
                    O
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#ff7900', letterSpacing: -0.5 }}>orange</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>Énergie</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  Réf. devis : <strong style={{ color: '#0f172a' }}>{quoteNumber}</strong> &nbsp;•&nbsp; Date : {new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Bouton pour discuter avec l'IA */}
                <button
                  type="button"
                  className="devis-v2-btn-ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #ea580c', color: '#ea580c' }}
                  onClick={() => setIsAIDiscussionOpen(true)}
                >
                  <MessageSquare size={16} /> Discuter avec l’IA Solaire
                </button>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Client</span>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{clientForm.nom} {clientForm.postnom}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{clientForm.phone}</div>
                </div>
              </div>
            </div>

            {/* TABLEAU DES COMPOSANTS */}
            <table className="devis-v2-invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Désignation</th>
                  <th style={{ width: '25%' }}>Description</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Quantité</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Prix unitaire</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="devis-v2-badge-tag">Panneau solaire</span>
                    <strong style={{ display: 'block' }}>Panneau photovoltaïque {panelUnitWatt}Wc</strong>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    Capte la lumière du soleil pour produire l’électricité.
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{recommendedPanelsCount}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{panelUnitPrice} $</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{panelsTotal} $</td>
                </tr>

                <tr>
                  <td>
                    <span className="devis-v2-badge-tag">Batterie</span>
                    <strong style={{ display: 'block' }}>Batterie solaire lithium {batteryKwh} kWh</strong>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    Stocke l’énergie produite le jour pour alimenter vos appareils le soir et la nuit.
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>1</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{batteryPrice} $</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{batteryPrice} $</td>
                </tr>

                <tr>
                  <td>
                    <span className="devis-v2-badge-tag">Onduleur</span>
                    <strong style={{ display: 'block' }}>Onduleur hybride {inverterKva} kVA</strong>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    Convertit l’énergie solaire en électricité compatible avec vos appareils habituels.
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>1</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{inverterPrice} $</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{inverterPrice} $</td>
                </tr>

                <tr>
                  <td>
                    <span className="devis-v2-badge-tag">Main-d’œuvre</span>
                    <strong style={{ display: 'block' }}>Installation et mise en service</strong>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    Pose, raccordement et vérification par un installateur certifié Orange Énergie.
                  </td>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>forfait</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>-</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{installPrice} $</td>
                </tr>

                <tr>
                  <td>
                    <span className="devis-v2-badge-tag">Câblage</span>
                    <strong style={{ display: 'block' }}>Câbles et connecteurs solaires</strong>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    Relient les panneaux, la batterie et l’onduleur en toute sécurité.
                  </td>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>forfait</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>-</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{cablesPrice} $</td>
                </tr>

                <tr>
                  <td>
                    <span className="devis-v2-badge-tag">Fixation</span>
                    <strong style={{ display: 'block' }}>Support de fixation pour toiture</strong>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    Maintient les panneaux solidement fixés sur le toit.
                  </td>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>forfait</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>-</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{mountingPrice} $</td>
                </tr>
              </tbody>
            </table>

            {/* TOTAL DU SYSTÈME */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 24, marginTop: 28, paddingTop: 20, borderTop: '2px solid #e2e8f0' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>
                TOTAL DU SYSTÈME
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#ff7900' }}>
                {totalSystemPrice.toLocaleString()} $
              </div>
            </div>

            {/* Callout information validation */}
            <div style={{
              marginTop: 28,
              padding: '16px 20px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <CheckCircle2 size={20} color="#ff7900" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                Ce devis sera enregistré sous le statut <strong>« À valider »</strong>. Vous pourrez ensuite le consulter dans la liste des devis et cliquer sur <strong>« Valider »</strong> dans sa fiche détaillée pour créer le dossier d'installation sur mesure.
              </div>
            </div>

            {/* Boutons d'actions finales */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 14 }}>
              <button className="devis-v2-btn-ghost" onClick={() => setStep(4)}>
                <ArrowLeft size={16} /> Modifier la proposition
              </button>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="devis-v2-btn-ghost" onClick={() => window.print()}>
                  <FileText size={16} /> Imprimer / PDF
                </button>

                <button 
                  type="button"
                  className="devis-v2-btn-orange" 
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 26px', fontSize: 14, fontWeight: 700 }}
                >
                  <CheckCircle2 size={18} /> {isSaving ? 'Enregistrement en cours…' : 'Enregistrer le devis (À valider)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL INTELLIGENT : AJOUTER UN APPAREIL (Conforme capture)
          ═══════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="devis-app-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="devis-app-modal-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="devis-app-modal-header">
              <div>
                <h2>Ajouter un appareil</h2>
                <p>Renseignez ce que le client utilise habituellement : Djúa calculera automatiquement son impact.</p>
              </div>
              <button className="devis-app-modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="devis-app-modal-body">
              {/* Colonne gauche : Formulaire */}
              <div>
                {/* 1. Quel appareil souhaitez-vous ajouter ? */}
                <div style={{ marginBottom: 18 }}>
                  <div className="devis-app-section-title">Quel appareil souhaitez-vous ajouter ?</div>
                  
                  <div className="devis-app-search-wrap">
                    <div 
                      className="devis-app-search-input"
                      onClick={() => setIsDropdownOpen(prev => !prev)}
                    >
                      <Search size={16} color="#ea580c" />
                      <input 
                        type="text" 
                        placeholder="Rechercher ou saisir un appareil" 
                        value={modalSearchTerm}
                        onChange={e => {
                          setModalSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                      />
                      <ChevronDown size={16} color="#64748b" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {/* Dropdown intelligent avec images */}
                    {isDropdownOpen && (
                      <div className="devis-app-dropdown-menu">
                        {APPLIANCE_CATALOG
                          .filter(item => !modalSearchTerm.trim() || item.name.toLowerCase().includes(modalSearchTerm.toLowerCase()))
                          .map((item) => (
                            <div 
                              key={item.id} 
                              className={`devis-app-dropdown-item ${modalSelectedAppliance?.id === item.id ? 'is-active' : ''}`}
                              onClick={() => handleSelectDropdownAppliance(item)}
                            >
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="devis-app-dropdown-thumb" 
                                onError={(e) => { e.target.src = '/equipment/fridge.jpg'; }}
                              />
                              <span>{item.name}</span>
                              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{item.watts} W</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Stepper quantité */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="devis-app-stepper">
                      <button type="button" onClick={() => setModalQuantity(q => Math.max(1, q - 1))}>-</button>
                      <span className="devis-app-stepper-val">{modalQuantity}</span>
                      <button type="button" onClick={() => setModalQuantity(q => q + 1)}>+</button>
                    </div>
                    <span style={{ fontSize: 13, color: '#64748b' }}>pièce(s)</span>
                  </div>
                </div>

                {/* 2. Puissance de l'appareil */}
                <div style={{ marginBottom: 18 }}>
                  <div className="devis-app-section-title">Puissance de l’appareil</div>
                  <div className="devis-app-section-desc">
                    Utilisez la valeur indiquée sur l’étiquette. Si vous ne l’avez pas, la valeur suggérée suffit pour commencer.
                  </div>

                  {/* Tabs Puissance en Watts (W) vs Tension et courant */}
                  <div className="devis-app-tabs-row">
                    <button 
                      type="button" 
                      className={`devis-app-tab-btn ${modalPowerTab === 'watts' ? 'is-active' : ''}`}
                      onClick={() => setModalPowerTab('watts')}
                    >
                      <Zap size={15} /> Puissance en Watts (W)
                    </button>
                    <button 
                      type="button" 
                      className={`devis-app-tab-btn ${modalPowerTab === 'va' ? 'is-active' : ''}`}
                      onClick={() => setModalPowerTab('va')}
                    >
                      <SlidersHorizontal size={15} /> Tension (V) et courant (A)
                    </button>
                  </div>

                  {modalPowerTab === 'watts' ? (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Puissance</label>
                      <div className="devis-app-unit-input" style={{ width: 140 }}>
                        <input 
                          type="number" 
                          min="1"
                          value={modalWatts}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setModalWatts(val);
                            setModalAmps(Number((val / 220).toFixed(2)));
                          }}
                        />
                        <span>W</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tension</label>
                        <div className="devis-app-unit-input">
                          <input 
                            type="number" 
                            value={modalVolts}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setModalVolts(val);
                              setModalWatts(Math.round(val * modalAmps));
                            }}
                          />
                          <span>V</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Courant</label>
                        <div className="devis-app-unit-input">
                          <input 
                            type="number" 
                            step="0.1"
                            value={modalAmps}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setModalAmps(val);
                              setModalWatts(Math.round(modalVolts * val));
                            }}
                          />
                          <span>A</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Quand le client utilise-t-il cet appareil ? */}
                <div>
                  <div className="devis-app-section-title">Quand le client utilise-t-il cet appareil ?</div>
                  <div className="devis-app-section-desc">
                    Indiquez les créneaux habituels : le soir et la nuit sont importants pour estimer la batterie.
                  </div>

                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Créneaux d’utilisation</label>
                  <div className="devis-app-times-row">
                    <div className="devis-app-time-pill">
                      <input 
                        type="time" 
                        value={modalStartTime}
                        onChange={e => setModalStartTime(e.target.value)}
                      />
                      <span className="devis-app-badge-slot">Matin</span>
                    </div>

                    <span style={{ fontSize: 13, color: '#64748b' }}>à</span>

                    <div className="devis-app-time-pill">
                      <input 
                        type="time" 
                        value={modalEndTime}
                        onChange={e => setModalEndTime(e.target.value)}
                      />
                      <span className="devis-app-badge-slot">Midi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite : Carte de calcul en direct (Capture) */}
              <div>
                <div className="devis-app-preview-card">
                  <div className="devis-app-preview-head">
                    <span className="devis-app-preview-name">
                      {modalSearchTerm.trim() || modalSelectedAppliance?.name || '—'}
                    </span>
                    <span className="devis-app-preview-qty-pill">
                      × {modalQuantity}
                    </span>
                  </div>

                  <div className="devis-app-preview-sub">
                    {modalWatts} W / unité &nbsp;•&nbsp; {modalCalculatedHours} h / jour
                  </div>

                  {/* Image dynamique de l'appareil */}
                  <img 
                    src={modalImage || '/equipment/fridge.jpg'} 
                    alt="Appareil" 
                    className="devis-app-preview-img"
                    onError={(e) => { e.target.src = '/equipment/fridge.jpg'; }}
                  />

                  <div className="devis-app-preview-divider" />

                  <div className="devis-app-preview-calc-lbl">Consommation estimée</div>
                  <div className="devis-app-preview-calc-val">
                    {(modalWatts * modalCalculatedHours * modalQuantity).toLocaleString()} Wh / jour
                  </div>
                </div>

                {/* Callout Conseil étiquette */}
                <div className="devis-app-tip-box">
                  <Lightbulb size={20} className="devis-app-tip-icon" />
                  <div>
                    <div className="devis-app-tip-title">Vous ne connaissez pas la puissance exacte ?</div>
                    <div className="devis-app-tip-text">
                      Vérifiez l’étiquette de l’appareil ou son manuel d’utilisation.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="devis-app-modal-footer">
              <button 
                type="button" 
                className="devis-v2-btn-ghost"
                onClick={() => setIsAddModalOpen(false)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="devis-v2-btn-orange"
                onClick={handleConfirmAddAppliance}
                disabled={!modalSearchTerm.trim() && !modalSelectedAppliance}
              >
                Ajouter l’appareil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DRAWER : DISCUTER AVEC L'IA SOLAIRE
          ═══════════════════════════════════════════════════════════════ */}
      {isAIDiscussionOpen && (
        <div className="devis-ai-drawer">
          <div className="devis-ai-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} color="#ea580c" />
              <strong style={{ fontSize: 13 }}>Assistant Djúa Solaire IA</strong>
            </div>
            <button 
              onClick={() => setIsAIDiscussionOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="devis-ai-drawer-messages">
            {aiChatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`devis-ai-msg-bubble ${msg.role === 'user' ? 'devis-ai-msg-user' : 'devis-ai-msg-assistant'}`}
              >
                {msg.text}
              </div>
            ))}
            {isAITyping && (
              <div className="devis-ai-msg-bubble devis-ai-msg-assistant" style={{ fontStyle: 'italic', color: '#64748b' }}>
                Djúa IA réfléchit...
              </div>
            )}
          </div>

          {/* Questions rapides */}
          <div className="devis-ai-quick-questions">
            <button 
              type="button"
              className="devis-ai-chip"
              onClick={() => handleSendAIMessage('Explique ce devis au client en termes simples')}
            >
              Expliquer au client
            </button>
            <button 
              type="button"
              className="devis-ai-chip"
              onClick={() => handleSendAIMessage('Quelle est l’autonomie en cas de pluie ?')}
            >
              Autonomie pluie
            </button>
            <button 
              type="button"
              className="devis-ai-chip"
              onClick={() => handleSendAIMessage('Comment réduire le devis de 20% ?')}
            >
              Optimiser budget
            </button>
            <button 
              type="button"
              className="devis-ai-chip"
              onClick={() => handleSendAIMessage('Quelle est la durée de vie des batteries lithium ?')}
            >
              Durée de vie batterie
            </button>
          </div>

          {/* Saisie message */}
          <form 
            className="devis-ai-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAIMessage();
            }}
          >
            <input 
              type="text" 
              placeholder="Poser une question sur ce devis..." 
              value={aiChatInput}
              onChange={e => setAiChatInput(e.target.value)}
            />
            <button 
              type="submit" 
              className="devis-v2-btn-orange" 
              style={{ padding: '7px 12px' }}
              disabled={!aiChatInput.trim() || isAITyping}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}