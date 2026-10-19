import SaveQuote from './SaveQuote';
import QuoteChat, { QuoteChatButton } from './QuoteChat';
import './SolarAdvisorResult.css';
import '../pages/SmartKitDetails.css';
import useDialog from '../hooks/useDialog';
import React, { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Battery, Zap, Settings2, ChevronDown, ChevronUp,
  MessageSquare, TrendingUp, Package, CheckCircle2,
  AlertCircle, Loader2, X, Phone,
  Clock, BarChart3, Info, AlertTriangle, FileText,
  Cpu, Gauge, Layers, Printer, Calculator, ClipboardList
} from 'lucide-react';
import { useSolarAsk } from '../hooks/tanstack/useSolarAdvisor';

const KitExplorer = lazy(() => import('./KitExplorer'));

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtCurrency = (amount, currency = 'XAF') => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-CD', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency;
};

const fmtWh = (wh) => {
  if (wh == null) return '—';
  return wh >= 1000 ? `${(wh / 1000).toFixed(2)} kWh` : `${Math.round(wh)} Wh`;
};

const fmtW = (w) => {
  if (w == null) return '—';
  return w >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${Math.round(w)} W`;
};

const confidenceColor = (level) => ({
  high:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium: 'text-amber-400  bg-amber-500/10  border-amber-500/30',
  low:    'text-red-400    bg-red-500/10    border-red-500/30',
}[level] || 'text-zinc-400 bg-zinc-800 border-zinc-700');

const ITEM_TYPE_LABELS = {
  panel:      { label: 'Panneaux solaires', icon: Sun },
  battery:    { label: 'Batteries',         icon: Battery },
  inverter:   { label: 'Onduleur',          icon: Zap },
  controller: { label: 'Régulateur MPPT',   icon: Settings2 },
};

// ─── Micro composants ────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, badge }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-xl bg-[var(--panel-alt)] border border-[var(--panel-border)] flex items-center justify-center">
        <Icon size={13} className="text-[var(--muted-foreground)]" />
      </div>
      <span className="text-sm font-bold tracking-tight text-[var(--app-foreground)]">{title}</span>
      {badge && (
        <span className="ml-1 text-[10px] font-semibold bg-[var(--panel)] text-[var(--muted-foreground)] border border-[var(--panel-border)] rounded-full px-2 py-0.5">
          {badge}
        </span>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  const accentCls = accent
    ? 'border-[var(--ops-line)] bg-[var(--ops-canvas)]'
    : 'border-[var(--panel-border)] bg-[var(--panel-alt)]';
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1.5 transition-all ${accentCls}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-bold">
        <Icon size={12} className={accent ? 'text-[#ff7900]' : 'text-[var(--muted-foreground)]'} />
        {label}
      </div>
      <div className={`text-2xl font-black tracking-tight ${accent ? 'text-[#ff7900]' : 'text-[var(--app-foreground)]'}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-[var(--muted-foreground)] leading-snug">{sub}</div>}
    </div>
  );
}

function ApplianceRow({ appliance }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-[var(--panel-border)] last:border-0 gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--app-foreground)]">{appliance.name}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${confidenceColor(appliance.confidence_level)}`}>
            {appliance.confidence_level === 'high' ? 'Certain' : appliance.confidence_level === 'medium' ? 'Estimé' : 'Incertain'}
          </span>
          {appliance.essential && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border text-blue-400 bg-blue-500/10 border-blue-500/25">
              Essentiel
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--muted-foreground)]">
          <span>× {appliance.quantity} unité(s)</span>
          <span>{fmtW(appliance.power_w)} · {appliance.hours_per_day}h/jour</span>
          <span>Cycle : {Math.round((appliance.duty_cycle || 1) * 100)}%</span>
        </div>
        {appliance.assumptions?.length > 0 && (
          <div className="mt-1.5 text-[10px] text-amber-400/80 italic flex items-start gap-1">
            <Info size={9} className="mt-0.5 flex-shrink-0" />
            {appliance.assumptions[0]}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-[var(--app-foreground)]">{fmtWh(appliance.daily_energy_wh)}/j</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">Pic : {fmtW(appliance.peak_power_w)}</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">Démarrage : {fmtW(appliance.starting_power_w)}</div>
      </div>
    </div>
  );
}

function QuoteItemRow({ item }) {
  const meta = ITEM_TYPE_LABELS[item.item_type] || { label: item.item_type, icon: Package };
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--panel-border)] last:border-0">
      <div className="w-8 h-8 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-[var(--muted-foreground)]" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-[var(--app-foreground)]">{item.label}</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">
          {meta.label} · {item.quantity} × {fmtCurrency(item.unit_price, item.currency)}
          {item.is_synthetic_price && (
            <span className="ml-1.5 text-amber-400/70">(prix indicatif)</span>
          )}
        </div>
      </div>
      <div className="text-sm font-black text-[var(--app-foreground)] text-right">
        {fmtCurrency(item.line_total, item.currency)}
      </div>
    </div>
  );
}

function ComponentDetailCard({ compKey, component }) {
  const meta = ITEM_TYPE_LABELS[compKey] || { label: compKey, icon: Package };
  const Icon = meta.icon;
  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-alt)] p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-center">
          <Icon size={14} className="text-[var(--muted-foreground)]" />
        </div>
        <div>
          <div className="text-xs font-bold text-[var(--app-foreground)]">
            {component.manufacturer} {component.model}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)]">{meta.label}</div>
        </div>
        <div className="ml-auto">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
            component.stock_status === 'demo'
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
          }`}>
            {component.stock_status === 'demo' ? 'Catalogue' : component.stock_status}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {component.efficiency > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Rendement</span>
            <span className="font-semibold text-[var(--app-foreground)]">{Math.round(component.efficiency * 100)}%</span>
          </div>
        )}
        {component.nominal_power_w > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Puissance</span>
            <span className="font-semibold text-[var(--app-foreground)]">{fmtW(component.nominal_power_w)}</span>
          </div>
        )}
        {component.capacity_ah > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Capacité</span>
            <span className="font-semibold text-[var(--app-foreground)]">{component.capacity_ah} Ah</span>
          </div>
        )}
        {component.capacity_wh > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Énergie</span>
            <span className="font-semibold text-[var(--app-foreground)]">{fmtWh(component.capacity_wh)}</span>
          </div>
        )}
        {component.voltage_v > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Tension</span>
            <span className="font-semibold text-[var(--app-foreground)]">{component.voltage_v} V</span>
          </div>
        )}
        {component.inverter_continuous_power_w > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Continue</span>
            <span className="font-semibold text-[var(--app-foreground)]">{fmtW(component.inverter_continuous_power_w)}</span>
          </div>
        )}
        {component.inverter_surge_power_w > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Crête</span>
            <span className="font-semibold text-[var(--app-foreground)]">{fmtW(component.inverter_surge_power_w)}</span>
          </div>
        )}
        {component.controller_type && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Type</span>
            <span className="font-semibold text-[var(--app-foreground)]">{component.controller_type}</span>
          </div>
        )}
        {component.controller_current_a > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Courant</span>
            <span className="font-semibold text-[var(--app-foreground)]">{component.controller_current_a} A</span>
          </div>
        )}
        {component.chemistry && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Chimie</span>
            <span className="font-semibold text-[var(--app-foreground)]">{component.chemistry}</span>
          </div>
        )}
        {component.usable_depth_of_discharge > 0 && (
          <div className="flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">DoD</span>
            <span className="font-semibold text-[var(--app-foreground)]">{Math.round(component.usable_depth_of_discharge * 100)}%</span>
          </div>
        )}
        {component.compatible_system_voltage && (
          <div className="col-span-2 flex justify-between bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2.5 py-1.5">
            <span className="text-[var(--muted-foreground)]">Tension système</span>
            <span className="font-semibold text-[var(--app-foreground)]">{component.compatible_system_voltage} V</span>
          </div>
        )}
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-[var(--panel-border)] flex justify-between items-center">
        <span className="text-[11px] text-[var(--muted-foreground)]">Prix unitaire</span>
        <span className="text-sm font-black text-[var(--app-foreground)]">{fmtCurrency(component.unit_price, component.currency)}</span>
      </div>
    </div>
  );
}

function AlternativeCard({ alt, currency }) {
  const totalPanels = alt.panel_count;
  const totalBat    = alt.battery_count;
  const isEconomy   = alt.name?.includes('economy');
  const isAutonomy  = alt.name?.includes('autonomy');

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${
      isEconomy ? 'border-blue-500/30 bg-blue-500/5' : isAutonomy ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[var(--panel-border)] bg-[var(--panel-alt)]'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs font-bold uppercase tracking-widest ${
          isEconomy ? 'text-blue-400' : isAutonomy ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'
        }`}>
          {isEconomy ? 'Option Économique' : isAutonomy ? 'Option Autonomie' : alt.name}
        </div>
        <div className="text-sm font-black text-[var(--app-foreground)]">
          {fmtCurrency(alt.estimated_price, currency)}
        </div>
      </div>
      <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">{alt.description}</p>
      <div className="flex gap-3 text-[11px]">
        <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
          <Sun size={10} className="text-[var(--muted-foreground)]" />
          <span>{totalPanels} panneaux</span>
        </div>
        <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
          <Battery size={10} className="text-[var(--muted-foreground)]" />
          <span>{totalBat} batteries</span>
        </div>
      </div>
    </div>
  );
}

// ─── Solar Chat ──────────────────────────────────────────────────────────────

function SolarChat({ recommendationId, open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const { mutate: ask, isPending } = useSolarAsk(recommendationId);


  const sendQuestion = () => {
    const q = input.trim();
    if (!q || isPending) return;
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: q }]);
    setInput('');
    ask(q, {
      onSuccess: (data) => {
        const text = data?.answer || data?.assistant_message || "Je n'ai pas pu générer une réponse.";
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text }]);
      },
      onError: () => {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1, role: 'assistant', isError: true,
          text: "Impossible de répondre à cette question pour l'instant.",
        }]);
      },
    });
  };

  return <QuoteChat open={open} onClose={onClose} messages={messages} input={input} onInput={setInput} onSend={sendQuestion} pending={isPending} />;
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function SolarAdvisorResult({ result, onClose, onContactRequest }) {
  const [savedQuote,setSavedQuote]=useState(null);
  const [tab, setTab]               = useState('quote');   // 'quote' | 'sizing' | 'appliances' | 'components'
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showAssumptions, setShowAssumptions]   = useState(false);
  const [isChatModalOpen, setIsChatModalOpen]   = useState(false);

  const [reportDate]=useState(()=>new Date().toLocaleDateString('fr-FR'));
  const studyRef=useDialog(Boolean(result)&&!isChatModalOpen,onClose);

  if (!result) return null;

  // ── Extraction des données réelles du modèle ─────────────────────────────
  const recId    = result.recommendation_id || result.id || null;
  const status   = result.status || '';
  
  const sizing       = result.sizing            || {};
  const consumption  = result.consumption       || {};
  const components   = result.selected_components || {};  
  const quote        = result.quote             || {};
  const alternatives = result.alternatives      || [];
  const explanationRaw = result.explanation || result.explication || result.summary || '';
  const explanation  = Array.isArray(explanationRaw) ? explanationRaw : (explanationRaw ? [explanationRaw] : []);
  const assumptions  = result.assumptions       || [];
  const limitations  = result.limitations       || [];
  const missing      = result.missing_information || [];
  const iotBaseline  = result.integration_links?.future_iot_baseline || null;

  // KPIs clés
  const panelCount    = sizing.panel_count;
  const panelPowerW   = sizing.panel_power_w;
  const totalPvKw     = panelCount && panelPowerW ? (panelCount * panelPowerW / 1000) : null;
  const battCount     = sizing.battery_count;
  const battCapWh     = sizing.battery_total_capacity_wh;
  const battUsableWh  = sizing.battery_usable_capacity_wh;
  const autonomyH     = sizing.autonomy_hours_estimated;
  const inverterW     = sizing.inverter_power_w;
  const sysVoltage    = sizing.system_voltage_v;
  const ctrlA         = sizing.controller_current_a;
  const totalPrice    = quote.total_estimated;
  const currency      = quote.currency || 'XAF';
  const dailyKwh      = consumption.total_daily_energy_kwh;
  const adjustedWh    = consumption.adjusted_daily_energy_wh;
  const simultaneousW = consumption.simultaneous_power_w;
  const quoteItems    = quote.items || [];
  const applianceList = consumption.appliances || [];

  const TABS = [
    { id: 'quote',      label: 'Devis & Synthèse',  icon: FileText  },
    { id: 'sizing',     label: 'Dimensionnement',   icon: Gauge     },
    { id: 'appliances', label: 'Bilan de charge',   icon: Layers    },
    { id: 'components', label: 'Fiche technique',   icon: Cpu       },
    { id: 'preview', label: 'Vue du kit', icon: Package },
  ];

  return (
    <div className="solar-study-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6" style={{ zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        ref={studyRef} role="dialog" aria-modal="true" aria-label="Étude solaire et proposition" className="solar-study-dialog w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-[var(--panel-border)] bg-[var(--app-surface)] shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="flex-none px-5 pt-5 pb-4 border-b border-[var(--panel-border)] bg-[var(--panel)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--panel-alt)] border border-[var(--panel-border)] flex items-center justify-center">
              <ClipboardList size={18} className="text-[var(--app-foreground)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--app-foreground)]">Votre étude solaire</h2>
                {status === 'recommendation_with_assumptions' && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/25">
                    Provisoire
                  </span>
                )}
                {status === 'success' && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-500 bg-emerald-500/10 border-emerald-500/25">
                    Calcul terminé
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                Dimensionnement, budget et hypothèses
                {recId && <span className="ml-2 font-mono opacity-60">{recId}</span>}
              </div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Fermer l’étude"
              className="w-8 h-8 rounded-xl border border-[var(--panel-border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] hover:bg-[var(--panel-alt)] transition flex-shrink-0">
              <X size={14} />
            </button>
          )}
        </div>

        {recId && <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-[var(--muted-foreground)]">Une question sur les panneaux, le budget ou l’autonomie ?</p><QuoteChatButton onClick={() => setIsChatModalOpen(true)} /></div>}

        <SaveQuote onSaved={setSavedQuote} payload={{ customer:{name:result.clientInfo?.fullName||result.clientInfo?.companyName||result.clientInfo?.contactName||'',phone:result.clientInfo?.phone||'',email:result.clientInfo?.email||'',address:result.site?.adresse||'',profile:result.profile||'personne',details:result.clientInfo||{}},site:{adresse:result.site?.adresse||'',ville:result.site?.ville||'',...(Number.isFinite(result.site?.lat)?{lat:result.site.lat}:{}),...(Number.isFinite(result.site?.lng)?{lng:result.site.lng}:{})},appliances:(result.sourceAppliances||[]).map(({name,quantity,watts,hours,period})=>({name,quantity:Number(quantity),watts:Number(watts),hours:Number(hours),period})),system:{panels:Number(panelCount),panelPower:Number(panelPowerW),batteryCapacity:Number(battUsableWh)/1000,inverterPower:Number(inverterW)/1000},amount:Number(totalPrice),currency:currency==='USD'?'USD':'CDF',recommendationId:recId||undefined,buildingType:result.buildingType||undefined}}/>
        {/* Alertes infos manquantes */}
        {missing.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-500/90 leading-snug">
              <span className="font-bold">Données incomplètes : </span>
              {missing.join(', ')}. Les préciser pour affiner l'étude.
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── KPIs ──────────────────────────────────────────────────────────── */}
        <div className="solar-study-kpis px-5 pt-5 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <KpiCard icon={TrendingUp}  label="Budget estimé"    value={fmtCurrency(totalPrice, currency)} sub={`${quoteItems.length} références`} accent />
        <KpiCard icon={Sun}         label="Champ solaire"    value={totalPvKw ? `${totalPvKw.toFixed(1)} kWc` : '—'} sub={panelCount ? `${panelCount} modules × ${panelPowerW}W` : null} />
        <KpiCard icon={Battery}     label="Parc batterie"    value={battUsableWh ? fmtWh(battUsableWh) : '—'} sub={battCount ? `${battCount} unités · ${sysVoltage}V` : null} />
        <KpiCard icon={Zap}         label="Onduleur"         value={fmtW(inverterW)} sub={sizing.inverter_surge_power_w ? `Crête : ${fmtW(sizing.inverter_surge_power_w)}` : null} />
        <KpiCard icon={Clock}       label="Autonomie"        value={autonomyH ? `${autonomyH.toFixed(1)}h` : '—'} sub="Hors production PV" />
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-2">
        <div className="solar-study-tabs inline-flex items-center gap-1 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} aria-pressed={tab===id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                tab === id
                  ? 'bg-white dark:bg-zinc-700 text-[#ff7900] shadow-sm ring-1 ring-zinc-900/5 dark:ring-white/10'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}>
              <Icon size={14} className={tab === id ? 'text-[#ff7900]' : ''} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* ══ TAB : DEVIS ══════════════════════════════════════════════════ */}
        {tab === 'quote' && (
          <div className="space-y-6 max-w-4xl mx-auto pb-4">
            {/* Design Papier / Bureautique */}
            <div className="bg-white border border-[#e4e4e7] shadow-md p-8 sm:p-12 text-[#111] mx-auto w-full relative selection:bg-[var(--ops-canvas)]">
              {/* En-tête Devis */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#111] pb-6 mb-8 gap-6">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-[#111]">DEVIS PROFORMA</h1>
                  <div className="text-sm font-bold text-[#777] mt-1">
                    Réf : {savedQuote?.number || recId || 'Étude non enregistrée'}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-black text-[#ff7900] tracking-tight">DJUA ENERGY</div>
                  <div className="text-xs font-semibold text-[#666] uppercase tracking-widest mt-1">Solutions Solaires Intelligentes</div>
                  <div className="text-sm text-[#555] mt-2">Avenue de l'Énergie, Kinshasa</div>
                  <div className="text-sm text-[#555]">contact@djua.com</div>
                </div>
              </div>

              {/* Infos Client & Dates */}
              <div className="flex flex-col sm:flex-row justify-between mb-8 gap-6">
                <div className="bg-[#fafafa] border border-[#e4e4e7] p-4 w-full sm:w-1/2">
                  <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Destinataire</div>
                  <div className="font-black text-[#111] text-base">{result.clientInfo?.fullName || result.clientInfo?.companyName || 'Client Djua'}</div>
                  <div className="text-sm text-[#666] mt-1">{result.clientInfo?.phone || ''}</div>
                  <div className="text-sm text-[#666]">{result.site?.adresse || result.clientInfo?.adresse || 'Adresse à confirmer'}</div>
                  <div className="text-sm text-[#666]">{result.site?.ville || result.clientInfo?.ville || ''}</div>
                </div>
                <div className="w-full sm:w-1/3 flex flex-col justify-end text-sm">
                  <div className="flex justify-between border-b border-[#e4e4e7] py-2">
                    <span className="font-bold text-[#555]">Date d'émission :</span>
                    <span className="font-semibold text-[#111]">{reportDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#e4e4e7] py-2">
                    <span className="font-bold text-[#555]">Validité :</span>
                    <span className="font-semibold text-[#111]">14 jours</span>
                  </div>
                </div>
              </div>

              {/* Tableau Devis */}
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f4f4f5] border-y border-[#d4d4d8]">
                    <tr>
                      <th className="py-3 px-4 font-bold text-[#444] uppercase tracking-wider text-xs">Désignation</th>
                      <th className="py-3 px-4 font-bold text-[#444] uppercase tracking-wider text-xs text-center w-20">Qté</th>
                      <th className="py-3 px-4 font-bold text-[#444] uppercase tracking-wider text-xs text-right w-32">P.U.</th>
                      <th className="py-3 px-4 font-bold text-[#444] uppercase tracking-wider text-xs text-right w-36">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e4e7]">
                    {quoteItems.map((item, i) => (
                      <tr key={i} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#111]">{item.label}</div>
                          <div className="text-xs text-[#777] mt-1">{ITEM_TYPE_LABELS[item.item_type]?.label || item.item_type}</div>
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-[#333]">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-[#666]">{fmtCurrency(item.unit_price, item.currency||currency)}</td>
                        <td className="py-4 px-4 text-right font-black text-[#111]">{fmtCurrency(item.line_total, item.currency||currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 bg-[#fafafa] border border-[#e4e4e7] p-5 rounded-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-[#555]">SOUS-TOTAL HT</span>
                    <span className="text-sm font-bold text-[#333]">{fmtCurrency(totalPrice, currency)}</span>
                  </div>
                  {quote.pricing_notice && (
                    <div className="text-[10px] text-[#777] mb-3 pb-3 border-b border-[#e4e4e7]">{quote.pricing_notice}</div>
                  )}
                  <div className="flex justify-between items-center border-t border-[#d4d4d8] pt-3 mt-1">
                    <span className="text-lg font-black text-[#111]">NET À PAYER</span>
                    <span className="text-xl font-black text-[#ff7900]">{fmtCurrency(totalPrice, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Pied de page bureautique */}
              <div className="mt-16 pt-6 border-t border-[#e4e4e7] text-center">
                <p className="text-[10px] text-[#555] uppercase tracking-widest font-semibold mb-1">Djua Energy - L'énergie qui vous ressemble</p>
                <p className="text-[10px] text-[#999]">Ce document est une estimation générée par notre IA. Les tarifs finaux peuvent être ajustés après une visite technique du site.</p>
              </div>
            </div>

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div className="mt-8 pt-4 border-t border-[var(--panel-border)]">
                <button onClick={() => setShowAlternatives(!showAlternatives)}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-alt)] text-sm font-bold text-[var(--app-foreground)] hover:bg-[var(--panel)] transition">
                  <span className="flex items-center gap-2">
                    <BarChart3 size={15} className="text-[#ff7900]" />
                    Options d'évolution proposées ({alternatives.length})
                  </span>
                  {showAlternatives ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <AnimatePresence>
                  {showAlternatives && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden grid gap-4 md:grid-cols-2 mt-4">
                      {alternatives.map((alt, i) => (
                        <AlternativeCard key={i} alt={alt} currency={currency} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB : DIMENSIONNEMENT ════════════════════════════════════════ */}
        {tab === 'sizing' && (
          <div className="space-y-5">
            {/* Consommation */}
            <div>
              <SectionTitle icon={BarChart3} title="Analyse de charge" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: 'Conso. journalière estimée',  value: fmtWh(consumption.total_daily_energy_wh) },
                  { label: 'Conso. avec marges',        value: fmtWh(adjustedWh), highlight: true },
                  { label: 'Appel de puissance',        value: fmtW(simultaneousW) },
                  { label: 'Courant de démarrage',      value: fmtW(consumption.peak_starting_power_w) },
                  { label: 'Usage diurne',              value: fmtWh(consumption.day_energy_wh) },
                  { label: 'Usage nocturne',            value: fmtWh(consumption.night_energy_wh) },
                  { label: 'Charges critiques',         value: fmtWh(consumption.essential_energy_wh) },
                  { label: 'Tolérance d\'erreur',       value: `${Math.round((consumption.uncertainty_margin || 0) * 100)}%` },
                  { label: 'Réserve d\'extension',      value: `${Math.round((consumption.growth_margin || 0) * 100)}%` },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-xl border px-3 py-2.5 ${highlight ? 'border-zinc-300 dark:border-zinc-700 bg-[var(--panel)]' : 'border-[var(--panel-border)] bg-[var(--panel-alt)]'}`}>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{label}</div>
                    <div className={`text-sm font-bold mt-0.5 ${highlight ? 'text-[var(--app-foreground)]' : 'text-[var(--app-foreground)] opacity-90'}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Système solaire */}
            <div>
              <SectionTitle icon={Sun} title="Caractéristiques du système" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: 'Ensoleillement moyen',   value: `${sizing.peak_sun_hours}h` },
                  { label: 'Besoin de production',   value: fmtW(sizing.required_pv_power_w) },
                  { label: 'Production nominale',    value: fmtW(sizing.pv_total_power_w), highlight: true },
                  { label: 'Modules PV',             value: `${panelCount} × ${panelPowerW}W` },
                  { label: 'Banc de batteries',      value: `${battCount} × ${sizing.battery_capacity_ah}Ah/${sizing.battery_voltage_v}V` },
                  { label: 'Capacité de stockage',   value: fmtWh(battCapWh) },
                  { label: 'Énergie restituable',    value: fmtWh(battUsableWh), highlight: true },
                  { label: 'Autonomie garantie',     value: `${autonomyH?.toFixed(1)}h`, highlight: true },
                  { label: 'Tension de bus',         value: `${sysVoltage}V` },
                  { label: 'Régime onduleur',        value: fmtW(inverterW) },
                  { label: 'Tolérance transitoire',  value: fmtW(sizing.inverter_surge_power_w) },
                  { label: 'Contrôleur de charge',   value: `${ctrlA}A` },
                  { label: 'Coefficient de sécurité',value: `${Math.round((sizing.safety_margin || 0) * 100)}%` },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-xl border px-3 py-2.5 ${highlight ? 'border-zinc-300 dark:border-zinc-700 bg-[var(--panel)]' : 'border-[var(--panel-border)] bg-[var(--panel-alt)]'}`}>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{label}</div>
                    <div className={`text-sm font-bold mt-0.5 ${highlight ? 'text-[var(--app-foreground)]' : 'text-[var(--app-foreground)] opacity-90'}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* IoT baseline */}
            {iotBaseline && (
              <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={12} className="text-[var(--muted-foreground)]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Supervision prévisionnelle</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <div className="text-[var(--muted-foreground)]">Indice conso. (j)</div>
                    <div className="font-bold text-[var(--app-foreground)]">{fmtWh(iotBaseline.expected_daily_energy_wh)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--muted-foreground)]">Indice de pointe</div>
                    <div className="font-bold text-[var(--app-foreground)]">{fmtW(iotBaseline.expected_peak_power_w)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--muted-foreground)]">Cible PV</div>
                    <div className="font-bold text-[var(--app-foreground)]">{fmtW(iotBaseline.recommended_pv_power_w)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Explication IA -> Notes de dimensionnement */}
            {explanation.length > 0 && (
              <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-alt)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={13} className="text-[var(--muted-foreground)]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Notes de dimensionnement</span>
                </div>
                <ul className="space-y-2">
                  {explanation.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--app-foreground)] leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB : APPAREILS ══════════════════════════════════════════════ */}
        {tab === 'appliances' && (
          <div className="space-y-4">
            <SectionTitle icon={Layers} title="Profil de charge" badge={`${applianceList.length} équipements`} />
            {/* Récap rapide */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-alt)] px-3 py-2.5">
                <div className="text-[var(--muted-foreground)]">Volume énergétique / 24h</div>
                <div className="font-black text-[var(--app-foreground)] text-sm">{dailyKwh?.toFixed(3)} kWh</div>
              </div>
              <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-alt)] px-3 py-2.5">
                <div className="text-[var(--muted-foreground)]">Facteur de foisonnement</div>
                <div className="font-black text-[var(--app-foreground)] text-sm">{fmtW(simultaneousW)}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 divide-y divide-[var(--panel-border)]">
              {applianceList.map((a, i) => <ApplianceRow key={i} appliance={a} />)}
            </div>
            {/* Hypothèses */}
            {assumptions.length > 0 && (
              <div>
                <button onClick={() => setShowAssumptions(!showAssumptions)}
                  className="w-full flex items-center justify-between py-2 text-[11px] font-bold text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] transition">
                  <span className="flex items-center gap-1.5"><Info size={12} />Cadre des hypothèses ({assumptions.length})</span>
                  {showAssumptions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <AnimatePresence>
                  {showAssumptions && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1.5">
                      {assumptions.map((a, i) => (
                        <li key={i} className="text-[11px] text-[var(--muted-foreground)] italic flex items-start gap-1.5 pl-1">
                          <span className="mt-1 w-1 h-1 rounded-full bg-zinc-500 flex-shrink-0" />{a}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB : COMPOSANTS ════════════════════════════════════════════ */}
        {tab === 'components' && (
          <div className="space-y-4">
            <SectionTitle icon={Cpu} title="Spécifications techniques" badge="Matériel préconisé" />
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(components).map(([key, comp]) => (
                <ComponentDetailCard key={key} compKey={key} component={comp} />
              ))}
            </div>
            {/* Limitations */}
            {limitations.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={12} className="text-amber-600 dark:text-amber-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Contraintes opérationnelles</span>
                </div>
                <ul className="space-y-1.5">
                  {limitations.map((l, i) => (
                    <li key={i} className="text-[11px] text-amber-700/80 dark:text-amber-400/80 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-amber-500/60 flex-shrink-0" />{l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === 'preview' && <section className="solar-design-section"><h3>Comprendre votre installation</h3><p>Sélectionnez un composant pour lire les caractéristiques retenues dans l'étude.</p><Suspense fallback={<p role="status">Chargement du schéma…</p>}><KitExplorer design={{
          solar:[['Modules',panelCount],['Puissance unitaire',panelPowerW?`${panelPowerW} W`:null],['Champ solaire',totalPvKw?`${totalPvKw.toFixed(1)} kWc`:null]],
          battery:[['Unités',battCount],['Capacité utile',battUsableWh?fmtWh(battUsableWh):null],['Tension système',sysVoltage?`${sysVoltage} V`:null]],
          controller:[['Courant régulateur',ctrlA?`${ctrlA} A`:null],['Onduleur',inverterW?fmtW(inverterW):null]],
        }}/></Suspense></section>}

        {/* ── Chat contextuel ────────────────────────────────────────────── */}
        {recId && <SolarChat recommendationId={recId} open={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} />}

        {/* ── Actions commerciales ───────────────────────────────────────── */}
        <div className="solar-study-actions flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--panel-border)]">
          <button onClick={() => onContactRequest?.(recId)}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-bold text-sm px-5 py-3.5 shadow-md transition active:scale-[0.98]">
            <Phone size={15} />Contacter le service commercial
          </button>
          <button onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] hover:bg-[var(--panel-alt)] text-[var(--app-foreground)] text-sm font-medium px-5 py-3.5 transition">
            <Printer size={14} />Rapport PDF
          </button>
        </div>
      </div>
      </div>
      </motion.div>
      <article className="quote-print-sheet solar-print-report">
        <header><p>DJUA ENERGY</p><h1>Étude solaire et estimation</h1><p>Référence : {recId||'Non renseignée'} · {reportDate}</p></header>
        <p>Client : {result.clientInfo?.fullName||result.clientInfo?.companyName||'Non renseigné'} · {result.site?.adresse||'Adresse à confirmer'}</p>
        <h2>Dimensionnement</h2><dl>{[['Budget estimé',fmtCurrency(totalPrice,currency)],['Panneaux',panelCount?`${panelCount} × ${panelPowerW||'—'} W`:'Non renseigné'],['Batterie utile',fmtWh(battUsableWh)],['Onduleur',fmtW(inverterW)],['Autonomie',autonomyH?`${autonomyH} h`:'Non renseigné']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <h2>Proposition chiffrée</h2><table><thead><tr><th>Équipement</th><th>Qté</th><th>Prix unitaire</th><th>Montant</th></tr></thead><tbody>{quoteItems.map((item,index)=><tr key={index}><td>{item.label}{item.is_synthetic_price?' (prix indicatif)':''}</td><td>{item.quantity}</td><td>{fmtCurrency(item.unit_price,item.currency||currency)}</td><td>{fmtCurrency(item.line_total,item.currency||currency)}</td></tr>)}</tbody></table>
        <p className="solar-print-total">Total estimé : {fmtCurrency(totalPrice,currency)}</p>
        <h2>Analyse</h2>{explanation.map((text,index)=><p key={index}>{text}</p>)}
        {assumptions.length>0&&<><h2>Hypothèses</h2><ul>{assumptions.map((text,index)=><li key={index}>{text}</li>)}</ul></>}
        {limitations.length>0&&<><h2>Limites</h2><ul>{limitations.map((text,index)=><li key={index}>{text}</li>)}</ul></>}
        <footer>Estimation soumise à validation technique et commerciale. Le schéma 3D est illustratif.</footer>
      </article>
    </div>
  );
}

// ─── Trigger button ──────────────────────────────────────────────────────────
export function SolarAdvisorTrigger({ isLoading, hasResult, onClick }) {
  return (
    <motion.button type="button" onClick={onClick} disabled={isLoading}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className="solar-generate-trigger w-full flex items-center justify-center gap-3 rounded-full bg-orange-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.3)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none">
      {isLoading ? (
        <><Loader2 size={16} className="animate-spin" />Calcul de votre solution…</>
      ) : hasResult ? (
        <><CheckCircle2 size={16} />Devis IA généré avec succès</>
      ) : (
        <><Calculator size={16} />Calculer la solution solaire</>
      )}
    </motion.button>
  );
}
