import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Sun, Battery, Zap, Settings2, ChevronDown, ChevronUp,
  Send, Bot, MessageSquare, TrendingUp, Package, CheckCircle2,
  AlertCircle, Loader2, X, Copy, Check, Phone,
} from 'lucide-react';
import { useSolarAsk } from '../hooks/tanstack/useSolarAdvisor';

// ─── Formatters ────────────────────────────────────────────────────────────
const fmtCurrency = (amount, currency = 'CDF') => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('fr-CD', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ' + currency;
};

const fmtPower = (kw) => {
  if (!kw && kw !== 0) return '—';
  return kw >= 1 ? `${kw.toFixed(1)} kW` : `${Math.round(kw * 1000)} W`;
};

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1.5 ${accent
      ? 'border-orange-500/40 bg-orange-500/8'
      : 'border-[var(--panel-border)] bg-[var(--panel-alt)]'}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-semibold">
        <Icon size={13} className={accent ? 'text-orange-400' : 'text-[var(--muted-foreground)]'} />
        {label}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${accent ? 'text-orange-400' : 'text-[var(--app-foreground)]'}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--muted-foreground)]">{sub}</div>}
    </div>
  );
}

// ─── Component Line ────────────────────────────────────────────────────────
function ComponentLine({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--panel-border)] last:border-0">
      <div>
        <div className="text-sm font-medium text-[var(--app-foreground)]">{label}</div>
        {sub && <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{sub}</div>}
      </div>
      <div className="text-sm font-semibold text-[var(--app-foreground)] text-right">{value}</div>
    </div>
  );
}

// ─── Chat contextuel ───────────────────────────────────────────────────────
function SolarChat({ recommendationId }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Posez-moi n'importe quelle question sur ce devis — panneaux, batteries, budget, autonomie..." },
  ]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);
  const { mutate: ask, isPending } = useSolarAsk(recommendationId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = () => {
    const q = input.trim();
    if (!q || isPending) return;

    const userMsg = { id: Date.now(), role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    ask(q, {
      onSuccess: (data) => {
        const text = data?.answer || data?.assistant_message || data?.text || "Je n'ai pas pu générer une réponse.";
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text }]);
      },
      onError: () => {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1, role: 'assistant', isError: true,
          text: "Je n'ai pas pu répondre à cette question. Réessayez.",
        }]);
      },
    });
  };

  const SUGGESTIONS = [
    'Pourquoi ce nombre de panneaux ?',
    'Quelle autonomie en cas de mauvais temps ?',
    'Comment réduire le budget ?',
  ];

  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--panel-border)] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
          <MessageSquare size={13} className="text-orange-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--app-foreground)]">Questions sur ce devis</div>
          <div className="text-[10px] text-[var(--muted-foreground)]">Posez n'importe quelle question au modèle IA</div>
        </div>
      </div>

      <div className="flex-1 max-h-56 overflow-y-auto p-3 space-y-3 bg-[var(--app-surface)]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'items-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={11} className="text-orange-400" />
              </div>
            )}
            <div className={`relative max-w-[80%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed group ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-tr-xs'
                : msg.isError
                  ? 'bg-red-950/40 border border-red-800/50 text-red-200 rounded-tl-xs'
                  : 'bg-[var(--panel-alt)] border border-[var(--panel-border)] text-[var(--app-foreground)] rounded-tl-xs'
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
            <div className="w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <Bot size={11} className="text-orange-400" />
            </div>
            <div className="bg-[var(--panel-alt)] border border-[var(--panel-border)] rounded-2xl rounded-tl-xs px-3 py-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Questions suggérées */}
      <div className="px-3 py-2 border-t border-[var(--panel-border)] flex gap-1.5 overflow-x-auto scrollbar-none">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setInput(s); }}
            className="text-[10px] font-medium whitespace-nowrap text-[var(--muted-foreground)] bg-[var(--panel-alt)] hover:bg-[var(--panel)] border border-[var(--panel-border)] rounded-full px-2.5 py-1 transition-all"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); sendQuestion(); }} className="p-3 border-t border-[var(--panel-border)] flex items-center gap-2 bg-[var(--panel)]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre question sur le devis..."
          className="flex-1 bg-[var(--panel-alt)] border border-[var(--panel-border)] focus:border-orange-500/60 rounded-xl px-3 py-2 text-xs text-[var(--app-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || isPending}
          className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center transition disabled:opacity-40 flex-shrink-0"
        >
          <Send size={13} className="translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function SolarAdvisorResult({ result, onClose, onContactRequest }) {
  const [showComponents, setShowComponents] = useState(false);

  if (!result) return null;

  // Parser le résultat — l'API retourne des structures variées
  const rec = result;
  const sizing = rec.sizing || rec.dimensionnement || rec.kit || {};
  const quote = rec.quote || rec.devis || rec.pricing || {};
  const components = rec.components || rec.composants || rec.selected_components || [];
  const explanation = rec.explanation || rec.explication || rec.summary || '';
  const recommendationId = rec.recommendation_id || rec.id || null;

  // Extraire les chiffres clés
  const panels = sizing.panel_count || sizing.panneaux || sizing.panels || null;
  const panelPower = sizing.panel_power_wp || sizing.puissance_panneau_wp || null;
  const solarKwp = sizing.solar_kwp || sizing.puissance_solaire_kwp || (panels && panelPower ? (panels * panelPower / 1000) : null);
  const batteryKwh = sizing.battery_kwh || sizing.capacite_batterie_kwh || null;
  const inverterKva = sizing.inverter_kva || sizing.puissance_onduleur_kva || null;
  const totalPrice = quote.total || quote.total_cdf || quote.total_price || null;
  const currency = quote.currency || 'CDF';
  const dailyWh = sizing.daily_consumption_wh || sizing.consommation_journaliere_wh || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-3xl border border-orange-500/25 bg-[var(--panel)] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--panel-border)] bg-gradient-to-r from-orange-500/8 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <Sparkles size={16} className="text-orange-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--app-foreground)]">Recommandation Solar Advisor IA</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              Dimensionnement calculé par le modèle ML Djua
              {recommendationId && <span className="ml-1.5 text-orange-400/70">· {recommendationId.slice(0, 16)}…</span>}
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-[var(--panel-border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--app-foreground)] transition">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Sun} label="Solaire" value={solarKwp ? `${solarKwp.toFixed(1)} kWc` : '—'} sub={panels ? `${panels} panneau${panels > 1 ? 'x' : ''}` : null} />
          <StatCard icon={Battery} label="Stockage" value={batteryKwh ? `${batteryKwh.toFixed(1)} kWh` : '—'} sub="Batteries" />
          <StatCard icon={Zap} label="Onduleur" value={inverterKva ? `${inverterKva.toFixed(1)} kVA` : '—'} sub="Puissance nominale" />
          <StatCard icon={TrendingUp} label="Devis total" value={totalPrice ? fmtCurrency(totalPrice, currency) : '—'} accent />
        </div>

        {/* Explication IA */}
        {explanation && (
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-alt)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={13} className="text-orange-400 flex-shrink-0" />
              <span className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-semibold">Analyse du modèle</span>
            </div>
            <p className="text-sm text-[var(--app-foreground)] leading-relaxed">{explanation}</p>
          </div>
        )}

        {/* Composants du kit */}
        {components.length > 0 && (
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-alt)] overflow-hidden">
            <button
              onClick={() => setShowComponents(!showComponents)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--panel)] transition"
            >
              <div className="flex items-center gap-2">
                <Package size={14} className="text-[var(--muted-foreground)]" />
                <span className="text-sm font-semibold text-[var(--app-foreground)]">Composants recommandés</span>
                <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded-full px-2 py-0.5 font-medium">{components.length}</span>
              </div>
              {showComponents ? <ChevronUp size={14} className="text-[var(--muted-foreground)]" /> : <ChevronDown size={14} className="text-[var(--muted-foreground)]" />}
            </button>

            <AnimatePresence>
              {showComponents && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-[var(--panel-border)] px-4"
                >
                  {components.map((c, i) => (
                    <ComponentLine
                      key={i}
                      label={c.name || c.nom || c.label || `Composant ${i + 1}`}
                      value={c.price ? fmtCurrency(c.price, currency) : (c.quantity ? `×${c.quantity}` : '—')}
                      sub={c.specs || c.specification || c.description || null}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Chat contextuel */}
        {recommendationId && <SolarChat recommendationId={recommendationId} />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={() => onContactRequest?.(recommendationId)}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-5 py-3 shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition active:scale-[0.98]"
          >
            <Phone size={14} />
            Demander un rappel commercial
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-alt)] hover:bg-[var(--panel)] text-[var(--app-foreground)] text-sm font-medium px-5 py-3 transition"
          >
            Imprimer le devis
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Trigger button — à placer dans Devis.jsx ──────────────────────────────
export function SolarAdvisorTrigger({ isLoading, hasResult, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold text-sm px-6 py-4 shadow-[0_14px_35px_rgba(249,115,22,0.35)] transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Analyse IA en cours...
        </>
      ) : hasResult ? (
        <>
          <CheckCircle2 size={16} />
          Recommandation IA disponible
        </>
      ) : (
        <>
          <Sparkles size={16} />
          Analyser avec l'IA Solar Advisor
        </>
      )}
    </motion.button>
  );
}
