import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, ArrowRight, RefreshCw, Sun, Radio, AlertTriangle, BrainCircuit, MapPin, Activity, Wrench, CircleHelp } from 'lucide-react';
import { useKitsQuery, useAlertsQuery, useTelemetryQuery } from '../hooks/tanstack/useKitQueries';
import { useFleetLiveStatus } from '../hooks/tanstack/useFleetLiveStatus';
import { asList, activeAlerts, prioritize, latestByKit, observedRecently, coordinates, detailUrl, formatDate, severityLabels } from '../lib/operations';
export default function Dashboard() {
  const kitsQuery = useKitsQuery();
  const alertsQuery = useAlertsQuery();
  const telemetryQuery = useTelemetryQuery();
  const { activeKitIds, isSocketConnected } = useFleetLiveStatus();
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(interval); }, []);
  const kits = asList(kitsQuery.data);
  const alerts = prioritize(activeAlerts(alertsQuery.data));
  const latest = latestByKit(telemetryQuery.data);
  const recent = kit => activeKitIds.has(kit.kitId) || observedRecently(latest.get(kit.kitId), now);
  const online = kits.filter(recent).length;
  const affected = new Set(alerts.map(alert => alert.kitId));
  const located = kits.map(kit => ({kit, point:coordinates(kit)})).filter(item => item.point);
  const refreshing = [kitsQuery, alertsQuery, telemetryQuery].some(query => query.isFetching);
  const refresh = () => { kitsQuery.refetch(); alertsQuery.refetch(); telemetryQuery.refetch(); };
  const failures = [kitsQuery.isError && 'parc', alertsQuery.isError && 'alertes', telemetryQuery.isError && 'télémétrie'].filter(Boolean);
  const countValue = (query, number) => query.isPending || query.isError ? '—' : number.toLocaleString('fr-FR');
  const cards = [
    { label:'Équipements du parc', value:countValue(kitsQuery,kits.length), hint:'Inventaire des kits enregistrés', icon:Sun, tone:'orange', to:'/parc' },
    { label:'Signal récent', value:kitsQuery.isError || kitsQuery.isPending ? '—' : countValue(telemetryQuery,online), hint:'Mesure observée depuis moins de 5 min', icon:Radio, tone:'green', to:'/telemetry' },
    { label:'Alertes ouvertes', value:countValue(alertsQuery,alerts.length), hint:alertsQuery.isSuccess ? affected.size + ' équipement(s) concerné(s) · 100 dernières alertes' : 'Source indisponible', icon:AlertTriangle, tone:'amber', to:'/notification' },
    { label:'Observation à compléter', value:kitsQuery.isError || kitsQuery.isPending ? '—' : countValue(telemetryQuery,kits.length - online), hint:'Aucun signal récent dans les données reçues', icon:CircleHelp, tone:'slate', to:'/diagnostics' },
  ];
  return <div className="ops-page">
    <div className="ops-page-heading"><div><p className="ops-eyebrow"><span/> CENTRE DE SUPERVISION</p><h1>Votre parc, en perspective.</h1><p>Surveillez les équipements. Identifiez les priorités. Préparez les prochaines actions.</p></div><button className="ops-button" onClick={refresh} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'ops-spin' : ''}/>{refreshing ? 'Actualisation…' : 'Actualiser'}</button></div>
    {failures.length > 0 && <div role="alert" className="ops-notice"><AlertTriangle size={18}/><span>Chargement impossible : {failures.join(', ')}. Les indicateurs concernés sont indisponibles.</span><button onClick={refresh}>Réessayer</button></div>}
    <div className="ops-kpis">{cards.map(({label,value,hint,icon:Icon,tone,to}) => <Link className={'ops-card ops-kpi ' + tone} key={label} to={to}><div className="ops-kpi-head"><span>{label}</span><Icon size={19}/></div><strong>{value}</strong><div className="ops-kpi-foot"><small>{hint}</small><ArrowUpRight size={16}/></div></Link>)}</div>
    <div className="ops-dashboard-grid">
      <section className="ops-card ops-map-card"><div className="ops-card-heading"><div><p className="ops-eyebrow">COUVERTURE DU PARC</p><h2>Les équipements sur le terrain</h2></div><Link className="ops-text-link" to="/parc">Voir le parc <ArrowUpRight size={14}/></Link></div><div className="ops-map">
        <MapContainer center={[-3.5,23.5]} zoom={5} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{located.map(({kit,point}) => <CircleMarker key={kit.kitId || kit._id} center={point} radius={7} pathOptions={{color:affected.has(kit.kitId) ? '#d97706' : recent(kit) ? '#059669' : '#64748b',fillOpacity:0.8,weight:2}}><Popup><strong>{kit.kitId}</strong><p>{affected.has(kit.kitId) ? 'Alerte ouverte' : recent(kit) ? 'Signal récent observé' : 'Observation à compléter'}</p><Link to={detailUrl(kit.kitId)}>Ouvrir la fiche →</Link></Popup></CircleMarker>)}</MapContainer>
        {located.length === 0 && <div className="ops-map-message"><MapPin size={19}/><strong>{kitsQuery.isPending ? 'Chargement du parc…' : kitsQuery.isError ? 'Parc indisponible' : 'Aucun équipement géolocalisé'}</strong><span>Les positions renseignées apparaîtront ici.</span></div>}
      </div><div className="ops-map-legend"><span><i className="green"/> Signal récent</span><span><i className="amber"/> Alerte ouverte</span><span><i className="slate"/> À vérifier</span><small>{located.length} position(s) disponible(s)</small></div></section>
      <section className="ops-card ops-priorities"><div className="ops-card-heading"><div><p className="ops-eyebrow">À EXAMINER</p><h2>Priorités opérationnelles</h2></div><span className="ops-counter">{countValue(alertsQuery, alerts.length)}</span></div>
        <div className="ops-priority-list">{alerts.slice(0,4).map((alert,index) => <Link to={'/notification?alertId=' + encodeURIComponent(alert._id || '')} key={alert._id || index} className="ops-priority"><div><span className={'ops-badge ' + alert.severity}>{severityLabels[alert.severity] || 'Non classée'}</span><small>{formatDate(alert.createdAt)}</small></div><h3>{alert.label || alert.type}</h3><p>{alert.kitId || 'Équipement non identifié'}</p><span className="ops-text-link">Examiner l’alerte <ArrowRight size={14}/></span></Link>)}
        {alerts.length === 0 && <div className="ops-empty"><span className="ops-empty-icon"><Activity size={25}/></span><h3>{alertsQuery.isPending ? 'Chargement des alertes' : alertsQuery.isError ? 'Alertes indisponibles' : 'Aucune alerte ouverte reçue'}</h3><p>{alertsQuery.isSuccess ? 'La liste se met à jour avec les remontées terrain. L’absence d’alerte ne garantit pas la santé du parc.' : 'Réessayez pour connaître les priorités du parc.'}</p></div>}</div><Link className="ops-card-footer" to="/notification">Ouvrir le centre d’alertes <ArrowRight size={15}/></Link>
      </section>
    </div>
    <div className="ops-bottom-grid"><section className="ops-card ops-ai-card"><div className="ops-feature-icon"><BrainCircuit size={24}/></div><div><p className="ops-eyebrow">DIAGNOSTIC & MAINTENANCE PRÉDICTIVE</p><h2>De la mesure à la décision.</h2><p>Consultez les mesures d’un kit, les résultats disponibles du modèle et les recommandations à valider avant intervention.</p><div className="ops-inline-actions"><Link className="ops-button primary" to="/diagnostics">Examiner un équipement <ArrowUpRight size={15}/></Link><Link className="ops-text-link" to="/InterventionWizard"><Wrench size={15}/> Préparer une intervention</Link></div></div></section>
    <section className="ops-card ops-quality"><p className="ops-eyebrow">FIABILITÉ DE LA VUE</p><h2>Ce que les données permettent de dire</h2><div><span className={'ops-status-dot ' + (isSocketConnected ? '' : 'slate')}/><strong>{isSocketConnected ? 'Flux temps réel connecté' : 'Flux temps réel indisponible'}</strong></div><p>Les compteurs utilisent les données reçues, dont les 100 dernières mesures. Un signal absent n’est pas un diagnostic de panne.</p><small>Dernière lecture télémétrie : {formatDate(telemetryQuery.dataUpdatedAt)}</small></section></div>
  </div>;
}
