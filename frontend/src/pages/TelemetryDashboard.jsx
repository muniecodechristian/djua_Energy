import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, RefreshCw, Search, ArrowUpRight, Send, Lock, Unlock, RotateCcw } from 'lucide-react';
import { useTelemetryQuery, useSendCommandMutation } from '../hooks/tanstack/useKitQueries';
import { asList, latestByKit, formatDate, detailUrl } from '../lib/operations';
const format=(value,unit)=>value!=null&&Number.isFinite(Number(value))?Number(value).toLocaleString('fr-FR',{maximumFractionDigits:2})+' '+unit:'—';
const commands=[['requestTelemetry','Demander une mesure',Send],['lockDevice','Verrouiller',Lock],['unlockDevice','Déverrouiller',Unlock],['reboot','Redémarrer',RotateCcw]];
export default function TelemetryDashboard(){
 const query=useTelemetryQuery();
 const command=useSendCommandMutation();
 const [search,setSearch]=useState('');
 const [mode,setMode]=useState('latest');
 const [selected,setSelected]=useState(null);
 const records=asList(query.data);
 const latest=latestByKit(records);
 const list=(mode==='latest'?[...latest.values()]:records).filter(row=>[row.kitId,row.deviceId].join(' ').toLowerCase().includes(search.toLowerCase()));
 const run=(cmd)=>{if(!selected)return; if(cmd!=='requestTelemetry'&&!window.confirm('Confirmer la commande « '+commands.find(item=>item[0]===cmd)[1]+' » pour '+selected.kitId+' ?'))return; command.mutate({deviceId:selected.kitId,command:cmd});};
 return <div className="ops-page"><div className="ops-page-heading"><div><p className="ops-eyebrow">MESURES TERRAIN</p><h1>Télémétrie</h1><p>Mesures reçues des équipements · actualisation toutes les 30 secondes.</p></div><button className="ops-button" onClick={()=>query.refetch()} disabled={query.isFetching}><RefreshCw size={15} className={query.isFetching?'ops-spin':''}/>Actualiser</button></div>
 <div className="ops-telemetry-summary"><Activity size={19}/><strong>{query.isSuccess?records.length:'—'} mesures reçues</strong><span>{query.isSuccess?latest.size:'—'} équipements dans cet échantillon</span><small>Dernière lecture : {formatDate(query.dataUpdatedAt)}</small></div>
 <div className="ops-toolbar"><div className="ops-tabs"><button aria-pressed={mode==='latest'} className={mode==='latest'?'active':''} onClick={()=>setMode('latest')}>Dernière mesure par kit</button><button aria-pressed={mode==='history'} className={mode==='history'?'active':''} onClick={()=>setMode('history')}>Historique reçu</button></div><label className="ops-input-wrap"><Search size={16}/><input aria-label="Filtrer la télémétrie" placeholder="Rechercher un équipement…" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
 {query.isError&&<div className="ops-notice" role="alert">La télémétrie est indisponible.<button onClick={()=>query.refetch()}>Réessayer</button></div>}
 <section className="ops-card"><div className="ops-card-heading"><h2>Journal des mesures</h2><small>Échantillon des 100 dernières mesures · aucun total de production extrapolé</small></div>
 {query.isPending?<div className="ops-empty" role="status">Chargement des mesures…</div>:list.length===0?<div className="ops-empty"><span className="ops-empty-icon"><Activity size={25}/></span><h3>{query.isError?'Source indisponible':'Aucune mesure reçue dans cette vue'}</h3><p>Les mesures apparaîtront après réception des données des capteurs.</p></div>:<div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Équipement / réception</th><th>Charge batterie</th><th>Tension</th><th>Puissance solaire</th><th>Température boîtier</th><th>Détails</th></tr></thead><tbody>{list.map((row,index)=><tr key={row._id||index}><td><Link className="ops-text-link" to={detailUrl(row.kitId)}>{row.kitId||'Non identifié'} <ArrowUpRight size={13}/></Link><small>{formatDate(row.createdAt||row.timestamp)}</small></td><td>{format(row.battery?.state_of_charge_pct,'%')}</td><td>{format(row.battery?.voltage_v,'V')}</td><td>{format(row.solar?.power_w,'W')}</td><td>{format(row.environment?.device_temperature_c,'°C')}</td><td><button className="ops-button" onClick={()=>{setSelected(row);command.reset();}}>Examiner</button></td></tr>)}</tbody></table></div>}</section>
 {selected&&<section className="ops-card ops-telemetry-detail"><div className="ops-card-heading"><h2>Équipement {selected.kitId}</h2><button className="ops-text-link" onClick={()=>setSelected(null)}>Fermer</button></div><div className="ops-detail-body"><p>Mesure reçue le {formatDate(selected.createdAt||selected.timestamp)}. Une mesure ancienne ne décrit pas l’état actuel de l’équipement.</p><div className="ops-inline-actions">{commands.map(([cmd,label,Icon])=><button key={cmd} className="ops-button" disabled={command.isPending||!selected.kitId} onClick={()=>run(cmd)}><Icon size={14}/>{label}</button>)}</div><p className="ops-help">L’envoi d’une commande ne confirme pas son exécution par l’équipement. Vérifiez les prochaines remontées terrain.</p><details><summary>Données reçues</summary><pre className="ops-raw-data">{JSON.stringify(selected,null,2)}</pre></details></div></section>}
 </div>;
}
