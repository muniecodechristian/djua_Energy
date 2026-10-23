import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useKitLiveTelemetry } from '../hooks/tanstack/useKitLiveTelemetry';
import { getAppSocket } from '../lib/socket';
import { detailUrl, formatDate } from '../lib/operations';
import { destination, distanceMeters, gpsPosition, offsetMeters, GEOFENCE_RADIUS_METERS } from '../lib/geofence';
import GeofenceSiteScene from './GeofenceSiteScene';
import FleetGlobe from './FleetGlobe';
import { useFleetPositions, positionSample, mergePositionSamples } from '../hooks/tanstack/useFleetPositions';

export default function GeofenceSiteCard({ kits, alerts, records = [], userZone }) {
  const [selection,setSelection]=useState('all');
  const rawSites=useFleetPositions(kits,records);
  const sites = useMemo(() => {
    return rawSites.map(s => {
      const kit = kits.find(k => k.kitId === s.kitId);
      const kitAlerts = (alerts || []).filter(a => a.kitId === s.kitId && a.status === 'active');
      const hasCritical = kitAlerts.some(a => a.type === 'geofence_exit' || a.severity === 'critical' || a.severity === 'high');
      const hasWarning = kitAlerts.length > 0;
      const status = hasCritical || kit?.status === 'alert' || kit?.status === 'incident'
        ? 'alert'
        : hasWarning || kit?.status === 'warning'
        ? 'warning'
        : (s.position || kit?.status === 'active' || kit?.status === 'online')
        ? 'online'
        : 'offline';
      return {
        ...s,
        status,
        hasAlert: kitAlerts.length > 0,
      };
    });
  }, [rawSites, alerts, kits]);
  const card=useRef(null);
  const kitId=kits.some(k=>k.kitId===selection)?selection:null;
  return <section ref={card} className="dashboard-panel geofence-site-card" aria-label="Carte 3D du géofencing">
    <header className="dashboard-map-heading"><div><h2>World Map 3D</h2><p>Vue mondiale du parc et sites des kits</p></div><button type="button" className="geofence-expand" aria-label="Agrandir la carte 3D" title="Plein écran, Échap pour quitter" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else card.current?.requestFullscreen?.().catch(()=>{});}}><Maximize2 size={14}/></button></header>
    {kitId?<Site key={kitId} kit={kits.find(k=>k.kitId===kitId)} kits={kits} alerts={alerts} onSelect={setSelection} fleetTrail={sites.find(s=>s.kitId===kitId)?.trail||[]}/>:<>
      <div className="geofence-site-selector"><label>Vue<select aria-label="Kit du site 3D" value="all" onChange={e=>setSelection(e.target.value)}><option value="all">Tous les kits</option>{kits.filter(k=>k.kitId).map(k=><option key={k.kitId} value={k.kitId}>{k.kitId}</option>)}</select></label></div>
      <FleetGlobe sites={sites} onSelect={setSelection} userZone={userZone}/>
      <div className="geofence-site-details"><strong className="fleet-overview-title">Vue d'ensemble du parc</strong><p className="geofence-source">Cliquez sur un repère ou choisissez un kit pour explorer son site. Les traces relient uniquement les points GPS reçus.</p><p className="geofence-source">{sites.filter(s=>!s.reference&&!s.position).length} kit(s) sans position GPS · Maisons représentées de manière schématique.</p></div>
    </>}

  </section>;
}
function Site({kit,kits,alerts,onSelect,fleetTrail}) {
  const {latestTelemetry:T,isLive}=useKitLiveTelemetry(kit.kitId);
  const queryClient=useQueryClient();
  const [simulation,setSimulation]=useState(false),[simDistance,setSimDistance]=useState(45),[bearing,setBearing]=useState(90);
  useEffect(()=>{const socket=getAppSocket();const update=()=>queryClient.invalidateQueries({queryKey:['alerts']});socket.on('geofence_alert',update);socket.on('geofence_resolved',update);return()=>{socket.off('geofence_alert',update);socket.off('geofence_resolved',update);};},[queryClient]);
  const ref=gpsPosition(kit.gpsCoordinates?.latitude,kit.gpsCoordinates?.longitude);
  const alert=alerts.find(a=>a.kitId===kit.kitId&&a.type==='geofence_exit'&&a.status==='active');
  const history=mergePositionSamples([...fleetTrail,positionSample(T)]);
  const received=history.at(-1)||null;
  const alertPosition=gpsPosition(alert?.metadata?.currentPosition?.latitude,alert?.metadata?.currentPosition?.longitude);
  const alertTime=new Date(alert?.createdAt).getTime();
  const useAlert=Boolean(alertPosition&&(!received||alertTime>received.time));
  const actual=useAlert?alertPosition:received;
  const position=simulation&&ref?destination(ref,simDistance,bearing):actual;
  const distance=ref&&position?(simulation?simDistance:distanceMeters(ref,position)):null;
  const outside=distance!=null&&distance>GEOFENCE_RADIUS_METERS;
  const offset=ref&&position?offsetMeters(ref,position):null;
  const pick=(east,north)=>{if(!simulation)return;setSimDistance(Math.min(180,Math.hypot(east,north)));setBearing(Math.atan2(east,north)*180/Math.PI);};
  const status=!ref?'Référence GPS absente':distance==null?'Position reçue indisponible':outside?'Hors périmètre':'Dans le périmètre';
  return <>
    <div className="geofence-site-selector"><label>Kit<select aria-label="Kit du site 3D" value={kit.kitId} onChange={e=>onSelect(e.target.value)}><option value="all">← Tous les kits</option>{kits.filter(k=>k.kitId).map(k=><option key={k.kitId} value={k.kitId}>{k.kitId}</option>)}</select></label><Link to={detailUrl(kit.kitId)}>Fiche ↗</Link></div>
    {ref?<GeofenceSiteScene trail={ref&&!simulation?history.map(p=>offsetMeters(ref,p)):[]} offset={offset} outside={outside} simulated={simulation} onGroundPick={pick}/>:<div className="geofence-empty">Ce kit n’a pas de coordonnées de référence valides. Le site ne peut pas être positionné.</div>}
    <div className="geofence-site-details">
      <div className="geofence-status-line"><strong className={outside?'geofence-outside':''}>{simulation?'Simulation · ':''}{status}</strong><span>{distance==null?'—':`${distance.toFixed(1)} m`} / 90 m</span></div>
      <p className="geofence-source">{simulation?'Essai local, sans envoi de données ni création d’alerte.':received&&!useAlert?`${isLive?'GPS en direct':'Dernier GPS reçu'} · ${formatDate(received?.time)}`:alertPosition?`Position de l’alerte · ${formatDate(alert.createdAt)}`:'En attente d’une position GPS du kit.'}</p>
      {alert&&!simulation&&<Link to={'/notification?alertId='+encodeURIComponent(alert._id||'')} className="geofence-alert-link">Alerte de sortie active · Consulter ↗</Link>}
      {!simulation&&history.length>1&&<p className="geofence-source" role="status">Trace GPS : {history.length} points reçus · Aucun déplacement inventé.</p>}
      <label className="geofence-simulation-toggle"><input type="checkbox" checked={simulation} disabled={!ref} onChange={e=>setSimulation(e.target.checked)}/> Simuler un déplacement</label>
      {simulation&&<div className="geofence-simulation-controls"><label>Distance simulée<input aria-label="Distance simulée en mètres" type="range" min="0" max="180" step="1" value={simDistance} onChange={e=>setSimDistance(Number(e.target.value))}/></label><p>Déplacez le curseur ou cliquez sur le terrain. Au-delà de 90 m : sortie de zone.</p></div>}
    </div>
  </>;
}
