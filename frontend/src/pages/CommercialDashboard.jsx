import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BellRing, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, FileText, PanelsTopLeft, RefreshCw, Wifi, Wrench,
} from 'lucide-react';
import api from '../api/axios';
import PageEntrance from '../components/PageEntrance';
import { useAlertsQuery } from '../hooks/tanstack/useKitQueries';
import { useGetInstallations } from '../hooks/tanstack/useInstallations';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { activeAlerts, asList, severityLabels } from '../lib/operations';
import './CommercialDashboard.css';

const numberFormat = new Intl.NumberFormat('fr-FR');
const severityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const INSTALL_STATUS_CONFIG = {
  a_planifier: { label: 'À planifier', tone: 'pending' },
  planifiee: { label: 'Planifiée', tone: 'info' },
  en_cours: { label: 'En cours', tone: 'progress' },
  en_attente: { label: 'En attente / Bloqué', tone: 'danger' },
  installee: { label: 'Installée', tone: 'info' },
  mise_en_service: { label: 'Mise en service', tone: 'success' },
  validee: { label: 'Validée & Conforme', tone: 'validated' },
};

function formatInstallDate(date) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

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
  navigate(`/devis/${encodeURIComponent(quote.number)}`);
}

function alertDetailUrl(alert) {
  return `/notification?alertId=${encodeURIComponent(alert._id || '')}`;
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

  const installationsQuery = useGetInstallations();
  const commercialInstallations = asList(installationsQuery.data?.installations);

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
  const installationsToWatch = useMemo(() => {
    const alertByKit = new Map(scopedAlerts.map(alert => [alert.kitId, alert]));
    const watchedInstallations = commercialInstallations.filter(installation =>
      installation.isOverdue || (installation.kitId && alertByKit.has(installation.kitId)));
    const representedKitIds = new Set(watchedInstallations.map(installation => installation.kitId).filter(Boolean));
    const installationItems = watchedInstallations.map(installation => ({
      key: `installation-${installation._id}`,
      installation,
      alert: alertByKit.get(installation.kitId),
    }));
    const unmatchedAlertItems = scopedAlerts
      .filter(alert => !representedKitIds.has(alert.kitId))
      .map(alert => ({
        key: `alert-${alert._id || alert.id || alert.kitId}`,
        alert: { ...alert, quote: quoteByKit.get(alert.kitId) },
      }));
    return [...installationItems, ...unmatchedAlertItems];
  }, [commercialInstallations, scopedAlerts, quoteByKit]);

  const drafts = useMemo(() => quotes.filter(quote => quote.status === 'draft')
    .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0)), [quotes]);
  const today = kinshasaToday();
  const draftsToday = drafts.filter(quote => quote.createdAt
    && new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kinshasa' }).format(new Date(quote.createdAt)) === today).length;
  const toFollowUp = asList(quotesQuery.data?.followUps);
  const criticalAlerts = scopedAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high');
  const installationsUnderWatch = installationsToWatch.length;
  const criticalInstallations = new Set(criticalAlerts.map(alert => alert.kitId)).size;

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
      onClick: () => navigate(alertDetailUrl(alert)),
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

  const reportNotices = asList(quotesQuery.data?.notices);
  const isRefreshing = quotesQuery.isFetching || alertsQuery.isFetching;
  const failedSources = [
    quotesQuery.isError && 'devis',
    alertsQuery.isError && 'alertes',
    installationsQuery.isError && 'installations',
  ].filter(Boolean);
  const displayName = user?.prenom || user?.name || 'Commercial';

  return (
    <PageEntrance className="ops-page commercial-dashboard">
      <header className="commercial-heading">
        <div>
          <h1>Bonjour {displayName}</h1>
          <p>Voici ce qui se passe aujourd’hui sur Djua.</p>
        </div>
        <div className="commercial-date"><CalendarDays size={16} /><span>{formatKinshasaDate()}<small>Kinshasa, RDC</small></span><button type="button" aria-label="Actualiser le tableau de bord" title="Actualiser" disabled={isRefreshing || installationsQuery.isFetching} onClick={() => { quotesQuery.refetch(); alertsQuery.refetch(); installationsQuery.refetch(); }}><RefreshCw size={15} className={isRefreshing || installationsQuery.isFetching ? 'ops-spin' : ''} /></button></div>
      </header>

      {failedSources.length > 0 && <div className="ops-notice commercial-notice" role="alert">Certaines données sont indisponibles : {failedSources.join(', ')}.<button type="button" onClick={() => { quotesQuery.refetch(); alertsQuery.refetch(); installationsQuery.refetch(); }}>Réessayer</button></div>}

      {reportNotices.map(notice => <Link className="commercial-install-notice" key={notice._id} to="/devis"><AlertTriangle size={17} /><span><strong>Installation enregistrée à une date différente · {notice.number}</strong><small>{notice.clientName} · Prévue le {notice.plannedDate}, enregistrée le {notice.installedDay} · Kit {notice.kitId}</small></span><ChevronRight size={16} /></Link>)}

      <section className="commercial-kpis" aria-label="Indicateurs commerciaux">
        <DashboardKpi title="Dimensionnements en cours" value={quotesQuery.isSuccess ? numberFormat.format(stats.draft || 0) : '—'} note={`${numberFormat.format(draftsToday)} commencé${draftsToday === 1 ? '' : 's'} aujourd’hui`} icon={ClipboardList} tone="orange" onClick={() => navigate('/devis')} />
        <DashboardKpi title="Devis à relancer" value={quotesQuery.isSuccess ? numberFormat.format(stats.draftsToFollowUp || 0) : '—'} note="Sans validation depuis 3 jours" icon={FileText} tone="orange" onClick={() => navigate('/devis')} />
        <DashboardKpi title="Installations à surveiller" value={installationsQuery.isSuccess && alertsQuery.isSuccess ? numberFormat.format(installationsUnderWatch) : '—'} note="Avec une alerte ou une échéance dépassée" icon={Wifi} tone="amber" onClick={() => navigate('/parc')} />
        <DashboardKpi title="Installations critiques" value={alertsQuery.isSuccess ? numberFormat.format(criticalInstallations) : '—'} note="Avec une alerte haute ou critique" icon={AlertTriangle} tone="red" onClick={() => navigate('/parc')} />
      </section>

      <div className="commercial-panels">
        <section className="commercial-panel">
          <header className="commercial-panel-heading"><div><h2>À faire aujourd’hui</h2></div><Link to="/devis">Voir tout <ArrowRight size={14} /></Link></header>
          {quotesQuery.isPending || alertsQuery.isPending ? <div className="commercial-state"><RefreshCw size={17} className="ops-spin" />Chargement de vos actions…</div> : quotesQuery.isError || alertsQuery.isError ? <div className="commercial-state" role="alert">Impossible de charger les actions. Utilisez « Réessayer » pour actualiser les données.</div> : todoItems.length === 0 ? <div className="commercial-state">Aucune action à afficher pour le moment.</div> : <ul className="commercial-task-list">{todoItems.map(item => { const Icon = item.icon; return <li key={item.key}><i className={`commercial-task-dot ${item.tone}`} /><span className={`commercial-task-icon ${item.tone}`}><Icon size={17} /></span><span className="commercial-task-copy"><strong>{item.title}</strong><b>{item.subject}</b><small>{item.detail}</small></span><button type="button" onClick={item.onClick}>{item.action}</button></li>; })}</ul>}
        </section>

        <section className="commercial-panel">
          <header className="commercial-panel-heading"><div><h2>Installations à surveiller</h2><p>Retards et alertes de vos installations.</p></div><Link to="/notification">Voir les alertes <ArrowRight size={14} /></Link></header>
          {installationsQuery.isPending || quotesQuery.isPending || alertsQuery.isPending ? <div className="commercial-state"><RefreshCw size={17} className="ops-spin" />Chargement des installations…</div> : installationsQuery.isError || quotesQuery.isError || alertsQuery.isError ? <div className="commercial-state" role="alert">Impossible de charger les installations à surveiller. Actualisez le tableau de bord pour réessayer.</div> : installationsToWatch.length === 0 ? <div className="commercial-state commercial-empty"><CheckCircle2 size={20} /><strong>Aucune installation ne nécessite votre attention</strong><span>Les retards et alertes de vos installations apparaîtront ici.</span><Link to="/notification">Consulter le centre d’alertes <ArrowRight size={14} /></Link></div> : <ul className="commercial-install-list">{installationsToWatch.map(item => {
            if (item.installation) {
              const { installation, alert } = item;
              const statusMeta = INSTALL_STATUS_CONFIG[installation.status] || { label: installation.status, tone: 'pending' };
              const tone = alert?.severity === 'critical' || installation.isOverdue
                ? 'red'
                : ['high', 'medium'].includes(alert?.severity) ? 'amber' : 'slate';
              const powerKwc = ((Number(installation.system?.panels || 0) * Number(installation.system?.panelPower || 0)) / 1000).toFixed(1);
              const technician = installation.assignedTechnician
                ? `${installation.assignedTechnician.prenom} ${installation.assignedTechnician.nom}`
                : 'Non assigné';
              const location = [installation.site?.quartier, installation.site?.ville || 'Kinshasa'].filter(Boolean).join(', ');
              return <li className="commercial-installation-watch-item" key={item.key}>
                <span className={`commercial-install-icon ${tone}`}><AlertTriangle size={15} /></span>
                <span className="commercial-install-copy">
                  <strong>{installation.folderNumber} · Devis {installation.quoteNumber}</strong>
                  <b className={tone}><i />{alert?.label || alert?.type || (installation.isOverdue ? 'Retard d’installation' : 'Alerte ouverte')}</b>
                  <small>{installation.customer?.name || 'Client sans nom'}{location ? ` · ${location}` : ''}</small>
                  <small>{powerKwc} kWc · {installation.system?.batteryCapacity || 0} kWh · {installation.system?.inverterPower || 0} kVA · {technician} · {formatInstallDate(installation.plannedDate)}</small>
                </span>
                <span className="commercial-install-watch-status">
                  <span className={`commercial-status-badge ${statusMeta.tone}`}><i className="commercial-badge-dot" />{statusMeta.label}</span>
                  {installation.isOverdue && <span className="commercial-overdue-tag"><AlertTriangle size={11} /> Retard</span>}
                </span>
                <button type="button" onClick={() => navigate(`/installations/${installation._id}`)}>Fiche détails</button>
              </li>;
            }

            const { alert } = item;
            const tone = alert.severity === 'critical' ? 'red' : ['high', 'medium'].includes(alert.severity) ? 'amber' : 'slate';
            return <li key={item.key}>
              <span className={`commercial-install-icon ${tone}`}><BellRing size={15} /></span>
              <span className="commercial-install-copy"><strong>{alert.kitId}{alert.quote ? ` · ${quoteCustomer(alert.quote)}` : ''}</strong><b className={tone}><i />{alert.label || alert.type || severityLabels[alert.severity] || 'Alerte'}</b><small>{alert.description || alert.message || 'Consulter le détail de l’alerte.'}</small></span>
              <time>{ageLabel(alert.createdAt)}</time>
              <button type="button" onClick={() => navigate(alertDetailUrl(alert))}>Détails</button>
            </li>;
          })}</ul>}
        </section>
      </div>

      <section className="commercial-shortcuts" aria-label="Accès rapides">
        <Link to="/devis"><ClipboardList size={16} /><span><strong>Nouveau dimensionnement</strong><small>Préparer une offre solaire</small></span><ArrowRight size={15} /></Link>
        <Link to="/parc"><PanelsTopLeft size={16} /><span><strong>Parc d’installations</strong><small>Suivi des kits et équipements</small></span><ArrowRight size={15} /></Link>
        <Link to="/rapports"><Wrench size={16} /><span><strong>Rapports d’activité</strong><small>Suivre vos ventes et résultats</small></span><ArrowRight size={15} /></Link>
      </section>
    </PageEntrance>
  );
}
