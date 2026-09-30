import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Battery, Zap, Settings2, ChevronDown, ChevronUp,
  Send, MessageSquare, TrendingUp, Package, CheckCircle2,
  AlertCircle, Loader2, X, Copy, Check, Phone, ShieldCheck,
  Clock, BarChart3, Info, AlertTriangle, FileText,
  Cpu, Gauge, Layers, Printer, Calculator, Headset, ClipboardList
} from 'lucide-react';
import { useSolarAsk } from '../hooks/tanstack/useSolarAdvisor';

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
    ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
    : 'border-[var(--panel-border)] bg-[var(--panel-alt)]';
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1.5 transition-all ${accentCls}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-bold">
        <Icon size={12} className={accent ? 'text-emerald-500' : 'text-[var(--muted-foreground)]'} />
        {label}
      </div>
      <div className={`text-2xl font-black tracking-tight ${accent ? 'text-emerald-500' : 'text-[var(--app-foreground)]'}`}>
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

function SolarChat({ recommendationId }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Avez-vous des questions sur cette étude ? Je peux vous expliquer les choix techniques ou les prix." },
  ]);
  const [input, setInput]     = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef              = useRef(null);
  const { mutate: ask, isPending } = useSolarAsk(recommendationId);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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

  const SUGGESTIONS = [
    'Pourquoi ce nombre de panneaux ?',
    'Quelle autonomie sans soleil ?',
    'Comment réduire le budget ?',
    'Peut-on ajouter un climatiseur ?',
  ];

  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-alt)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--panel-border)] flex items-center gap-2.5 bg-[var(--panel)]">
        <div className="w-7 h-7 rounded-full bg-[var(--panel-alt)] border border-[var(--panel-border)] flex items-center justify-center">
          <Headset size={13} className="text-[var(--muted-foreground)]" />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--app-foreground)]">Assistant d'étude</div>
          <div className="text-[10px] text-[var(--muted-foreground)]">Posez vos questions sur le dimensionnement</div>
        </div>
      </div>

      <div className="flex-1 max-h-52 overflow-y-auto p-3 space-y-3 bg-[var(--app-surface)]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'items-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Headset size={11} className="text-[var(--muted-foreground)]" />
              </div>
            )}
            <div className={`relative max-w-[82%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed group ${
              msg.role === 'user'
                ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm border border-zinc-700'
                : msg.isError
                  ? 'bg-red-950/40 border border-red-800/50 text-red-300 rounded-tl-sm'
                  : 'bg-[var(--panel-alt)] border border-[var(--panel-border)] text-[var(--app-foreground)] rounded-tl-sm'
            }`}>
              {msg.text}
              {msg.role === 'assistant' && !msg.isError && (
                <button
                  onClick={() => { navigator.clipboard.writeText(msg.text); setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 2000); }}
                  className="absolute -bottom-2.5 right-2 opacity-0 group-hover:opacity-100 bg-[var(--panel)] border border-[var(--panel-border)] p-1 rounded-md transition-all shadow-md"
                >
                  {copiedId === msg.id ? <Check size={9} className="text-emerald-400" /> : <Copy size={9} className="text-[var(--muted-foreground)]" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-full bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-center flex-shrink-0">
              <Headset size={11} className="text-[var(--muted-foreground)]" />
            </div>
            <div className="bg-[var(--panel-alt)] border border-[var(--panel-border)] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="px-3 py-2 border-t border-[var(--panel-border)] flex gap-1.5 overflow-x-auto scrollbar-none bg-[var(--panel)]">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => setInput(s)}
            className="text-[10px] font-medium whitespace-nowrap text-[var(--muted-foreground)] bg-[var(--panel-alt)] hover:bg-zinc-800 hover:text-zinc-300 border border-[var(--panel-border)] rounded-full px-2.5 py-1 transition-all">
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); sendQuestion(); }}
        className="p-3 border-t border-[var(--panel-border)] flex items-center gap-2 bg-[var(--panel-alt)]">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Poser une question..."
          className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] focus:border-zinc-500 rounded-xl px-3 py-2 text-xs text-[var(--app-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none transition" />
        <button type="submit" disabled={!input.trim() || isPending}
          className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition disabled:opacity-40 flex-shrink-0">
          <Send size={13} className="translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function SolarAdvisorResult({ result, onClose, onContactRequest }) {
  const [tab, setTab]               = useState('quote');   // 'quote' | 'sizing' | 'appliances' | 'components'
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showAssumptions, setShowAssumptions]   = useState(false);
  const [isChatModalOpen, setIsChatModalOpen]   = useState(false);

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
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-[var(--panel-border)] bg-[var(--app-surface)] shadow-[0_30px_80px_rgba(0,0,0,0.2)] overflow-hidden"
    >
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--panel-border)] bg-[var(--panel)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--panel-alt)] border border-[var(--panel-border)] flex items-center justify-center">
              <ClipboardList size={18} className="text-[var(--app-foreground)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--app-foreground)]">Étude Technique & Commerciale</h2>
                {status === 'recommendation_with_assumptions' && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/25">
                    Provisoire
                  </span>
                )}
                {status === 'success' && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-500 bg-emerald-500/10 border-emerald-500/25">
                    Validé
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                Système de Dimensionnement Automatisé
                {recId && <span className="ml-2 font-mono opacity-60">{recId}</span>}
              </div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl border border-[var(--panel-border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] hover:bg-[var(--panel-alt)] transition flex-shrink-0">
              <X size={14} />
            </button>
          )}
        </div>

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

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <KpiCard icon={TrendingUp}  label="Budget estimé"    value={fmtCurrency(totalPrice, currency)} sub={`${quoteItems.length} références`} accent />
        <KpiCard icon={Sun}         label="Champ solaire"    value={totalPvKw ? `${totalPvKw.toFixed(1)} kWc` : '—'} sub={panelCount ? `${panelCount} modules × ${panelPowerW}W` : null} />
        <KpiCard icon={Battery}     label="Parc batterie"    value={battUsableWh ? fmtWh(battUsableWh) : '—'} sub={battCount ? `${battCount} unités · ${sysVoltage}V` : null} />
        <KpiCard icon={Zap}         label="Onduleur"         value={fmtW(inverterW)} sub={sizing.inverter_surge_power_w ? `Crête : ${fmtW(sizing.inverter_surge_power_w)}` : null} />
        <KpiCard icon={Clock}       label="Autonomie"        value={autonomyH ? `${autonomyH.toFixed(1)}h` : '—'} sub="Hors production PV" />
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 border-b border-[var(--panel-border)]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold transition-all border-b-2 -mb-px ${
                tab === id
                  ? 'border-zinc-800 text-zinc-900 dark:border-zinc-300 dark:text-zinc-100'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--app-foreground)]'
              }`}>
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* ══ TAB : DEVIS ══════════════════════════════════════════════════ */}
        {tab === 'quote' && (
          <div className="space-y-5">
            {/* Lignes du devis */}
            <div>
              <SectionTitle icon={FileText} title="Évaluation budgétaire" badge={`${quoteItems.length} lignes`} />
              <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] divide-y divide-[var(--panel-border)] overflow-hidden">
                {quoteItems.map((item, i) => (
                  <QuoteItemRow key={i} item={item} />
                ))}
                {/* Total */}
                <div className="flex items-center justify-between px-4 py-4 bg-[var(--panel-alt)] border-t border-[var(--panel-border)]">
                  <div>
                    <div className="text-sm font-black text-[var(--app-foreground)]">SOUS-TOTAL HT</div>
                    {quote.pricing_notice && (
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{quote.pricing_notice}</div>
                    )}
                  </div>
                  <div className="text-xl font-black text-[var(--app-foreground)]">{fmtCurrency(totalPrice, currency)}</div>
                </div>
              </div>
            </div>

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <button onClick={() => setShowAlternatives(!showAlternatives)}
                  className="w-full flex items-center justify-between py-2 text-sm font-bold text-[var(--app-foreground)] hover:opacity-70 transition">
                  <span className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-[var(--muted-foreground)]" />
                    Options de gamme ({alternatives.length})
                  </span>
                  {showAlternatives ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {showAlternatives && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden grid gap-3 md:grid-cols-2 mt-2">
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

        {/* ── Chat contextuel ────────────────────────────────────────────── */}
        {recId && (
          <div className="pt-2 border-t border-[var(--panel-border)] flex justify-end">
            <button 
              onClick={() => setIsChatModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-bold text-sm px-5 py-3 transition"
            >
              <MessageSquare size={16} /> Discuter avec l'Assistant IA
            </button>
          </div>
        )}

        <AnimatePresence>
          {isChatModalOpen && recId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg relative"
              >
                <button 
                  onClick={() => setIsChatModalOpen(false)}
                  className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition shadow-lg"
                >
                  <X size={18} />
                </button>
                <div className="shadow-[0_30px_80px_rgba(0,0,0,0.5)] rounded-2xl">
                  <SolarChat recommendationId={recId} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Actions commerciales ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[var(--panel-border)]">
          <button onClick={() => onContactRequest?.(recId)}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-bold text-sm px-5 py-3.5 shadow-md transition active:scale-[0.98]">
            <Phone size={15} />Transmettre au service commercial
          </button>
          <button onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] hover:bg-[var(--panel-alt)] text-[var(--app-foreground)] text-sm font-medium px-5 py-3.5 transition">
            <Printer size={14} />Éditer le PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Trigger button ──────────────────────────────────────────────────────────
export function SolarAdvisorTrigger({ isLoading, hasResult, onClick }) {
  return (
    <motion.button type="button" onClick={onClick} disabled={isLoading}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-3 rounded-full bg-orange-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.3)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none">
      {isLoading ? (
        <><Loader2 size={16} className="animate-spin" />Génération du devis avec l'IA...</>
      ) : hasResult ? (
        <><CheckCircle2 size={16} />Devis IA généré avec succès</>
      ) : (
        <><Calculator size={16} />Générer le devis avec l'IA (Djua)</>
      )}
    </motion.button>
  );
}
