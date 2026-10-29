import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowDownToLine, ArrowUpRight, CircleAlert, Layers3, MapPin, Pause, Play, RefreshCw, Search, ShieldAlert, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import PageEntrance from '../components/PageEntrance';
import { useKitsQuery, useAlertsQuery, useUpdateKitStatus } from '../hooks/tanstack/useKitQueries';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { activeAlerts, asList, coordinates, detailUrl, prioritize, severityLabels } from '../lib/operations';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '../components/PageSkeleton';
import './OrangeKitsRegistry.css';

const contractLabels = { active: 'Actif', suspended: 'Suspendu', terminated: 'Résilié' };
const severityTone = { critical: 'critical', high: 'warning', medium: 'warning', low: 'neutral', info: 'neutral' };

function FitVisibleKits({ kits }) {
  const map = useMap();
  const points = useMemo(() => kits.map(coordinates).filter(Boolean), [kits]);
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 11 });
  }, [map, points]);
  return null;
}

function ParkMap({ kits, onOpenKit }) {
  const locatedKits = useMemo(() => kits.filter(kit => coordinates(kit)), [kits]);
  return (
    <div className="park-map">
      <MapContainer center={[-2.5, 23.5]} zoom={5} scrollWheelZoom={false} aria-label="Carte des installations solaires">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitVisibleKits kits={locatedKits} />
        {locatedKits.map(kit => {
          const point = coordinates(kit);
          const tone = kit.status === 'active' ? '#20a464' : kit.status === 'suspended' ? '#ed8b1a' : '#8c97a5';
          return <CircleMarker key={kit._id || kit.kitId} center={point} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: tone, fillOpacity: 1 }} eventHandlers={{ click: () => onOpenKit(kit) }}><Tooltip>{kit.kitId} · {contractLabels[kit.status] || 'Statut inconnu'}</Tooltip></CircleMarker>;
        })}
      </MapContainer>
      <div className="park-map-legend"><span><i className="is-active"/>Contrat actif <strong>{kits.filter(kit => kit.status === 'active').length}</strong></span><span><i className="is-suspended"/>Suspendu <strong>{kits.filter(kit => kit.status === 'suspended').length}</strong></span><span><i className="is-unlocated"/>Sans GPS <strong>{kits.length - locatedKits.length}</strong></span></div>
      {locatedKits.length === 0 && <div className="park-map-empty"><MapPin size={17}/><span>Aucune installation n’a de coordonnées GPS valides à afficher.</span></div>}
    </div>
  );
}

function exportKits(kits) {
  const columns = ['Identifiant', 'Client', 'Offre', 'Région', 'Statut du contrat', 'Date d’installation', 'Latitude', 'Longitude'];
  const rows = kits.map(kit => [
    kit.kitId, kit.clientName || `Boîtier ${kit.kitId}`, kit.offerName, kit.province || kit.region,
    contractLabels[kit.status] || kit.status, kit.installationDate,
    kit.gpsCoordinates?.latitude, kit.gpsCoordinates?.longitude,
  ]);
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const blob = new Blob([`\uFEFF${[columns, ...rows].map(row => row.map(escape).join(';')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `parc-solaire-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function OrangeKitsRegistry() {
  const query = useKitsQuery();
  const alertsQuery = useAlertsQuery();
  const user = useAuthStore(state => state.user);
  const isAdmin = ['admin', 'administration'].includes(user?.role);
  const updateKitStatus = useUpdateKitStatus();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const all = asList(query.data);
  const alerts = prioritize(activeAlerts(alertsQuery.data));
  const visible = useMemo(() => all.filter(kit => (
    (status === 'all' || kit.status === status)
    && [kit.kitId, kit.offerName, kit.region, kit.province, kit.clientName].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )), [all, status, search]);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
  const changeKitStatus = kit => {
    const nextStatus = kit.status === 'suspended' ? 'active' : 'suspended';
    if (nextStatus === 'suspended' && !window.confirm(`Suspendre le kit ${kit.kitId} ?`)) return;
    updateKitStatus.mutate({ kitId: kit.kitId, status: nextStatus }, {
      onSuccess: () => toast.success(nextStatus === 'suspended' ? 'Kit suspendu.' : 'Kit réactivé.'),
      onError: error => toast.error(error.response?.data?.message || 'Impossible de modifier le statut du kit.'),
    });
  };
  const stats = [
    { label: 'Installations', value: query.isSuccess ? all.length : '—', icon: Layers3, tone: 'neutral' },
    { label: 'Contrats actifs', value: query.isSuccess ? all.filter(kit => kit.status === 'active').length : '—', icon: Wifi, tone: 'good' },
    { label: 'Alertes ouvertes', value: alertsQuery.isSuccess ? alerts.length : '—', icon: CircleAlert, tone: 'warning' },
    { label: 'Alertes critiques', value: alertsQuery.isSuccess ? criticalAlerts : '—', icon: ShieldAlert, tone: 'critical' },
  ];

  return (
    <PageEntrance className="ops-page park-page">
      <header className="ops-page-heading park-heading">
        <div><p className="ops-eyebrow">SUPERVISION DES INSTALLATIONS</p><h1>Parc solaire</h1><p>Vue d’ensemble des installations, des contrats et des alertes du parc connecté.</p></div>
        <div className="park-heading-actions">
          <button className="ops-button" disabled={query.isFetching || alertsQuery.isFetching} onClick={() => { query.refetch(); alertsQuery.refetch(); }}><RefreshCw size={14} className={query.isFetching || alertsQuery.isFetching ? 'ops-spin' : ''}/>Actualiser</button>
          <button className="ops-button" disabled={query.isPending || all.length === 0} onClick={() => exportKits(all)}><ArrowDownToLine size={14}/>Exporter</button>
        </div>
      </header>

      {(query.isError || alertsQuery.isError) && <div className="ops-notice" role="alert">{query.isError ? 'Impossible de charger les installations.' : 'Les alertes sont indisponibles.'}<button onClick={() => { query.refetch(); alertsQuery.refetch(); }}>Réessayer</button></div>}

      <section className="park-kpis" aria-label="Synthèse du parc">
        {stats.map(({ label, value, icon: Icon, tone }) => <article className={`park-kpi ${tone}`} key={label}><span><Icon size={17}/>{label}</span><strong>{value}</strong></article>)}
      </section>

      <div className="park-overview-grid">
        <section className="ops-card park-map-card">
          <header className="park-panel-heading"><div><h2>Carte du parc</h2><small>Installations pour lesquelles une position GPS est disponible</small></div><span><MapPin size={13}/>RDC</span></header>
          {query.isPending ? <div className="park-map-loading">Chargement des installations…</div> : <ParkMap kits={visible} onOpenKit={kit => navigate(detailUrl(kit.kitId))}/>}
        </section>
        <section className="ops-card park-alert-card">
          <header className="park-panel-heading"><div><h2>Alertes récentes</h2><small>{alerts.length} alerte(s) ouverte(s)</small></div><button onClick={() => navigate('/notification')}>Voir tout <ArrowUpRight size={13}/></button></header>
          {alertsQuery.isPending ? <div className="park-alert-empty">Chargement des alertes…</div> : alerts.slice(0, 5).length === 0 ? <div className="park-alert-empty"><CircleAlert size={19}/><strong>Aucune alerte ouverte</strong><span>Les nouvelles alertes du parc apparaîtront ici.</span></div> : <ul className="park-alert-list">{alerts.slice(0, 5).map((alert, index) => <li key={alert._id || alert.id || `${alert.kitId}-${index}`}><span className={`park-alert-icon ${severityTone[alert.severity] || 'neutral'}`}><CircleAlert size={15}/></span><button onClick={() => navigate(alert.kitId ? detailUrl(alert.kitId) : '/notification')}><span><strong>{alert.kitId || alert.label || 'Alerte'}</strong><small className={`park-severity ${severityTone[alert.severity] || 'neutral'}`}>{severityLabels[alert.severity] || alert.severity || 'Information'}</small></span><span className="park-alert-description">{alert.description || alert.message || alert.label || 'Consulter le détail de l’alerte'}</span></button></li>)}</ul>}
        </section>
      </div>

      <section className="ops-card park-installations">
        <header className="park-table-heading"><div><h2>Toutes les installations <span>{query.isSuccess ? `(${visible.length.toLocaleString('fr-FR')})` : ''}</span></h2><small>Les statuts affichés décrivent le contrat, pas l’état technique de l’équipement.</small></div><label className="ops-input-wrap"><Search size={15}/><input aria-label="Rechercher une installation" placeholder="Kit, client, ville…" value={search} onChange={event => setSearch(event.target.value)}/></label></header>
        <div className="park-filter-row" role="group" aria-label="Filtrer les contrats">
          {[
            ['all', `Tous (${all.length})`], ['active', `Actifs (${all.filter(kit => kit.status === 'active').length})`],
            ['suspended', `Suspendus (${all.filter(kit => kit.status === 'suspended').length})`], ['terminated', `Résiliés (${all.filter(kit => kit.status === 'terminated').length})`],
          ].map(([key, label]) => <button key={key} className={status === key ? 'is-active' : ''} aria-pressed={status === key} onClick={() => setStatus(key)}>{label}</button>)}
        </div>
        {query.isPending ? <TableSkeleton/> : visible.length === 0 ? <div className="ops-empty"><span className="ops-empty-icon"><Layers3 size={24}/></span><h3>{query.isError ? 'Inventaire indisponible' : all.length ? 'Aucun résultat' : 'Aucune installation enregistrée'}</h3><p>{all.length ? 'Modifiez les filtres ou votre recherche.' : 'Les installations enregistrées apparaîtront ici.'}</p></div> : (
          <div className="ops-table-scroll"><table className="ops-table park-table"><thead><tr><th>Installation</th><th>Client / Site</th><th>Région</th><th>Contrat</th><th>Position</th><th>Date d’installation</th><th>Fiche</th>{isAdmin && <th>Action</th>}</tr></thead><tbody>{visible.map((kit,index) => <tr key={kit._id || kit.kitId || index} onClick={() => kit.kitId && navigate(detailUrl(kit.kitId))}><td><strong>{kit.kitId || 'Identifiant manquant'}</strong><small>{kit.offerName || 'Offre non renseignée'}</small></td><td>{kit.clientName || (kit.kitId ? `Boîtier ${kit.kitId}` : 'Client non renseigné')}<small>{kit.clientPhone || 'Coordonnée non renseignée'}</small></td><td>{kit.province || kit.region || 'Non renseignée'}</td><td><span className={`ops-badge ${kit.status === 'active' ? 'contract-active' : 'contract-inactive'}`}>{contractLabels[kit.status] || 'Non renseigné'}</span></td><td>{coordinates(kit) ? <span className="park-gps"><MapPin size={13}/>GPS confirmé</span> : 'Non renseignée'}</td><td>{kit.installationDate || 'Non renseignée'}</td><td><button className="ops-text-link" onClick={event => { event.stopPropagation(); navigate(detailUrl(kit.kitId)); }}>Examiner <ArrowUpRight size={14}/></button></td>{isAdmin && <td><button className="ops-icon-button" type="button" title={kit.status === 'suspended' ? 'Réactiver le kit' : 'Suspendre le kit'} aria-label={`${kit.status === 'suspended' ? 'Réactiver' : 'Suspendre'} ${kit.kitId}`} disabled={updateKitStatus.isPending || kit.status === 'terminated'} onClick={event => { event.stopPropagation(); changeKitStatus(kit); }}>{kit.status === 'suspended' ? <Play size={14}/> : <Pause size={14}/>}</button></td>}</tr>)}</tbody></table></div>
        )}
      </section>
    </PageEntrance>
  );
}
