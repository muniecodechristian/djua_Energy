import PageEntrance from '../components/PageEntrance';
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Wrench, Save, Check, ArrowUpRight, ClipboardList, Clock, CheckCircle2 } from 'lucide-react';
import { useKitsQuery } from '../hooks/tanstack/useKitQueries';
import { useCreateIntervention, useGetInterventions, useUpdateInterventionStatus } from '../hooks/tanstack/useInterventions';
import { asList, detailUrl, formatDate } from '../lib/operations';

const localDay = () => { const date = new Date(); return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'); };

export default function InterventionWizard() {
  const [params] = useSearchParams();
  const query = useKitsQuery();
  const interventionsQuery = useGetInterventions();
  const createIntervention = useCreateIntervention();
  const updateStatus = useUpdateInterventionStatus();
  
  const interventions = asList(interventionsQuery.data);
  const plannedInterventions = interventions.filter(i => i.status !== 'Terminée');
  const completedInterventions = interventions.filter(i => i.status === 'Terminée');

  const [kitId, setKitId] = useState(params.get('kitId') || '');
  const [reason, setReason] = useState('Vérification d’une anomalie');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState('Moyenne');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('planned');

  const save = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    
    if (!asList(query.data).some(kit => kit.kitId === kitId)) {
      setError('Sélectionnez un équipement présent dans le parc.');
      return;
    }
    if (date && date < localDay()) {
      setError('La date souhaitée doit être aujourd’hui ou ultérieure.');
      return;
    }
    
    createIntervention.mutate({
      kitId,
      title: reason,
      description: notes.trim() || 'Aucune description',
      priority,
      scheduledDate: date || new Date().toISOString()
    }, {
      onSuccess: () => {
        setMessage('Intervention enregistrée avec succès (conservée pendant 2 semaines).');
        setNotes('');
        setDate('');
        setActiveTab('planned');
      },
      onError: () => {
        setError('Erreur lors de l’enregistrement de l’intervention.');
      }
    });
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Critique': return 'var(--text-error)';
      case 'Haute': return '#ea580c';
      case 'Moyenne': return '#ca8a04';
      default: return 'var(--text-muted)';
    }
  };

  const displayedList = activeTab === 'planned' ? plannedInterventions : completedInterventions;

  return (
    <PageEntrance className="ops-page">
      <div className="ops-page-heading">
        <div>
          <p className="ops-eyebrow">EXPLOITATION</p>
          <h1>Maintenance des équipements</h1>
          <p>Planifiez et suivez vos interventions de maintenance (historique conservé 14 jours).</p>
        </div>
        <span className="ops-badge medium">Base de données</span>
      </div>

      <div className="ops-notice">
        <Clock size={19}/>
        <span>Les interventions terminées ou anciennes sont automatiquement purgées de cette vue après 14 jours par le système.</span>
      </div>

      <div className="ops-maintenance-grid">
        <section className="ops-card">
          <div className="ops-card-heading">
            <h2>Planifier une intervention</h2>
            <Wrench size={19}/>
          </div>
          <form className="ops-form" onSubmit={save}>
            <label>Équipement concerné <span>*</span>
              <select value={kitId} onChange={e=>setKitId(e.target.value)} required disabled={!query.isSuccess}>
                <option value="">{query.isPending ? 'Chargement du parc…' : 'Sélectionner un kit'}</option>
                {asList(query.data).filter(kit=>kit.kitId).map(kit=><option key={kit.kitId} value={kit.kitId}>{kit.kitId} {kit.province ? '· '+kit.province : ''}</option>)}
              </select>
            </label>
            {query.isError && <p role="alert">Le parc est indisponible. <button type="button" className="ops-text-link" onClick={()=>query.refetch()}>Réessayer</button></p>}
            
            <label>Motif
              <select value={reason} onChange={e=>setReason(e.target.value)}>
                {['Vérification d’une anomalie','Maintenance préventive','Maintenance corrective','Inspection après diagnostic IA','Installation / remplacement'].map(value=><option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            
            <div className="ops-form-row">
              <label>Date souhaitée
                <input type="date" min={localDay()} value={date} onChange={e=>setDate(e.target.value)}/>
              </label>
              <label>Priorité
                <select value={priority} onChange={e=>setPriority(e.target.value)}>
                  <option value="Basse">Basse</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Haute">Haute</option>
                  <option value="Critique">Critique</option>
                </select>
              </label>
            </div>
            
            <label>Constats et actions proposées
              <textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Mesures observées, symptômes, vérifications à réaliser…" maxLength={4000}/>
            </label>
            
            {message && <p className="ops-success" role="status"><Check size={17}/>{message}</p>}
            {error && <p className="ops-notice" role="alert">{error}</p>}
            
            <div className="ops-inline-actions">
              <button className="ops-button primary" disabled={!kitId || !query.isSuccess || createIntervention.isLoading}>
                <Save size={16}/>
                {createIntervention.isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              {kitId && <Link className="ops-text-link" to={detailUrl(kitId,true)}>Voir le diagnostic <ArrowUpRight size={15}/></Link>}
            </div>
          </form>
        </section>

        <section className="ops-card flex flex-col h-full">
          <div className="ops-card-heading">
            <h2>Suivi des interventions</h2>
            <div className="flex bg-[#1e293b] rounded-lg p-1 overflow-hidden border border-[#334155]">
              <button 
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'planned' ? 'bg-[#ff7900] text-black' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setActiveTab('planned')}
              >
                Planifiées ({plannedInterventions.length})
              </button>
              <button 
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'completed' ? 'bg-[#10b981] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setActiveTab('completed')}
              >
                Terminées ({completedInterventions.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            {interventionsQuery.isLoading ? (
              <div className="ops-empty">
                <h3>Chargement...</h3>
              </div>
            ) : displayedList.length === 0 ? (
              <div className="ops-empty">
                <span className="ops-empty-icon"><ClipboardList size={26}/></span>
                <h3>{activeTab === 'planned' ? 'Aucune intervention prévue' : 'Aucune intervention terminée'}</h3>
                {activeTab === 'planned' && <p>Commencez par planifier une intervention à gauche.</p>}
              </div>
            ) : (
              <div className="ops-drafts space-y-3">
                {displayedList.map(intervention => (
                  <article key={intervention._id} className={`p-4 rounded-xl border ${activeTab === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80' : 'border-slate-700 bg-slate-800/50'} relative`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`ops-badge ${activeTab === 'completed' ? 'success' : 'info'} mb-1`}>{intervention.status || 'Planifiée'}</span>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          {intervention.kitId}
                          <Link className="text-slate-400 hover:text-[#ff7900]" to={detailUrl(intervention.kitId)} title="Fiche équipement">
                            <ArrowUpRight size={14}/>
                          </Link>
                        </h3>
                      </div>
                      {activeTab === 'planned' && (
                        <button 
                          onClick={() => updateStatus.mutate({ id: intervention._id, status: 'Terminée' })}
                          disabled={updateStatus.isLoading}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition-colors"
                          title="Marquer comme fait"
                        >
                          <CheckCircle2 size={14} /> Fait
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-300 font-medium">{intervention.title}</p>
                    
                    {intervention.description && <p className="text-xs text-slate-400 mt-2 bg-black/20 p-2 rounded-lg border border-white/5">{intervention.description}</p>}
                    
                    <div className="flex items-center justify-between mt-3 text-[10px]">
                      <small style={{ color: activeTab === 'planned' ? getPriorityColor(intervention.priority) : '#64748b' }} className="font-bold uppercase tracking-wider">
                        Priorité: {intervention.priority}
                      </small>
                      <small className="text-slate-500">
                        Prévue: {formatDate(intervention.scheduledDate || intervention.createdAt)}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageEntrance>
  );
}
