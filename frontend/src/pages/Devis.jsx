import PageEntrance from '../components/PageEntrance';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  CookingPot,
  Droplets,
  Factory,
  FileText,
  Home,
  Hotel,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  MonitorSmartphone,
  MoonStar,
  PencilLine,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Store,
  SunMedium,
  Trash2,
  UserRound,
  UtensilsCrossed,
  Warehouse,
  Wrench,
  X,
  Zap,
  // Building detail icons
  Waves,        // Tôle
  Blocks,       // Dalle béton
  Triangle,     // Tuiles
  CircleCheck,  // Oui
  Ban,          // Non
  KeyRound,     // Propriétaire
  FileCheck,    // Locataire
  UserCog,      // Syndic / gérant
  Sun as SunIcon,// Aucune ombre
  CloudSun,     // Un peu d'ombre
  TreePine,     // Beaucoup d'ombre
  Unplug,       // Coupures
  Fuel,         // Groupe électrogène
  DoorOpen,     // Accès libre
  Handshake,    // Accord syndic
  ShieldOff,    // Impossible
  Sunrise,      // Jour
  Sunset,       // Jour & soir
  Moon,         // 24h/24
  Cable,        // SNEL
  PlugZap,      // Pas de réseau
  ImagePlus,    // For equipment images
} from 'lucide-react';
import { useSolarRecommend } from '../hooks/tanstack/useSolarAdvisor';
import SolarAdvisorResult, { SolarAdvisorTrigger } from '../components/SolarAdvisorResult';

/* ────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — Orange RDC : noir, blanc, orange #FF7900, Helvetica Neue
   Tout le thème passe par des variables CSS (clair / sombre) : plus de couleurs
   en dur dans le JSX, le mode clair fonctionne enfin partout.
──────────────────────────────────────────────────────────────────────────── */
const CSS = `
.devis-shell{
  --bg:#0a0a0b;--panel:var(--saas-panel);--card:var(--saas-card);--card2:var(--saas-card-raised);--field:#0e0e10;--line:var(--saas-card-border);
  --fg:#fafafa;--muted:#9c9ca6;--or:#ff7900;--or-soft:rgba(255,121,0,.13);--or-line:rgba(255,121,0,.55);
  --ok:#3ccf62;--ok-soft:rgba(60,207,98,.12);--err:#ff6161;--err-soft:rgba(255,97,97,.12);
  --shadow:var(--saas-panel-shadow);
  background:var(--bg);
  color:var(--fg);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;
}
:root[data-theme='light'] .devis-shell{
  --bg:#f2f2f3;--panel:var(--saas-panel);--card:var(--saas-card);--card2:var(--saas-card-raised);--field:#ffffff;--line:var(--saas-card-border);
  --fg:#111114;--muted:#686873;--or-soft:rgba(255,121,0,.11);--shadow:var(--saas-panel-shadow);
  background:var(--bg);
}
.devis-shell *{-webkit-tap-highlight-color:transparent}
.dv-panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow)}
.dv-card{background:var(--card);border:1px solid var(--line);border-radius:14px}
.dv-label{display:block;font-size:13px;font-weight:600;color:var(--fg);margin-bottom:6px}
.dv-hint{font-size:12px;color:var(--muted);margin-top:6px;line-height:1.45}
.dv-muted{color:var(--muted)}
.dv-field{display:flex;align-items:center;gap:10px;background:var(--field);border:1.5px solid var(--line);border-radius:10px;padding:0 14px;min-height:48px;transition:border-color .15s,box-shadow .15s;color:var(--muted)}
.dv-field:focus-within{border-color:var(--or);box-shadow:0 0 0 4px var(--or-soft);color:var(--or)}
.dv-field.is-error{border-color:var(--err);box-shadow:0 0 0 4px var(--err-soft)}
.dv-field input,.dv-field select,.dv-field textarea{flex:1;min-width:0;width:100%;background:transparent;border:0;outline:0;color:var(--fg);font:inherit;font-size:15px;padding:12px 0}
.dv-field textarea{resize:none;min-height:76px;line-height:1.45}
.dv-field select option{background:var(--panel);color:var(--fg)}
.dv-field input::placeholder,.dv-field textarea::placeholder{color:var(--muted);opacity:.65}
.dv-affix{font-size:14px;font-weight:700;color:var(--fg);white-space:nowrap}
.dv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;font-weight:700;font-size:14px;padding:0 20px;min-height:48px;cursor:pointer;transition:transform .15s,filter .15s,border-color .15s,color .15s,background .15s;border:1.5px solid transparent;font-family:inherit}
.dv-btn:active{transform:scale(.97)}
.dv-btn-primary{background:var(--or);color:#000}
.dv-btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px)}
.dv-btn-primary:disabled{opacity:.35;cursor:not-allowed;transform:none;filter:none}
.dv-btn-dark{background:var(--fg);color:var(--bg)}
.dv-btn-ghost{background:transparent;border-color:var(--line);color:var(--fg)}
.dv-btn-ghost:hover{border-color:var(--or);color:var(--or)}
.dv-btn-sm{min-height:38px;padding:0 14px;font-size:13px}
.dv-choice{position:relative;display:flex;align-items:center;gap:10px;padding:10px 12px;min-height:56px;border:1.5px solid var(--line);background:var(--card);border-radius:12px;font-weight:600;font-size:14px;color:var(--fg);text-align:left;cursor:pointer;transition:border-color .18s,background .18s,box-shadow .18s,transform .18s;font-family:inherit}
.dv-choice:hover{border-color:var(--or-line);transform:translateY(-1px)}
.dv-choice:active{transform:scale(.98)}
.dv-choice.is-on{border-color:var(--or);background:var(--or-soft);box-shadow:0 0 0 3px var(--or-soft)}
.dv-ic{width:38px;height:38px;border-radius:9px;display:grid;place-items:center;background:var(--card2);color:var(--or);flex:none;font-size:18px;transition:background .18s,color .18s}
.dv-choice.is-on .dv-ic{background:var(--or);color:#000}
.dv-tick{margin-left:auto;width:20px;height:20px;border-radius:99px;background:var(--or);color:#000;display:grid;place-items:center;flex:none}
.dv-step-btn{width:44px;height:44px;border-radius:10px;border:1.5px solid var(--line);background:var(--card2);color:var(--fg);display:grid;place-items:center;cursor:pointer;transition:border-color .15s,color .15s,transform .1s}
.dv-step-btn:hover:not(:disabled){border-color:var(--or);color:var(--or)}
.dv-step-btn:active:not(:disabled){transform:scale(.92)}
.dv-step-btn:disabled{opacity:.35;cursor:not-allowed}
.dv-num{width:30px;height:30px;border-radius:99px;background:var(--or);color:#000;display:grid;place-items:center;font-weight:800;font-size:14px;flex:none}
.dv-pill{display:inline-flex;align-items:center;gap:6px;border-radius:99px;padding:5px 12px;font-size:12px;font-weight:600;border:1px solid var(--line);background:var(--card);color:var(--muted)}
.dv-pill.ok{background:var(--ok-soft);border-color:rgba(60,207,98,.4);color:var(--ok)}
.dv-pill.or{background:var(--or-soft);border-color:var(--or-line);color:var(--or)}
.dv-dropdown{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:30;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);overflow:hidden;max-height:300px;overflow-y:auto}
.dv-dropdown button{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:12px 14px;background:transparent;border:0;border-bottom:1px solid var(--line);color:var(--fg);cursor:pointer;font:inherit;transition:background .12s}
.dv-dropdown button:last-child{border-bottom:0}
.dv-dropdown button:hover{background:var(--or-soft)}
.dv-map{position:relative;isolation:isolate;border-radius:14px;overflow:hidden;border:1.5px solid var(--line)}
.dv-map.is-confirmed{border-color:var(--ok);box-shadow:0 0 0 4px var(--ok-soft)}
.dv-map-overlay{position:absolute;z-index:500;pointer-events:none}
.leaflet-container{background:var(--field);font-family:inherit}
.dv-ping{position:relative}
.dv-ping::after{content:'';position:absolute;inset:0;border-radius:99px;border:2px solid var(--or);animation:dv-ping 1.8s ease-out infinite}
@keyframes dv-ping{0%{transform:scale(.8);opacity:.9}100%{transform:scale(2.2);opacity:0}}
@keyframes dv-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.dv-shake{animation:dv-shake .3s}
.dv-scroll-x{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.dv-scroll-x::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.devis-shell *{animation:none!important;transition-duration:.01ms!important}}
@media print{
  body *{visibility:hidden!important}
  .quote-print-sheet,.quote-print-sheet *{visibility:visible!important}
  .quote-modal{position:static!important;background:#fff!important;padding:0!important;overflow:visible!important}
  .quote-print-sheet{position:absolute;left:0;top:0;width:100%;box-shadow:none!important;border-radius:0!important}
}
`;

/* ────────────────────────────────────────────────────────────────────────────
   DONNÉES
──────────────────────────────────────────────────────────────────────────── */
const CATEGORIES = {
  Éclairage: { icon: Lightbulb },
  Cuisine: { icon: CookingPot },
  Multimédia: { icon: MonitorSmartphone },
  Climatisation: { icon: Snowflake },
  Pompage: { icon: Droplets },
  Autres: { icon: Wrench },
};

// Appareils courants : un seul tap pour les ajouter au devis
const PRESETS = [
  { name: 'Ampoule LED', category: 'Éclairage', watts: 10, hours: 6, period: 'night', diversity: 0.9 },
  { name: 'Télévision', category: 'Multimédia', watts: 120, hours: 5, period: 'both', diversity: 0.8 },
  { name: 'Réfrigérateur', category: 'Cuisine', watts: 150, hours: 10, period: 'both', diversity: 0.5 },
  { name: 'Congélateur', category: 'Cuisine', watts: 200, hours: 10, period: 'both', diversity: 0.5 },
  { name: 'Ventilateur', category: 'Climatisation', watts: 75, hours: 8, period: 'night', diversity: 0.8 },
  { name: 'Climatiseur', category: 'Climatisation', watts: 1000, hours: 6, period: 'night', diversity: 0.7 },
  { name: 'Ordinateur', category: 'Multimédia', watts: 65, hours: 6, period: 'day', diversity: 0.85 },
  { name: 'Décodeur TV', category: 'Multimédia', watts: 20, hours: 8, period: 'both', diversity: 0.9 },
  { name: 'Pompe à eau', category: 'Pompage', watts: 750, hours: 1, period: 'day', diversity: 0.65 },
  { name: 'Fer à repasser', category: 'Autres', watts: 1000, hours: 0.5, period: 'day', diversity: 0.6 },
  { name: 'Machine à laver', category: 'Autres', watts: 500, hours: 1, period: 'day', diversity: 0.6 },
  { name: 'Enseigne lumineuse', category: 'Éclairage', watts: 40, hours: 12, period: 'night', diversity: 1 },
];

const profileOptions = {
  personne: [
    { id: 'Villa', label: 'Villa', icon: Home },
    { id: 'Maison moderne', label: 'Maison moderne', icon: Home },
    { id: 'Appartement', label: 'Appartement', icon: Building2 },
    { id: 'Immeuble', label: 'Immeuble', icon: Building2 },
    { id: 'Duplex', label: 'Duplex', icon: Building2 },
    { id: 'Studio', label: 'Studio', icon: Home },
    { id: 'Autre', label: 'Autre', icon: PencilLine },
  ],
  entreprise: [
    { id: 'Boutique', label: 'Boutique', icon: Store },
    { id: 'Magasin', label: 'Magasin', icon: ShoppingBag },
    { id: 'Bureau', label: 'Bureau', icon: BriefcaseBusiness },
    { id: 'Restaurant', label: 'Restaurant', icon: UtensilsCrossed },
    { id: 'Hôtel', label: 'Hôtel', icon: Hotel },
    { id: 'Usine', label: 'Usine', icon: Factory },
    { id: 'Entrepôt', label: 'Entrepôt', icon: Warehouse },
    { id: 'Autre', label: 'Autre', icon: PencilLine },
  ],
};

const profileCards = [
  { id: 'personne', title: 'Particulier', description: 'Une maison, un appartement, un foyer', icon: UserRound },
  { id: 'entreprise', title: 'Entreprise', description: 'Un commerce, un bureau, un site industriel', icon: Building2 },
];

const STEP_LABELS = { profile: 'Profil', details: 'Client', type: 'Bâtiment', site: 'Site', equipment: 'Équipements', summary: 'Résumé' };
const getStepOrder = (profile) => (profile === 'entreprise'
  ? ['profile', 'type', 'details', 'site', 'equipment', 'summary']
  : ['profile', 'details', 'type', 'site', 'equipment', 'summary']);

/* ─── Détails du bâtiment : ce qu'on demande dépend du type choisi ─── */
const ROOF = {
  type: 'choice', key: 'roof', label: 'Type de toiture', options: [
    { value: 'Tôle', icon: Waves }, { value: 'Dalle béton', icon: Blocks }, { value: 'Tuiles', icon: Triangle }, { value: 'Autre', icon: PencilLine },
  ],
};
const YES_NO = [{ value: 'Oui', icon: CircleCheck }, { value: 'Non', icon: Ban }];
const ROLE = { type: 'choice', key: 'role', label: 'Le client est…', options: [{ value: 'Propriétaire', icon: KeyRound }, { value: 'Locataire', icon: FileCheck }, { value: 'Syndic / gérant', icon: UserCog }] };

const DETAIL_SCHEMA = {
  house: {
    title: 'Votre villa / maison',
    hint: 'Ces infos aident l’installateur à préparer la pose sur le toit.',
    fields: [
      { type: 'stepper', key: 'levels', label: 'Nombre de niveaux', def: 1, min: 1, max: 6 },
      { type: 'stepper', key: 'rooms', label: 'Nombre de pièces', def: 4, min: 1, max: 30 },
      ROOF,
      { type: 'choice', key: 'shade', label: 'Ombre sur le toit', options: [{ value: 'Aucune', icon: SunIcon }, { value: 'Un peu', icon: CloudSun }, { value: 'Beaucoup', icon: TreePine }] },
      { type: 'choice', key: 'fence', label: 'Parcelle clôturée', options: YES_NO },
    ],
  },
  multi: {
    title: 'Votre logement / immeuble',
    hint: 'Pour un immeuble, l’accord du syndic ou du propriétaire est souvent nécessaire.',
    fields: [
      { type: 'text', key: 'building', label: 'Nom de l’immeuble / résidence', placeholder: 'Ex : Résidence Les Palmiers' },
      { type: 'stepper', key: 'floors', label: 'Étages de l’immeuble', def: 4, min: 1, max: 40 },
      { type: 'stepper', key: 'myFloor', label: 'Étage du client', def: 1, min: 0, max: 40, format: (v) => (v === 0 ? 'RDC' : v) },
      { type: 'text', key: 'door', label: 'N° de porte / appartement', placeholder: 'Ex : B12' },
      { type: 'choice', key: 'elevator', label: 'Ascenseur', options: YES_NO },
      { type: 'choice', key: 'roofAccess', label: 'Accès au toit', options: [{ value: 'Libre', icon: DoorOpen }, { value: 'Accord syndic', icon: Handshake }, { value: 'Impossible', icon: ShieldOff }] },
      ROLE,
    ],
  },
  large: {
    title: 'Votre site',
    hint: 'Un grand site demande un peu plus de précisions pour bien dimensionner.',
    fields: [
      { type: 'stepper', key: 'buildings', label: 'Nombre de bâtiments', def: 1, min: 1, max: 30 },
      { type: 'number', key: 'area', label: 'Surface au sol (m²)', placeholder: 'Ex : 800' },
      { type: 'stepper', key: 'levels', label: 'Niveaux du bâtiment principal', def: 1, min: 1, max: 12 },
      ROOF,
      { type: 'choice', key: 'truck', label: 'Accès camion / grue', options: YES_NO },
      { type: 'choice', key: 'generator', label: 'Groupe électrogène existant', options: YES_NO },
      { type: 'text', key: 'onsite', label: 'Contact sur site (gardien, responsable)', placeholder: 'Ex : Papa Jean, 0812 000 000' },
    ],
  },
  commerce: {
    title: 'Votre local',
    hint: 'Les horaires d’ouverture changent beaucoup la taille de la batterie.',
    fields: [
      { type: 'number', key: 'area', label: 'Surface du local (m²)', placeholder: 'Ex : 60' },
      { type: 'stepper', key: 'levels', label: 'Nombre de niveaux', def: 1, min: 1, max: 8 },
      { type: 'choice', key: 'hours', label: 'Horaires d’ouverture', options: [{ value: 'Jour', icon: Sunrise }, { value: 'Jour & soir', icon: Sunset }, { value: '24h/24', icon: Moon }] },
      ROOF,
      { type: 'choice', key: 'generator', label: 'Groupe électrogène existant', options: YES_NO },
      ROLE,
    ],
  },
  other: {
    title: 'Votre bâtiment',
    hint: 'Dites-nous l’essentiel, le reste sera confirmé lors de la visite.',
    fields: [
      { type: 'stepper', key: 'levels', label: 'Nombre de niveaux', def: 1, min: 1, max: 12 },
      { type: 'number', key: 'area', label: 'Surface (m²)', placeholder: 'Ex : 120' },
      ROOF,
      ROLE,
    ],
  },
};
const GRID_FIELD = {
  type: 'choice', key: 'grid', label: 'Électricité actuelle', options: [
    { value: 'SNEL stable', icon: Cable }, { value: 'Coupures fréquentes', icon: Unplug }, { value: 'Groupe électrogène', icon: Fuel }, { value: 'Pas de réseau', icon: PlugZap },
  ],
};

const getBuildingKind = (type) => {
  if (['Villa', 'Maison moderne'].includes(type)) return 'house';
  if (['Appartement', 'Immeuble', 'Duplex', 'Studio'].includes(type)) return 'multi';
  if (['Usine', 'Entrepôt', 'Hôtel'].includes(type)) return 'large';
  if (['Boutique', 'Magasin', 'Bureau', 'Restaurant'].includes(type)) return 'commerce';
  return 'other';
};
const getDetailValue = (field, details) => details?.[field.key] ?? field.def;
const summarizeDetails = (kind, details) => [...DETAIL_SCHEMA[kind].fields, GRID_FIELD]
  .map((field) => {
    const raw = getDetailValue(field, details);
    if (raw === undefined || raw === '') return null;
    return { label: field.label, value: field.format ? field.format(raw) : String(raw) };
  })
  .filter(Boolean);

/* ─── États initiaux ─── */
const STORAGE_KEY = 'djua-devis-onboarding-state';
const KINSHASA = [-4.3217, 15.3126];

const initialCompanyForm = { companyName: '', rccm: '', idNationale: '', tva: '', secteur: '', adresse: '', ville: '', province: '', contactName: '', phone: '', email: '' };
const initialClientForm = { fullName: '', phone: '', email: '', contactPref: '', adresse: '', ville: '', province: '' };
const initialSiteForm = { adresse: '', quartier: '', commune: '', ville: 'Kinshasa', province: 'Kinshasa', lat: null, lng: null, confirmed: false, reference: '', details: {} };
const initialProjectForm = { name: '', location: '', occupants: 4, targetConsumption: 0 };

const getDefaultDraft = () => ({
  currentStep: 'profile',
  selectedProfile: '',
  selectedType: '',
  customType: '',
  companyForm: initialCompanyForm,
  clientForm: initialClientForm,
  siteForm: initialSiteForm,
  projectForm: initialProjectForm,
  appliances: [],
  defaultApplianceCategory: 'Multimédia',
  isValidated: false,
});

const resolveCategoryIcon = (category) => CATEGORIES[category]?.icon || Wrench;

const readSavedDraft = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const base = getDefaultDraft();
    return {
      ...base,
      ...parsed,
      currentStep: STEP_LABELS[parsed.currentStep] ? parsed.currentStep : 'profile',
      companyForm: { ...initialCompanyForm, ...(parsed.companyForm || {}) },
      clientForm: { ...initialClientForm, ...(parsed.clientForm || {}) },
      siteForm: { ...initialSiteForm, ...(parsed.siteForm || {}), details: { ...(parsed.siteForm?.details || {}) } },
      projectForm: { ...initialProjectForm, ...(parsed.projectForm || {}) },
      appliances: Array.isArray(parsed.appliances) ? parsed.appliances.map((item) => ({ ...item, category: item.category || 'Autres' })) : [],
      defaultApplianceCategory: Object.keys(CATEGORIES).includes(parsed.defaultApplianceCategory) ? parsed.defaultApplianceCategory : 'Multimédia',
    };
  } catch (error) {
    return null;
  }
};

/* ─── Formats & calculs ─── */
const fmtEnergy = (wh) => (wh >= 1000 ? `${(wh / 1000).toFixed(2)} kWh` : `${Math.round(wh)} Wh`);
const fmtPower = (watts) => (watts >= 1000 ? `${(watts / 1000).toFixed(2)} kW` : `${Math.round(watts)} W`);
const periodLabel = (period) => ({ day: 'Jour', night: 'Nuit', both: 'Jour & nuit' }[period] || 'Jour');

const minutesFromTime = (value) => {
  if (typeof value !== 'string' || !value) return 0;
  const [h = '0', m = '0'] = value.split(':');
  const total = Number(h || 0) * 60 + Number(m || 0);
  return Number.isFinite(total) ? Math.max(0, total) : 0;
};
const timeToInputValue = (minutes) => {
  const n = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};
const getWindowDurationHours = (start, end) => {
  let d = minutesFromTime(end) - minutesFromTime(start);
  if (d <= 0) d += 1440;
  return d / 60;
};
const getTotalHoursFromWindows = (windows) => windows.reduce((s, w) => s + getWindowDurationHours(w.start, w.end), 0);
const createUsageWindow = (hoursValue = 1, startTime = '08:00') => ({
  start: startTime,
  end: timeToInputValue(minutesFromTime(startTime) + Math.max(0.5, Number(hoursValue) || 1) * 60),
});
// Part de l'énergie consommée pendant la journée solaire (6h–18h)
const getDayShare = (windows) => {
  let day = 0;
  let total = 0;
  windows.forEach((w) => {
    const duration = getWindowDurationHours(w.start, w.end) * 60;
    for (let t = 0; t < duration; t += 15) {
      const tod = (minutesFromTime(w.start) + t) % 1440;
      total += 1;
      if (tod >= 360 && tod < 1080) day += 1;
    }
  });
  return total === 0 ? 1 : day / total;
};

function calculate(appliances, autonomy = 1) {
  const dailyWh = appliances.reduce((t, i) => t + i.watts * i.hours * i.quantity, 0);
  const dayWh = appliances.reduce((t, i) => {
    const share = i.dayShare ?? (i.period === 'night' ? 0 : i.period === 'both' ? 0.5 : 1);
    return t + i.watts * i.hours * i.quantity * share;
  }, 0);
  const simultaneousWatts = appliances.reduce((t, i) => t + i.watts * i.quantity * i.diversity, 0);
  const energyToProduce = dailyWh * 1.15 * 1.2;
  const rawSolarKw = energyToProduce / 1000 / 5.1;
  const panelCount = Math.max(2, Math.ceil(rawSolarKw / 0.6));
  const solarKw = panelCount * 0.6;
  const batteryKwh = Math.max(2.5, Math.ceil(((dailyWh / 1000) * autonomy / 0.8) / 2.5) * 2.5);
  const inverterKva = Math.max(1.5, Math.ceil((simultaneousWatts * 1.25 / 0.8) / 500) * 0.5);
  return { dailyWh, dayWh, nightWh: dailyWh - dayWh, simultaneousWatts, energyToProduce, rawSolarKw, panelCount, solarKw, batteryKwh, inverterKva, autonomy };
}

/* ────────────────────────────────────────────────────────────────────────────
   PETITS COMPOSANTS RÉUTILISABLES
──────────────────────────────────────────────────────────────────────────── */
function useDebounce(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function AnimatedNumber({ value, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const controls = animate(previous.current, value, { duration: 0.6, ease: 'easeOut', onUpdate: setDisplay });
    previous.current = value;
    return () => controls.stop();
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

function Field({ label, required, hint, error, className = '', children }) {
  return (
    <div className={className}>
      {label && <span className="dv-label">{label}{required && <span style={{ color: 'var(--or)' }}> *</span>}</span>}
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--err)' }}>{error}</p> : hint ? <p className="dv-hint">{hint}</p> : null}
    </div>
  );
}

function Input({ icon: Icon, prefix, suffix, invalid, ...props }) {
  return (
    <div className={`dv-field ${invalid ? 'is-error' : ''}`}>
      {Icon && <Icon size={17} />}
      {prefix && <span className="dv-affix">{prefix}</span>}
      <input {...props} />
      {suffix}
    </div>
  );
}

function Choice({ on, onClick, icon: Icon, emoji, label, sub }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`dv-choice ${on ? 'is-on' : ''}`}>
      <span className="dv-ic">{Icon ? <Icon size={18} /> : emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block leading-tight">{label}</span>
        {sub && <span className="dv-muted mt-0.5 block text-xs font-normal">{sub}</span>}
      </span>
      <AnimatePresence>
        {on && <motion.span key="tick" className="dv-tick" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}><Check size={13} strokeWidth={3} /></motion.span>}
      </AnimatePresence>
    </button>
  );
}

function StepperRow({ label, value, onChange, min = 0, max = 99, format }) {
  return (
    <div className="dv-card flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-2.5">
        <button type="button" className="dv-step-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Diminuer"><Minus size={18} /></button>
        <motion.strong key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="min-w-10 text-center text-xl font-bold">{format ? format(value) : value}</motion.strong>
        <button type="button" className="dv-step-btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Augmenter"><Plus size={18} /></button>
      </div>
    </div>
  );
}

function DetailField({ field, details, onChange }) {
  const stored = details?.[field.key];
  if (field.type === 'stepper') {
    return <StepperRow label={field.label} value={getDetailValue(field, details)} min={field.min} max={field.max} format={field.format} onChange={(v) => onChange(field.key, v)} />;
  }
  if (field.type === 'choice') {
    return (
      <div>
        <span className="dv-label">{field.label}</span>
        <div className={`grid gap-2 ${field.options.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {field.options.map((option) => (
            <Choice key={option.value} on={stored === option.value} emoji={option.emoji} label={option.value} onClick={() => onChange(field.key, stored === option.value ? undefined : option.value)} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <Field label={field.label}>
      <Input type={field.type === 'number' ? 'number' : 'text'} inputMode={field.type === 'number' ? 'numeric' : undefined} min={field.type === 'number' ? 0 : undefined} value={stored ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(field.key, e.target.value || undefined)} />
    </Field>
  );
}

function StepHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="dv-muted text-sm">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-[28px]">{title}</h2>
      {subtitle && <p className="dv-muted mt-2 max-w-xl text-sm leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function NavBar({ onBack, onNext, nextLabel = 'Continuer', nextDisabled, onDisabledClick, children }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {onBack ? <button type="button" onClick={onBack} className="dv-btn dv-btn-ghost"><ArrowLeft size={16} />Retour</button> : <span />}
      <div className="flex items-center gap-3">
        {children}
        <button type="button" onClick={nextDisabled ? onDisabledClick : onNext} aria-disabled={nextDisabled} className="dv-btn dv-btn-primary" style={nextDisabled ? { opacity: 0.4 } : undefined}>{nextLabel}<ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   CARTE : recherche d'adresse, épingle déplaçable, confirmation
──────────────────────────────────────────────────────────────────────────── */
function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 17), { duration: 0.9 });
  }, [map, position?.[0], position?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function MapClick({ onPick }) {
  useMapEvents({ click: (event) => onPick([event.latlng.lat, event.latlng.lng]) });
  return null;
}

const shortLabel = (place) => {
  const a = place.address || {};
  const street = a.road ? `${a.house_number ? `${a.house_number} ` : ''}${a.road}` : '';
  const parts = [street, a.suburb || a.neighbourhood || a.quarter, a.city_district || a.municipality].filter(Boolean);
  return parts.length ? parts.join(', ') : String(place.display_name || '').split(',').slice(0, 3).join(',');
};

function AddressPicker({ site, onChange, theme }) {
  const [query, setQuery] = useState(site.adresse || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [detected, setDetected] = useState('');
  const lastPicked = useRef('');
  const wrapRef = useRef(null);
  const siteRef = useRef(site);
  siteRef.current = site;
  const debounced = useDebounce(query, 450);
  const position = site.lat != null && site.lng != null ? [site.lat, site.lng] : null;

  // Recherche d'adresses (OpenStreetMap), priorité à Kinshasa
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 3 || q === lastPicked.current) { setResults([]); return undefined; }
    const controller = new AbortController();
    setSearching(true);
    const ville = (siteRef.current.ville || '').trim();
    const params = new URLSearchParams({
      format: 'jsonv2', addressdetails: '1', limit: '6', countrycodes: 'cd', 'accept-language': 'fr',
      q: ville && !q.toLowerCase().includes(ville.toLowerCase()) ? `${q}, ${ville}` : q,
    });
    if (/kinshasa/i.test(ville)) params.set('viewbox', '15.0,-4.1,15.75,-4.65');
    fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => { setResults(Array.isArray(data) ? data : []); setOpen(true); })
      .catch((error) => { if (error.name !== 'AbortError') setResults([]); })
      .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    return () => controller.abort();
  }, [debounced]);

  // Ferme la liste au clic extérieur
  useEffect(() => {
    const handler = (event) => { if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickResult = (place) => {
    const a = place.address || {};
    const label = shortLabel(place);
    lastPicked.current = label;
    setQuery(label);
    setOpen(false);
    setResults([]);
    setDetected(label);
    onChange({
      adresse: label,
      quartier: a.suburb || a.neighbourhood || a.quarter || siteRef.current.quartier,
      commune: a.city_district || a.municipality || siteRef.current.commune,
      ville: a.city || a.town || siteRef.current.ville,
      province: a.state || siteRef.current.province,
      lat: Number(place.lat),
      lng: Number(place.lon),
      confirmed: false,
    });
  };

  // Nom de la rue à l'endroit de l'épingle
  const placePin = useCallback(async (coords) => {
    onChange({ lat: coords[0], lng: coords[1], confirmed: false });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=fr&zoom=18&lat=${coords[0]}&lon=${coords[1]}`);
      const data = await res.json();
      if (!data?.display_name) return;
      const label = shortLabel(data);
      const a = data.address || {};
      setDetected(label);
      const patch = {};
      if (!siteRef.current.adresse.trim()) { patch.adresse = label; lastPicked.current = label; setQuery(label); }
      if (!siteRef.current.quartier) patch.quartier = a.suburb || a.neighbourhood || a.quarter || '';
      if (!siteRef.current.commune) patch.commune = a.city_district || a.municipality || '';
      if (Object.keys(patch).length) onChange(patch);
    } catch (error) { /* hors-ligne : l'épingle reste valable */ }
  }, [onChange]);

  const locateMe = () => {
    if (!navigator.geolocation) { toast.error('La localisation n’est pas disponible sur cet appareil.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); placePin([pos.coords.latitude, pos.coords.longitude]); },
      () => { setLocating(false); toast.error('Position introuvable. Touchez la carte pour placer l’épingle.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const markerHandlers = useMemo(() => ({ dragend: (event) => { const ll = event.target.getLatLng(); placePin([ll.lat, ll.lng]); } }), [placePin]);
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="space-y-4">
      <div ref={wrapRef} className="relative">
        <Field label="Adresse du client" required hint="Tapez la rue ou le quartier, puis choisissez dans la liste.">
          <Input
            icon={MapPin}
            value={query}
            placeholder="Ex : 23 avenue de la Paix, Gombe"
            autoComplete="off"
            onFocus={() => results.length > 0 && setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); onChange({ adresse: e.target.value, confirmed: false }); }}
            suffix={searching ? <Loader2 size={17} className="animate-spin" style={{ color: 'var(--or)' }} /> : query ? <button type="button" aria-label="Effacer" onClick={() => { setQuery(''); lastPicked.current = ''; onChange({ adresse: '', confirmed: false }); }}><X size={16} /></button> : null}
          />
        </Field>
        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.div className="dv-dropdown" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {results.map((place) => (
                <button type="button" key={place.place_id} onClick={() => pickResult(place)}>
                  <MapPin size={17} style={{ color: 'var(--or)', marginTop: 2, flex: 'none' }} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{shortLabel(place)}</span>
                    <span className="dv-muted block truncate text-xs">{place.display_name}</span>
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`dv-map ${site.confirmed ? 'is-confirmed' : ''}`}>
        <MapContainer center={position || KINSHASA} zoom={position ? 17 : 12} scrollWheelZoom={false} style={{ height: 340, width: '100%' }}>
          <TileLayer key={theme} attribution="&copy; OpenStreetMap" url={tileUrl} />
          <MapController position={position} />
          <MapClick onPick={placePin} />
          {position && <Marker position={position} draggable eventHandlers={markerHandlers} />}
        </MapContainer>
        <div className="dv-map-overlay left-3 top-3">
          <span className="dv-pill" style={{ background: 'var(--panel)', boxShadow: 'var(--shadow)' }}><Info size={13} />{position ? 'Déplacez l’épingle si besoin' : 'Touchez la carte pour placer l’épingle'}</span>
        </div>
        <button type="button" onClick={locateMe} className="dv-btn dv-btn-sm dv-btn-dark" style={{ position: 'absolute', zIndex: 500, right: 12, bottom: 12, boxShadow: 'var(--shadow)' }}>
          {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}Ma position
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!position && (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dv-muted text-sm">
            La position exacte permet à l’équipe de planifier la visite technique sans se perdre.
          </motion.p>
        )}
        {position && !site.confirmed && (
          <motion.div key="ask" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="dv-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--or-line)' }}>
            <div className="min-w-0">
              <p className="text-sm font-bold">C’est bien ici ?</p>
              <p className="dv-muted mt-0.5 truncate text-sm">{detected || site.adresse || `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`}</p>
            </div>
            <button type="button" className="dv-btn dv-btn-primary" onClick={() => { onChange({ confirmed: true }); toast.success('Position confirmée.'); }}><Check size={17} strokeWidth={3} />Oui, confirmer</button>
          </motion.div>
        )}
        {position && site.confirmed && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3 rounded-xl p-4" style={{ background: 'var(--ok-soft)', border: '1px solid rgba(60,207,98,.4)' }}>
            <div className="flex items-center gap-3">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }} className="dv-ic" style={{ background: 'var(--ok)', color: '#000', borderRadius: 99 }}><Check size={20} strokeWidth={3} /></motion.span>
              <div><p className="text-sm font-bold" style={{ color: 'var(--ok)' }}>Position confirmée</p><p className="dv-muted text-xs">{position[0].toFixed(5)}, {position[1].toFixed(5)}</p></div>
            </div>
            <button type="button" className="dv-btn dv-btn-ghost dv-btn-sm" onClick={() => onChange({ confirmed: false })}>Modifier</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Quartier"><Input value={site.quartier} onChange={(e) => onChange({ quartier: e.target.value })} placeholder="Ex : Ngaliema" /></Field>
        <Field label="Commune"><Input value={site.commune} onChange={(e) => onChange({ commune: e.target.value })} placeholder="Ex : Gombe" /></Field>
        <Field label="Ville"><Input value={site.ville} onChange={(e) => onChange({ ville: e.target.value })} placeholder="Kinshasa" /></Field>
        <Field label="Province"><Input value={site.province} onChange={(e) => onChange({ province: e.target.value })} placeholder="Kinshasa" /></Field>
      </div>
    </div>
  );
}

function MiniMap({ lat, lng, theme }) {
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  return (
    <div className="dv-map mt-3" style={{ height: 150 }}>
      <MapContainer center={[lat, lng]} zoom={16} dragging={false} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} style={{ height: 150, width: '100%' }}>
        <TileLayer key={theme} attribution="&copy; OpenStreetMap" url={tileUrl} />
        <MapController position={null} />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   ÉTAPE SITE : adresse + carte + détails du bâtiment
──────────────────────────────────────────────────────────────────────────── */
function SectionCard({ index, title, subtitle, children }) {
  return (
    <motion.section layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="dv-card p-4 md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="dv-num">{index}</span>
        <div><h3 className="text-base font-bold leading-tight">{title}</h3>{subtitle && <p className="dv-muted text-xs">{subtitle}</p>}</div>
      </div>
      {children}
    </motion.section>
  );
}

function SiteStep({ site, setSite, selectedType, customType, selectedProfile, theme }) {
  const kind = getBuildingKind(selectedType);
  const schema = DETAIL_SCHEMA[kind];
  const typeLabel = selectedType === 'Autre' ? (customType || 'Autre') : selectedType;
  const TypeIcon = [...profileOptions.personne, ...profileOptions.entreprise].find((o) => o.id === selectedType)?.icon || Building2;
  const patchSite = useCallback((patch) => setSite((prev) => ({ ...prev, ...patch })), [setSite]);
  const setDetail = (key, value) => setSite((prev) => {
    const details = { ...prev.details };
    if (value === undefined) delete details[key]; else details[key] = value;
    return { ...prev, details };
  });

  return (
    <div className="space-y-4">
      <SectionCard index={1} title="Où se trouve le client ?" subtitle="Cherchez l’adresse, puis confirmez l’épingle sur la carte">
        <AddressPicker site={site} onChange={patchSite} theme={theme} />
      </SectionCard>

      <SectionCard index={2} title={schema.title} subtitle={schema.hint}>
        <div className="dv-card mb-4 flex items-center gap-3 p-3" style={{ borderColor: 'var(--or-line)', background: 'var(--or-soft)' }}>
          <span className="dv-ic" style={{ background: 'var(--or)', color: '#000' }}><TypeIcon size={19} /></span>
          <div className="min-w-0"><p className="text-sm font-bold">{typeLabel}</p><p className="dv-muted text-xs">Facultatif : passez si vous ne savez pas, l’équipe confirmera à la visite.</p></div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={kind} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {schema.fields.filter((f) => f.type === 'stepper').map((field) => <DetailField key={field.key} field={field} details={site.details} onChange={setDetail} />)}
            </div>
            {schema.fields.filter((f) => f.type === 'text' || f.type === 'number').length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {schema.fields.filter((f) => f.type === 'text' || f.type === 'number').map((field) => <DetailField key={field.key} field={field} details={site.details} onChange={setDetail} />)}
              </div>
            )}
            {schema.fields.filter((f) => f.type === 'choice').map((field) => <DetailField key={field.key} field={field} details={site.details} onChange={setDetail} />)}
          </motion.div>
        </AnimatePresence>
      </SectionCard>

      <SectionCard index={3} title="Accès et électricité" subtitle="Aide l’équipe à trouver le site et à comprendre le besoin">
        <div className="space-y-4">
          <Field label="Repère pour trouver la maison" hint="Ex : après le rond-point, portail bleu, en face de la pharmacie.">
            <div className="dv-field"><textarea value={site.reference} onChange={(e) => patchSite({ reference: e.target.value })} placeholder="Décrivez un repère connu…" /></div>
          </Field>
          <DetailField field={GRID_FIELD} details={site.details} onChange={setDetail} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   ÉQUIPEMENTS
──────────────────────────────────────────────────────────────────────────── */
function Quantity({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="dv-step-btn" style={{ width: 38, height: 38 }} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Diminuer"><Minus size={16} /></button>
      <strong className="min-w-6 text-center text-base font-bold">{value}</strong>
      <button type="button" className="dv-step-btn" style={{ width: 38, height: 38 }} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Augmenter"><Plus size={16} /></button>
    </div>
  );
}

function ApplianceRow({ item, onUpdate, onRemove }) {
  const energy = item.watts * item.hours * item.quantity;
  const Icon = resolveCategoryIcon(item.category);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.2 }} className="dv-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center" style={{ background: 'var(--panel)' }}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="dv-ic"><Icon size={19} /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{item.name}</p>
          <p className="dv-muted text-xs">{fmtPower(item.watts)} · {Number(item.hours.toFixed(1))} h/jour · {periodLabel(item.period)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Quantity value={item.quantity} onChange={(quantity) => onUpdate({ ...item, quantity })} />
        <div className="min-w-[88px] text-right">
          <p className="text-sm font-bold" style={{ color: 'var(--or)' }}>{fmtEnergy(energy)}</p>
          <p className="dv-muted text-[11px]">par jour</p>
        </div>
        <button type="button" className="dv-step-btn" style={{ width: 38, height: 38 }} onClick={() => onRemove(item.id)} aria-label={`Supprimer ${item.name}`}><Trash2 size={16} /></button>
      </div>
    </motion.div>
  );
}

function QuickAdd({ appliances, onQuickAdd }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">Ajout rapide</p>
        <span className="dv-muted text-xs">Touchez pour ajouter, retouchez pour en ajouter un de plus</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {PRESETS.map((preset) => {
          const Icon = resolveCategoryIcon(preset.category);
          const count = appliances.filter((a) => a.name === preset.name).reduce((s, a) => s + a.quantity, 0);
          return (
            <button type="button" key={preset.name} onClick={() => onQuickAdd(preset)} className={`dv-choice ${count ? 'is-on' : ''}`} style={{ minHeight: 60 }}>
              <span className="dv-ic" style={{ width: 34, height: 34 }}><Icon size={16} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] leading-tight">{preset.name}</span><span className="dv-muted text-[11px] font-normal">{preset.watts} W</span></span>
              <AnimatePresence>{count > 0 && <motion.span key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="dv-tick" style={{ width: 22, height: 22, fontSize: 11, fontWeight: 800 }}>{count}</motion.span>}</AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ApplianceList({ appliances, onUpdate, onRemove, onAddClick, onReorder }) {
 const [dragged,setDragged]=useState(null);
  const [search, setSearch] = useState('');
  const categories = Object.keys(CATEGORIES);
  const filtered = appliances.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold">Vos appareils <span className="dv-muted text-sm font-medium">({appliances.reduce((s, i) => s + i.quantity, 0)})</span></h3>
        <div className="flex gap-2">
          <div className="dv-field" style={{ minHeight: 40 }}><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher" style={{ padding: '8px 0', fontSize: 14 }} /></div>
          <button type="button" onClick={() => onAddClick('Multimédia')} className="dv-btn dv-btn-primary dv-btn-sm"><Plus size={15} />Autre</button>
        </div>
      </div>
      <div className="space-y-4">
        {categories.map((category) => {
          const group = filtered.filter((item) => item.category === category);
          if (group.length === 0) return null;
          const totalEnergy = group.reduce((s, i) => s + i.watts * i.hours * i.quantity, 0);
          const CategoryIcon = CATEGORIES[category].icon;
          return (
            <div key={category}>
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2"><CategoryIcon size={16} style={{ color: 'var(--or)' }} /><span className="text-sm font-bold">{category}</span></div>
                <span className="dv-muted text-xs">{fmtEnergy(totalEnergy)}/jour</span>
              </div>
              <div className="space-y-2"><AnimatePresence initial={false}>{group.map((item) => <div key={item.id} onDragOver={e=>{if(dragged && dragged!==item.id)e.preventDefault();}} onDrop={e=>{e.preventDefault();if(dragged && dragged!==item.id)onReorder(dragged,item.id);setDragged(null);}}>
<div className="dv-reorder">
<button type="button" draggable className="dv-btn dv-btn-ghost dv-btn-sm" aria-label={'Déplacer '+item.name} onDragStart={e=>{setDragged(item.id);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(item.id));}} onDragEnd={()=>setDragged(null)}>↕ Déplacer</button>
<button type="button" className="dv-btn dv-btn-ghost dv-btn-sm" disabled={group.indexOf(item)===0} aria-label={'Monter '+item.name} onClick={()=>onReorder(item.id,group[group.indexOf(item)-1].id)}>↑</button>
<button type="button" className="dv-btn dv-btn-ghost dv-btn-sm" disabled={group.indexOf(item)===group.length-1} aria-label={'Descendre '+item.name} onClick={()=>onReorder(item.id,group[group.indexOf(item)+1].id)}>↓</button>
</div><ApplianceRow item={item} onUpdate={onUpdate} onRemove={onRemove}/></div>)}</AnimatePresence></div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="dv-muted py-4 text-center text-sm">Aucun appareil ne correspond à « {search} ».</p>}
      </div>
    </section>
  );
}

function AddModal({ onClose, onAdd, defaultCategory = 'Multimédia' }) {
  const [deviceName, setDeviceName] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [nameError, setNameError] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [quantity, setQuantity] = useState(1);
  const [watts, setWatts] = useState(100);
  const [usageWindows, setUsageWindows] = useState([createUsageWindow(4, '08:00')]);
  const [powerMode, setPowerMode] = useState('watts');
  const [voltage, setVoltage] = useState(220);
  const [amps, setAmps] = useState(0.45);
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const nameInputRef = useRef(null);
  const SelectedIcon = CATEGORIES[category]?.icon || Wrench;

  const hours = getTotalHoursFromWindows(usageWindows);
  const dayShare = getDayShare(usageWindows);
  const period = dayShare >= 0.99 ? 'day' : dayShare <= 0.01 ? 'night' : 'both';
  const estimatedDaily = watts * hours * quantity;

  // Fake image based on category and name to look like a real photo
  const imageUrl = `https://images.unsplash.com/photo-${category === 'Climatisation' ? '1527344754160-5991823192bd' : category === 'Cuisine' ? '1584269600464-377fbfd40ec4' : category === 'Multimédia' ? '1593359677879-14aeb1f7a0bd' : category === 'Éclairage' ? '1513694203232-719a280e022f' : '1558383409-91ce695272a2'}?auto=format&fit=crop&w=400&q=80`;

  useEffect(() => { const handler = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [onClose]);

  const applyPreset = (preset) => {
    setDeviceName(preset.name);
    setBrandModel('');
    setNameError('');
    setCategory(preset.category);
    setWatts(preset.watts);
    setAmps(Number((preset.watts / voltage).toFixed(2)));
    setUsageWindows([createUsageWindow(preset.hours, preset.period === 'night' ? '19:00' : '08:00')]);
  };
  
  // Smart AI Fetch Simulation
  const handleSmartFetch = async () => {
    if (!deviceName && !brandModel) {
      toast.error("Veuillez saisir un nom ou un modèle d'abord.");
      return;
    }
    setIsSimulatingAI(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Heuristics for demo
    const query = `${deviceName} ${brandModel}`.toLowerCase();
    let estimatedWatts = watts;
    
    if (query.includes('tv') || query.includes('télévision')) {
      if (query.includes('32')) estimatedWatts = 45;
      else if (query.includes('55')) estimatedWatts = 120;
      else if (query.includes('65')) estimatedWatts = 160;
      else estimatedWatts = 80;
    } else if (query.includes('frigo') || query.includes('réfrigérateur')) {
      estimatedWatts = query.includes('américain') ? 300 : 150;
    } else if (query.includes('clim')) {
      estimatedWatts = query.includes('12000') ? 1100 : query.includes('18000') ? 1600 : 900;
    } else if (query.includes('ps5') || query.includes('playstation')) {
      estimatedWatts = 200;
    }
    
    setWatts(estimatedWatts);
    setAmps(Number((estimatedWatts / voltage).toFixed(2)));
    setIsSimulatingAI(false);
    toast.success(`Puissance trouvée : ${estimatedWatts}W pour ce modèle.`);
  };

  const setQuickHours = (h) => setUsageWindows([createUsageWindow(h, h >= 12 ? '00:00' : '08:00')]);
  const handleWatts = (v) => { const n = Math.max(1, Number(v) || 1); setWatts(n); setAmps(Number((n / voltage).toFixed(2))); };
  const handleVoltage = (v) => { const n = Math.max(1, Number(v) || 220); setVoltage(n); setWatts(Math.max(1, Math.round(n * amps))); };
  const handleAmps = (v) => { const n = Math.max(0.1, Number(v) || 0.1); setAmps(n); setWatts(Math.max(1, Math.round(voltage * n))); };
  const handleWindow = (i, field, v) => setUsageWindows((prev) => prev.map((w, idx) => (idx === i ? { ...w, [field]: v } : w)));
  const addWindow = () => setUsageWindows((prev) => { const last = prev[prev.length - 1] || { end: '08:00' }; return [...prev, { start: last.end, end: timeToInputValue(minutesFromTime(last.end) + 60) }]; });
  const removeWindow = (i) => setUsageWindows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const handleAdd = () => {
    const name = deviceName.trim();
    if (!name) { setNameError('Donnez un nom à l’appareil'); toast.error('Le nom de l’appareil est obligatoire.'); nameInputRef.current?.focus(); return; }
    onAdd({ id: Date.now(), name: brandModel ? `${name} (${brandModel})` : name, category, watts, hours, quantity, period, dayShare, diversity: 0.8, imageUrl });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} className="dv-panel devis-shell flex max-h-[94vh] w-full max-w-[1000px] flex-col overflow-hidden" style={{ borderRadius: 20, background: 'var(--panel)' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--line)' }}>
          <div><h3 className="text-xl font-bold">Ajouter un équipement</h3><p className="dv-muted text-sm">Définissez manuellement ou utilisez notre IA pour trouver la puissance.</p></div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="dv-step-btn"><X size={18} /></button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <span className="dv-label">Modèles courants</span>
              <div className="dv-scroll-x">
                {PRESETS.map((p) => <button type="button" key={p.name} onClick={() => applyPreset(p)} className={`dv-pill ${deviceName === p.name ? 'or' : ''}`} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>{p.name}</button>)}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom de l’appareil" required error={nameError}>
                <div className={`dv-field ${nameError ? 'is-error' : ''}`}>
                  <input ref={nameInputRef} value={deviceName} onChange={(e) => { setDeviceName(e.target.value); if (nameError) setNameError(''); }} placeholder="Ex : Télévision" />
                </div>
              </Field>
              <Field label="Catégorie">
                <div className="dv-field"><SelectedIcon size={17} style={{ color: 'var(--or)' }} /><select value={category} onChange={(e) => setCategory(e.target.value)}>{Object.keys(CATEGORIES).map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              </Field>
            </div>
            
            <div className="dv-card space-y-4 p-4 border border-[#ff7900]/30 bg-gradient-to-br from-[#ff7900]/5 to-transparent">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-[#ff7900]" />
                <h4 className="text-sm font-bold text-[#ff7900]">Recherche intelligente (Marque / Modèle)</h4>
              </div>
              <p className="dv-muted text-xs">Entrez la marque ou le modèle (ex: "Sony 32 pouces") et nous trouverons sa vraie puissance.</p>
              <div className="flex gap-2">
                <div className="dv-field flex-1">
                  <input value={brandModel} onChange={(e) => setBrandModel(e.target.value)} placeholder="Ex : LG OLED 55 pouces..." />
                </div>
                <button 
                  type="button" 
                  onClick={handleSmartFetch}
                  disabled={isSimulatingAI}
                  className="dv-btn bg-[#ff7900] text-black hover:brightness-110 disabled:opacity-50 min-w-[120px]"
                >
                  {isSimulatingAI ? <Loader2 size={16} className="animate-spin" /> : 'Rechercher'}
                </button>
              </div>
            </div>

            <StepperRow label="Quantité" value={quantity} min={1} max={99} onChange={setQuantity} />

            <div className="dv-card space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div><h4 className="text-sm font-bold">Puissance {brandModel ? 'trouvée' : 'manuelle'}</h4><p className="dv-muted text-xs">Ajustez si nécessaire.</p></div>
                <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--card2)' }}>
                  {[['watts', 'Watts'], ['volts', 'Volts × Ampères']].map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setPowerMode(id)} className="rounded-md px-3 py-1.5 text-xs font-bold transition" style={powerMode === id ? { background: 'var(--or)', color: '#000' } : { color: 'var(--muted)' }}>{label}</button>
                  ))}
                </div>
              </div>
              {powerMode === 'watts' ? (
                <Input type="number" min="1" value={watts} onChange={(e) => handleWatts(e.target.value)} suffix={<span className="dv-affix">W</span>} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Tension"><Input type="number" min="1" value={voltage} onChange={(e) => handleVoltage(e.target.value)} suffix={<span className="dv-affix">V</span>} /></Field>
                  <Field label="Courant"><Input type="number" min="0.1" step="0.01" value={amps} onChange={(e) => handleAmps(e.target.value)} suffix={<span className="dv-affix">A</span>} /></Field>
                  <p className="text-sm sm:col-span-2" style={{ color: 'var(--or)' }}>Puissance calculée : <strong>{watts} W</strong></p>
                </div>
              )}
            </div>

            <div className="dv-card space-y-4 p-4">
              <div><h4 className="text-sm font-bold">Combien de temps par jour ?</h4><p className="dv-muted text-xs">Touchez une durée, ou réglez les horaires précis.</p></div>
              <div className="dv-scroll-x">
                {[1, 2, 4, 6, 8, 12, 24].map((h) => <button type="button" key={h} onClick={() => setQuickHours(h)} className={`dv-pill ${Math.abs(hours - h) < 0.01 ? 'or' : ''}`} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>{h} h</button>)}
              </div>
              <div className="space-y-2">
                {usageWindows.map((w, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                    <Field label={i === 0 ? 'Début' : undefined}><div className="dv-field"><input type="time" value={w.start} onChange={(e) => handleWindow(i, 'start', e.target.value)} /></div></Field>
                    <Field label={i === 0 ? 'Fin' : undefined}><div className="dv-field"><input type="time" value={w.end} onChange={(e) => handleWindow(i, 'end', e.target.value)} /></div></Field>
                    <button type="button" className="dv-step-btn" onClick={() => removeWindow(i)} disabled={usageWindows.length <= 1} aria-label="Supprimer la plage" style={{ height: 48, width: 48 }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={addWindow} className="dv-btn dv-btn-ghost dv-btn-sm"><Plus size={14} />Ajouter une plage</button>
                <span className="dv-pill or">Total {Number(hours.toFixed(1))} h/jour · {periodLabel(period)}</span>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[320px] bg-[var(--card)] lg:border-l border-t lg:border-t-0 border-[var(--line)] flex flex-col shrink-0 z-10 overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
            <div className="relative h-48 w-full bg-zinc-800 shrink-0">
              {deviceName || brandModel ? (
                <img 
                  src={imageUrl} 
                  alt={deviceName || 'Equipment'} 
                  className="w-full h-full object-cover opacity-80 mix-blend-overlay"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <ImagePlus size={48} className="text-zinc-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-[#ff7900]/20 backdrop-blur-md border border-[#ff7900]/30 text-[#ff7900]">
                    <SelectedIcon size={16} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7900]">
                    {category}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white drop-shadow-md">
                  {brandModel ? `${deviceName} ${brandModel}` : (deviceName || 'Nouvel équipement')}
                </h4>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="dv-muted text-[10px] uppercase font-bold tracking-wider">Puissance</p>
                    <p className="text-lg font-semibold text-[var(--fg)]">{watts} W</p>
                  </div>
                  <div>
                    <p className="dv-muted text-[10px] uppercase font-bold tracking-wider">Durée estimée</p>
                    <p className="text-lg font-semibold text-[var(--fg)]">{Number(hours.toFixed(1))} h/j</p>
                  </div>
                </div>

                <div className="rounded-xl p-4 bg-[var(--or-soft)] border border-[var(--or-line)]">
                  <p className="text-[11px] font-bold text-[var(--or)] uppercase tracking-wider mb-1">Consommation journalière</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black tracking-tight text-[var(--or)] leading-none">{fmtEnergy(estimatedDaily)}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-5 py-4" style={{ borderColor: 'var(--line)' }}>
          <button type="button" onClick={onClose} className="dv-btn dv-btn-ghost">Annuler</button>
          <button type="button" onClick={handleAdd} className="dv-btn dv-btn-primary bg-[#ff7900] text-black hover:brightness-110"><Plus size={17} />Ajouter au devis</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   RÉCAPITULATIF LATÉRAL
──────────────────────────────────────────────────────────────────────────── */
function SummaryCard({ selectedProfile, selectedType, customType, projectForm, site, appliances, calc, hasName }) {
  const typeLabel = selectedType === 'Autre' ? (customType || 'Autre') : selectedType;
  const totalDevices = appliances.reduce((s, i) => s + i.quantity, 0);
  const checks = [
    { label: 'Profil choisi', ok: !!selectedProfile },
    { label: 'Nom du client', ok: hasName },
    { label: 'Type de bâtiment', ok: !!typeLabel },
    { label: 'Position confirmée', ok: site.confirmed },
    { label: 'Au moins un appareil', ok: totalDevices > 0 },
  ];
  const done = checks.filter((c) => c.ok).length;

  return (
    <aside className="dv-panel p-5 xl:sticky xl:top-5 xl:self-start">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Votre devis</h3>
        <span className="dv-pill or">{done}/{checks.length}</span>
      </div>

      <ul className="mb-5 space-y-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2.5 text-sm" style={{ color: c.ok ? 'var(--fg)' : 'var(--muted)' }}>
            <motion.span animate={c.ok ? { scale: [0.6, 1.15, 1] } : { scale: 1 }} className="grid h-5 w-5 place-items-center rounded-full" style={c.ok ? { background: 'var(--or)', color: '#000' } : { border: '1.5px solid var(--line)' }}>{c.ok && <Check size={12} strokeWidth={3.5} />}</motion.span>
            {c.label}
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-xl p-4" style={{ background: 'var(--or-soft)', border: '1px solid var(--or-line)' }}>
        <div className="flex items-center justify-between text-sm"><span className="dv-muted">Appareils</span><strong><AnimatedNumber value={totalDevices} /></strong></div>
        <div className="flex items-center justify-between text-sm"><span className="dv-muted">Consommation</span><strong><AnimatedNumber value={calc.dailyWh / 1000} decimals={2} suffix=" kWh/j" /></strong></div>
        <div className="flex items-center justify-between text-sm"><span className="dv-muted">Puissance max.</span><strong><AnimatedNumber value={calc.simultaneousWatts / 1000} decimals={2} suffix=" kW" /></strong></div>
      </div>

      <AnimatePresence>
        {totalDevices > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="mb-2 mt-5 text-sm font-bold">Équipement conseillé</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Panneaux', calc.panelCount, 0, ''], ['Batterie', calc.batteryKwh, 1, ' kWh'], ['Onduleur', calc.inverterKva, 1, ' kVA']].map(([label, value, dec, suffix]) => (
                <div key={label} className="dv-card px-1 py-3"><p className="text-lg font-black" style={{ color: 'var(--or)' }}><AnimatedNumber value={value} decimals={dec} suffix={suffix} /></p><p className="dv-muted text-[11px]">{label}</p></div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(site.adresse || projectForm.name) && (
        <div className="mt-5 flex items-start gap-2 text-xs dv-muted"><MapPin size={14} style={{ color: 'var(--or)', marginTop: 1, flex: 'none' }} /><span>{site.adresse}{site.quartier ? `, ${site.quartier}` : ''}</span></div>
      )}
    </aside>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   DEVIS IMPRIMABLE
──────────────────────────────────────────────────────────────────────────── */
function QuotePreview({ selectedProfile, selectedType, customType, companyForm, clientForm, site, appliances, calc, onClose }) {
  const customerName = selectedProfile === 'entreprise' ? (companyForm.companyName || companyForm.contactName || 'Client professionnel') : (clientForm.fullName || 'Client particulier');
  const typeLabel = selectedType === 'Autre' ? (customType || 'Autre') : selectedType;
  const quoteNumber = useMemo(() => `DJ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`, []);
  const address = [site.adresse, site.quartier, site.commune, site.ville].filter(Boolean).join(', ');
  const lineItems = [
    { label: `Dimensionnement solaire (${calc.panelCount} panneaux)`, detail: `${calc.solarKw.toFixed(1)} kWc · étude IA`, amount: calc.panelCount * 485000 },
    { label: 'Stockage lithium', detail: `${calc.batteryKwh.toFixed(1)} kWh · autonomie optimisée`, amount: calc.batteryKwh * 720000 },
    { label: 'Onduleur hybride', detail: `${calc.inverterKva.toFixed(1)} kVA · protection intégrée`, amount: calc.inverterKva * 390000 },
    { label: 'Installation & mise en service', detail: 'Pose, configuration et formation', amount: 350000 },
  ];
  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  const formatAmount = (a) => `${Math.round(a).toLocaleString('fr-FR')} FC`;

  return (
    <div className="quote-modal fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="quote-print-sheet relative my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white text-slate-950 shadow-2xl">
        <div className="flex items-center justify-between bg-black px-5 py-4 text-white sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[#ff7900] text-black"><FileText size={20} /></div>
            <div><p className="text-sm font-bold">Proposition commerciale</p><p className="text-xs text-slate-300">Générée par Djua Energy IA</p></div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-[#ff7900] px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"><Printer size={15} />Imprimer / PDF</button>
            <button type="button" onClick={onClose} aria-label="Fermer le devis" className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </div>
        </div>
        <div className="p-5 sm:p-10">
          <div className="flex flex-col justify-between gap-8 border-b border-slate-200 pb-8 sm:flex-row">
            <div>
              <div className="mb-4 flex items-center gap-2"><span className="h-3 w-3 bg-[#ff7900]" /><span className="text-sm font-bold">Djua Energy × Orange RDC</span></div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Votre solution énergétique</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Une proposition dimensionnée selon vos usages, votre bâtiment et la charge estimée de votre site.</p>
            </div>
            <div className="min-w-[220px] bg-slate-50 p-4 text-sm">
              <div className="mb-3 flex items-center justify-between"><span className="font-semibold text-slate-500">N° devis</span><strong>{quoteNumber}</strong></div>
              <div className="mb-3 flex items-center justify-between"><span className="font-semibold text-slate-500">Date</span><strong>{new Date().toLocaleDateString('fr-FR')}</strong></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Validité</span><strong>30 jours</strong></div>
            </div>
          </div>
          <div className="grid gap-4 border-b border-slate-200 py-7 sm:grid-cols-2">
            <div><p className="mb-2 text-xs font-bold text-slate-500">Émis par</p><p className="font-bold">Djua Energy</p><p className="text-sm text-slate-600">Solutions solaires intelligentes</p><p className="text-sm text-slate-600">Kinshasa, République démocratique du Congo</p></div>
            <div className="sm:text-right"><p className="mb-2 text-xs font-bold text-slate-500">Destinataire</p><p className="font-bold">{customerName}</p><p className="text-sm text-slate-600">{typeLabel || 'Projet énergétique'}</p><p className="text-sm text-slate-600">{address || 'Adresse à confirmer'}</p>{site.confirmed && <p className="text-xs font-semibold text-emerald-700">Position GPS confirmée</p>}</div>
          </div>
          <div className="mt-8 overflow-hidden border border-slate-200">
            <div className="hidden grid-cols-[1fr_220px] gap-4 bg-black px-5 py-3 text-xs font-bold text-white sm:grid"><span>Désignation</span><span className="text-right">Montant estimatif</span></div>
            {lineItems.map((item) => <div key={item.label} className="grid gap-2 border-b border-slate-200 px-5 py-4 last:border-0 sm:grid-cols-[1fr_220px] sm:gap-4"><div><p className="font-bold">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div><strong className="text-left text-[#c25a00] sm:text-right">{formatAmount(item.amount)}</strong></div>)}
          </div>
          <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="max-w-md border border-orange-200 bg-orange-50 p-4"><div className="mb-2 flex items-center gap-2 text-[#c25a00]"><Sparkles size={15} /><span className="text-sm font-bold">Recommandation IA</span></div><p className="text-sm leading-relaxed text-slate-700">Dimensionnement basé sur {fmtEnergy(calc.dailyWh)}/jour, {appliances.length} équipement(s) et une puissance simultanée de {fmtPower(calc.simultaneousWatts)}.</p></div>
            <div className="w-full max-w-sm space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Sous-total HT</span><strong>{formatAmount(subtotal)}</strong></div><div className="flex justify-between"><span className="text-slate-500">TVA (16%)</span><strong>{formatAmount(tax)}</strong></div><div className="mt-3 flex items-end justify-between border-t-2 border-black pt-4"><span className="font-black">Total TTC</span><strong className="text-2xl font-black text-[#ff7900]">{formatAmount(total)}</strong></div></div>
          </div>
          <div className="mt-10 grid gap-5 border-t border-slate-200 pt-6 text-xs text-slate-600 sm:grid-cols-3"><div><p className="mb-1 font-bold text-slate-950">Conditions</p><p>50% à la commande, solde à la mise en service.</p></div><div><p className="mb-1 font-bold text-slate-950">Délai indicatif</p><p>Livraison et installation sous 15 à 20 jours ouvrés.</p></div><div><p className="mb-1 font-bold text-slate-950">Note</p><p>Montants estimatifs soumis à validation technique finale.</p></div></div>
          <div className="mt-8 flex items-center justify-between text-xs font-semibold text-slate-400"><span>Merci pour votre confiance</span><span>Djua Energy · Énergie intelligente</span></div>
        </div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
──────────────────────────────────────────────────────────────────────────── */
export default function Devis() {
  const savedDraft = useMemo(() => readSavedDraft(), []);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('djua-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [currentStep, setCurrentStep] = useState(savedDraft?.currentStep || 'profile');
  const [selectedProfile, setSelectedProfile] = useState(savedDraft?.selectedProfile || '');
  const [selectedType, setSelectedType] = useState(savedDraft?.selectedType || '');
  const [customType, setCustomType] = useState(savedDraft?.customType || '');
  const [companyForm, setCompanyForm] = useState(savedDraft?.companyForm || initialCompanyForm);
  const [clientForm, setClientForm] = useState(savedDraft?.clientForm || initialClientForm);
  const [siteForm, setSiteForm] = useState(savedDraft?.siteForm || initialSiteForm);
  const [projectForm, setProjectForm] = useState(savedDraft?.projectForm || initialProjectForm);
  const [appliances, setAppliances] = useState(savedDraft?.appliances || []);
  const [defaultApplianceCategory, setDefaultApplianceCategory] = useState(savedDraft?.defaultApplianceCategory || 'Multimédia');
  const [isAdding, setIsAdding] = useState(false);
  const [isValidated, setIsValidated] = useState(Boolean(savedDraft?.isValidated));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [mlResult, setMlResult] = useState(null);
  const [showLegal, setShowLegal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const { mutate: recommendSolar, isPending: isRecommending } = useSolarRecommend();

  /* thème */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem('djua-theme', theme);
  }, [theme]);

  /* brouillon auto-sauvegardé */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isValidated || isSubmitting) { window.localStorage.removeItem(STORAGE_KEY); return; }
    const isEmptyDraft = currentStep === 'profile' && !selectedProfile && !selectedType && !customType && !companyForm.companyName && !companyForm.contactName && !clientForm.fullName && !clientForm.phone && !siteForm.adresse && appliances.length === 0;
    if (isEmptyDraft) { window.localStorage.removeItem(STORAGE_KEY); return; }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep, selectedProfile, selectedType, customType, companyForm, clientForm, siteForm, projectForm, appliances, defaultApplianceCategory, isValidated: false }));
  }, [currentStep, selectedProfile, selectedType, customType, companyForm, clientForm, siteForm, projectForm, appliances, defaultApplianceCategory, isValidated, isSubmitting]);

  useEffect(() => {
    if (!confirmReset) return undefined;
    const timer = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const currentOptions = useMemo(() => (selectedProfile ? profileOptions[selectedProfile] : []), [selectedProfile]);
  const calc = useMemo(() => calculate(appliances), [appliances]);
  const stepOrder = getStepOrder(selectedProfile);
  const stepIndex = Math.max(0, stepOrder.indexOf(currentStep));
  const progress = ((stepIndex + 1) / stepOrder.length) * 100;

  const typeIsValid = Boolean(selectedType) && (selectedType !== 'Autre' || customType.trim().length > 1);
  const hasName = selectedProfile === 'entreprise' ? (companyForm.companyName.trim().length > 1 || companyForm.contactName.trim().length > 1) : clientForm.fullName.trim().length > 1;
  const activePhone = selectedProfile === 'entreprise' ? companyForm.phone : clientForm.phone;
  const phoneInvalid = activePhone.trim().length > 0 && activePhone.replace(/\D/g, '').length < 9;
  const siteIsValid = siteForm.confirmed || siteForm.adresse.trim().length > 2;

  const stepValidity = {
    profile: Boolean(selectedProfile),
    details: hasName && !phoneInvalid,
    type: typeIsValid,
    site: siteIsValid,
    equipment: appliances.length > 0,
    summary: true,
  };
  const stepErrors = {
    details: phoneInvalid ? 'Le numéro de téléphone semble incomplet.' : 'Indiquez au moins le nom du client.',
    type: 'Choisissez un type de bâtiment.',
    site: 'Tapez l’adresse du client pour continuer.',
    equipment: 'Ajoutez au moins un appareil.',
  };

  const blocked = () => { setShakeKey((k) => k + 1); toast.error(stepErrors[currentStep] || 'Complétez cette étape.'); };
  const goToNext = () => {
    if (!stepValidity[currentStep]) {
      if (currentStep === 'equipment') { setIsAdding(true); return; }
      blocked();
      return;
    }
    const next = stepOrder[stepIndex + 1];
    if (next) setCurrentStep(next);
  };
  const goBack = () => {
    if (stepIndex > 0) { setCurrentStep(stepOrder[stepIndex - 1]); if (currentStep === 'summary') setIsValidated(false); }
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    setSelectedType('');
    setCustomType('');
    setSiteForm((prev) => ({ ...prev, details: {} }));
    setCurrentStep(getStepOrder(profile)[1]);
    setIsValidated(false);
  };

  const handleTypeSelect = (type) => {
    if (getBuildingKind(type) !== getBuildingKind(selectedType)) setSiteForm((prev) => ({ ...prev, details: {} }));
    setSelectedType(type);
    if (type !== 'Autre') setCustomType('');
  };

  const handleAddAppliance = (item) => { setAppliances((prev) => [...prev, item]); setIsAdding(false); toast.success(`${item.name} ajouté.`); };
  const handleQuickAdd = (preset) => {
    setAppliances((prev) => {
      const existing = prev.find((a) => a.name === preset.name);
      if (existing) return prev.map((a) => (a.id === existing.id ? { ...a, quantity: Math.min(99, a.quantity + 1) } : a));
      return [...prev, { ...preset, id: Date.now() + Math.random(), quantity: 1, dayShare: preset.period === 'night' ? 0 : preset.period === 'both' ? 0.5 : 1 }];
    });
  };
  const handleReorderAppliance=(source,target)=>setAppliances(previous=>{
 const next=[...previous],from=next.findIndex(i=>i.id===source),to=next.findIndex(i=>i.id===target);
 if(from<0||to<0||next[from].category!==next[to].category)return previous;
 const [item]=next.splice(from,1);next.splice(to,0,item);return next;
 });
 const handleUpdateAppliance = (next) => setAppliances((prev) => prev.map((item) => (item.id === next.id ? next : item)));
  const handleRemoveAppliance = (id) => setAppliances((prev) => prev.filter((item) => item.id !== id));

  const resetDraft = () => {
    setCurrentStep('profile');
    setSelectedProfile('');
    setSelectedType('');
    setCustomType('');
    setCompanyForm(initialCompanyForm);
    setClientForm(initialClientForm);
    setSiteForm(initialSiteForm);
    setProjectForm(initialProjectForm);
    setAppliances([]);
    setDefaultApplianceCategory('Multimédia');
    setIsAdding(false);
    setIsValidated(false);
    setIsSubmitting(false);
    setMlResult(null);
    setConfirmReset(false);
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = () => {
    if (!selectedProfile || !typeIsValid || isSubmitting) return;
    setIsSubmitting(true);
    setIsValidated(false);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsValidated(true);
      setIsQuoteOpen(true);
      window.localStorage.removeItem(STORAGE_KEY);
    }, 900);
  };

  const handleAIRecommend = () => {
    recommendSolar(
      { appliances, clientInfo: selectedProfile === 'entreprise' ? companyForm : clientForm, projectForm, site: siteForm, buildingType: selectedType === 'Autre' ? customType : selectedType },
      {
        onSuccess: (data) => { setMlResult(data); toast.success('Recommandation générée par l’IA Djua.'); },
        onError: () => toast.error('L’IA n’est pas disponible. Utilisez le devis standard.'),
      },
    );
  };

  const typeLabel = selectedType === 'Autre' ? customType : selectedType;
  const kind = getBuildingKind(selectedType);
  const titles = {
    profile: 'Qui est le client ?',
    details: selectedProfile === 'entreprise' ? 'Informations de l’entreprise' : 'Informations du client',
    type: selectedProfile === 'entreprise' ? 'Quel type d’entreprise ?' : 'Quel type de logement ?',
    site: 'Adresse et bâtiment',
    equipment: 'Quels appareils sont utilisés ?',
    summary: 'Vérifiez avant de valider',
  };

  const setCompany = (key) => (e) => setCompanyForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setClient = (key) => (e) => setClientForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <PageEntrance className="devis-shell min-h-screen px-3 py-5 sm:px-4 md:px-8 lg:px-10">
      <style>{CSS}</style>
      {isQuoteOpen && <QuotePreview selectedProfile={selectedProfile} selectedType={selectedType} customType={customType} companyForm={companyForm} clientForm={clientForm} site={siteForm} appliances={appliances} calc={calc} onClose={() => setIsQuoteOpen(false)} />}

      <div className="mx-auto max-w-7xl">
        {/* ── En-tête ── */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 flex-none place-items-center" style={{ background: 'var(--or)', color: '#000' }}><Zap size={28} strokeWidth={2.6} /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">Créer un devis solaire</h1>
              <p className="dv-muted text-sm">Point de vente Orange RDC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => (confirmReset ? resetDraft() : setConfirmReset(true))} className={`dv-btn dv-btn-sm ${confirmReset ? 'dv-btn-primary' : 'dv-btn-ghost'}`}><RotateCcw size={14} /><span className="hidden sm:inline">{confirmReset ? 'Confirmer ?' : 'Recommencer'}</span></button>
            <motion.button type="button" whileTap={{ scale: 0.9, rotate: 20 }} onClick={() => setTheme((c) => (c === 'dark' ? 'light' : 'dark'))} className="dv-step-btn" aria-label="Changer de thème">
              {theme === 'dark' ? <SunMedium size={18} style={{ color: 'var(--or)' }} /> : <MoonStar size={18} style={{ color: 'var(--or)' }} />}
            </motion.button>
          </div>
        </header>

        {/* ── Progression ── */}
        <nav aria-label="Progression" className="dv-panel mb-6 p-4">
          <div className="mb-3 flex items-center justify-between text-sm"><span className="font-bold">Étape {stepIndex + 1} sur {stepOrder.length}</span><span className="dv-muted">{STEP_LABELS[currentStep]}</span></div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--card2)' }}>
            <motion.div initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ background: 'var(--or)' }} />
          </div>
          <ol className="mt-4 flex items-center justify-between gap-1">
            {stepOrder.map((id, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex;
              return (
                <li key={id} className="flex flex-1 flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-2">
                  <button type="button" disabled={!done} onClick={() => done && setCurrentStep(id)} aria-current={active ? 'step' : undefined} className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition disabled:cursor-default" style={done || active ? { background: 'var(--or)', color: '#000', boxShadow: active ? '0 0 0 4px var(--or-soft)' : 'none' } : { border: '1.5px solid var(--line)', color: 'var(--muted)' }}>{done ? <Check size={15} strokeWidth={3.5} /> : index + 1}</button>
                  <span className="hidden text-xs font-semibold md:inline" style={{ color: active ? 'var(--fg)' : 'var(--muted)' }}>{STEP_LABELS[id]}</span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="grid items-start gap-6 xl:grid-cols-[1.7fr_0.8fr]">
          <section key={shakeKey} className={`dv-panel min-w-0 p-5 md:p-7 ${shakeKey ? 'dv-shake' : ''}`}>
            <AnimatePresence mode="wait" initial={false}>
              <PageEntrance key={currentStep}>

                {/* PROFIL */}
                {currentStep === 'profile' && (
                  <>
                    <StepHeader eyebrow="Commençons" title={titles.profile} subtitle="Choisissez le type de client. Les questions suivantes s’adapteront." />
                    <div className="grid gap-4 md:grid-cols-2">
                      {profileCards.map((profile) => {
                        const Icon = profile.icon;
                        return (
                          <motion.button type="button" key={profile.id} onClick={() => handleProfileSelect(profile.id)} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="group dv-card flex min-h-[220px] flex-col justify-between p-6 text-left transition-colors hover:!border-[var(--or)]">
                            <span className="grid h-16 w-16 place-items-center transition-transform group-hover:rotate-[-4deg]" style={{ background: 'var(--or)', color: '#000' }}><Icon className="h-8 w-8" /></span>
                            <div><h3 className="text-2xl font-bold">{profile.title}</h3><p className="dv-muted mt-2 text-sm">{profile.description}</p></div>
                            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--or)' }}>Choisir<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* TYPE */}
                {currentStep === 'type' && selectedProfile && (
                  <>
                    <StepHeader eyebrow="Le bâtiment" title={titles.type} subtitle="On vous posera ensuite les bonnes questions selon votre choix." />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {currentOptions.map((option) => <Choice key={option.id} on={selectedType === option.id} icon={option.icon} label={option.label} onClick={() => handleTypeSelect(option.id)} />)}
                    </div>
                    <AnimatePresence>
                      {selectedType === 'Autre' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <Field className="mt-5" label="Précisez le type" required>
                            <Input value={customType} onChange={(e) => setCustomType(e.target.value)} autoFocus placeholder={selectedProfile === 'personne' ? 'Ex : maison de campagne, lotissement…' : 'Ex : clinique, école, agence…'} />
                          </Field>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <NavBar onBack={goBack} onNext={goToNext} nextDisabled={!typeIsValid} onDisabledClick={blocked} />
                  </>
                )}

                {/* DÉTAILS CLIENT */}
                {currentStep === 'details' && (
                  <>
                    <StepHeader eyebrow={selectedProfile === 'entreprise' ? 'L’entreprise' : 'Le client'} title={titles.details} subtitle="Seul le nom est obligatoire. Le reste peut être complété plus tard." />
                    {selectedProfile === 'entreprise' ? (
                      <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Nom de l’entreprise" required><Input icon={Building2} value={companyForm.companyName} onChange={setCompany('companyName')} placeholder="Ex : Boutique Mbala & Fils" /></Field>
                          <Field label="Secteur d’activité"><Input value={companyForm.secteur} onChange={setCompany('secteur')} placeholder="Ex : commerce, restauration" /></Field>
                          <Field label="Personne à contacter"><Input icon={UserRound} value={companyForm.contactName} onChange={setCompany('contactName')} placeholder="Ex : Jean Mbala" /></Field>
                          <Field label="Téléphone" error={phoneInvalid ? 'Numéro trop court' : undefined}><Input prefix="+243" inputMode="tel" invalid={phoneInvalid} value={companyForm.phone} onChange={setCompany('phone')} placeholder="850 000 000" /></Field>
                          <Field label="Email" className="md:col-span-2"><Input type="email" value={companyForm.email} onChange={setCompany('email')} placeholder="contact@entreprise.com" /></Field>
                        </div>
                        <div className="dv-card overflow-hidden">
                          <button type="button" onClick={() => setShowLegal((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold" aria-expanded={showLegal}>
                            <span>Informations légales <span className="dv-muted font-medium">· facultatif</span></span>
                            <motion.span animate={{ rotate: showLegal ? 45 : 0 }}><Plus size={18} style={{ color: 'var(--or)' }} /></motion.span>
                          </button>
                          <AnimatePresence initial={false}>
                            {showLegal && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="grid gap-4 p-4 pt-1 md:grid-cols-3">
                                  <Field label="RCCM"><Input value={companyForm.rccm} onChange={setCompany('rccm')} placeholder="RCCM/KN/2024/B/12345" /></Field>
                                  <Field label="Identifiant fiscal"><Input value={companyForm.idNationale} onChange={setCompany('idNationale')} placeholder="A1234567" /></Field>
                                  <Field label="Numéro TVA"><Input value={companyForm.tva} onChange={setCompany('tva')} placeholder="TVA 123456789" /></Field>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Nom complet" required className="md:col-span-2"><Input icon={UserRound} value={clientForm.fullName} onChange={setClient('fullName')} placeholder="Ex : Christian Mukendi" autoFocus /></Field>
                          <Field label="Téléphone" error={phoneInvalid ? 'Numéro trop court' : undefined}><Input prefix="+243" inputMode="tel" invalid={phoneInvalid} value={clientForm.phone} onChange={setClient('phone')} placeholder="850 000 000" /></Field>
                          <Field label="Email"><Input type="email" value={clientForm.email} onChange={setClient('email')} placeholder="client@email.com" /></Field>
                        </div>
                        <div>
                          <span className="dv-label">Comment le client préfère être contacté</span>
                          <div className="grid grid-cols-3 gap-2">
                            {[['WhatsApp', '💬'], ['Appel', '📞'], ['SMS', '✉️']].map(([label, emoji]) => (
                              <Choice key={label} on={clientForm.contactPref === label} emoji={emoji} label={label} onClick={() => setClientForm((prev) => ({ ...prev, contactPref: prev.contactPref === label ? '' : label }))} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <NavBar onBack={goBack} onNext={goToNext} nextDisabled={!stepValidity.details} onDisabledClick={blocked} />
                  </>
                )}

                {/* SITE */}
                {currentStep === 'site' && (
                  <>
                    <StepHeader eyebrow="Le lieu d’installation" title={titles.site} subtitle="Trouvez l’adresse sur la carte, puis décrivez le bâtiment." />
                    <SiteStep site={siteForm} setSite={setSiteForm} selectedType={selectedType} customType={customType} selectedProfile={selectedProfile} theme={theme} />
                    <NavBar onBack={goBack} onNext={goToNext} nextDisabled={!siteIsValid} onDisabledClick={blocked} />
                  </>
                )}

                {/* ÉQUIPEMENTS */}
                {currentStep === 'equipment' && (
                  <>
                    <StepHeader eyebrow="La consommation" title={titles.equipment} subtitle="Touchez les appareils du client. Plus la liste est complète, plus le devis sera juste." />
                    <QuickAdd appliances={appliances} onQuickAdd={handleQuickAdd} />
                    {appliances.length === 0 ? (
                      <div className="dv-card flex flex-col items-center px-6 py-10 text-center" style={{ borderStyle: 'dashed', borderColor: 'var(--or-line)' }}>
                        <span className="dv-ping mb-4 grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--or-soft)', color: 'var(--or)' }}><Plus size={26} /></span>
                        <h3 className="text-lg font-bold">Aucun appareil pour le moment</h3>
                        <p className="dv-muted mt-1 max-w-sm text-sm">Touchez un modèle ci-dessus, ou ajoutez un appareil précis.</p>
                        <button type="button" onClick={() => { setDefaultApplianceCategory('Multimédia'); setIsAdding(true); }} className="dv-btn dv-btn-primary mt-5"><Plus size={16} />Ajouter un appareil</button>
                      </div>
                    ) : (
                      <ApplianceList onReorder={handleReorderAppliance} appliances={appliances} onUpdate={handleUpdateAppliance} onRemove={handleRemoveAppliance} onAddClick={(category) => { setDefaultApplianceCategory(category || 'Multimédia'); setIsAdding(true); }} />
                    )}
                    <div className="mt-6 flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: 'var(--or-soft)', border: '1px solid var(--or-line)' }}>
                      <div><p className="dv-muted text-xs">Consommation totale</p><p className="text-2xl font-black"><AnimatedNumber value={calc.dailyWh / 1000} decimals={2} /> <span className="text-base font-bold">kWh / jour</span></p></div>
                      <div className="flex gap-3"><button type="button" onClick={goBack} className="dv-btn dv-btn-ghost"><ArrowLeft size={16} />Retour</button><button type="button" onClick={goToNext} disabled={appliances.length === 0} className="dv-btn dv-btn-primary">Voir le résumé<ArrowRight size={16} /></button></div>
                    </div>
                  </>
                )}

                {/* RÉSUMÉ */}
                {currentStep === 'summary' && (
                  <>
                    <StepHeader eyebrow="Dernière étape" title={titles.summary} subtitle="Relisez avec le client. Vous pouvez encore tout modifier." />
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="dv-card p-4">
                          <p className="dv-muted text-xs">Client</p>
                          <div className="mt-3 flex items-center gap-3">
                            <span className="dv-ic" style={{ background: 'var(--or)', color: '#000' }}>{selectedProfile === 'personne' ? <UserRound size={19} /> : <Building2 size={19} />}</span>
                            <div className="min-w-0"><p className="truncate text-base font-bold">{selectedProfile === 'entreprise' ? (companyForm.companyName || companyForm.contactName) : clientForm.fullName}</p><p className="dv-muted truncate text-sm">{typeLabel}</p></div>
                          </div>
                          <div className="dv-muted mt-3 space-y-1 text-sm">
                            {(selectedProfile === 'entreprise' ? companyForm.phone : clientForm.phone) && <p>+243 {selectedProfile === 'entreprise' ? companyForm.phone : clientForm.phone}</p>}
                            {(selectedProfile === 'entreprise' ? companyForm.email : clientForm.email) && <p>{selectedProfile === 'entreprise' ? companyForm.email : clientForm.email}</p>}
                            {clientForm.contactPref && selectedProfile === 'personne' && <p>Préfère : {clientForm.contactPref}</p>}
                            {selectedProfile === 'entreprise' && (companyForm.rccm || companyForm.tva) && <p>{[companyForm.rccm && `RCCM ${companyForm.rccm}`, companyForm.tva && companyForm.tva].filter(Boolean).join(' · ')}</p>}
                          </div>
                        </div>
                        <div className="dv-card p-4">
                          <div className="flex items-center justify-between"><p className="dv-muted text-xs">Lieu d’installation</p><span className={`dv-pill ${siteForm.confirmed ? 'ok' : ''}`}>{siteForm.confirmed ? <><Check size={12} strokeWidth={3} />Position confirmée</> : 'Non confirmée'}</span></div>
                          <p className="mt-3 text-base font-bold">{siteForm.adresse || 'Adresse non renseignée'}</p>
                          <p className="dv-muted text-sm">{[siteForm.quartier, siteForm.commune, siteForm.ville].filter(Boolean).join(', ')}</p>
                          {siteForm.reference && <p className="dv-muted mt-2 text-sm italic">« {siteForm.reference} »</p>}
                        </div>
                      </div>

                      {siteForm.lat != null && <MiniMap lat={siteForm.lat} lng={siteForm.lng} theme={theme} />}

                      <div className="dv-card p-4">
                        <p className="mb-3 text-sm font-bold">Détails du bâtiment</p>
                        {summarizeDetails(kind, siteForm.details).length > 0 ? (
                          <div className="flex flex-wrap gap-2">{summarizeDetails(kind, siteForm.details).map((d) => <span key={d.label} className="dv-pill"><span>{d.label} :</span><strong style={{ color: 'var(--fg)' }}>{d.value}</strong></span>)}</div>
                        ) : <p className="dv-muted text-sm">Aucun détail renseigné.</p>}
                      </div>

                      <div className="dv-card p-4">
                        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold">Appareils</p><span className="dv-pill or">{appliances.reduce((s, i) => s + i.quantity, 0)} au total</span></div>
                        <div className="space-y-2">
                          {appliances.map((item) => {
                            const ItemIcon = resolveCategoryIcon(item.category);
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
                                <div className="flex min-w-0 items-center gap-3"><ItemIcon size={16} style={{ color: 'var(--or)', flex: 'none' }} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="dv-muted text-xs">{item.category}</p></div></div>
                                <div className="dv-muted flex-none text-right text-xs"><p>{item.quantity} × {item.watts} W</p><p className="font-semibold" style={{ color: 'var(--fg)' }}>{(item.watts * item.hours * item.quantity / 1000).toFixed(2)} kWh/j</p></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {mlResult && (
                      <div className="mt-6">
                        <SolarAdvisorResult result={mlResult} onClose={() => setMlResult(null)} onContactRequest={(id) => toast.success(`Demande de contact envoyée pour la recommandation ${id}`)} />
                      </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3">
                      {!mlResult && <SolarAdvisorTrigger isLoading={isRecommending} hasResult={!!mlResult} onClick={handleAIRecommend} />}
                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button type="button" onClick={() => setCurrentStep('equipment')} className="dv-btn dv-btn-ghost"><ArrowLeft size={16} />Modifier</button>
                        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="dv-btn dv-btn-primary" style={{ minWidth: 220 }}>
                          {isSubmitting ? <><Loader2 size={17} className="animate-spin" />Préparation…</> : <><FileText size={17} />Générer le devis</>}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isValidated && (
                        <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mt-5 space-y-4 rounded-xl p-4 text-sm" style={{ background: 'var(--ok-soft)', border: '1px solid rgba(60,207,98,.4)' }}>
                          <div className="flex items-start gap-3" style={{ color: 'var(--ok)' }}><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><span className="font-semibold">Le devis est prêt. Vous pouvez l’imprimer ou l’envoyer au client.</span></div>
                          <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setIsQuoteOpen(true)} className="dv-btn dv-btn-primary dv-btn-sm"><FileText size={15} />Voir le devis</button><button type="button" onClick={resetDraft} className="dv-btn dv-btn-ghost dv-btn-sm">Nouveau devis</button></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </PageEntrance>
            </AnimatePresence>
          </section>

          <SummaryCard selectedProfile={selectedProfile} selectedType={selectedType} customType={customType} projectForm={projectForm} site={siteForm} appliances={appliances} calc={calc} hasName={hasName} />
        </div>
      </div>

      <AnimatePresence>
        {isAdding && <AddModal defaultCategory={defaultApplianceCategory} onClose={() => setIsAdding(false)} onAdd={handleAddAppliance} />}
      </AnimatePresence>
    </PageEntrance>
  );
}