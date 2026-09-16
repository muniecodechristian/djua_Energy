import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowUpRight, PanelsTopLeft, MapPin } from 'lucide-react';
import { useKitsQuery } from '../hooks/tanstack/useKitQueries';
import { asList, coordinates, detailUrl } from '../lib/operations';
const labels={active:'Actif',suspended:'Suspendu',terminated:'Résilié'};
export default function OrangeKitsRegistry(){
  const query=useKitsQuery();
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('all');
  const all=asList(query.data);
  const visible=all.filter(kit=>(status==='all'||kit.status===status)&&[kit.kitId,kit.offerName,kit.region,kit.province].join(' ').toLowerCase().includes(search.toLowerCase()));
  return <div className="ops-page"><div className="ops-page-heading"><div><p className="ops-eyebrow">INVENTAIRE & ÉQUIPEMENTS</p><h1>Parc solaire</h1><p>Retrouvez chaque kit et accédez à ses mesures, ses alertes et son diagnostic.</p></div><button className="ops-button" disabled={query.isFetching} onClick={()=>query.refetch()}><RefreshCw size={15} className={query.isFetching?'ops-spin':''}/>Actualiser le parc</button></div>
    <div className="ops-toolbar"><div className="ops-tabs" aria-label="Filtrer par contrat">{[['all','Tous les contrats'],['active','Actifs'],['suspended','Suspendus'],['terminated','Résiliés']].map(([key,label])=><button key={key} aria-pressed={status===key} className={status===key?'active':''} onClick={()=>setStatus(key)}>{label}</button>)}</div><label className="ops-input-wrap"><Search size={16}/><input aria-label="Rechercher un kit" placeholder="Identifiant, offre ou région…" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
    {query.isError&&<div className="ops-notice" role="alert">Impossible de charger l’inventaire.<button onClick={()=>query.refetch()}>Réessayer</button></div>}
    <section className="ops-card"><div className="ops-card-heading"><h2>{query.isSuccess?visible.length+' équipement(s)':'Inventaire'}</h2><small>Le statut du contrat ne décrit pas la santé technique du kit.</small></div>
    {query.isPending?<div className="ops-empty" role="status">Chargement du parc…</div>:visible.length===0?<div className="ops-empty"><span className="ops-empty-icon"><PanelsTopLeft size={25}/></span><h3>{query.isError?'Inventaire indisponible':'Aucun équipement dans cette vue'}</h3><p>Modifiez les filtres ou actualisez l’inventaire.</p></div>:<div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Équipement</th><th>Localisation</th><th>Contrat</th><th>Position GPS</th><th>Fiche technique</th></tr></thead><tbody>{visible.map((kit,index)=>{const point=coordinates(kit);return <tr key={kit.kitId||kit._id||index}><td><strong>{kit.kitId||'Identifiant manquant'}</strong><small>{kit.offerName||'Offre non renseignée'}</small></td><td>{kit.province||kit.region||'Non renseignée'}</td><td><span className={'ops-badge '+(kit.status==='active'?'info':'medium')}>{labels[kit.status]||'Non renseigné'}</span></td><td>{point?<span className="ops-coordinate"><MapPin size={13}/>{point.map(value=>value.toFixed(4)).join(', ')}</span>:'Non renseignée'}</td><td>{kit.kitId&&<Link className="ops-text-link" to={detailUrl(kit.kitId)}>Examiner le kit <ArrowUpRight size={15}/></Link>}</td></tr>;})}</tbody></table></div>}</section>
  </div>;
}
