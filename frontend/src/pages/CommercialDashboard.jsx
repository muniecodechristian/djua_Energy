import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BellRing, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, FileText, RefreshCw, Wifi, Wrench,
} from 'lucide-react';
import api from '../api/axios';
import PageEntrance from '../components/PageEntrance';
import { useAlertsQuery } from '../hooks/tanstack/useKitQueries';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { activeAlerts, asList, detailUrl, severityLabels } from '../lib/operations';
import './CommercialDashboard.css';

const numberFormat = new Intl.NumberFormat('fr-FR');
const severityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

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

function formatKinshasaDate() {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Kinshasa',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

function ageLabel(value) {
  if (!value) return 'Date inconnue';
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
  if (hours < 1) return 'À l’instant';
  if (hours < 24) return `Depuis ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Depuis ${days} j`;
}

function quoteCustomer(quote) {
  return quote.customer?.name || 'Client';
}

function openQuote(navigate, quote) {
  navigate('/devis', { state: { focusQuote: quote.number } });
}

function DashboardKpi({ title, value, note, icon: Icon, tone, onClick }) {
  const Content = <><span className={`commercial-kpi-icon ${tone}`}><Icon size={19} /></span><span className="commercial-kpi-copy"><small>{title}</small><strong>{value}</strong><em>{note}</em></span><span className="commercial-kpi-arrow"><ArrowRight size={16} /></span></>;
  return onClick
    ? <button type="button" className="commercial-kpi" onClick={onClick}>{Content}</button>
    : <article className="commercial-kpi">{Content}</article>;
}

export default function CommercialDashboard() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const quotesQuery = useQuery({
    queryKey: ['sales-quotes', user?._id, 'commercial-dashboard'],
    queryFn: async () => {
      const firstPage = (await api.get('/api/quotes', { params: { page: 1 } })).data?.data;
      if (!firstPage || !Array.isArray(firstPage.quotes)) throw new Error('Format de réponse des devis inattendu.');
      return {
        quotes: firstPage.quotes,
        kitIds: asList(firstPage.kitIds),
        followUps: asList(firstPage.followUps),
        stats: firstPage.stats || {},
        notices: firstPage.notices || [],
      };
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const alertsQuery = useAlertsQuery();

  const quotes = asList(quotesQuery.data?.quotes);
  const stats = quotesQuery.data?.stats || {};
  const quoteByKit = useMemo(() => new Map(quotes.filter(quote => quote.kitId).map(quote => [quote.kitId, quote])), [quotes]);
  const ownedKitIds = useMemo(() => new Set([...asList(quotesQuery.data?.kitIds), ...quoteByKit.keys()]), [quotesQuery.data?.kitIds, quoteByKit]);
  const scopedAlerts = useMemo(() => activeAlerts(alertsQuery.data)
    .filter(alert => ownedKitIds.has(alert.kitId))
    .sort((left, right) => (severityRank[left.severity] ?? 5) - (severityRank[right.severity] ?? 5)
      || new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
  [alertsQuery.data, ownedKitIds]);

  const drafts = useMemo(() => quotes.filter(quote => quote.status === 'draft')
    .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0)), [quotes]);
  const today = kinshasaToday();
  const draftsToday = drafts.filter(quote => quote.createdAt
    && new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kinshasa' }).format(new Date(quote.createdAt)) === today).length;
  const toFollowUp = asList(quotesQuery.data?.followUps);
  const criticalAlerts = scopedAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high');
  const installationsUnderWatch = new Set(scopedAlerts.map(alert => alert.kitId)).size;

  const todoItems = useMemo(() => {
    const followUps = toFollowUp.slice(0, 2).map(quote => ({
      key: `followup-${quote.number}`,
      icon: FileText,
      tone: 'orange',
      title: 'Relancer le devis',
      subject: quoteCustomer(quote),
      detail: `${quote.number} · Aucune validation depuis ${ageLabel(quote.createdAt).replace('Depuis ', '')}`,
      action: 'Relancer',
      onClick: () => openQuote(navigate, quote),
    }));
    const critical = criticalAlerts.slice(0, 2).map(alert => ({
      key: `alert-${alert._id || alert.id || alert.kitId}`,
      icon: AlertTriangle,
      tone: 'red',
      title: alert.label || 'Installation à vérifier',
      subject: quoteCustomer(quoteByKit.get(alert.kitId) || {}),
      detail: `${alert.kitId} · ${alert.description || alert.message || severityLabels[alert.severity] || 'Alerte ouverte'}`,
      action: 'Analyser',
      onClick: () => navigate(detailUrl(alert.kitId)),
    }));
    const pending = drafts.filter(quote => !toFollowUp.some(item => item.number === quote.number)).slice(-2).reverse().map(quote => ({
      key: `approval-${quote.number}`,
      icon: ClipboardList,
      tone: 'amber',
      title: 'Devis à valider',
      subject: quoteCustomer(quote),
      detail: `${quote.number} · Créé ${ageLabel(quote.createdAt).toLowerCase()}`,
      action: 'Voir',
      onClick: () => openQuote(navigate, quote),
    }));
    const items = [...followUps, ...critical, ...pending];
    if (items.length === 0 && quotesQuery.isSuccess && alertsQuery.isSuccess) {
      return [{
        key: 'all-clear',
        icon: CheckCircle2,
        tone: 'green',
        title: 'Tout est à jour',
        subject: 'Aucune action prioritaire',
        detail: 'Les nouveaux devis et alertes apparaîtront ici automatiquement.',
        action: 'Ouvrir les devis',
        onClick: () => navigate('/devis'),
      }];
    }
    return items.slice(0, 5);
  }, [toFollowUp, criticalAlerts, drafts, quoteByKit, navigate, quotesQuery.isSuccess, alertsQuery.isSuccess]);

  const installations = scopedAlerts.slice(0, 5).map(alert => ({
    ...alert,
    quote: quoteByKit.get(alert.kitId),
  }));
  const reportNotices = asList(quotesQuery.data?.notices);
  const isRefreshing = quotesQuery.isFetching || alertsQuery.isFetching;
  const failedSources = [
    quotesQuery.isError && 'devis',
    alertsQuery.isError && 'alertes',
  ].filter(Boolean);
  const displayName = user?.prenom || user?.name || 'Commercial';

  return (
    <PageEntrance className="ops-page commercial-dashboard">
      <header className="commercial-heading">
        <div>
          <p className="ops-eyebrow">VOTRE ESPACE COMMERCIAL</p>
          <h1>Bonjour {displayName}</h1>
          <p>Voici ce qui se passe aujourd’hui sur Djua.</p>
        </div>
        <div className="commercial-date"><CalendarDays size={16} /><span>{formatKinshasaDate()}<small>Kinshasa, RDC</small></span><button type="button" aria-label="Actualiser le tableau de bord" title="Actualiser" disabled={isRefreshing} onClick={() => { quotesQuery.refetch(); alertsQuery.refetch(); }}><RefreshCw size={15} className={isRefreshing ? 'ops-spin' : ''} /></button></div>
      </header>

      {failedSources.length > 0 && <div className="ops-notice commercial-notice" role="alert">Certaines données sont indisponibles : {failedSources.join(', ')}.<button onClick={() => { quotesQuery.refetch(); alertsQuery.refetch(); }}>Réessayer</button></div>}

      {reportNotices.map(notice => <Link className="commercial-install-notice" key={notice._id} to="/devis"><AlertTriangle size={17} /><span><strong>Installation enregistrée à une date différente · {notice.number}</strong><small>{notice.clientName} · Prévue le {notice.plannedDate}, enregistrée le {notice.installedDay} · Kit {notice.kitId}</small></span><ChevronRight size={16} /></Link>)}

      <section className="commercial-kpis" aria-label="Indicateurs commerciaux">
        <DashboardKpi title="Dimensionnements en cours" value={quotesQuery.isSuccess ? numberFormat.format(stats.draft || 0) : '—'} note={`${numberFormat.format(draftsToday)} commencé${draftsToday === 1 ? '' : 's'} aujourd’hui`} icon={ClipboardList} tone="orange" onClick={() => navigate('/devis')} />
        <DashboardKpi title="Devis à relancer" value={quotesQuery.isSuccess ? numberFormat.format(stats.draftsToFollowUp || 0) : '—'} note="Sans validation depuis 3 jours" icon={FileText} tone="orange" onClick={() => navigate('/devis')} />
        <DashboardKpi title="Installations à surveiller" value={alertsQuery.isSuccess ? numberFormat.format(installationsUnderWatch) : '—'} note="Installations avec au moins une alerte ouverte" icon={Wifi} tone="amber" onClick={() => navigate('/parc')} />
        <DashboardKpi title="Alertes critiques" value={alertsQuery.isSuccess ? numberFormat.format(criticalAlerts.length) : '—'} note="Priorité haute ou critique" icon={AlertTriangle} tone="red" onClick={() => navigate('/parc')} />
      </section>

      <div className="commercial-panels">
        <section className="commercial-panel">
          <header className="commercial-panel-heading"><div><h2>À faire aujourd’hui</h2><p>Vos prochaines actions commerciales et opérationnelles.</p></div><Link to="/devis">Tous les devis <ArrowRight size={14} /></Link></header>
          {quotesQuery.isPending || alertsQuery.isPending ? <div className="commercial-state"><RefreshCw size={17} className="ops-spin" />Chargement de vos actions…</div> : todoItems.length === 0 ? <div className="commercial-state">Aucune action à afficher pour le moment.</div> : <ul className="commercial-task-list">{todoItems.map(item => { const Icon = item.icon; return <li key={item.key}><i className={`commercial-task-dot ${item.tone}`} /><span className={`commercial-task-icon ${item.tone}`}><Icon size={17} /></span><span className="commercial-task-copy"><strong>{item.title}</strong><b>{item.subject}</b><small>{item.detail}</small></span><button type="button" onClick={item.onClick}>{item.action}</button></li>; })}</ul>}
        </section>

        <section className="commercial-panel">
          <header className="commercial-panel-heading"><div><h2>Installations à surveiller</h2><p>Alertes ouvertes sur les installations associées à vos devis.</p></div><Link to="/parc">Voir le parc <ArrowRight size={14} /></Link></header>
          {alertsQuery.isPending || quotesQuery.isPending ? <div className="commercial-state"><RefreshCw size={17} className="ops-spin" />Chargement des alertes…</div> : installations.length === 0 ? <div className="commercial-state commercial-empty"><CheckCircle2 size={20} /><strong>Aucune installation ne nécessite votre attention</strong><span>Les alertes de vos installations apparaîtront ici dès leur réception.</span><Link to="/parc">Consulter le parc solaire <ArrowRight size={14} /></Link></div> : <ul className="commercial-install-list">{installations.map(alert => {
            const tone = alert.severity === 'critical' ? 'red' : ['high', 'medium'].includes(alert.severity) ? 'amber' : 'slate';
            return <li key={alert._id || alert.id || alert.kitId + alert.type}>
              <span className={`commercial-install-icon ${tone}`}><BellRing size={15} /></span>
              <span className="commercial-install-copy"><strong>{alert.kitId}{alert.quote ? ` · ${quoteCustomer(alert.quote)}` : ''}</strong><b className={tone}><i />{alert.label || alert.type || severityLabels[alert.severity] || 'Alerte'}</b><small>{alert.description || alert.message || 'Consulter le détail de l’installation.'}</small></span>
              <time>{ageLabel(alert.createdAt)}</time>
              <button type="button" onClick={() => navigate(detailUrl(alert.kitId))}>Vérifier</button>
            </li>;
          })}</ul>}
        </section>
      </div>

      <section className="commercial-shortcuts" aria-label="Accès rapides">
        <Link to="/devis"><ClipboardList size={16} /><span><strong>Nouveau dimensionnement</strong><small>Préparer une offre solaire</small></span><ArrowRight size={15} /></Link>
        <Link to="/catalogue"><FileText size={16} /><span><strong>Catalogue équipements</strong><small>Consulter les produits partagés</small></span><ArrowRight size={15} /></Link>
        <Link to="/rapports"><Wrench size={16} /><span><strong>Rapports d’activité</strong><small>Suivre vos ventes et résultats</small></span><ArrowRight size={15} /></Link>
      </section>
    </PageEntrance>
  );
}
