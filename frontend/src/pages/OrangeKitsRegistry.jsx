import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, CircleAlert, Layers3, MapPin, Pause, Play, RefreshCw, Search, ShieldAlert, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import PageEntrance from '../components/PageEntrance';
import { useKitsQuery, useAlertsQuery, useLatestKitTelemetryQuery, useUpdateKitStatus } from '../hooks/tanstack/useKitQueries';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { activeAlerts, asList, coordinates, detailUrl, prioritize, severityLabels } from '../lib/operations';
import { getAppSocket } from '../lib/socket';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '../components/PageSkeleton';
import './OrangeKitsRegistry.css';

const contractLabels = { active: 'Actif', suspended: 'Suspendu', terminated: 'Résilié' };
const severityTone = { critical: 'critical', high: 'warning', medium: 'warning', low: 'neutral', info: 'neutral' };
const PAGE_SIZE = 20;
const GEOFENCE_RADIUS_METERS = 90;

function isValidGps(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    && !(lat === 0 && lng === 0);
}

function distanceMeters(first, second) {
  const radians = degrees => degrees * Math.PI / 180;
  const latitudeDelta = radians(second[0] - first[0]);
  const longitudeDelta = radians(second[1] - first[1]);
  const a = Math.min(1, Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(first[0])) * Math.cos(radians(second[0])) * Math.sin(longitudeDelta / 2) ** 2);
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatPower(value, unit = 'W') {
  return value == null || !Number.isFinite(Number(value))
    ? 'Pas de mesure'
    : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(Number(value))} ${unit}`;
}

function formatEnergy(value, unit = 'Wh') {
  return value == null || !Number.isFinite(Number(value))
    ? null
    : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(Number(value))} ${unit}`;
}

function formatTimeAgo(value) {
  if (!value) return 'Aucune donnée';
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'Date inconnue';
  if (elapsed < 60_000) return 'À l’instant';
  if (elapsed < 3_600_000) return `Il y a ${Math.floor(elapsed / 60_000)} min`;
  if (elapsed < 86_400_000) return `Il y a ${Math.floor(elapsed / 3_600_000)} h`;
  return `Il y a ${Math.floor(elapsed / 86_400_000)} j`;
}

function telemetryFresh(snapshot) {
  const receivedAt = new Date(snapshot?.createdAt || 0).getTime();
  const age = Date.now() - receivedAt;
  return Number.isFinite(receivedAt) && age >= 0 && age <= 30 * 60 * 1000;
}

function statusLabel(kit, snapshot, kitAlerts) {
  const severe = kitAlerts.some(alert => ['critical', 'high'].includes(alert.severity));
  if (severe) return { label: 'Critique', tone: 'critical' };
  if (kitAlerts.length) return { label: 'À surveiller', tone: 'warning' };
  if (kit.status === 'suspended') return { label: 'Contrat suspendu', tone: 'warning' };
  if (kit.status === 'terminated') return { label: 'Contrat résilié', tone: 'neutral' };
  if (!telemetryFresh(snapshot)) return { label: 'Données indisponibles', tone: 'offline' };
  return { label: 'Aucun incident remonté', tone: 'good' };
}

function positionLabel(kit, snapshot, kitAlerts) {
  if (kitAlerts.some(alert => alert.type === 'geofence_exit')) return { label: 'Hors zone', tone: 'warning' };
  const current = snapshot?.gpsCoordinates;
  if (!isValidGps(current?.latitude, current?.longitude)) return { label: 'Données indisponibles', tone: 'offline' };
  const reference = coordinates(kit);
  if (!reference) return { label: 'Position reçue', tone: 'neutral' };
  const livePosition = [Number(current.latitude), Number(current.longitude)];
  return distanceMeters(reference, livePosition) > GEOFENCE_RADIUS_METERS
    ? { label: 'Hors zone', tone: 'warning' }
    : { label: 'Confirmée', tone: 'good' };
}

function integrityLabel(snapshot, kitAlerts) {
  if (kitAlerts.some(alert => ['critical', 'high'].includes(alert.severity))) return { label: 'Anomalie signalée', tone: 'critical' };
  if (kitAlerts.length || snapshot?.dc_load?.overload_detected) return { label: 'À vérifier', tone: 'warning' };
  const errorCodes = [snapshot?.battery?.error_code, snapshot?.solar?.error_code]
    .filter(code => code && !['NONE', '0'].includes(String(code).toUpperCase()));
  if (errorCodes.length) return { label: errorCodes.join(', '), tone: 'warning' };
  if (!telemetryFresh(snapshot)) return { label: 'Données indisponibles', tone: 'offline' };
  return { label: 'Aucun défaut remonté', tone: 'good' };
}

function liveSnapshot(event) {
  if (event.raw) return { ...event.raw, createdAt: event.raw.createdAt || event.timestamp };
  const record = event.enriched?.records?.at(-1);
  if (!record) return null;
  return {
    createdAt: event.timestamp,
    gpsCoordinates: { latitude: record.latitude, longitude: record.longitude },
    battery: { state_of_health_pct: record.state_of_health_pct, error_code: record.battery_error_code },
    solar: { power_w: record.solar_power_w, energy_interval_wh: record.energy_generated_wh, error_code: record.solar_error_code },
    dc_load: { power_w: record.load_power_w, energy_interval_wh: record.energy_consumed_wh, overload_detected: record.overload_detected },
    ac_load: {},
  };
}

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
  const [page, setPage] = useState(1);
  const [liveSnapshots, setLiveSnapshots] = useState({});
  const all = asList(query.data);
  const alerts = prioritize(activeAlerts(alertsQuery.data));
  const visible = useMemo(() => all.filter(kit => (
    (status === 'all' || kit.status === status)
    && [kit.kitId, kit.offerName, kit.region, kit.province, kit.clientName].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )), [all, status, search]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageKits = useMemo(() => visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [visible, currentPage]);
  const pageKitIds = useMemo(() => pageKits.map(kit => kit.kitId).filter(Boolean), [pageKits]);
  const telemetryQuery = useLatestKitTelemetryQuery(pageKitIds);
  const snapshots = useMemo(() => {
    const latest = { ...telemetryQuery.data };
    for (const [kitId, snapshot] of Object.entries(liveSnapshots)) {
      const storedAt = new Date(latest[kitId]?.createdAt || 0).getTime();
      const liveAt = new Date(snapshot.createdAt || 0).getTime();
      if (!Number.isFinite(storedAt) || liveAt >= storedAt) latest[kitId] = snapshot;
    }
    return latest;
  }, [telemetryQuery.data, liveSnapshots]);
  const alertsByKit = useMemo(() => {
    const grouped = new Map();
    for (const alert of alerts) {
      if (!alert.kitId) continue;
      const current = grouped.get(alert.kitId) || [];
      current.push(alert);
      grouped.set(alert.kitId, current);
    }
    return grouped;
  }, [alerts]);
  const pageKitIdsKey = pageKitIds.join(',');

  useEffect(() => {
    const subscribedKitIds = pageKitIdsKey ? pageKitIdsKey.split(',') : [];
    const allowedKitIds = new Set(subscribedKitIds);
    if (!allowedKitIds.size) return undefined;
    const socket = getAppSocket();
    const subscribe = () => subscribedKitIds.forEach(kitId => socket.emit('subscribe:kit', { kitId }));
    const receive = event => {
      if (!allowedKitIds.has(event?.kitId)) return;
      const snapshot = liveSnapshot(event);
      if (snapshot) setLiveSnapshots(previous => ({ ...previous, [event.kitId]: snapshot }));
    };
    socket.on('connect', subscribe);
    socket.on('telemetry:live', receive);
    if (socket.connected) subscribe();
    return () => {
      socket.off('connect', subscribe);
      socket.off('telemetry:live', receive);
      subscribedKitIds.forEach(kitId => socket.emit('unsubscribe:kit', { kitId }));
    };
  }, [pageKitIdsKey]);

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
          <button className="ops-button" disabled={query.isFetching || alertsQuery.isFetching || telemetryQuery.isFetching} onClick={() => { query.refetch(); alertsQuery.refetch(); if (pageKitIds.length) telemetryQuery.refetch(); }}><RefreshCw size={14} className={query.isFetching || alertsQuery.isFetching || telemetryQuery.isFetching ? 'ops-spin' : ''}/>Actualiser</button>
        </div>
      </header>

      {(query.isError || alertsQuery.isError) && <div className="ops-notice" role="alert">{query.isError ? 'Impossible de charger les installations.' : 'Les alertes sont indisponibles.'}<button onClick={() => { query.refetch(); alertsQuery.refetch(); }}>Réessayer</button></div>}
      {telemetryQuery.isError && <div className="ops-notice" role="alert">Les dernières mesures IoT sont indisponibles ; les données techniques ne peuvent pas être confirmées.<button onClick={() => telemetryQuery.refetch()}>Réessayer</button></div>}

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
        <header className="park-table-heading"><div><h2>Toutes les installations <span>{query.isSuccess ? `(${visible.length.toLocaleString('fr-FR')})` : ''}</span></h2><small>Mesures actuelles reçues de l’ESP32 ; la référence habituelle n’est pas encore calculée.</small></div><div className="park-table-tools"><label className="ops-input-wrap"><Search size={15}/><input aria-label="Rechercher une installation" placeholder="Kit, client, ville…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }}/></label><button className="ops-button park-export-button" disabled={query.isPending || all.length === 0} onClick={() => exportKits(all)}><ArrowDownToLine size={14}/>Exporter</button></div></header>
        <div className="park-filter-row" role="group" aria-label="Filtrer les contrats">
          {[
            ['all', `Tous (${all.length})`], ['active', `Actifs (${all.filter(kit => kit.status === 'active').length})`],
            ['suspended', `Suspendus (${all.filter(kit => kit.status === 'suspended').length})`], ['terminated', `Résiliés (${all.filter(kit => kit.status === 'terminated').length})`],
          ].map(([key, label]) => <button key={key} className={status === key ? 'is-active' : ''} aria-pressed={status === key} onClick={() => { setStatus(key); setPage(1); }}>{label}</button>)}
        </div>
        {query.isPending ? <TableSkeleton/> : visible.length === 0 ? <div className="ops-empty"><span className="ops-empty-icon"><Layers3 size={24}/></span><h3>{query.isError ? 'Inventaire indisponible' : all.length ? 'Aucun résultat' : 'Aucune installation enregistrée'}</h3><p>{all.length ? 'Modifiez les filtres ou votre recherche.' : 'Les installations enregistrées apparaîtront ici.'}</p></div> : (
          <div className="ops-table-scroll"><table className="ops-table park-table"><thead><tr><th>Installation</th><th>Client / Site</th><th>Production vs. habitude</th><th>Consommation vs. habitude</th><th>Position du boîtier</th><th>Intégrité du boîtier</th><th>État global</th><th>Dernière donnée</th><th>Fiche</th>{isAdmin && <th>Action</th>}</tr></thead><tbody>{pageKits.map((kit,index) => {
            const snapshot = snapshots[kit.kitId];
            const kitAlerts = alertsByKit.get(kit.kitId) || [];
            const overall = statusLabel(kit, snapshot, kitAlerts);
            const position = positionLabel(kit, snapshot, kitAlerts);
            const integrity = integrityLabel(snapshot, kitAlerts);
            const consumptionValue = snapshot?.dc_load?.power_w ?? snapshot?.ac_load?.apparent_power_va;
            const consumptionUnit = snapshot?.dc_load?.power_w != null ? 'W' : 'VA';
            const productionEnergy = formatEnergy(snapshot?.solar?.energy_interval_wh);
            const consumptionEnergy = formatEnergy(snapshot?.dc_load?.energy_interval_wh);
            return <tr key={kit._id || kit.kitId || index} onClick={() => kit.kitId && navigate(detailUrl(kit.kitId))}>
              <td><strong>{kit.kitId || 'Identifiant manquant'}</strong><small>{kit.offerName || 'Offre non renseignée'}</small></td>
              <td>{kit.clientName || (kit.kitId ? `Boîtier ${kit.kitId}` : 'Client non renseigné')}<small>{kit.province || kit.region || 'Site non renseigné'}</small></td>
              <td><span className="park-measurement">{formatPower(snapshot?.solar?.power_w)}<small>{productionEnergy ? `${productionEnergy} sur l’intervalle · réf. non calculée` : 'Puissance instantanée · réf. non calculée'}</small></span></td>
              <td><span className="park-measurement">{formatPower(consumptionValue, consumptionUnit)}<small>{consumptionEnergy ? `${consumptionEnergy} sur l’intervalle · réf. non calculée` : 'Puissance mesurée · réf. non calculée'}</small></span></td>
              <td><span className={`park-live-badge ${position.tone}`}><MapPin size={12}/>{position.label}</span></td>
              <td><span className={`park-live-badge ${integrity.tone}`}>{integrity.label}</span>{snapshot?.battery?.state_of_health_pct != null && <small className="park-signal-detail">Santé batterie {formatPower(snapshot.battery.state_of_health_pct, '%')}</small>}</td>
              <td><span className={`park-live-badge ${overall.tone}`}>{overall.label}</span></td>
              <td>{formatTimeAgo(snapshot?.createdAt)}</td>
              <td><button className="ops-text-link" onClick={event => { event.stopPropagation(); navigate(detailUrl(kit.kitId)); }}>Examiner <ArrowUpRight size={14}/></button></td>
              {isAdmin && <td><button className="ops-icon-button" type="button" title={kit.status === 'suspended' ? 'Réactiver le kit' : 'Suspendre le kit'} aria-label={`${kit.status === 'suspended' ? 'Réactiver' : 'Suspendre'} ${kit.kitId}`} disabled={updateKitStatus.isPending || kit.status === 'terminated'} onClick={event => { event.stopPropagation(); changeKitStatus(kit); }}>{kit.status === 'suspended' ? <Play size={14}/> : <Pause size={14}/>}</button></td>}
            </tr>;
          })}</tbody></table></div>
        )}
        {!query.isPending && visible.length > 0 && <footer className="park-pagination"><span>Affichage de {(currentPage - 1) * PAGE_SIZE + 1} à {Math.min(currentPage * PAGE_SIZE, visible.length)} sur {visible.length.toLocaleString('fr-FR')} installations{telemetryQuery.isFetching ? ' · Actualisation des mesures…' : ''}</span><div><button type="button" aria-label="Page précédente" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ArrowLeft size={15}/></button><span>Page {currentPage} sur {pageCount}</span><button type="button" aria-label="Page suivante" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}><ArrowRight size={15}/></button></div></footer>}
      </section>
    </PageEntrance>
  );
}
