import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowRight, BellRing, CalendarClock, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, CircleDollarSign, FilePlus2, FileText,
  RefreshCw, Search, Users, Eye, Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import PageEntrance from '../components/PageEntrance';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import QuoteDetailModal from '../components/QuoteDetailModal';
import './QuotesDashboard.css';

const statusConfig = {
  draft: { label: 'À valider', tone: 'draft', tab: 'Brouillons' },
  approved: { label: 'Validé · installation prévue', tone: 'approved', tab: 'Validés' },
  installing: { label: 'Installation en cours', tone: 'installing', tab: 'En installation' },
  installed: { label: 'Installé', tone: 'installed', tab: 'Installés' },
};
const statusTabs = ['', 'draft', 'validated', 'installing', 'installed'];
const nf = new Intl.NumberFormat('fr-FR');

function kinshasaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kinshasa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return parts.find(part => part.type === 'year').value
    + '-' + parts.find(part => part.type === 'month').value
    + '-' + parts.find(part => part.type === 'day').value;
}

function formatDate(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Date non renseignée';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function currency(value, code) {
  const suffix = (!code || code === 'CDF' || code === 'XAF' || code === 'FC') ? 'Francs' : code;
  return `${nf.format(Math.round(Number(value) || 0))} ${suffix}`;
}

function formatPending(valueMap = {}) {
  const amounts = Object.entries(valueMap)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([code, amount]) => currency(amount, code));
  if (!amounts.length) return '0';
  if (amounts.length === 1) return amounts[0];
  return amounts.join(' · ');
}

function quoteCustomer(quote) {
  return quote.customer?.name || 'Client non renseigné';
}

function exportQuotes(quotes) {
  const columns = ['Numéro', 'Client', 'Téléphone', 'Montant', 'Devise', 'Statut', 'Date de création', 'Installation prévue', 'Kit'];
  const rows = quotes.map(quote => [
    quote.number,
    quoteCustomer(quote),
    quote.customer?.phone,
    quote.amount,
    quote.currency,
    statusConfig[quote.status]?.label || quote.status,
    quote.createdAt,
    quote.plannedDate,
    quote.kitId,
  ]);
  const csv = `\uFEFF${[columns, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `devis-djua-${kinshasaToday()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function MetricCard({ icon: Icon, label, value, note, tone, progress, onClick }) {
  const content = <>
    <span className={`quotes-metric-icon ${tone}`}><Icon size={18} /></span>
    <span className="quotes-metric-content">
      <span className="quotes-metric-label">{label}</span>
      <strong className={tone === 'value' ? 'is-currency-value' : ''}>{value}</strong>
      <span className="quotes-metric-note">{note}</span>
      {progress !== undefined && <span className="quotes-metric-progress"><i style={{ width: `${progress}%` }} /></span>}
    </span>
    {onClick && <span className={`quotes-metric-action ${tone}`}><ArrowRight size={15} /></span>}
  </>;
  return onClick
    ? <button type="button" className="quotes-metric" onClick={onClick}>{content}</button>
    : <article className="quotes-metric">{content}</article>;
}

function QuoteRow({ quote, focusQuote, currentUser, onViewDetails }) {
  const [expanded, setExpanded] = useState(quote.number === focusQuote);
  const [date, setDate] = useState('');
  const cache = useQueryClient();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'administration';
  const isCreator = quote.owner && (String(quote.owner) === String(currentUser?._id) || String(quote.owner?._id) === String(currentUser?._id));
  const canManageInstallation = isAdmin || isCreator;

  const validation = useMutation({
    mutationFn: async () => api.patch(`/api/quotes/${encodeURIComponent(quote.number)}/approve`, { plannedDate: date }),
    onSuccess: () => {
      toast.success('Devis validé. La date prévue est enregistrée.');
      cache.invalidateQueries({ queryKey: ['quote-workspace'] });
      cache.invalidateQueries({ queryKey: ['sales-quotes'] });
    },
    onError: error => toast.error(error.response?.data?.message || 'Impossible de valider ce devis.'),
  });
  const status = statusConfig[quote.status] || { label: 'Statut inconnu', tone: 'unknown' };

  return <>
    <tr 
      className={`quotes-table-row${expanded ? ' is-expanded' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={() => onViewDetails()}
    >
      <td><button className="quotes-row-expand" aria-label={`${expanded ? 'Réduire' : 'Afficher'} le devis ${quote.number}`} aria-expanded={expanded} onClick={event => { event.stopPropagation(); setExpanded(value => !value); }}><ChevronDown size={14} /></button></td>
      <td><strong>{quote.number || 'Devis'}</strong><small>{formatDate(quote.createdAt)}</small></td>
      <td><strong>{quoteCustomer(quote)}</strong><small>{quote.customer?.profile === 'entreprise' ? 'Entreprise' : 'Client'}</small></td>
      <td className="quotes-amount">{currency(quote.amount, quote.currency)}</td>
      <td><span className={`quotes-status ${status.tone}`}><i />{status.label}</span></td>
      <td>
        <span className="quotes-next-action">
          {quote.status === 'draft' ? (canManageInstallation ? 'Relancer / valider' : 'En attente de validation') : quote.status === 'installed' ? 'Installation terminée' : 'Suivre l’installation'}
        </span>
        <small>
          {quote.status === 'draft' ? 'Proposition en attente' : (canManageInstallation && quote.plannedDate) ? `Prévue le ${formatDate(quote.plannedDate)}` : quote.kitId || 'Étape suivante à confirmer'}
        </small>
      </td>
      <td>{(canManageInstallation && quote.plannedDate) ? formatDate(quote.plannedDate) : '—'}</td>
      <td>
        <button
          className="quotes-row-more"
          title="Consulter le détail complet du devis"
          aria-label={`Détails complets du devis ${quote.number}`}
          onClick={event => { event.stopPropagation(); onViewDetails(); }}
        >
          <Eye size={14} />
        </button>
      </td>
    </tr>
    {expanded && <tr className="quotes-expanded-row"><td colSpan="8"><div className="quotes-expanded-content">
      <div className="quotes-expanded-facts">
        <div><small>Contact</small><strong>{quote.customer?.phone || 'Téléphone non renseigné'}</strong></div>
        <div><small>Adresse du site</small><strong>{[quote.site?.adresse, quote.site?.ville].filter(Boolean).join(', ') || 'Adresse non renseignée'}</strong></div>
        <div><small>Dimensionnement</small><strong>{nf.format(quote.system?.panels || 0)} panneaux · {nf.format(quote.system?.panelPower || 0)} W</strong></div>
        <div><small>Stockage / onduleur</small><strong>{nf.format(quote.system?.batteryCapacity || 0)} kWh · {nf.format(quote.system?.inverterPower || 0)} kVA</strong></div>
        {canManageInstallation && quote.plannedDate && (
          <div><small>Date d'installation prévue</small><strong className="text-emerald-600 dark:text-emerald-400">{formatDate(quote.plannedDate)}</strong></div>
        )}
      </div>
      {quote.appliances?.length > 0 && <ul className="quotes-appliance-list">{quote.appliances.slice(0, 8).map((item, index) => <li key={`${item.name}-${index}`}>{item.quantity} × {item.name}<small>{nf.format(item.watts || 0)} W · {item.hours || 0} h/j</small></li>)}</ul>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
        <button
          type="button"
          className="quotes-export-button"
          style={{ cursor: 'pointer' }}
          onClick={() => onViewDetails()}
        >
          <Maximize2 size={13} /> Voir toute la fiche détaillée du devis
        </button>
      </div>
      {quote.status === 'draft' && canManageInstallation && (
        <form className="quotes-validation-form" onSubmit={event => { event.preventDefault(); validation.mutate(); }}>
          <label>Date d’installation prévue<input type="date" required min={kinshasaToday()} value={date} onChange={event => setDate(event.target.value)} /></label>
          <button type="submit" disabled={!date || date < kinshasaToday() || validation.isPending}>{validation.isPending ? 'Validation…' : 'Valider le devis'}</button>
          <small>Heure de Kinshasa. En validant, le devis passe au statut validé et la date d'installation est enregistrée.</small>
        </form>
      )}
      {quote.status === 'draft' && !canManageInstallation && (
        <p className="text-xs text-zinc-500 italic mt-2">La validation du devis et la fixation de la date d’installation sont réservées à son créateur et à l'administrateur.</p>
      )}
    </div></td></tr>}
  </>;
}

export default function QuotesDashboard() {
  const user = useAuthStore(state => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const focusQuote = location.state?.focusQuote || '';
  const [search, setSearch] = useState(focusQuote);
  const [term, setTerm] = useState(focusQuote);
  const [status, setStatus] = useState('');
  const [followUpsOnly, setFollowUpsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [activeDetailQuote, setActiveDetailQuote] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const query = useQuery({
    queryKey: ['quote-workspace', user?._id, term, status, followUpsOnly, page],
    queryFn: async () => {
      const response = await api.get('/api/quotes', {
        params: { search: term || undefined, status: status || undefined, followUp: followUpsOnly ? 'true' : undefined, page },
      });
      const data = response.data?.data;
      if (!data || !Array.isArray(data.quotes)) throw new Error('Format de réponse des devis inattendu.');
      return data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const data = query.data;
  const stats = data?.stats || {};
  const quotes = data?.quotes || [];
  const drafts = Number(stats.draft) || 0;
  const validated = (Number(stats.approved) || 0) + (Number(stats.installing) || 0) + (Number(stats.installed) || 0);
  const total = Number(stats.total) || 0;
  const followUpCount = Number(stats.draftsToFollowUp) || 0;
  const maxCount = Math.max(drafts, validated, 1);
  const pages = Math.max(1, Math.ceil((data?.total || 0) / (data?.pageSize || 30)));
  const role = user?.role === 'admin' || user?.role === 'administration'
    ? 'de l’ensemble des espaces'
    : user?.role === 'shop_manager' ? 'de votre équipe' : 'de votre espace';

  const chooseStatus = nextStatus => {
    setFollowUpsOnly(false);
    setStatus(nextStatus);
    setPage(1);
  };
  const toggleFollowUps = () => {
    setFollowUpsOnly(value => !value);
    setStatus('');
    setPage(1);
  };

  return (
    <PageEntrance className="ops-page quotes-workspace">
      <header className="quotes-workspace-heading">
        <div><p className="ops-eyebrow">SUIVI COMMERCIAL</p><h1>Devis</h1><p>Suivez vos propositions, retrouvez vos clients et reprenez les actions en attente.</p></div>
        <div className="quotes-workspace-actions">
          <button className="quotes-export-button" type="button" disabled={!quotes.length} onClick={() => exportQuotes(quotes)}><ArrowDownToLine size={15} />Exporter cette page</button>
          <Link className="quotes-create-button" to="/devis/nouveau"><FilePlus2 size={16} />Créer un devis solaire</Link>
        </div>
      </header>

      <section className="quotes-metrics" aria-label="Indicateurs de devis">
        <MetricCard icon={FileText} label="À valider" value={query.isSuccess ? nf.format(drafts) : '—'} note={`${nf.format(total)} proposition${total === 1 ? '' : 's'} ${role}`} tone="orange" progress={Math.min(100, drafts / maxCount * 100)} onClick={() => chooseStatus('draft')} />
        <MetricCard icon={BellRing} label="À relancer" value={query.isSuccess ? nf.format(followUpCount) : '—'} note={`${data?.followUps?.length || 0} priorité(s) à traiter`} tone="amber" progress={total ? Math.min(100, followUpCount / total * 100) : 0} onClick={toggleFollowUps} />
        <MetricCard icon={CheckCircle2} label="Validés" value={query.isSuccess ? nf.format(validated) : '—'} note={total ? `${Math.round(validated / total * 100)} % des devis enregistrés` : 'Aucun devis enregistré'} tone="green" progress={total ? Math.min(100, validated / total * 100) : 0} onClick={() => chooseStatus('validated')} />
        <MetricCard icon={CircleDollarSign} label="Montant en attente" value={query.isSuccess ? formatPending(stats.valuePendingByCurrency) : '—'} note="Devis non encore installés · par devise" tone="value" />
      </section>

      {query.isSuccess && followUpCount > 0 && <button type="button" className={`quotes-follow-up${followUpsOnly ? ' is-active' : ''}`} onClick={toggleFollowUps}>
        <span className="quotes-follow-up-icon"><BellRing size={18} /></span><span><strong>À relancer aujourd’hui</strong><small>{data.followUps?.length ? `Reprenez contact avec ${data.followUps.slice(0, 2).map(quoteCustomer).join(' et ')}${followUpCount > data.followUps.length ? ` et ${followUpCount - data.followUps.length} autre(s)` : ''}.` : 'Identifiez les propositions restées sans validation depuis trois jours.'}</small></span><span className="quotes-follow-up-action">{followUpsOnly ? 'Afficher tous' : 'Voir les relances'} <span>{nf.format(followUpCount)}</span></span>
      </button>}

      <section className="quotes-register-card" aria-label="Liste des devis">
        <header className="quotes-register-heading">
          <div><h2>{followUpsOnly ? 'Devis à relancer' : 'Tous les devis'} <span>{query.isSuccess ? `(${nf.format(data.total)})` : ''}</span></h2><p>Les devis et statuts reflètent les enregistrements de votre espace.</p></div>
          <div className="quotes-register-tools"><div className="quotes-owner-select"><Users size={15} /><span>{user?.role === 'admin' || user?.role === 'administration' ? 'Tous les espaces' : user?.role === 'shop_manager' ? 'Mon équipe' : 'Mes devis'}</span></div><label className="quotes-search"><Search size={16} /><input aria-label="Rechercher un devis ou un client" placeholder="Rechercher un devis, client, numéro…" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
        </header>
        <div className="quotes-status-tabs" role="tablist" aria-label="Filtrer les devis par statut">
          <button type="button" role="tab" aria-selected={!status && !followUpsOnly} className={!status && !followUpsOnly ? 'is-active' : ''} onClick={() => { setFollowUpsOnly(false); setStatus(''); setPage(1); }}>Tous <span>{query.isSuccess ? nf.format(total) : '—'}</span></button>
          {statusTabs.slice(1).map(key => <button type="button" key={key} role="tab" aria-selected={status === key} className={status === key ? 'is-active' : ''} onClick={() => chooseStatus(key)}>{key === 'validated' ? 'Validés' : statusConfig[key].tab} <span>{query.isSuccess ? nf.format(key === 'validated' ? validated : stats[key] || 0) : '—'}</span></button>)}
        </div>

        {query.isPending && <div className="quotes-table-state"><RefreshCw size={18} className="ops-spin" />Chargement des devis…</div>}
        {query.isError && <div className="quotes-table-state is-error" role="alert"><FileText size={19} /><strong>Impossible de charger les devis.</strong><span>Vérifiez votre connexion puis réessayez.</span><button type="button" onClick={() => query.refetch()}>Réessayer</button></div>}
        {query.isSuccess && data.quotes.length === 0 && <div className="quotes-table-state"><FileText size={20} /><strong>{term ? 'Aucun résultat pour cette recherche.' : followUpsOnly ? 'Aucune relance à effectuer.' : status ? `Aucun devis au statut « ${status === 'validated' ? 'Validés' : statusConfig[status]?.tab} ».` : 'Aucun devis enregistré pour le moment.'}</strong><span>{!term && !followUpsOnly && !status ? 'Créez votre première proposition pour commencer le suivi.' : 'Modifiez vos filtres ou votre recherche.'}</span>{!term && !followUpsOnly && !status && <Link to="/devis/nouveau">Créer un devis solaire <ArrowRight size={14} /></Link>}</div>}
        {query.isSuccess && data.quotes.length > 0 && <div className="quotes-table-scroll"><table className="quotes-table"><thead><tr><th aria-label="Détails" /><th>Devis</th><th>Client</th><th>Montant estimé</th><th>Statut</th><th>Prochaine action</th><th>Installation prévue</th><th>Détails</th></tr></thead><tbody>{data.quotes.map(quote => <QuoteRow key={quote._id || quote.number} quote={quote} focusQuote={focusQuote} currentUser={user} onViewDetails={() => navigate(`/devis/${encodeURIComponent(quote.number)}`)} />)}</tbody></table></div>}

        {query.isSuccess && data.total > 0 && <footer className="quotes-pagination"><span>{nf.format(Math.min((page - 1) * (data.pageSize || 30) + 1, data.total))}–{nf.format(Math.min(page * (data.pageSize || 30), data.total))} sur {nf.format(data.total)} devis</span><div><button type="button" aria-label="Page précédente" disabled={page === 1 || query.isFetching} onClick={() => setPage(value => value - 1)}><ChevronLeft size={15} /></button><span>Page {page} sur {pages}</span><button type="button" aria-label="Page suivante" disabled={page >= pages || query.isFetching} onClick={() => setPage(value => value + 1)}><ChevronRight size={15} /></button></div></footer>}
      </section>
      <p className="quotes-data-note"><CalendarClock size={13} />Les relances sont calculées à partir des brouillons sans validation depuis au moins trois jours. Les montants sont exprimés en Franc Congolais (FC).</p>

      {activeDetailQuote && (
        <QuoteDetailModal
          quote={activeDetailQuote}
          onClose={() => setActiveDetailQuote(null)}
        />
      )}
    </PageEntrance>
  );
}
