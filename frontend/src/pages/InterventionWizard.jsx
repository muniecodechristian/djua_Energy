import './InterventionWizard.css';
import PageEntrance from '../components/PageEntrance';
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Wrench, Plus, Check, ArrowUpRight, ClipboardList, CheckCircle2,
  UserCheck, FileText, Search, X, Calendar, AlertCircle
} from 'lucide-react';
import { useKitsQuery } from '../hooks/tanstack/useKitQueries';
import {
  useCreateIntervention,
  useGetInterventions,
  useUpdateInterventionStatus,
  useTeamTechnicians
} from '../hooks/tanstack/useInterventions';
import { asList, detailUrl, formatDate } from '../lib/operations';
import { ListSkeleton } from '../components/PageSkeleton';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import { getAppSocket } from '../lib/socket';
import { useQueryClient } from '@tanstack/react-query';

const localDay = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
};

export default function InterventionWizard() {
  const [params] = useSearchParams();
  const query = useKitsQuery();
  const interventionsQuery = useGetInterventions();
  const createIntervention = useCreateIntervention();
  const updateStatus = useUpdateInterventionStatus();
  const techniciansQuery = useTeamTechnicians();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const isShopManager = user?.role === 'shop_manager' || user?.role === 'admin';

  // ── Socket.io écoute temps réel ───────────────────────────────────────────
  useEffect(() => {
    const socket = getAppSocket();
    const handleUpdate = () => {
      queryClient.invalidateQueries(['interventions']);
    };

    socket.on('intervention:new', handleUpdate);
    socket.on('intervention:status-updated', handleUpdate);
    socket.on('intervention:report-submitted', handleUpdate);
    socket.on('intervention:reassigned', handleUpdate);

    return () => {
      socket.off('intervention:new', handleUpdate);
      socket.off('intervention:status-updated', handleUpdate);
      socket.off('intervention:report-submitted', handleUpdate);
      socket.off('intervention:reassigned', handleUpdate);
    };
  }, [queryClient]);

  const interventions = asList(interventionsQuery.data);
  const errorStatus = interventionsQuery.error?.response?.status;
  const accessDenied = errorStatus === 401 || errorStatus === 403;
  const loadErrorTitle = errorStatus === 401 ? 'Connectez-vous pour consulter les interventions.'
    : errorStatus === 403 ? 'Votre compte ne peut pas consulter ces interventions.'
    : !interventionsQuery.error?.response ? 'Le serveur est injoignable.'
    : 'Impossible de charger les interventions.';
  const loadErrorDescription = errorStatus === 401 ? 'Cette page est accessible, mais les missions de votre zone demandent une session valide.'
    : errorStatus === 403 ? 'L’accès est réservé aux responsables de shop, aux techniciens et aux administrateurs autorisés.'
    : !interventionsQuery.error?.response ? 'Vérifiez que le backend est démarré et accessible depuis ce navigateur.'
    : 'Le serveur a renvoyé une erreur. Réessayez dans un instant.';


  // ── Filtres & États d'affichage ───────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'planned' | 'in_progress' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportIntervention, setSelectedReportIntervention] = useState(null);

  // ── Modal de création d'intervention ──────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(params.get('kitId')));
  const [kitId, setKitId] = useState(params.get('kitId') || '');
  const [reason, setReason] = useState('Vérification d’une anomalie');
  const [type, setType] = useState('maintenance');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState('Moyenne');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');

  const technicians = asList(techniciansQuery.data);

  // Calcul des statistiques
  const plannedCount = interventions.filter((i) => i.status === 'Planifiée' || !i.status).length;
  const inProgressCount = interventions.filter((i) => i.status === 'En cours').length;
  const completedCount = interventions.filter((i) => i.status === 'Terminée').length;

  const handleSaveIntervention = (event) => {
    event.preventDefault();
    setFormError('');
    setFormMessage('');

    if (!asList(query.data).some((kit) => kit.kitId === kitId)) {
      setFormError('Veuillez sélectionner un équipement présent dans votre zone.');
      return;
    }
    if (date && date < localDay()) {
      setFormError('La date souhaitée doit être aujourd’hui ou ultérieure.');
      return;
    }
    if (!assignedTo) {
      setFormError('Veuillez sélectionner le technicien assigné.');
      return;
    }

    createIntervention.mutate(
      {
        kitId,
        title: reason,
        description: notes.trim() || 'Aucune consigne particulière',
        type,
        priority,
        assignedTo,
        scheduledDate: date ? new Date(date).toISOString() : new Date().toISOString(),
      },
      {
        onSuccess: (response) => {
          const whatsapp = response?.data;
          setFormMessage(
            whatsapp?.whatsappSent
              ? 'Intervention enregistrée et message WhatsApp envoyé au technicien.'
              : `Intervention enregistrée, mais WhatsApp n’a pas été envoyé${whatsapp?.whatsappError ? ` : ${whatsapp.whatsappError}` : '.'}`,
          );
          setTimeout(() => {
            setIsCreateModalOpen(false);
            setFormMessage('');
            setNotes('');
            setDate('');
            setAssignedTo('');
          }, 1200);
        },
        onError: (err) => {
          setFormError(err?.response?.data?.message || 'Erreur lors de la création.');
        },
      }
    );
  };

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'Critique': return 'maintenance-priority-critical';
      case 'Haute': return 'maintenance-priority-high';
      case 'Moyenne': return 'maintenance-priority-normal';
      default: return 'border-slate-500/30 maintenance-muted bg-slate-500/10';
    }
  };

  // Filtrage des interventions
  const filteredInterventions = interventions.filter((item) => {
    // Filtre d'onglet
    if (activeTab === 'planned' && item.status !== 'Planifiée' && item.status) return false;
    if (activeTab === 'in_progress' && item.status !== 'En cours') return false;
    if (activeTab === 'completed' && item.status !== 'Terminée') return false;

    // Filtre de recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const techName = `${item.assignedTo?.prenom || ''} ${item.assignedTo?.nom || ''}`.toLowerCase();
      const matchKit = (item.kitId || '').toLowerCase().includes(q);
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchTech = techName.includes(q);
      return matchKit || matchTitle || matchTech;
    }
    return true;
  });

  return (
    <PageEntrance className="ops-page maintenance-page">
      <header className="maintenance-header">
        <div>
          <p className="maintenance-eyebrow">Équipements · Suivi terrain</p>
          <h1>Maintenance & interventions</h1>
          <p className="maintenance-intro">Planifiez les missions de votre zone et retrouvez les comptes-rendus de vos techniciens.</p>
        </div>
        {isShopManager && (
          <button onClick={() => setIsCreateModalOpen(true)} className="ops-button maintenance-primary">
            <Plus size={16} /> Nouvelle intervention
          </button>
        )}
      </header>

      <dl className="maintenance-summary" aria-label="Bilan des interventions">
        {[
          ['Total des interventions', interventions.length],
          ['À réaliser', plannedCount],
          ['En cours', inProgressCount],
          ['Terminées', completedCount],
        ].map(([label, count]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{interventionsQuery.isLoading || interventionsQuery.isError ? '—' : count}</dd>
          </div>
        ))}
      </dl>

      <section className="maintenance-register" aria-label="Liste des interventions">
        <div className="maintenance-register-heading">
          <div>
            <h2>Interventions</h2>
            <p>Le suivi des missions, de la planification au rapport.</p>
          </div>
          <label className="maintenance-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label="Rechercher une intervention par kit, technicien ou titre"
              placeholder="Kit, technicien ou titre…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" aria-label="Effacer la recherche" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </label>
        </div>
        <div className="maintenance-filters" aria-label="Filtrer les interventions par statut">
          {[
            { id: 'all', label: 'Toutes', count: interventions.length },
            { id: 'planned', label: 'À réaliser', count: plannedCount },
            { id: 'in_progress', label: 'En cours', count: inProgressCount },
            { id: 'completed', label: 'Terminées', count: completedCount },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id}>
              {tab.label}<span>{interventionsQuery.isLoading || interventionsQuery.isError ? '—' : tab.count}</span>
            </button>
          ))}
        </div>
        {interventionsQuery.isError && (
          <div className="maintenance-error" role="alert">
            <AlertCircle size={18} />
            <div><strong>{loadErrorTitle}</strong><p>{loadErrorDescription}</p></div>
            {accessDenied ? <Link className="ops-button" to="/">{errorStatus === 401 ? 'Se connecter' : 'Changer de compte'}</Link>
              : <button className="ops-button" onClick={() => interventionsQuery.refetch()}>Réessayer</button>}

          </div>
        )}
        {interventionsQuery.isLoading ? (
          <ListSkeleton />
        ) : interventionsQuery.isError ? null : filteredInterventions.length === 0 ? (
          <div className="ops-empty maintenance-empty">
            <span className="maintenance-empty-icon">
              <ClipboardList size={25} strokeWidth={1.5} />
            </span>
            <h3 className="text-base font-semibold maintenance-ink">{searchQuery || activeTab !== 'all' ? 'Aucune intervention trouvée' : 'Vos interventions apparaîtront ici'}</h3>
            <p className="text-xs maintenance-muted mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Aucun résultat ne correspond à votre recherche.'
                : activeTab === 'all'
                ? 'Retrouvez ici les missions de votre zone, leur technicien et leur compte-rendu.'
                : 'Aucune intervention ne correspond à ce filtre.'}
            </p>
            {isShopManager && !searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="ops-button maintenance-primary text-xs mt-4 inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Créer la première intervention
              </button>
            )}
          </div>
        ) : (
          <div className="maintenance-list">
            {filteredInterventions.map((intervention) => {
              const assignedTech = intervention.assignedTo;
              const isDone = intervention.status === 'Terminée';
              const isInProgress = intervention.status === 'En cours';

              return (
                <article
                  key={intervention._id}
                  className="maintenance-item"
                >
                  <div className="space-y-2.5">
                    {/* Header carte */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-md uppercase tracking-wider ${
                              isDone
                                ? 'bg-emerald-500/20 maintenance-ink border border-emerald-500/30'
                                : isInProgress
                                ? 'bg-sky-500/20 maintenance-ink border border-sky-500/30'
                                : 'bg-amber-500/20 maintenance-ink border border-amber-500/30'
                            }`}
                          >
                            {intervention.status || 'Planifiée'}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPriorityBadgeClass(intervention.priority)}`}>
                            {intervention.priority || 'Normale'}
                          </span>
                          <span className="text-[11px] maintenance-muted capitalize">
                            {intervention.type || 'Maintenance'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold maintenance-ink flex items-center gap-2">
                          {intervention.kitId}
                          <Link
                            className="maintenance-muted hover:underline transition-colors"
                            to={detailUrl(intervention.kitId)}
                            title="Ouvrir la fiche diagnostic du kit"
                          >
                            <ArrowUpRight size={15} />
                          </Link>
                        </h3>
                      </div>

                      {/* Action rapide clôture par le manager */}
                      {isShopManager && !isDone && (
                        <button
                          onClick={() => updateStatus.mutate({ id: intervention._id, status: 'Terminée' })}
                          disabled={updateStatus.isLoading}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 maintenance-ink rounded-lg border border-emerald-500/30 transition-colors flex items-center gap-1"
                          title="Marquer manuellement comme terminée"
                        >
                          <CheckCircle2 size={13} />
                          Clôturer
                        </button>
                      )}
                    </div>

                    {/* Titre & Consignes */}
                    <div>
                      <p className="text-sm font-semibold maintenance-ink">{intervention.title}</p>
                      {intervention.description && (
                        <p className="text-xs maintenance-muted mt-1 maintenance-soft p-2.5 rounded-lg border border-white/5 line-clamp-2">
                          {intervention.description}
                        </p>
                      )}
                    </div>

                    {/* ── Compte-rendu technique envoyé par le technicien ────── */}
                    {intervention.report ? (
                      <div className="maintenance-soft border border-emerald-500/30 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold maintenance-ink flex items-center gap-1.5">
                            <FileText size={14} />
                            Rapport technique du technicien
                          </span>
                          <button
                            onClick={() => setSelectedReportIntervention(intervention)}
                            className="text-[11px] maintenance-ink hover:underline font-semibold"
                          >
                            Voir détails
                          </button>
                        </div>
                        <p className="text-xs maintenance-ink leading-relaxed line-clamp-2">
                          {intervention.report}
                        </p>
                      </div>
                    ) : (
                      isDone && (
                        <p className="text-[11px] maintenance-muted italic">
                          Clôturée sans rapport écrit.
                        </p>
                      )
                    )}
                  </div>

                  {/* Footer carte : Technicien & Date */}
                  <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t maintenance-border text-[11px] gap-2">
                    <div className="flex items-center gap-1.5 maintenance-ink">
                      <UserCheck size={14} className="maintenance-ink" />
                      <span>
                        {assignedTech?.prenom ? `${assignedTech.prenom} ${assignedTech.nom}` : 'Technicien assigné'}
                        {assignedTech?.seniority === 'senior' && (
                          <span className="ml-1 maintenance-ink font-bold">(Senior)</span>
                        )}
                        {assignedTech?.zone && (
                          <span className="ml-1 maintenance-muted font-normal">({assignedTech.zone})</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 maintenance-muted">
                      <Calendar size={13} />
                      <span>{formatDate(intervention.scheduledDate || intervention.createdAt)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── MODAL : CRÉER UNE INTERVENTION (Shop Manager) ───────────────────── */}
      {isCreateModalOpen && (
        <div className="maintenance-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label="Nouvelle intervention" className="ops-card maintenance-dialog w-full max-w-xl border maintenance-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b maintenance-border mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--ops-canvas)] maintenance-ink">
                  <Wrench size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold maintenance-ink">Créer une intervention</h2>
                  <p className="text-xs maintenance-muted">Assignez une mission à un technicien de votre zone</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Fermer le formulaire"
                className="maintenance-muted hover:underline p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulaire Modal */}
            <form onSubmit={handleSaveIntervention} className="ops-form space-y-3">
              <label>
                Équipement concerné <span>*</span>
                <select
                  value={kitId}
                  onChange={(e) => setKitId(e.target.value)}
                  required
                  disabled={!query.isSuccess}
                >
                  <option value="">{query.isPending ? 'Chargement du parc…' : 'Sélectionner un kit'}</option>
                  {asList(query.data)
                    .filter((kit) => kit.kitId)
                    .map((kit) => (
                      <option key={kit.kitId} value={kit.kitId}>
                        {kit.kitId} {kit.zone ? `(Zone: ${kit.zone})` : kit.province ? `· ${kit.province}` : ''}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Technicien assigné <span>*</span>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                  disabled={techniciansQuery.isLoading}
                >
                  <option value="">
                    {techniciansQuery.isLoading ? 'Chargement des techniciens…' : 'Sélectionner un technicien de votre équipe'}
                  </option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.prenom} {t.nom} {t.seniority === 'senior' ? '(Senior)' : ''} {t.zone ? `[Zone: ${t.zone}]` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="ops-form-row">
                <label>
                  Type d'intervention
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="maintenance">Maintenance préventive</option>
                    <option value="repair">Dépannage / Réparation</option>
                    <option value="inspection">Inspection technique</option>
                    <option value="installation">Installation / Remplacement</option>
                  </select>
                </label>
                <label>
                  Priorité
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                    <option value="Critique">Critique</option>
                  </select>
                </label>
              </div>

              <div className="ops-form-row">
                <label>
                  Motif
                  <select value={reason} onChange={(e) => setReason(e.target.value)}>
                    {[
                      'Vérification d’une anomalie',
                      'Maintenance préventive',
                      'Maintenance corrective',
                      'Inspection après diagnostic IA',
                      'Installation / remplacement',
                    ].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Date souhaitée
                  <input
                    type="date"
                    min={localDay()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
              </div>

              <label>
                Consignes / Instructions pour le technicien
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Points de mesure, consignes de sécurité, pièces à prévoir…"
                  maxLength={4000}
                />
              </label>

              {formMessage && (
                <p className="ops-success flex items-center gap-1.5" role="status">
                  <Check size={16} /> {formMessage}
                </p>
              )}
              {formError && (
                <p className="ops-notice flex items-center gap-1.5" role="alert">
                  <AlertCircle size={16} /> {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t maintenance-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="ops-button text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!kitId || !assignedTo || createIntervention.isLoading}
                  className="ops-button maintenance-primary text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  {createIntervention.isLoading ? 'Envoi en cours…' : 'Créer & Notifier le technicien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL : DÉTAIL DU RAPPORT TECHNIQUE ──────────────────────────────── */}
      {selectedReportIntervention && (
        <div className="maintenance-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label="Compte-rendu technique" className="ops-card maintenance-dialog w-full max-w-lg border border-emerald-500/30 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b maintenance-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 maintenance-ink">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold maintenance-ink">Compte-rendu technique</h2>
                  <p className="text-xs maintenance-muted">Kit {selectedReportIntervention.kitId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportIntervention(null)}
                aria-label="Fermer le compte-rendu"
                className="maintenance-muted hover:underline p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 maintenance-soft rounded-lg border maintenance-border text-xs space-y-1.5">
                <div className="flex justify-between maintenance-muted">
                  <span>Motif :</span>
                  <span className="font-semibold maintenance-ink">{selectedReportIntervention.title}</span>
                </div>
                <div className="flex justify-between maintenance-muted">
                  <span>Technicien :</span>
                  <span className="font-semibold maintenance-ink">
                    {selectedReportIntervention.assignedTo?.prenom} {selectedReportIntervention.assignedTo?.nom}
                  </span>
                </div>
                <div className="flex justify-between maintenance-muted">
                  <span>Date d'enregistrement :</span>
                  <span className="maintenance-ink">{formatDate(selectedReportIntervention.updatedAt || selectedReportIntervention.scheduledDate)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold maintenance-ink mb-1.5">Rapport rédigé par le technicien :</p>
                <div className="maintenance-soft border border-emerald-500/30 rounded-xl p-3.5 text-xs maintenance-ink leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedReportIntervention.report || 'Aucun rapport rédigé.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t maintenance-border">
              <button
                onClick={() => setSelectedReportIntervention(null)}
                aria-label="Fermer le compte-rendu"
                className="ops-button text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </PageEntrance>
  );
}
