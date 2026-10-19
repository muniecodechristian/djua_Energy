import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, ArrowDownToLine, CalendarDays, CheckCircle2, ChevronDown,
  ChevronRight, CircleAlert, FileText, Gauge, MapPin, RefreshCw,
  Search, Users, Wrench, X,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import api from '../api/axios';
import PageEntrance from '../components/PageEntrance';
import { ListSkeleton } from '../components/PageSkeleton';
import { useGetInterventions } from '../hooks/tanstack/useInterventions';
import { useAlertsQuery, useKitsQuery, useTelemetryQuery } from '../hooks/tanstack/useKitQueries';
import { activeAlerts, asList, formatDate } from '../lib/operations';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import './AdminReports.css';

const tabs = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'sales', label: 'Dimensionnement & ventes' },
  { id: 'fleet', label: 'Performance du parc' },
  { id: 'reports', label: 'Rapports personnalisés' },
];
const statusLabels = { draft: 'En attente', approved: 'Validé', installing: 'En installation', installed: 'Installé' };
const statusColors = { draft: '#f5a623', approved: '#2e8b57', installing: '#4187f5', installed: '#7047eb' };
const numberFormat = new Intl.NumberFormat('fr-FR');
const palette = ['#2eaa70', '#f6a623', '#e84d4d', '#aeb8c7', '#4187f5'];

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initialRange(period) {
  const today = new Date();
  const end = localDate(today);
  if (period === 'month') return { from: localDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: end };
  const days = Number(period) || 30;
  const start = new Date(today);
  start.setDate(start.getDate() - days + 1);
  return { from: localDate(start), to: end };
}

function dateOf(item, ...fields) {
  for (const field of fields) {
    const value = field.split('.').reduce((current, part) => current?.[part], item);
    if (value && Number.isFinite(new Date(value).getTime())) return new Date(value);
  }
  return null;
}

function getProvince(item) {
  return item?.customer?.details?.province || item?.site?.province || item?.province || item?.region || '';
}

function dateInside(item, range, ...fields) {
  const date = dateOf(item, ...fields);
  if (!date) return false;
  const day = localDate(date);
  return day >= range.from && day <= range.to;
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadCsv(name, columns, rows) {
  const content = `\uFEFF${[columns, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name}-${localDate(new Date())}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getEnergyValue(record, section, field) {
  const direct = record?.[section]?.[field];
  if (direct !== null && direct !== undefined && direct !== '' && Number.isFinite(Number(direct))) return Number(direct);
  const metricValue = record?.metrics?.[section]?.[field];
  if (metricValue !== null && metricValue !== undefined && metricValue !== '' && Number.isFinite(Number(metricValue))) return Number(metricValue);
  return null;
}

function createTrend(quotes, telemetry, range) {
  const start = new Date(`${range.from}T00:00:00`);
  const end = new Date(`${range.to}T00:00:00`);
  const totalDays = Math.max(1, Math.floor((end - start) / 86400000) + 1);
  const step = Math.max(1, Math.ceil(totalDays / 90));
  const buckets = Array.from({ length: Math.ceil(totalDays / step) }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index * step);
    return {
      key: localDate(date),
      day: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      created: 0,
      validated: 0,
      installed: 0,
      produced: 0,
      consumed: 0,
    };
  });
  const bucketFor = value => {
    if (!value) return null;
    const index = Math.floor(((new Date(`${localDate(value)}T00:00:00`) - start) / 86400000) / step);
    return Number.isInteger(index) && index >= 0 && index < buckets.length ? buckets[index] : null;
  };
  quotes.forEach(quote => {
    const bucket = bucketFor(dateOf(quote, 'createdAt'));
    if (!bucket) return;
    bucket.created += 1;
    if (quote.status === 'approved' || quote.status === 'installing' || quote.status === 'installed') bucket.validated += 1;
    if (quote.status === 'installed') bucket.installed += 1;
  });
  telemetry.forEach(record => {
    const bucket = bucketFor(dateOf(record, 'createdAt', 'timestamp', 'meta.event_time'));
    if (!bucket) return;
    const produced = getEnergyValue(record, 'solar', 'energy_interval_wh');
    const consumed = getEnergyValue(record, 'dc_load', 'energy_interval_wh');
    if (produced !== null) bucket.produced += produced;
    if (consumed !== null) bucket.consumed += consumed;
  });
  return buckets;
}

function EmptyChart({ children = 'Aucune donnée disponible pour cette période.' }) {
  return <div className="reports-empty-chart"><Activity size={19} /><span>{children}</span></div>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="reports-tooltip"><strong>{label}</strong>{payload.map(item => <span key={item.dataKey}><i style={{ background: item.color }} />{item.name}<b>{numberFormat.format(item.value || 0)}</b></span>)}</div>;
}

function ChartCard({ title, description, children, className = '' }) {
  return <section className={`reports-card reports-chart-card ${className}`}><header className="reports-card-title"><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>;
}

function KpiCard({ label, value, note, icon: Icon, tone = 'orange' }) {
  return <article className={`reports-kpi ${tone}`}><span className="reports-kpi-icon"><Icon size={18} /></span><div className="reports-kpi-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

export default function AdminReports() {
  const user = useAuthStore(state => state.user);
  const isCommercial = user?.role === 'commercial';
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('30');
  const [today] = useState(() => localDate(new Date()));
  const [customRange, setCustomRange] = useState(() => initialRange('30'));
  const [province, setProvince] = useState('all');
  const [exportOpen, setExportOpen] = useState(false);
  const [search, setSearch] = useState('');

  const quotesQuery = useQuery({
    queryKey: ['sales-quotes', user?._id, 'reports'],
    queryFn: async () => {
      const firstPage = (await api.get('/api/quotes', { params: { page: 1 } })).data?.data;
      if (!firstPage || !Array.isArray(firstPage.quotes)) throw new Error('Format de réponse des devis inattendu.');
      const pages = [firstPage.quotes];
      const pageCount = Math.ceil((firstPage.total || firstPage.quotes.length) / (firstPage.pageSize || 30));
      for (let first = 2; first <= pageCount; first += 4) {
        const batch = await Promise.all(
          Array.from({ length: Math.min(4, pageCount - first + 1) }, (_, offset) =>
            api.get('/api/quotes', { params: { page: first + offset } }),
          ),
        );
        batch.forEach(response => {
          const quotes = response.data?.data?.quotes;
          if (Array.isArray(quotes)) pages.push(quotes);
        });
      }
      return pages.flat();
    },
    staleTime: 60_000,
  });
  const kitsQuery = useKitsQuery({ enabled: !isCommercial });
  const alertsQuery = useAlertsQuery({ enabled: !isCommercial });
  const telemetryQuery = useTelemetryQuery({ enabled: !isCommercial });
  const interventionsQuery = useGetInterventions(null, { enabled: !isCommercial });

  const allQuotes = asList(quotesQuery.data);
  const kits = useMemo(() => isCommercial ? [] : asList(kitsQuery.data), [isCommercial, kitsQuery.data]);
  const alerts = useMemo(() => isCommercial ? [] : activeAlerts(alertsQuery.data), [isCommercial, alertsQuery.data]);
  const telemetry = useMemo(() => isCommercial ? [] : asList(telemetryQuery.data), [isCommercial, telemetryQuery.data]);
  const interventions = useMemo(() => isCommercial ? [] : asList(interventionsQuery.data), [isCommercial, interventionsQuery.data]);
  const range = period === 'custom' ? customRange : initialRange(period);
  const provinces = useMemo(() => [...new Set([
    ...allQuotes.map(getProvince),
    ...kits.map(getProvince),
  ].map(value => String(value || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')), [allQuotes, kits]);

  const quotes = useMemo(() => allQuotes.filter(quote =>
    dateInside(quote, range, 'createdAt')
    && (province === 'all' || getProvince(quote) === province),
  ), [allQuotes, range, province]);
  const filteredKits = useMemo(() => kits.filter(kit => province === 'all' || getProvince(kit) === province), [kits, province]);
  const kitProvince = useMemo(() => new Map(kits.map(kit => [kit.kitId, getProvince(kit)])), [kits]);
  const filteredAlerts = useMemo(() => alerts.filter(alert =>
    dateInside(alert, range, 'createdAt')
    && (province === 'all' || kitProvince.get(alert.kitId) === province),
  ), [alerts, range, province, kitProvince]);
  const filteredTelemetry = useMemo(() => telemetry.filter(record =>
    dateInside(record, range, 'createdAt', 'timestamp')
    && (province === 'all' || kitProvince.get(record.kitId) === province),
  ), [telemetry, range, province, kitProvince]);
  const filteredInterventions = useMemo(() => interventions
    .filter(item => typeof item.report === 'string' && item.report.trim())
    .filter(item => dateInside(item, range, 'updatedAt', 'completedAt', 'scheduledDate'))
    .filter(item => province === 'all' || kitProvince.get(item.kitId) === province)
    .filter(item => [item.title, item.kitId, item.report, item.assignedTo?.prenom, item.assignedTo?.nom]
      .filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt || b.scheduledDate || 0) - new Date(a.updatedAt || a.scheduledDate || 0)),
  [interventions, range, province, kitProvince, search]);
  const trend = useMemo(() => createTrend(quotes, filteredTelemetry, range), [quotes, filteredTelemetry, range]);

  const validatedCount = quotes.filter(quote => ['approved', 'installing', 'installed'].includes(quote.status)).length;
  const allKpis = [
    { label: 'Devis créés', value: quotesQuery.isSuccess ? numberFormat.format(quotes.length) : '—', note: 'Sur la période sélectionnée', icon: FileText, tone: 'orange' },
    { label: 'Devis validés', value: quotesQuery.isSuccess ? numberFormat.format(validatedCount) : '—', note: 'Validés ou en cours d’installation', icon: CheckCircle2, tone: 'green' },
    { label: 'Installations suivies', value: kitsQuery.isSuccess ? numberFormat.format(filteredKits.length) : '—', note: province === 'all' ? 'Parc enregistré' : province, icon: Users, tone: 'purple' },
    { label: 'Alertes ouvertes', value: alertsQuery.isSuccess ? numberFormat.format(filteredAlerts.length) : '—', note: 'Actives ou prises en charge', icon: AlertTriangle, tone: 'red' },
  ];
  const kpis = isCommercial ? allKpis.slice(0, 2) : allKpis;

  const quoteStatus = useMemo(() => Object.entries(statusLabels).map(([status, label]) => ({
    name: label,
    value: quotes.filter(quote => quote.status === status).length,
    color: statusColors[status],
  })).filter(item => item.value), [quotes]);
  const anomalies = useMemo(() => {
    const counts = new Map();
    filteredAlerts.forEach(alert => {
      const name = alert.label || alert.type || 'Autre alerte';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredAlerts]);
  const products = useMemo(() => {
    const counts = new Map();
    quotes.forEach(quote => (quote.appliances || []).forEach(appliance => {
      const name = appliance.name || 'Équipement';
      const product = counts.get(name) || { name, category: appliance.category || appliance.type || 'Équipement', count: 0 };
      product.count += Number(appliance.quantity) || 1;
      counts.set(name, product);
    }));
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [quotes]);

  const refresh = () => {
    quotesQuery.refetch();
    if (!isCommercial) {
      kitsQuery.refetch();
      alertsQuery.refetch();
      telemetryQuery.refetch();
      interventionsQuery.refetch();
    }
  };
  const refreshing = isCommercial ? quotesQuery.isFetching : [quotesQuery, kitsQuery, alertsQuery, telemetryQuery, interventionsQuery].some(query => query.isFetching);
  const errors = [
    quotesQuery.isError && 'devis',
    !isCommercial && kitsQuery.isError && 'installations',
    !isCommercial && alertsQuery.isError && 'alertes',
    !isCommercial && telemetryQuery.isError && 'télémétrie',
    !isCommercial && interventionsQuery.isError && 'comptes-rendus',
  ].filter(Boolean);
  const visibleTabs = isCommercial ? tabs.filter(item => ['overview', 'sales'].includes(item.id)) : tabs;

  const exportQuotes = () => downloadCsv('devis', ['Numéro', 'Client', 'Province', 'Statut', 'Date', 'Montant', 'Devise'], quotes.map(quote => [
    quote.number, quote.customer?.name, getProvince(quote), statusLabels[quote.status] || quote.status,
    quote.createdAt, quote.amount, quote.currency,
  ]));
  const exportFleet = () => downloadCsv('parc-solaire', ['Kit', 'Province', 'Offre', 'Statut du contrat'], filteredKits.map(kit => [
    kit.kitId, getProvince(kit), kit.offerName, kit.status,
  ]));
  const exportInterventions = () => downloadCsv('rapports-interventions', ['Intervention', 'Kit', 'Technicien', 'Date du rapport', 'Rapport'], filteredInterventions.map(report => [
    report.title || 'Intervention', report.kitId || '',
    [report.assignedTo?.prenom, report.assignedTo?.nom].filter(Boolean).join(' '),
    report.updatedAt || report.scheduledDate || '', report.report || '',
  ]));

  return (
    <PageEntrance className="ops-page reports-page">
      <header className="reports-heading">
        <div>
          <p className="ops-eyebrow">PILOTAGE DE L’ACTIVITÉ</p>
          <h1>Rapports</h1>
          <p>Suivez vos ventes, vos installations et les événements du parc solaire.</p>
        </div>
        <div className="reports-controls">
          <div className="reports-period-control">
            <CalendarDays size={15} />
            <select aria-label="Période des rapports" value={period} onChange={event => setPeriod(event.target.value)}>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="month">Mois en cours</option>
              <option value="custom">Personnaliser</option>
            </select>
            {period === 'custom' && <div className="reports-date-inputs">
              <input aria-label="Date de début" type="date" value={customRange.from} max={customRange.to} onChange={event => setCustomRange(current => ({ ...current, from: event.target.value }))} />
              <span>au</span>
              <input aria-label="Date de fin" type="date" value={customRange.to} min={customRange.from} max={today} onChange={event => setCustomRange(current => ({ ...current, to: event.target.value }))} />
              <button aria-label="Fermer les dates personnalisées" onClick={() => setPeriod('30')}><X size={14} /></button>
            </div>}
          </div>
          <label className="reports-province-control"><MapPin size={15} /><select aria-label="Filtrer par province" value={province} onChange={event => setProvince(event.target.value)}><option value="all">Toutes les provinces</option>{provinces.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="reports-export-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setExportOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') setExportOpen(false); }}>
            <button className="reports-export-button" aria-expanded={exportOpen} onClick={() => setExportOpen(open => !open)}><ArrowDownToLine size={15} />Exporter<ChevronDown size={14} /></button>
            {exportOpen && <div className="reports-export-menu" role="menu">
              <button role="menuitem" onClick={() => { exportQuotes(); setExportOpen(false); }}>Devis de la période</button>
              {!isCommercial && <button role="menuitem" onClick={() => { exportFleet(); setExportOpen(false); }}>Installations filtrées</button>}
              {!isCommercial && <button role="menuitem" onClick={() => { exportInterventions(); setExportOpen(false); }}>Comptes-rendus filtrés</button>}
            </div>}
          </div>
          <button className="reports-refresh-button" aria-label="Actualiser les rapports" title="Actualiser les données" disabled={refreshing} onClick={refresh}><RefreshCw size={15} className={refreshing ? 'ops-spin' : ''} /></button>
        </div>
      </header>

      {errors.length > 0 && <div className="ops-notice reports-notice" role="alert">
        Certaines données sont indisponibles : {errors.join(', ')}.
        <button onClick={refresh}><RefreshCw size={14} />Réessayer</button>
      </div>}

      <nav className="reports-tabs" aria-label="Sections des rapports" role="tablist">
        {visibleTabs.map(item => <button key={item.id} id={`reports-tab-${item.id}`} role="tab" aria-controls={`reports-panel-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </nav>

      {tab === 'overview' && <div id="reports-panel-overview" role="tabpanel" aria-labelledby="reports-tab-overview" tabIndex={0}>
        <section className={`reports-kpis${isCommercial ? ' commercial-only' : ''}`} aria-label="Indicateurs clés">
          {kpis.map(item => <KpiCard key={item.label} {...item} />)}
        </section>
        <div className={`reports-main-grid${isCommercial ? ' commercial-only' : ''}`}>
          <ChartCard title="Activité commerciale" description="Devis créés, validés et installés sur la période.">
            {quotesQuery.isPending ? <EmptyChart>Chargement des devis…</EmptyChart> : quotes.length === 0 ? <EmptyChart /> : <div className="reports-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}><CartesianGrid stroke="#edf0f4" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip content={<ChartTooltip />} /><Legend verticalAlign="bottom" height={32} iconType="circle" /><Line name="Devis créés" dataKey="created" stroke="#ff6a00" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /><Line name="Devis validés" dataKey="validated" stroke="#3984f7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /><Line name="Installés" dataKey="installed" stroke="#2eaa70" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>}
          </ChartCard>
          {!isCommercial && <ChartCard title="Production solaire et charge DC" description="Énergie mesurée par les dernières télémétries disponibles (Wh).">
            {telemetryQuery.isPending ? <EmptyChart>Chargement de la télémétrie…</EmptyChart> : filteredTelemetry.length === 0 || !trend.some(row => row.produced || row.consumed) ? <EmptyChart>Aucune mesure d’énergie exploitable pour cette période.</EmptyChart> : <div className="reports-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -12 }}><CartesianGrid stroke="#edf0f4" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} /><YAxis tickLine={false} axisLine={false} /><Tooltip content={<ChartTooltip />} /><Legend verticalAlign="bottom" height={32} iconType="circle" /><Area name="Production solaire (Wh)" dataKey="produced" type="monotone" stroke="#ff6a00" fill="#ff6a00" fillOpacity={0.12} strokeWidth={2} /><Area name="Charge DC (Wh)" dataKey="consumed" type="monotone" stroke="#3984f7" fill="#3984f7" fillOpacity={0.10} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>}
          </ChartCard>}
        </div>
        <div className={`reports-bottom-grid${isCommercial ? ' commercial-only' : ''}`}>
          <section className="reports-card reports-status-card">
            <header className="reports-card-title"><div><h2>Statut des devis</h2><p>Répartition des devis créés dans la période.</p></div></header>
            {quotesQuery.isPending ? <EmptyChart>Chargement des devis…</EmptyChart> : quoteStatus.length === 0 ? <EmptyChart /> : <div className="reports-status-content"><div className="reports-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={quoteStatus} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="92%" paddingAngle={2} stroke="none">{quoteStatus.map((item, index) => <Cell key={item.name} fill={item.color || palette[index % palette.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer><span><strong>{numberFormat.format(quotes.length)}</strong><small>devis</small></span></div><ul className="reports-legend-list">{quoteStatus.map((item, index) => <li key={item.name}><i style={{ background: item.color || palette[index % palette.length] }} /><span>{item.name}</span><strong>{numberFormat.format(item.value)}</strong><small>{quotes.length ? `${Math.round(item.value / quotes.length * 100)} %` : '0 %'}</small></li>)}</ul></div>}
          </section>
          {!isCommercial && <section className="reports-card reports-list-card">
            <header className="reports-card-title"><div><h2>Alertes les plus fréquentes</h2><p>Alertes ouvertes correspondant aux filtres.</p></div><button className="reports-inline-action" onClick={() => setTab('fleet')}>Voir le parc <ChevronRight size={14} /></button></header>
            {alertsQuery.isPending ? <EmptyChart>Chargement des alertes…</EmptyChart> : anomalies.length === 0 ? <EmptyChart>Aucune alerte ouverte sur cette période.</EmptyChart> : <ul className="reports-data-list">{anomalies.map((item, index) => <li key={item.name}><span className="reports-rank">{index + 1}</span><span>{item.name}</span><strong>{numberFormat.format(item.count)}</strong></li>)}</ul>}
          </section>}
          <section className="reports-card reports-list-card">
            <header className="reports-card-title"><div><h2>Équipements les plus dimensionnés</h2><p>Quantités issues des devis de la période.</p></div><button className="reports-inline-action" onClick={() => setTab('sales')}>Voir les ventes <ChevronRight size={14} /></button></header>
            {quotesQuery.isPending ? <EmptyChart>Chargement des devis…</EmptyChart> : products.length === 0 ? <EmptyChart>Aucun équipement dans les devis de cette période.</EmptyChart> : <div className="reports-mini-table"><div><span>Équipement</span><span>Catégorie</span><span>Qté</span></div>{products.map(item => <div key={item.name}><strong title={item.name}>{item.name}</strong><span>{item.category}</span><b>{numberFormat.format(item.count)}</b></div>)}</div>}
          </section>
        </div>
      </div>}

      {tab === 'sales' && <section id="reports-panel-sales" role="tabpanel" aria-labelledby="reports-tab-sales" tabIndex={0} className="reports-card reports-detail-card">
        <header className="reports-card-title"><div><h2>Dimensionnement & ventes</h2><p>{quotesQuery.isSuccess ? `${numberFormat.format(quotes.length)} devis dans la période sélectionnée.` : 'Données commerciales issues des devis enregistrés.'}</p></div><label className="reports-search"><Search size={15} /><input aria-label="Rechercher un devis" placeholder="Client, numéro, province…" value={search} onChange={event => setSearch(event.target.value)} /></label></header>
        {quotesQuery.isPending ? <ListSkeleton /> : quotesQuery.isError ? null : quotes.length === 0 ? <EmptyChart>Aucun devis ne correspond à cette période et à cette province.</EmptyChart> : <div className="ops-table-scroll"><table className="ops-table reports-table"><thead><tr><th>Devis</th><th>Client</th><th>Province</th><th>Dimensionnement</th><th>Statut</th><th>Date</th><th>Montant</th></tr></thead><tbody>{quotes.filter(quote => [quote.number, quote.customer?.name, getProvince(quote)].join(' ').toLowerCase().includes(search.trim().toLowerCase())).map(quote => <tr key={quote._id || quote.number}><td><strong>{quote.number || 'Devis'}</strong></td><td>{quote.customer?.name || 'Client non renseigné'}</td><td>{getProvince(quote) || '—'}</td><td>{numberFormat.format(quote.system?.panels || 0)} panneaux<small>{numberFormat.format(quote.system?.panelPower || 0)} W / panneau</small></td><td><span className={`reports-status-pill status-${quote.status || 'draft'}`}><i />{statusLabels[quote.status] || quote.status || 'Inconnu'}</span></td><td>{formatDate(quote.createdAt)}</td><td>{Number(quote.amount || 0).toLocaleString('fr-FR')} {quote.currency || ''}</td></tr>)}</tbody></table></div>}
      </section>}

      {tab === 'fleet' && <div id="reports-panel-fleet" role="tabpanel" aria-labelledby="reports-tab-fleet" tabIndex={0} className="reports-fleet-grid">
        <section className="reports-card reports-fleet-status">
          <header className="reports-card-title"><div><h2>État du parc suivi</h2><p>Répartition des installations selon leur statut contractuel.</p></div></header>
          {kitsQuery.isPending ? <EmptyChart>Chargement du parc…</EmptyChart> : filteredKits.length === 0 ? <EmptyChart>Aucune installation pour les filtres sélectionnés.</EmptyChart> : <div className="reports-status-content"><div className="reports-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={Object.entries({ active: 'Actif', suspended: 'Suspendu', terminated: 'Résilié' }).map(([status, name]) => ({ name, value: filteredKits.filter(kit => kit.status === status).length, color: status === 'active' ? '#2eaa70' : status === 'suspended' ? '#f6a623' : '#aeb8c7' })).filter(item => item.value)} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="92%" paddingAngle={2} stroke="none">{Object.entries({ active: 'Actif', suspended: 'Suspendu', terminated: 'Résilié' }).map(([status], index) => <Cell key={status} fill={['#2eaa70', '#f6a623', '#aeb8c7'][index]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer><span><strong>{numberFormat.format(filteredKits.length)}</strong><small>installations</small></span></div><ul className="reports-legend-list">{Object.entries({ active: 'Actif', suspended: 'Suspendu', terminated: 'Résilié' }).map(([status, label], index) => { const count = filteredKits.filter(kit => kit.status === status).length; return <li key={status}><i style={{ background: ['#2eaa70', '#f6a623', '#aeb8c7'][index] }} /><span>{label}</span><strong>{numberFormat.format(count)}</strong><small>{filteredKits.length ? `${Math.round(count / filteredKits.length * 100)} %` : '0 %'}</small></li>; })}</ul></div>}
        </section>
        <ChartCard title="Énergie mesurée" description="Production solaire et énergie de charge DC cumulées (Wh).">
          {telemetryQuery.isPending ? <EmptyChart>Chargement de la télémétrie…</EmptyChart> : !trend.some(row => row.produced || row.consumed) ? <EmptyChart>Aucune mesure énergétique exploitable pour cette période.</EmptyChart> : <div className="reports-chart reports-chart-tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 12, right: 12, bottom: 4, left: -8 }}><CartesianGrid stroke="#edf0f4" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} /><YAxis tickLine={false} axisLine={false} /><Tooltip content={<ChartTooltip />} /><Legend verticalAlign="bottom" height={32} iconType="circle" /><Area name="Production solaire (Wh)" dataKey="produced" type="monotone" stroke="#ff6a00" fill="#ff6a00" fillOpacity={0.12} strokeWidth={2} /><Area name="Charge DC (Wh)" dataKey="consumed" type="monotone" stroke="#3984f7" fill="#3984f7" fillOpacity={0.10} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>}
        </ChartCard>
        <section className="reports-card reports-list-card reports-anomalies-card">
          <header className="reports-card-title"><div><h2>Incidents du parc</h2><p>Alertes ouvertes classées par fréquence.</p></div><span className="reports-count-badge"><CircleAlert size={13} />{numberFormat.format(filteredAlerts.length)}</span></header>
          {alertsQuery.isPending ? <EmptyChart>Chargement des alertes…</EmptyChart> : anomalies.length === 0 ? <EmptyChart>Aucun incident ouvert.</EmptyChart> : <ul className="reports-data-list">{anomalies.map((item, index) => <li key={item.name}><span className="reports-rank">{index + 1}</span><span>{item.name}</span><strong>{numberFormat.format(item.count)}</strong></li>)}</ul>}
        </section>
        <section className="reports-card reports-fleet-summary">
          <header className="reports-card-title"><div><h2>Synthèse opérationnelle</h2><p>Événements IoT actuellement disponibles.</p></div></header>
          <div className="reports-summary-metrics"><div><Gauge size={17} /><span>Mesures de télémétrie</span><strong>{telemetryQuery.isSuccess ? numberFormat.format(filteredTelemetry.length) : '—'}</strong></div><div><Wrench size={17} /><span>Interventions terminées</span><strong>{interventionsQuery.isSuccess ? numberFormat.format(interventions.filter(item => item.status === 'Terminée' && dateInside(item, range, 'completedAt', 'updatedAt')).length) : '—'}</strong></div><div><MapPin size={17} /><span>Installations avec province</span><strong>{kitsQuery.isSuccess ? numberFormat.format(filteredKits.filter(getProvince).length) : '—'}</strong></div></div>
          <p className="reports-data-footnote">La télémétrie affichée correspond aux 100 événements les plus récents fournis par le serveur. Les données absentes ne sont pas estimées.</p>
        </section>
      </div>}

      {tab === 'reports' && <section id="reports-panel-reports" role="tabpanel" aria-labelledby="reports-tab-reports" tabIndex={0} className="reports-card reports-detail-card">
        <header className="reports-card-title"><div><h2>Comptes-rendus d’intervention</h2><p>Notes transmises par les techniciens. {interventionsQuery.isSuccess ? `${numberFormat.format(filteredInterventions.length)} rapport(s) sur la période.` : ''}</p></div><div className="reports-report-actions"><label className="reports-search"><Search size={15} /><input aria-label="Rechercher dans les rapports" placeholder="Kit, technicien, contenu…" value={search} onChange={event => setSearch(event.target.value)} /></label><button className="reports-outline-button" disabled={filteredInterventions.length === 0} onClick={exportInterventions}><ArrowDownToLine size={14} />Exporter</button></div></header>
        {interventionsQuery.isPending ? <ListSkeleton /> : interventionsQuery.isError ? null : filteredInterventions.length === 0 ? <div className="reports-empty-chart"><FileText size={20} /><span>{interventions.some(item => item.report?.trim()) ? 'Aucun compte-rendu ne correspond aux filtres.' : 'Les rapports apparaîtront ici lorsqu’un technicien aura clôturé une intervention avec un compte-rendu.'}</span></div> : <div className="ops-table-scroll"><table className="ops-table reports-table"><thead><tr><th>Intervention</th><th>Kit</th><th>Technicien</th><th>Date du rapport</th><th>Compte-rendu</th></tr></thead><tbody>{filteredInterventions.map((report, index) => <tr key={report._id || report.id || `${report.kitId}-${index}`}><td><strong>{report.title || 'Intervention'}</strong><small>{report.type || 'Maintenance'}</small></td><td>{report.kitId || 'Non renseigné'}</td><td>{[report.assignedTo?.prenom, report.assignedTo?.nom].filter(Boolean).join(' ') || 'Non assigné'}</td><td>{formatDate(report.updatedAt || report.scheduledDate)}</td><td className="reports-report-cell">{report.report}</td></tr>)}</tbody></table></div>}
      </section>}
    </PageEntrance>
  );
}
