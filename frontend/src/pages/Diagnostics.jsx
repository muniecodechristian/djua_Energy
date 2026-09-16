import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Search, ArrowUpRight, Activity, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useKitsQuery, useAlertsQuery } from '../hooks/tanstack/useKitQueries';
import { asList, activeAlerts, detailUrl } from '../lib/operations';
export default function Diagnostics() {
  const kits = useKitsQuery();
  const alerts = useAlertsQuery();
  const [search,setSearch] = useState('');
  const list = asList(kits.data).filter(kit => [kit.kitId, kit.province,kit.region].join(' ').toLowerCase().includes(search.toLowerCase()));
  const open = activeAlerts(alerts.data);
  return <div className="ops-page"><div className="ops-page-heading"><div><p className="ops-eyebrow">AIDE À LA DÉCISION</p><h1>Diagnostic IA</h1><p>Choisissez un équipement pour examiner ses mesures et les analyses disponibles.</p></div><button className="ops-button" disabled={kits.isFetching} onClick={() => kits.refetch()}><RefreshCw size={15}/>Actualiser</button></div>
    <section className="ops-card ops-diagnostic-intro"><div className="ops-feature-icon"><BrainCircuit size={28}/></div><div><h2>Un diagnostic traçable, avant chaque décision.</h2><p>Un résultat doit être associé au bon kit, daté et confronté aux mesures. Sans résultat du modèle, aucun risque de panne ni délai prédit n’est affiché.</p></div></section>
    <div className="ops-process">{[[Activity,'01','Observer','Vérifier les mesures et leur fraîcheur.'],[BrainCircuit,'02','Analyser','Examiner le résultat et sa confiance, si fournie.'],[ClipboardCheck,'03','Décider','Valider le diagnostic avant de préparer une intervention.']].map(([Icon,index,title,description]) => <div key={index}><span>{index}</span><Icon size={18}/><h3>{title}</h3><p>{description}</p></div>)}</div>
    <section className="ops-card"><div className="ops-card-heading"><h2>Équipements à examiner</h2><label className="ops-input-wrap"><Search size={16}/><input aria-label="Rechercher un équipement pour diagnostic" placeholder="Identifiant, région…" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
    {kits.isError && <div className="ops-notice" role="alert">Le parc ne peut pas être chargé.<button onClick={() => kits.refetch()}>Réessayer</button></div>}
    {kits.isPending ? <div className="ops-empty" role="status">Chargement des équipements…</div> : list.length === 0 ? <div className="ops-empty"><BrainCircuit size={26}/><h3>Aucun équipement disponible</h3><p>Actualisez le parc ou modifiez votre recherche.</p><Link className="ops-text-link" to="/parc">Consulter le parc <ArrowUpRight size={15}/></Link></div> : <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Équipement</th><th>Région</th><th>Alertes ouvertes</th><th>Analyse</th></tr></thead><tbody>{list.map(kit => <tr key={kit.kitId || kit._id}><td><strong>{kit.kitId || 'Sans identifiant'}</strong><small>{kit.offerName || 'Modèle non renseigné'}</small></td><td>{kit.province || kit.region || 'Non renseignée'}</td><td>{alerts.isSuccess ? open.filter(a => a.kitId === kit.kitId).length : 'Indisponible'}</td><td>{kit.kitId && <Link className="ops-text-link" to={detailUrl(kit.kitId,true)}>Ouvrir le diagnostic <ArrowUpRight size={15}/></Link>}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
