import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BellRing, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, FileText, PanelsTopLeft, RefreshCw, Wifi, Wrench,
  Eye, Clock, Zap, AlertOctagon, ShieldCheck, Layers, Search, Folder, User, MapPin
} from 'lucide-react';
import api from '../api/axios';
import PageEntrance from '../components/PageEntrance';
import { useAlertsQuery } from '../hooks/tanstack/useKitQueries';
import { useGetInstallations } from '../hooks/tanstack/useInstallations';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { activeAlerts, asList, detailUrl, severityLabels } from '../lib/operations';
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

  // État du suivi d'installations commercial
  const [installTab, setInstallTab] = useState('all');
  const [installSearch, setInstallSearch] = useState('');

  const installationsQuery = useGetInstallations({
    status: installTab !== 'all' ? installTab : undefined,
    search: installSearch || undefined,
  });
  const commercialInstallations = asList(installationsQuery.data?.installations);
  const installStats = installationsQuery.data?.stats || {};

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

      {/* SECTION SENIOR : SUIVI DES INSTALLATIONS ISSUES DES DEVIS DU COMMERCIAL */}
      <section className="commercial-installations-section" aria-label="Suivi des chantiers et installations">
        <header className="commercial-installations-head">
          <div>
            <p className="ops-eyebrow">MODULE 2 · TRAÇABILITÉ DES PROJETS</p>
            <h2>Suivi des Chantiers & Installations</h2>
            <p>État d'avancement des installations issues de vos devis, assignation des techniciens et mise en service.</p>
          </div>
          <div className="commercial-install-head-actions">
            <div className="commercial-install-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Rechercher dossier, client, kit..."
                value={installSearch}
                onChange={e => setInstallSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Mini KPIs du suivi commercial */}
        <div className="commercial-install-kpis">
          <div className="commercial-mini-kpi">
            <span className="commercial-mini-kpi-icon"><Folder size={16} /></span>
            <div>
              <small>Total Dossiers</small>
              <strong>{installStats.total || commercialInstallations.length}</strong>
            </div>
          </div>
          <div className="commercial-mini-kpi">
            <span className="commercial-mini-kpi-icon"><Clock size={16} /></span>
            <div>
              <small>À planifier</small>
              <strong>{installStats.a_planifier || 0}</strong>
            </div>
          </div>
          <div className="commercial-mini-kpi">
            <span className="commercial-mini-kpi-icon"><CalendarDays size={16} /></span>
            <div>
              <small>Planifiées</small>
              <strong>{installStats.planifiee || 0}</strong>
            </div>
          </div>
          <div className="commercial-mini-kpi">
            <span className="commercial-mini-kpi-icon"><Wrench size={16} /></span>
            <div>
              <small>En cours</small>
              <strong>{installStats.en_cours || 0}</strong>
            </div>
          </div>
          <div className="commercial-mini-kpi">
            <span className="commercial-mini-kpi-icon"><ShieldCheck size={16} /></span>
            <div>
              <small>Mises en service / Validées</small>
              <strong>{(installStats.mise_en_service || 0) + (installStats.validee || 0)}</strong>
            </div>
          </div>
          {Number(installStats.overdue || 0) > 0 && (
            <div className="commercial-mini-kpi is-overdue">
              <span className="commercial-mini-kpi-icon"><AlertTriangle size={16} /></span>
              <div>
                <small>Retards / Échéances</small>
                <strong>{installStats.overdue}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Onglets Filtres de Statut */}
        <div className="commercial-install-tabs">
          {[
            { id: 'all', label: 'Toutes les installations', count: installStats.total || commercialInstallations.length },
            { id: 'a_planifier', label: 'À planifier', count: installStats.a_planifier },
            { id: 'planifiee', label: 'Planifiées', count: installStats.planifiee },
            { id: 'en_cours', label: 'En cours', count: installStats.en_cours },
            { id: 'en_attente', label: 'Bloquées / En attente', count: installStats.en_attente },
            { id: 'installee', label: 'Installées', count: installStats.installee },
            { id: 'mise_en_service', label: 'Mises en service', count: installStats.mise_en_service },
            { id: 'validee', label: 'Validées conformes', count: installStats.validee },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`commercial-install-tab-btn ${installTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setInstallTab(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.count != null && <span className="commercial-tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Tableau des Dossiers */}
        <div className="commercial-install-table-card">
          {installationsQuery.isPending ? (
            <div className="commercial-state">
              <RefreshCw size={18} className="ops-spin" />
              <span>Chargement du suivi de vos installations...</span>
            </div>
          ) : commercialInstallations.length === 0 ? (
            <div className="commercial-state commercial-empty">
              <CheckCircle2 size={24} />
              <strong>Aucun dossier d'installation dans cette catégorie</strong>
              <span>Dès que vos devis sont validés avec une date d'installation, ils s'affichent automatiquement ici.</span>
              <Link to="/devis">Consulter vos devis <ArrowRight size={14} /></Link>
            </div>
          ) : (
            <div className="commercial-table-responsive">
              <table className="commercial-install-table">
                <thead>
                  <tr>
                    <th>Dossier / Devis</th>
                    <th>Client & Site</th>
                    <th>Système Solaire</th>
                    <th>Technicien Assigné</th>
                    <th>Date d'intervention</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {commercialInstallations.map(inst => {
                    const statusMeta = INSTALL_STATUS_CONFIG[inst.status] || { label: inst.status, tone: 'pending' };
                    const powerKwc = ((Number(inst.system?.panels || 0) * Number(inst.system?.panelPower || 0)) / 1000).toFixed(1);
                    return (
                      <tr
                        key={inst._id}
                        className="commercial-install-row"
                        onClick={() => navigate(`/installations/${inst._id}`)}
                      >
                        <td>
                          <div className="commercial-row-folder">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{inst.folderNumber}</span>
                            <small className="text-slate-500 font-mono">Devis {inst.quoteNumber}</small>
                          </div>
                        </td>
                        <td>
                          <div className="commercial-row-client">
                            <strong>{inst.customer?.name || 'Client sans nom'}</strong>
                            <small>
                              {[inst.site?.quartier, inst.site?.ville || 'Kinshasa'].filter(Boolean).join(', ')}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="commercial-row-tech">
                            <strong>{powerKwc} kWc</strong>
                            <small>{inst.system?.batteryCapacity || 0} kWh • {inst.system?.inverterPower || 0} kVA</small>
                          </div>
                        </td>
                        <td>
                          {inst.assignedTechnician ? (
                            <div className="commercial-row-assigned">
                              <User size={13} className="text-slate-400" />
                              <span>{inst.assignedTechnician.prenom} {inst.assignedTechnician.nom}</span>
                            </div>
                          ) : (
                            <span className="commercial-unassigned-tag">Non assigné</span>
                          )}
                        </td>
                        <td>
                          <div className="commercial-row-date">
                            <CalendarDays size={13} />
                            <span>{formatInstallDate(inst.plannedDate)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="commercial-row-status">
                            <span className={`commercial-status-badge ${statusMeta.tone}`}>
                              <span className="commercial-badge-dot" />
                              {statusMeta.label}
                            </span>
                            {inst.isOverdue && (
                              <span className="commercial-overdue-tag">
                                <AlertTriangle size={11} /> Retard
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="commercial-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/installations/${inst._id}`);
                            }}
                          >
                            <Eye size={13} /> Fiche détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="commercial-shortcuts" aria-label="Accès rapides">
        <Link to="/devis"><ClipboardList size={16} /><span><strong>Nouveau dimensionnement</strong><small>Préparer une offre solaire</small></span><ArrowRight size={15} /></Link>
        <Link to="/parc"><PanelsTopLeft size={16} /><span><strong>Parc d’installations</strong><small>Suivi des kits et équipements</small></span><ArrowRight size={15} /></Link>
        <Link to="/rapports"><Wrench size={16} /><span><strong>Rapports d’activité</strong><small>Suivre vos ventes et résultats</small></span><ArrowRight size={15} /></Link>
      </section>
    </PageEntrance>
  );
}
