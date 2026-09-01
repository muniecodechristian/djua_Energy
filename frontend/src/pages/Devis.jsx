import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CookingPot,
  Droplets,
  Factory,
  FileText,
  Home,
  Hotel,
  Lightbulb,
  MonitorSmartphone,
  MoonStar,
  PencilLine,
  Plus,
  Search,
  ShoppingBag,
  Snowflake,
  Store,
  SunMedium,
  UserRound,
  UtensilsCrossed,
  Warehouse,
  Wrench,
} from 'lucide-react';

const CATEGORIES = {
  Éclairage: { icon: Lightbulb, tone: 'sun' },
  Cuisine: { icon: CookingPot, tone: 'rose' },
  'Multimédia': { icon: MonitorSmartphone, tone: 'blue' },
  Climatisation: { icon: Snowflake, tone: 'ice' },
  Pompage: { icon: Droplets, tone: 'water' },
  Autres: { icon: Wrench, tone: 'gray' },
};

const INITIAL_APPLIANCES = [];

const PRESETS = [
  { name: 'Télévision', category: 'Multimédia', icon: MonitorSmartphone, watts: 120, hours: 5, period: 'both', diversity: 0.8 },
  { name: 'Ventilateur', category: 'Climatisation', icon: Snowflake, watts: 75, hours: 8, period: 'night', diversity: 0.8 },
  { name: 'Pompe à eau', category: 'Pompage', icon: Droplets, watts: 750, hours: 1, period: 'day', diversity: 0.65 },
  { name: 'Ordinateur', category: 'Multimédia', icon: MonitorSmartphone, watts: 65, hours: 6, period: 'day', diversity: 0.85 },
];

const profileOptions = {
  personne: [
    { id: 'Villa', label: 'Villa', icon: Home },
    { id: 'Appartement', label: 'Appartement', icon: Building2 },
    { id: 'Studio', label: 'Studio', icon: Home },
    { id: 'Duplex', label: 'Duplex', icon: Building2 },
    { id: 'Maison moderne', label: 'Maison moderne', icon: Home },
    { id: 'Autre', label: 'Autre', icon: PencilLine },
  ],
  entreprise: [
    { id: 'Usine', label: 'Usine', icon: Factory },
    { id: 'Boutique', label: 'Boutique', icon: Store },
    { id: 'Bureau', label: 'Bureau', icon: BriefcaseBusiness },
    { id: 'Restaurant', label: 'Restaurant', icon: UtensilsCrossed },
    { id: 'Hôtel', label: 'Hôtel', icon: Hotel },
    { id: 'Magasin', label: 'Magasin', icon: ShoppingBag },
    { id: 'Entrepôt', label: 'Entrepôt', icon: Warehouse },
    { id: 'Autre', label: 'Autre', icon: PencilLine },
  ],
};

const profileCards = [
  { id: 'personne', title: 'Personne', description: 'Pour un particulier ou un foyer', icon: UserRound },
  { id: 'entreprise', title: 'Entreprise', description: 'Pour une structure commerciale ou industrielle', icon: Building2 },
];

const STORAGE_KEY = 'djua-devis-onboarding-state';

const initialCompanyForm = {
  companyName: '',
  rccm: '',
  idNationale: '',
  tva: '',
  secteur: '',
  adresse: '',
  ville: '',
  province: '',
  contactName: '',
  phone: '',
  email: '',
};

const getDefaultDraft = () => ({
  currentStep: 'profile',
  selectedProfile: '',
  selectedType: '',
  customType: '',
  companyForm: initialCompanyForm,
  projectForm: { name: '', location: '', occupants: 4, targetConsumption: 0 },
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

    return {
      ...getDefaultDraft(),
      ...parsed,
      companyForm: { ...initialCompanyForm, ...(parsed.companyForm || {}) },
      projectForm: {
        name: '',
        location: '',
        occupants: 4,
        targetConsumption: 0,
        ...(parsed.projectForm || {}),
      },
      appliances: Array.isArray(parsed.appliances)
        ? parsed.appliances.map((item) => ({ ...item, category: item.category || 'Autres', icon: undefined }))
        : [],
      defaultApplianceCategory: Object.keys(CATEGORIES).includes(parsed.defaultApplianceCategory) ? parsed.defaultApplianceCategory : 'Multimédia',
    };
  } catch (error) {
    return null;
  }
};

const fmtEnergy = (wh) => (wh >= 1000 ? `${(wh / 1000).toFixed(2)} kWh` : `${Math.round(wh)} Wh`);
const fmtPower = (watts) => (watts >= 1000 ? `${(watts / 1000).toFixed(2)} kW` : `${Math.round(watts)} W`);
const periodLabel = (period) => ({ day: 'Jour', night: 'Nuit', both: 'Jour & nuit' }[period] || 'Jour');

function calculate(appliances, autonomy = 1) {
  const dailyWh = appliances.reduce((total, item) => total + item.watts * item.hours * item.quantity, 0);
  const dayWh = appliances.reduce((total, item) => total + item.watts * item.hours * item.quantity * (item.period === 'night' ? 0 : item.period === 'both' ? 0.5 : 1), 0);
  const simultaneousWatts = appliances.reduce((total, item) => total + item.watts * item.quantity * item.diversity, 0);
  const energyToProduce = dailyWh * 1.15 * 1.2;
  const rawSolarKw = energyToProduce / 1000 / 5.1;
  const panelCount = Math.max(2, Math.ceil(rawSolarKw / 0.6));
  const solarKw = panelCount * 0.6;
  const batteryKwh = Math.max(2.5, Math.ceil((dailyWh / 1000 * autonomy / 0.8) / 2.5) * 2.5);
  const inverterKva = Math.max(1.5, Math.ceil((simultaneousWatts * 1.25 / 0.8) / 500) * 0.5);
  return { dailyWh, dayWh, nightWh: dailyWh - dayWh, simultaneousWatts, energyToProduce, rawSolarKw, panelCount, solarKw, batteryKwh, inverterKva, autonomy };
}

function Quantity({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/80 px-2 py-1.5 shadow-inner shadow-black/20">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-lg text-white transition hover:bg-zinc-700">−</button>
      <strong className="min-w-5 text-center text-sm font-semibold text-white">{value}</strong>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-lg text-white transition hover:bg-zinc-700">+</button>
    </div>
  );
}

function ApplianceRow({ item, onUpdate }) {
  const energy = item.watts * item.hours * item.quantity;
  const Icon = resolveCategoryIcon(item.category);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 md:flex-row md:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 shadow-inner shadow-black/30">
          <Icon size={20} className="text-orange-300" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{item.name}</div>
          <div className="text-[11px] text-zinc-400">{fmtPower(item.watts)} · {item.hours} h/jour · {periodLabel(item.period)}</div>
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-3 md:items-center">
        <Quantity value={item.quantity} onChange={(quantity) => onUpdate({ ...item, quantity })} />
        <div className="min-w-[110px] rounded-xl border border-zinc-800 bg-zinc-900/80 px-2 py-1.5 text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Énergie</div>
          <div className="text-sm font-semibold text-white">{fmtEnergy(energy)}/j</div>
        </div>
      </div>
    </div>
  );
}

function ApplianceList({ appliances, onUpdate, onAddClick }) {
  const categories = Object.keys(CATEGORIES);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-zinc-400">Équipements du projet</p>
          <h3 className="text-2xl font-semibold text-white">Dimensionnement de la charge</h3>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 sm:w-auto">
            <Search size={14} className="text-zinc-500" />
            <input placeholder="Rechercher" className="w-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none sm:w-28" />
          </label>
          <button type="button" onClick={() => onAddClick('Multimédia')} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(249,115,22,0.35)] transition hover:bg-orange-400 sm:w-auto"><Plus size={14} />Ajouter</button>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const group = appliances.filter((item) => item.category === category);
          const totalEnergy = group.reduce((sum, item) => sum + item.watts * item.hours * item.quantity, 0);
          const CategoryIcon = CATEGORIES[category].icon;

          return (
            <div key={category} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                    <CategoryIcon size={16} className="text-orange-300" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white">{category}</div>
                    <div className="text-[11px] text-zinc-500">{group.reduce((sum, item) => sum + item.quantity, 0)} appareils</div>
                  </div>
                </div>
                <div className="text-right text-xs font-medium text-zinc-300">{fmtEnergy(totalEnergy)}/jour</div>
              </div>

              <div className="space-y-2">
                {group.length > 0 ? group.map((item) => <ApplianceRow key={item.id} item={item} onUpdate={onUpdate} />) : (
                  <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/50 px-3 py-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-medium text-zinc-300">Aucun appareil dans cette catégorie.</p>
                        <p className="mt-1 text-xs text-zinc-500">Ajoutez un équipement pour compléter le dimensionnement.</p>
                      </div>
                      <button type="button" onClick={() => onAddClick(category)} className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-200 transition hover:border-orange-400 hover:bg-orange-500/15">
                        <Plus size={14} /> Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AddModal({ onClose, onAdd, defaultCategory = 'Multimédia' }) {
  const [deviceName, setDeviceName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [quantity, setQuantity] = useState(1);
  const [watts, setWatts] = useState(PRESETS[0].watts);
  const [hours, setHours] = useState(PRESETS[0].hours);
  const [period, setPeriod] = useState(PRESETS[0].period);
  const [powerMode, setPowerMode] = useState('watts');
  const [voltage, setVoltage] = useState(220);
  const [amps, setAmps] = useState(Number((PRESETS[0].watts / 220).toFixed(2)));

  const SelectedIcon = CATEGORIES[category]?.icon || Wrench;

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    if (powerMode === 'volts') {
      const nextWatts = Math.max(1, Math.round(voltage * amps));
      setWatts(nextWatts);
    }
  }, [voltage, amps, powerMode]);

  const handleWattsChange = (nextValue) => {
    const value = Number(nextValue) || 1;
    setWatts(value);
    if (powerMode === 'volts') {
      setAmps(Number((value / voltage).toFixed(2)));
    }
  };

  const handleVoltageChange = (nextValue) => {
    const value = Number(nextValue) || 220;
    setVoltage(value);
    setAmps(Number((watts / value).toFixed(2)) || 0.1);
  };

  const handleAmpsChange = (nextValue) => {
    const value = Number(nextValue) || 0.1;
    setAmps(value);
    setWatts(Math.max(1, Math.round(voltage * value)));
  };

  const estimatedDaily = watts * hours * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-[1100px] rounded-[28px] border border-[var(--devis-border)] bg-[var(--devis-surface)] shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--devis-separator)] px-6 py-5">
          <div>
            <h3 className="text-[34px] font-semibold tracking-[-0.04em] text-[var(--devis-foreground)]">Ajouter un appareil</h3>
            <p className="mt-1 text-sm text-[var(--devis-muted)]">Renseignez les caractéristiques et l’utilisation de l’appareil.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--devis-border)] bg-[var(--devis-panel)] text-xl font-light text-[var(--devis-foreground)] transition hover:border-orange-500/60 hover:text-orange-400"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[var(--devis-foreground)]">
                <span>Catégorie</span>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--devis-border)] bg-[var(--devis-field)] px-3 py-3 text-[var(--devis-field-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/10 text-orange-400">
                    <SelectedIcon size={12} />
                  </span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full bg-transparent pr-4 text-base font-medium text-[var(--devis-field-foreground)] outline-none"
                  >
                    {Object.keys(CATEGORIES).map((name) => (
                      <option value={name} key={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="space-y-2 text-sm font-medium text-[var(--devis-foreground)]">
                <span>Quel appareil ajoutez-vous ?</span>
                <input
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder="Ex. Machine à laver"
                  autoFocus
                  className="w-full rounded-xl border border-[var(--devis-border)] bg-[var(--devis-field)] px-3 py-3 text-base text-[var(--devis-field-foreground)] placeholder:text-[var(--devis-muted)] outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--devis-foreground)]">Quantité</label>
              <div className="flex items-center gap-3 rounded-xl border border-[var(--devis-border)] bg-[var(--devis-field)] px-3 py-3 text-[var(--devis-field-foreground)]">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--devis-border)] bg-[var(--devis-panel)] text-xl text-[var(--devis-foreground)] transition hover:border-orange-500/60 hover:text-orange-400"
                >
                  −
                </button>
                <strong className="min-w-8 text-center text-xl font-semibold text-[var(--devis-foreground)]">{quantity}</strong>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--devis-border)] bg-[var(--devis-panel)] text-xl text-[var(--devis-foreground)] transition hover:border-orange-500/60 hover:text-orange-400"
                >
                  +
                </button>
                <span className="ml-2 text-sm text-[var(--devis-muted)]">pièce(s)</span>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-[var(--devis-border)] bg-[var(--devis-soft)] p-4">
              <div>
                <h4 className="text-[15px] font-semibold text-[var(--devis-foreground)]">Caractéristiques électriques</h4>
                <p className="mt-1 text-sm text-[var(--devis-muted)]">Renseignez la puissance de l’appareil.</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPowerMode('watts')}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    powerMode === 'watts'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.15)]'
                      : 'border-[var(--devis-border)] bg-[var(--devis-panel)] text-[var(--devis-foreground)] hover:border-orange-500/50'
                  }`}
                >
                  <span>⚡</span>
                  <span>Puissance en Watts (W)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPowerMode('volts')}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    powerMode === 'volts'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.15)]'
                      : 'border-[var(--devis-border)] bg-[var(--devis-panel)] text-[var(--devis-foreground)] hover:border-orange-500/50'
                  }`}
                >
                  <span>⚡</span>
                  <span>Tension (V) et courant (A)</span>
                </button>
              </div>

              {powerMode === 'watts' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--devis-foreground)]">Puissance</label>
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--devis-border)] bg-[var(--devis-field)] px-3 py-3">
                    <input
                      type="number"
                      min="1"
                      value={watts}
                      onChange={(event) => handleWattsChange(event.target.value)}
                      className="w-full bg-transparent text-2xl font-semibold text-[var(--devis-field-foreground)] outline-none"
                    />
                    <span className="text-sm uppercase tracking-[0.2em] text-[var(--devis-muted)]">W</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-[var(--devis-foreground)]">
                      <span>Tension</span>
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--devis-border)] bg-[var(--devis-field)] px-3 py-3">
                        <input
                          type="number"
                          min="1"
                          value={voltage}
                          onChange={(event) => handleVoltageChange(event.target.value)}
                          className="w-full bg-transparent text-xl font-semibold text-[var(--devis-field-foreground)] outline-none"
                        />
                        <span className="text-sm uppercase tracking-[0.2em] text-[var(--devis-muted)]">V</span>
                      </div>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-[var(--devis-foreground)]">
                      <span>Courant</span>
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--devis-border)] bg-[var(--devis-field)] px-3 py-3">
                        <input
                          type="number"
                          min="0.1"
                          step="0.01"
                          value={amps}
                          onChange={(event) => handleAmpsChange(event.target.value)}
                          className="w-full bg-transparent text-xl font-semibold text-[var(--devis-field-foreground)] outline-none"
                        />
                        <span className="text-sm uppercase tracking-[0.2em] text-[var(--devis-muted)]">A</span>
                      </div>
                    </label>
                  </div>

                  <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-sm text-orange-500">
                    Puissance calculée : <span className="font-semibold">{watts} W</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[var(--devis-border)] bg-[var(--devis-panel)] px-3 py-2 text-sm text-[var(--devis-muted)]">
                Valeur indicative : vérifiez l’étiquette de votre appareil.
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-[var(--devis-border)] bg-[var(--devis-soft)] p-4">
              <div>
                <h4 className="text-[15px] font-semibold text-[var(--devis-foreground)]">Utilisation quotidienne</h4>
                <p className="mt-1 text-sm text-[var(--devis-muted)]">Combien d’heures par jour cet appareil est-il utilisé ?</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[var(--devis-foreground)]">
                  <span>Heures d’utilisation par jour</span>
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--devis-border)] bg-[var(--devis-field)] px-3 py-3">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={hours}
                      onChange={(event) => setHours(Number(event.target.value) || 0.1)}
                      className="w-full bg-transparent text-xl font-semibold text-[var(--devis-field-foreground)] outline-none"
                    />
                    <span className="text-sm uppercase tracking-[0.2em] text-[var(--devis-muted)]">h / jour</span>
                  </div>
                </label>

                <div className="space-y-2">
                  <span className="block text-sm font-medium text-[var(--devis-foreground)]">Période principale d’utilisation</span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {['day', 'night', 'both'].map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setPeriod(item)}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                          period === item
                            ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                            : 'border-[var(--devis-border)] bg-[var(--devis-panel)] text-[var(--devis-foreground)] hover:border-orange-500/50'
                        }`}
                      >
                        {item === 'day' ? '☀ Jour' : item === 'night' ? '☾ Nuit' : '☀☾ Les deux'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-[var(--devis-foreground)] transition hover:text-orange-500"
              >
                <span>⌄</span>
                <span>Ajouter des notes (optionnel)</span>
              </button>
            </div>
          </div>

          <aside className="rounded-[24px] border border-[var(--devis-border)] bg-[var(--devis-panel)] p-4">
            <div className="flex items-center justify-center rounded-[18px] border border-[var(--devis-border)] bg-[var(--devis-soft)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="flex h-24 w-24 items-center justify-center rounded-[22px] bg-[var(--devis-panel-alt)] border border-[var(--devis-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <SelectedIcon size={40} className="text-orange-400" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h4 className="text-[28px] font-semibold tracking-[-0.04em] text-[var(--devis-foreground)]">{deviceName || 'Nouvel appareil'}</h4>
              <span className="rounded-full border border-[var(--devis-border)] bg-[var(--devis-soft)] px-2 py-1 text-xs text-[var(--devis-muted)]">× {quantity}</span>
            </div>

            <div className="mt-3 text-sm text-[var(--devis-muted)]">
              <div>{watts} W / unité</div>
              <div>{hours} h / jour</div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--devis-border)] bg-[var(--devis-soft)] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--devis-muted)]">Consommation estimée</div>
              <div className="mt-2 text-3xl font-bold tracking-[-0.04em] text-orange-500">{fmtEnergy(estimatedDaily)}</div>
              <div className="mt-1 text-sm text-[var(--devis-muted)]">/ jour</div>
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--devis-separator)] px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--devis-border)] bg-[var(--devis-panel)] px-5 py-3 text-sm font-medium text-[var(--devis-foreground)] transition hover:border-orange-500/60 hover:text-orange-400"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onAdd({
              id: Date.now(),
              name: deviceName.trim() || 'Nouvel appareil',
              category,
              icon: CATEGORIES[category].icon,
              watts,
              hours,
              quantity,
              period,
              diversity: 0.8,
            })}
            className="rounded-full bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-[0_14px_28px_rgba(249,115,22,0.32)] transition hover:bg-orange-400"
          >
            Ajouter l’appareil
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryCard({ selectedProfile, selectedType, customType, companyForm, projectForm, appliances, calc }) {
  const typeLabel = selectedType === 'Autre' ? (customType || 'Autre') : selectedType;
  const totalDevices = appliances.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Récapitulatif</h3>
        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300">Overview</span>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Profil</p><p className="mt-2 text-lg font-semibold text-white">{selectedProfile === 'personne' ? 'Personne' : selectedProfile === 'entreprise' ? 'Entreprise' : 'Non sélectionné'}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Type</p><p className="mt-2 text-lg font-semibold text-white">{typeLabel || 'Non sélectionné'}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Projet</p><div className="mt-2 space-y-2 text-sm text-zinc-300"><p><span className="text-zinc-500">Nom :</span> {projectForm.name || 'Non renseigné'}</p><p><span className="text-zinc-500">Localisation :</span> {projectForm.location || 'Non renseignée'}</p><p><span className="text-zinc-500">Charge :</span> {(calc.dailyWh / 1000).toFixed(2)} kWh/j</p></div></div>
        {selectedProfile === 'entreprise' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Entreprise</p><div className="mt-2 space-y-2 text-sm text-zinc-300"><p><span className="text-zinc-500">RCCM :</span> {companyForm.rccm || 'Non renseigné'}</p><p><span className="text-zinc-500">TVA :</span> {companyForm.tva || 'Non renseignée'}</p><p><span className="text-zinc-500">Contact :</span> {companyForm.contactName || 'Non renseigné'}</p></div></div>
        )}
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4"><div className="flex items-center justify-between text-sm text-zinc-200"><span>Appareils</span><strong className="text-white">{totalDevices}</strong></div><div className="mt-3 flex items-center justify-between text-sm text-zinc-200"><span>Consommation</span><strong className="text-white">{(calc.dailyWh / 1000).toFixed(2)} kWh/j</strong></div><div className="mt-3 flex items-center justify-between text-sm text-zinc-200"><span>Puissance simultanée</span><strong className="text-white">{(calc.simultaneousWatts / 1000).toFixed(2)} kW</strong></div></div>
      </div>
    </aside>
  );
}

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
  const [projectForm, setProjectForm] = useState(savedDraft?.projectForm || { name: '', location: '', occupants: 4, targetConsumption: 0 });
  const [appliances, setAppliances] = useState(savedDraft?.appliances || []);
  const [defaultApplianceCategory, setDefaultApplianceCategory] = useState(savedDraft?.defaultApplianceCategory || 'Multimédia');
  const [isAdding, setIsAdding] = useState(false);
  const [isValidated, setIsValidated] = useState(Boolean(savedDraft?.isValidated));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem('djua-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isValidated || isSubmitting) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const isEmptyDraft = currentStep === 'profile' && !selectedProfile && !selectedType && !customType && !companyForm.companyName && !companyForm.rccm && !companyForm.contactName && !projectForm.name && !projectForm.location && appliances.length === 0;

    if (isEmptyDraft) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const draft = {
      currentStep,
      selectedProfile,
      selectedType,
      customType,
      companyForm,
      projectForm,
      appliances,
      defaultApplianceCategory,
      isValidated: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [currentStep, selectedProfile, selectedType, customType, companyForm, projectForm, appliances, defaultApplianceCategory, isValidated, isSubmitting]);

  const currentOptions = useMemo(() => (selectedProfile ? profileOptions[selectedProfile] : []), [selectedProfile]);
  const calc = useMemo(() => calculate(appliances), [appliances]);
  const typeIsValid = selectedType && (selectedType !== 'Autre' || customType.trim().length > 1);
  const canContinue = typeIsValid && selectedProfile;
  const stepOrder = ['profile', 'type', 'details', 'equipment', 'summary'];
  const stepIndex = stepOrder.indexOf(currentStep);
  const progress = ((stepIndex + 1) / stepOrder.length) * 100;

  const goToNext = () => {
    if (currentStep === 'profile' && selectedProfile) {
      setCurrentStep('type');
      return;
    }
    if (currentStep === 'type' && canContinue) {
      setCurrentStep(selectedProfile === 'entreprise' ? 'details' : 'equipment');
      return;
    }
    if (currentStep === 'details') {
      setCurrentStep('equipment');
      return;
    }
    if (currentStep === 'equipment') {
      if (appliances.length === 0) {
        setIsAdding(true);
        return;
      }
      setCurrentStep('summary');
      return;
    }
  };

  const goBack = () => {
    if (currentStep === 'summary') {
      setCurrentStep('equipment');
      setIsValidated(false);
      return;
    }
    if (currentStep === 'equipment') {
      setCurrentStep(selectedProfile === 'entreprise' ? 'details' : 'type');
      return;
    }
    if (currentStep === 'details') {
      setCurrentStep('type');
      return;
    }
    if (currentStep === 'type') {
      setCurrentStep('profile');
      return;
    }
    if (currentStep === 'profile') {
      resetDraft();
    }
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    setSelectedType('');
    setCustomType('');
    setCurrentStep('type');
    setIsValidated(false);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    if (type !== 'Autre') setCustomType('');
  };

  const handleAddAppliance = (item) => {
    setAppliances((prev) => [...prev, item]);
    setIsAdding(false);
  };

  const handleUpdateAppliance = (id, next) => {
    setAppliances((prev) => prev.map((item) => (item.id === id ? next : item)));
  };

  const resetDraft = () => {
    setCurrentStep('profile');
    setSelectedProfile('');
    setSelectedType('');
    setCustomType('');
    setCompanyForm(initialCompanyForm);
    setProjectForm({ name: '', location: '', occupants: 4, targetConsumption: 0 });
    setAppliances([]);
    setDefaultApplianceCategory('Multimédia');
    setIsAdding(false);
    setIsValidated(false);
    setIsSubmitting(false);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSubmit = () => {
    if (!selectedProfile || !typeIsValid || isSubmitting) return;

    setIsSubmitting(true);
    setIsValidated(false);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsValidated(true);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }, 900);
  };

  const currentTitle = currentStep === 'profile' ? 'Choisir le profil' : currentStep === 'type' ? (selectedProfile === 'entreprise' ? 'Type d’entreprise' : 'Type de maison') : currentStep === 'details' ? (selectedProfile === 'entreprise' ? 'Données de l’établissement' : 'Informations du logement') : currentStep === 'equipment' ? 'Équipements & dimensionnement' : 'Résumé final';

  return (
    <div className="devis-shell min-h-screen bg-[var(--devis-bg)] px-3 py-5 text-[var(--devis-foreground)] sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-300"><FileText size={12} />Devis & onboarding</div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Créer un devis</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <motion.button type="button" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }} className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-zinc-700/80 bg-zinc-950/80 shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-orange-500/60 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.15),0_12px_28px_rgba(249,115,22,0.18)]">
              <span className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <motion.span key={theme} initial={{ rotate: -35, opacity: 0, scale: 0.7 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 35, opacity: 0, scale: 0.7 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="relative flex items-center justify-center text-zinc-200">
                {theme === 'dark' ? <SunMedium size={18} className="text-orange-300" /> : <MoonStar size={18} className="text-orange-300" />}
              </motion.span>
            </motion.button>
            <button type="button" onClick={resetDraft} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-orange-500/50 hover:text-white">Réinitialiser</button>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-300"><span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.9)]" /><span>{currentTitle}</span></div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-orange-500/20 bg-zinc-950/80 p-4 shadow-[0_0_0_1px_rgba(249,115,22,0.12),0_18px_35px_rgba(0,0,0,0.42)]">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-zinc-400"><span>Progression</span><span className="font-semibold text-orange-300">{Math.round(progress)}%</span></div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-900 ring-1 ring-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.9)]" /></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500">{['Profil', 'Type', 'Détails', 'Équipements', 'Résumé'].map((label, index) => { const active = stepIndex === index; const done = stepIndex > index; return <div key={label} className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold ${done || active ? 'border-orange-500 bg-orange-500 text-white shadow-[0_0_14px_rgba(249,115,22,0.7)]' : 'border-zinc-700 bg-zinc-900 text-zinc-500'}`}>{index + 1}</span><span className="hidden sm:inline">{label}</span></div>; })}</div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-7">
            {currentStep === 'profile' && (
              <>
                <div className="mb-6"><p className="text-sm font-medium text-zinc-400">Sélectionnez le profil du client</p><h2 className="mt-2 text-2xl font-semibold text-white">Qui est concerné par ce devis ?</h2></div>
                <div className="grid gap-4 md:grid-cols-2">{profileCards.map((profile) => { const Icon = profile.icon; return <motion.button type="button" key={profile.id} onClick={() => handleProfileSelect(profile.id)} whileHover={{ y: -6, scale: 1.01 }} whileTap={{ scale: 0.98 }} className="group flex min-h-[230px] flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-left shadow-[0_18px_35px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-orange-500/70 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.18),0_18px_40px_rgba(249,115,22,0.12)]"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_0_22px_rgba(249,115,22,0.55)] ring-1 ring-orange-300/30"><Icon className="h-7 w-7" /></div><div><h3 className="text-2xl font-semibold text-white">{profile.title}</h3><p className="mt-2 text-sm text-zinc-400">{profile.description}</p></div><div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-300">Sélectionner<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></div></motion.button>; })}</div>
              </>
            )}

            {currentStep === 'type' && selectedProfile && (
              <>
                <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-sm text-zinc-400">Sélectionnez le type</p><h2 className="mt-2 text-2xl font-semibold text-white">{selectedProfile === 'personne' ? 'Type de maison' : 'Type d’entreprise'}</h2></div><button type="button" onClick={() => setCurrentStep('profile')} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-orange-500/50 hover:text-white"><ArrowLeft size={14} />Retour</button></div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{currentOptions.map((option) => { const Icon = option.icon; const isSelected = selectedType === option.id; return <motion.button type="button" key={option.id} onClick={() => handleTypeSelect(option.id)} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_0_1px_rgba(249,115,22,0.18),0_0_20px_rgba(249,115,22,0.15)]' : 'border-zinc-800 bg-zinc-900/50 hover:border-orange-500/50 hover:bg-zinc-900'}`}><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${isSelected ? 'bg-orange-500 text-white shadow-[0_0_18px_rgba(249,115,22,0.5)]' : 'bg-zinc-800 text-orange-300'}`}><Icon size={20} /></span><span className="font-medium text-white">{option.label}</span></motion.button>; })}</div>
                {selectedType === 'Autre' && <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-orange-500/40 bg-orange-500/5 p-4"><label htmlFor="customType" className="mb-2 block text-sm font-medium text-orange-200">Précisez le type manuellement <span className="text-orange-400">*</span></label><input id="customType" type="text" value={customType} onChange={(event) => setCustomType(event.target.value)} placeholder={selectedProfile === 'personne' ? 'Ex : Maison de campagne, duplex, lotissement...' : 'Ex : Centre de formation, clinique, agence...'} className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30" required /></motion.div>}
                <div className="mt-8 flex justify-end"><button type="button" onClick={goToNext} disabled={!canContinue} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.3)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-700/40 disabled:shadow-none">Continuer<ArrowRight size={16} /></button></div>
              </>
            )}

            {currentStep === 'details' && (
              <>
                <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-sm text-zinc-400">{selectedProfile === 'entreprise' ? 'Informations légales' : 'Informations du projet'}</p><h2 className="mt-2 text-2xl font-semibold text-white">{selectedProfile === 'entreprise' ? 'Données de l’établissement' : 'Détails du logement / propriété'}</h2></div><button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-orange-500/50 hover:text-white"><ArrowLeft size={14} />Retour</button></div>
                {selectedProfile === 'entreprise' ? <div className="space-y-5"><p className="text-xs leading-relaxed text-zinc-400">Les informations officielles comme le RCCM, l’identifiant fiscal ou la TVA sont optionnelles. Si le client ne les a pas, laissez-les vides et continuez.</p><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm text-zinc-300"><span>Raison sociale</span><input value={companyForm.companyName} onChange={(event) => setCompanyForm((prev) => ({ ...prev, companyName: event.target.value }))} placeholder="Ex : Djua Energy SARL" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Secteur d’activité</span><input value={companyForm.secteur} onChange={(event) => setCompanyForm((prev) => ({ ...prev, secteur: event.target.value }))} placeholder="Ex : commerce, usine, service" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>RCCM</span><input value={companyForm.rccm} onChange={(event) => setCompanyForm((prev) => ({ ...prev, rccm: event.target.value }))} placeholder="Ex : RCCM/KN/2024/B/12345" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Identifiant fiscal / N° impôt</span><input value={companyForm.idNationale} onChange={(event) => setCompanyForm((prev) => ({ ...prev, idNationale: event.target.value }))} placeholder="Ex : A1234567" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Numéro TVA</span><input value={companyForm.tva} onChange={(event) => setCompanyForm((prev) => ({ ...prev, tva: event.target.value }))} placeholder="Ex : TVA 123456789" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Adresse</span><input value={companyForm.adresse} onChange={(event) => setCompanyForm((prev) => ({ ...prev, adresse: event.target.value }))} placeholder="Ex : Avenue de la Paix 23" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Ville</span><input value={companyForm.ville} onChange={(event) => setCompanyForm((prev) => ({ ...prev, ville: event.target.value }))} placeholder="Ex : Kinshasa" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Province</span><input value={companyForm.province} onChange={(event) => setCompanyForm((prev) => ({ ...prev, province: event.target.value }))} placeholder="Ex : Kinshasa" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Contact principal</span><input value={companyForm.contactName} onChange={(event) => setCompanyForm((prev) => ({ ...prev, contactName: event.target.value }))} placeholder="Ex : Jean Mbala" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Téléphone</span><input value={companyForm.phone} onChange={(event) => setCompanyForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Ex : +243 850 000 000" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300 md:col-span-2"><span>Email</span><input type="email" value={companyForm.email} onChange={(event) => setCompanyForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="contact@entreprise.com" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label></div></div> : <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm text-zinc-300"><span>Nom du projet</span><input value={projectForm.name} onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ex : Villa 4 chambres" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Localisation</span><input value={projectForm.location} onChange={(event) => setProjectForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Ex : Kinshasa, Gombe" className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Nombre d’occupants</span><input type="number" min="1" value={projectForm.occupants} onChange={(event) => setProjectForm((prev) => ({ ...prev, occupants: Number(event.target.value) || 1 }))} className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label><label className="space-y-2 text-sm text-zinc-300"><span>Consommation cible (kWh/jour)</span><input type="number" min="0" step="0.1" value={projectForm.targetConsumption} onChange={(event) => setProjectForm((prev) => ({ ...prev, targetConsumption: Number(event.target.value) || 0 }))} className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></label></div></div>}
                <div className="mt-8 flex justify-end"><button type="button" onClick={goToNext} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.3)] transition hover:bg-orange-400">Suivant<ArrowRight size={16} /></button></div>
              </>
            )}

            {currentStep === 'equipment' && (
              <>
                <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-sm text-zinc-400">Étape d’évaluation</p><h2 className="mt-2 text-2xl font-semibold text-white">Équipements & charge du site</h2></div><button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-orange-500/50 hover:text-white"><ArrowLeft size={14} />Retour</button></div>
                {appliances.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-dashed border-orange-500/50 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_rgba(13,13,15,0.96)_45%)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
                    <div className="flex flex-col items-center justify-center text-center">
                      <motion.div animate={{ y: [0, -8, 0], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] border border-orange-500/30 bg-orange-500/10 text-2xl font-semibold text-orange-300 shadow-[0_0_26px_rgba(249,115,22,0.2)]">
                        01
                      </motion.div>
                      <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Démarrage</p>
                      <h3 className="mt-3 text-2xl font-semibold text-white">Aucun équipement ajouté pour le moment</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">Commencez par ajouter les appareils et matériels du projet pour lancer le dimensionnement de la charge.</p>
                      <button type="button" onClick={() => { setDefaultApplianceCategory('Multimédia'); setIsAdding(true); }} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.3)] transition hover:bg-orange-400 sm:w-auto">Commencer le devis<ArrowRight size={16} /></button>
                    </div>
                  </motion.div>
                ) : (
                  <ApplianceList appliances={appliances} onUpdate={(next) => handleUpdateAppliance(next.id, next)} onAddClick={(category) => { setDefaultApplianceCategory(category || 'Multimédia'); setIsAdding(true); }} />
                )}
                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Total estimé</div><div className="mt-1 text-2xl font-semibold text-white">{(calc.dailyWh / 1000).toFixed(2)} kWh / jour</div></div><button type="button" onClick={goToNext} disabled={appliances.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.3)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none sm:w-auto">Résumé final<ArrowRight size={16} /></button></div>
              </>
            )}

            {currentStep === 'summary' && (
              <>
                <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-sm text-zinc-400">Validation finale</p><h2 className="mt-2 text-2xl font-semibold text-white">Vérifiez votre devis avant validation</h2></div><button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-orange-500/50 hover:text-white"><ArrowLeft size={14} />Modifier</button></div>
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Profil</p><div className="mt-3 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-[0_0_16px_rgba(249,115,22,0.45)]">{selectedProfile === 'personne' ? <UserRound size={20} /> : <Building2 size={20} />}</div><div><h3 className="text-lg font-semibold text-white">{selectedProfile === 'personne' ? 'Personne' : 'Entreprise'}</h3><p className="text-sm text-zinc-400">{selectedType === 'Autre' ? customType : selectedType}</p></div></div></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Projet</p><div className="mt-3"><h3 className="text-lg font-semibold text-white">{projectForm.name || 'Projet non nommé'}</h3><p className="mt-1 text-sm text-zinc-400">{projectForm.location || 'Localisation non renseignée'}</p></div></div></div>
                  {selectedProfile === 'entreprise' && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Entreprise</p><div className="mt-3 grid gap-2 text-sm text-zinc-300 md:grid-cols-2"><p><span className="text-zinc-500">Raison sociale :</span> {companyForm.companyName || '—'}</p><p><span className="text-zinc-500">RCCM :</span> {companyForm.rccm || '—'}</p><p><span className="text-zinc-500">TVA :</span> {companyForm.tva || '—'}</p><p><span className="text-zinc-500">Contact :</span> {companyForm.contactName || '—'}</p></div></div>}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Appareils cochés</p><span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300">{appliances.reduce((sum, item) => sum + item.quantity, 0)} total</span></div>                  <div className="space-y-2">{appliances.map((item) => { const ItemIcon = resolveCategoryIcon(item.category); return <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800"><ItemIcon size={14} className="text-orange-300" /></span><div><p className="font-medium text-white">{item.name}</p><p className="text-[11px] text-zinc-400">{item.category}</p></div></div><div className="text-right text-xs text-zinc-400"><p>{item.quantity} × {item.watts} W</p><p>{(item.watts * item.hours * item.quantity / 1000).toFixed(2)} kWh/j</p></div></div>; })}</div></div>                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end"><button type="button" onClick={() => setCurrentStep('equipment')} className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-orange-500/50 hover:text-white">Modifier</button><button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.3)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:shadow-none">{isSubmitting ? 'Soumission...' : 'Valider le devis'}</button></div>
                {isValidated && (
                  <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }} className="mt-5 space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                    <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>Le devis a bien été préparé et est prêt pour la validation commerciale.</span></div>
                    <div className="flex justify-end"><button type="button" onClick={resetDraft} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15">Créer un autre devis</button></div>
                  </motion.div>
                )}
              </>
            )}
          </section>

          <SummaryCard selectedProfile={selectedProfile} selectedType={selectedType} customType={customType} companyForm={companyForm} projectForm={projectForm} appliances={appliances} calc={calc} />
        </div>
      </div>

      {isAdding && <AddModal defaultCategory={defaultApplianceCategory} onClose={() => setIsAdding(false)} onAdd={handleAddAppliance} />}
    </div>
  );
}
