import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Wrench, Save, Check, ArrowUpRight, ClipboardList } from 'lucide-react';
import { useKitsQuery } from '../hooks/tanstack/useKitQueries';
import { asList, detailUrl, formatDate } from '../lib/operations';
const STORAGE = 'djua-maintenance-drafts-v1';
const readDrafts = () => { try { return asList(JSON.parse(localStorage.getItem(STORAGE) || '[]')); } catch { return []; } };
const localDay = () => { const date = new Date(); return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'); };
export default function InterventionWizard() {
  const [params] = useSearchParams();
  const query = useKitsQuery();
  const [drafts,setDrafts] = useState(readDrafts);
  const [kitId,setKitId] = useState(params.get('kitId') || '');
  const [reason,setReason] = useState('Vérification d’une anomalie');
  const [date,setDate] = useState('');
  const [assignee,setAssignee] = useState('');
  const [notes,setNotes] = useState('');
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const save = event => {
    event.preventDefault(); setError(''); setMessage('');
    if (!asList(query.data).some(kit => kit.kitId === kitId)) { setError('Sélectionnez un équipement présent dans le parc.'); return; }
    if (date && date < localDay()) { setError('La date souhaitée doit être aujourd’hui ou ultérieure.'); return; }
    const draft = {id:crypto.randomUUID(),kitId,reason,date,assignee:assignee.trim(),notes:notes.trim(),createdAt:new Date().toISOString()};
    try { const next=[draft,...drafts]; localStorage.setItem(STORAGE,JSON.stringify(next)); setDrafts(next); setMessage('Brouillon enregistré dans ce navigateur. Aucun ordre de mission n’a été envoyé.'); } catch { setError('Le stockage local est indisponible. Le brouillon n’a pas été enregistré.'); }
  };
  return <div className="ops-page"><div className="ops-page-heading"><div><p className="ops-eyebrow">EXPLOITATION</p><h1>Préparer la maintenance</h1><p>Reliez une action à un équipement et conservez les éléments nécessaires à sa validation.</p></div><span className="ops-badge medium">Brouillons locaux</span></div>
    <div className="ops-notice"><ClipboardList size={19}/><span>La planification et l’envoi aux techniciens ne sont pas connectés. Vos brouillons restent dans ce navigateur.</span></div>
    <div className="ops-maintenance-grid"><section className="ops-card"><div className="ops-card-heading"><h2>Nouvelle intervention</h2><Wrench size={19}/></div><form className="ops-form" onSubmit={save}>
      <label>Équipement concerné <span>*</span><select value={kitId} onChange={e=>setKitId(e.target.value)} required disabled={!query.isSuccess}><option value="">{query.isPending ? 'Chargement du parc…' : 'Sélectionner un kit'}</option>{asList(query.data).filter(kit=>kit.kitId).map(kit=><option key={kit.kitId} value={kit.kitId}>{kit.kitId} {kit.province ? '· '+kit.province : ''}</option>)}</select></label>
      {query.isError && <p role="alert">Le parc est indisponible. <button type="button" className="ops-text-link" onClick={()=>query.refetch()}>Réessayer</button></p>}
      <label>Motif<select value={reason} onChange={e=>setReason(e.target.value)}>{['Vérification d’une anomalie','Maintenance préventive','Maintenance corrective','Inspection après diagnostic IA','Installation / remplacement'].map(value=><option key={value}>{value}</option>)}</select></label>
      <div className="ops-form-row"><label>Date souhaitée<input type="date" min={localDay()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Intervenant envisagé<input value={assignee} onChange={e=>setAssignee(e.target.value)} placeholder="Nom ou équipe (facultatif)" maxLength={120}/></label></div>
      <label>Constats et actions proposées<textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Mesures observées, symptômes, vérifications à réaliser…" maxLength={4000}/></label>
      {message && <p className="ops-success" role="status"><Check size={17}/>{message}</p>}{error && <p className="ops-notice" role="alert">{error}</p>}
      <div className="ops-inline-actions"><button className="ops-button primary" disabled={!kitId || !query.isSuccess}><Save size={16}/>Enregistrer le brouillon</button>{kitId && <Link className="ops-text-link" to={detailUrl(kitId,true)}>Voir le diagnostic <ArrowUpRight size={15}/></Link>}</div>
    </form></section><section className="ops-card"><div className="ops-card-heading"><h2>Brouillons enregistrés</h2><span className="ops-counter">{drafts.length}</span></div>{drafts.length===0 ? <div className="ops-empty"><span className="ops-empty-icon"><ClipboardList size={26}/></span><h3>Aucune intervention préparée</h3><p>Commencez par un équipement et un constat. Le brouillon sera conservé ici.</p></div> : <div className="ops-drafts">{drafts.map(draft=><article key={draft.id}><span className="ops-badge info">Brouillon · non transmis</span><h3>{draft.kitId}</h3><p>{draft.reason}</p><small>{draft.date || 'Date à définir'} · {draft.assignee || 'Intervenant à définir'}</small>{draft.notes && <p className="ops-draft-notes">{draft.notes}</p>}<small>Créé le {formatDate(draft.createdAt)}</small><Link className="ops-text-link" to={detailUrl(draft.kitId)}>Fiche équipement <ArrowUpRight size={14}/></Link></article>)}</div>}</section></div>
  </div>;
}
