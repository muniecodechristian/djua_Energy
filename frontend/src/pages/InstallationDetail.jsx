import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, Clock, Calendar, User,
  Wrench, ShieldCheck, AlertCircle, Play, Check,
  ChevronRight, Navigation, AlertTriangle, RefreshCw
} from 'lucide-react';
import InstallationChat from '../components/InstallationChat';
import { toast } from 'sonner';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import {
  useGetInstallationDetail,
  useAssignTechnician,
  useUpdateInstallationStatus,
  useCommissionInstallation,
  useValidateInstallation
} from '../hooks/tanstack/useInstallations';
import './InstallationDetail.css';

const STATUS_CONFIG = {
  a_planifier: { label: 'À planifier', tone: 'pending', desc: 'En attente d’assignation d’un technicien' },
  planifiee: { label: 'Planifiée', tone: 'scheduled', desc: 'Date fixée et technicien assigné' },
  en_cours: { label: 'En cours', tone: 'in-progress', desc: 'Intervention sur le site client en cours' },
  en_attente: { label: 'En attente / Bloqué', tone: 'blocked', desc: 'Intervention suspendue (obstacle ou matériel)' },
  installee: { label: 'Installée', tone: 'installed', desc: 'Matériel posé, en attente de mise en service' },
  mise_en_service: { label: 'Mise en service', tone: 'commissioned', desc: 'Boîtier connecté appairé et checklist validée' },
  validee: { label: 'Validée & Conforme', tone: 'validated', desc: 'Contrôle qualité final approuvé par l’administration' },
};

function formatDateShort(date) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export default function InstallationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);

  // Action Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showStatusReviewModal, setShowStatusReviewModal] = useState(false);

  // Form states
  const [selectedTech, setSelectedTech] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [reviewedStatus, setReviewedStatus] = useState('');
  const [statusReviewNote, setStatusReviewNote] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [boxKitId, setBoxKitId] = useState('');
  const [gpsLat, setGpsLat] = useState(-4.3276);
  const [gpsLng, setGpsLng] = useState(15.3136);
  const [checklist, setChecklist] = useState({
    solarPanelsMounted: false,
    wiringChecked: false,
    inverterTested: false,
    safetyGrounding: false,
    iotBoxPaired: false,
    customerTrainingDone: false,
  });

  // Query dossier d'installation
  const { data: folder, isLoading, error, refetch } = useGetInstallationDetail(id);

  // The API scopes commercial choices to technicians under their shop manager.
  const { data: teamUsers } = useQuery({
    queryKey: ['team-technicians', currentUser?._id, currentUser?.role],
    queryFn: async () => {
      const res = await api.get('/auth/technicians');
      const list = res.data?.data || res.data?.users || [];
      return list;
    },
    enabled: Boolean(currentUser?.role === 'admin' || currentUser?.role === 'administration' || currentUser?.role === 'shop_manager' || currentUser?.role === 'commercial'),
  });

  // Mutations
  const assignMutation = useAssignTechnician();
  const statusMutation = useUpdateInstallationStatus();
  const commissionMutation = useCommissionInstallation();
  const validateMutation = useValidateInstallation();

  // Synchronisation des états formulaire lors du chargement du dossier
  React.useEffect(() => {
    if (folder) {
      setSelectedTech(folder.assignedTechnician?._id || '');
      setPlannedDate(folder.plannedDate || '');
      setBoxKitId(folder.kitId || '');
      if (folder.gpsCoordinates?.latitude) setGpsLat(folder.gpsCoordinates.latitude);
      if (folder.gpsCoordinates?.longitude) setGpsLng(folder.gpsCoordinates.longitude);
      if (folder.checklist) {
        setChecklist({
          solarPanelsMounted: Boolean(folder.checklist.solarPanelsMounted),
          wiringChecked: Boolean(folder.checklist.wiringChecked),
          inverterTested: Boolean(folder.checklist.inverterTested),
          safetyGrounding: Boolean(folder.checklist.safetyGrounding),
          iotBoxPaired: Boolean(folder.checklist.iotBoxPaired),
          customerTrainingDone: Boolean(folder.checklist.customerTrainingDone),
        });
      }
    }
  }, [folder]);

  if (isLoading) {
    return (
      <div className="inst-detail-loading-screen">
        <div className="inst-detail-spinner" />
        <p>Chargement du dossier d'installation…</p>
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="inst-detail-error-container">
        <AlertTriangle size={48} className="inst-detail-error-icon" />
        <h2>Dossier d’installation introuvable</h2>
        <p>Le dossier demandé n'existe pas ou vos droits d'accès sont insuffisants.</p>
        <Link to="/installations" className="inst-detail-back-btn">
          <ArrowLeft size={16} /> Retour au suivi des installations
        </Link>
      </div>
    );
  }

  const isAdmin = ['admin', 'administration'].includes(currentUser?.role);
  const isManager = currentUser?.role === 'shop_manager';
  const isCommercial = currentUser?.role === 'commercial';
  const isFolderOwner = isCommercial && (String(folder.createdBy?._id || folder.createdBy) === String(currentUser?._id));
  const isAssignedTech = currentUser?.role === 'technician' && String(folder.assignedTechnician?._id) === String(currentUser?._id);
  const canManage = isAdmin || isManager || isFolderOwner;
  const canOperate = isAdmin || isManager || isAssignedTech || isFolderOwner;

  const latestHistoryEvent = folder.history?.[folder.history.length - 1];
  const assignedTechnicianId = String(folder.assignedTechnician?._id || folder.assignedTechnician || '');
  const hasAssignedTechnician = Boolean(assignedTechnicianId);
  const assignedTechnicianName = folder.assignedTechnician?.prenom
    ? `${folder.assignedTechnician.prenom} ${folder.assignedTechnician.nom || ''}`.trim()
    : 'Technicien assigné';
  const latestEventAuthorId = String(latestHistoryEvent?.changedBy?._id || latestHistoryEvent?.changedBy || '');
  const technicianCreatorId = String(folder.assignedTechnician?.createdBy?._id || folder.assignedTechnician?.createdBy || '');
  const currentUserId = String(currentUser?._id || '');
  const currentUserParentId = String(currentUser?.createdBy?._id || currentUser?.createdBy || '');
  const canManageAssignedTechnician = isAdmin || (
    ['shop_manager', 'commercial'].includes(currentUser?.role)
    && Boolean(technicianCreatorId)
    && (technicianCreatorId === currentUserId || (currentUserParentId && technicianCreatorId === currentUserParentId))
  );
  const latestEventFromTechnician = Boolean(
    assignedTechnicianId
    && latestEventAuthorId === assignedTechnicianId
    && latestHistoryEvent?.status === folder.status,
  );
  const canReviewTechnicianStatus = canManage && canManageAssignedTechnician && latestEventFromTechnician;

  const openStatusReview = () => {
    setReviewedStatus(folder.status);
    setStatusReviewNote('');
    setShowStatusReviewModal(true);
  };

  // 1. Action : Assigner un technicien
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await assignMutation.mutateAsync({
        id: folder._id,
        technicianId: selectedTech,
        plannedDate,
        note: assignNote,
      });
      toast.success('Technicien et date planifiée enregistrés.');
      setShowAssignModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’assignation.');
    }
  };

  // 2. Action : Démarrer travaux
  const handleStartWork = async () => {
    try {
      await statusMutation.mutateAsync({
        id: folder._id,
        status: 'en_cours',
        note: `Travaux démarrés par ${currentUser?.prenom || 'le technicien'}`,
      });
      toast.success('Statut mis à jour : Installation en cours.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };

  // 3. Action : Bloquer
  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockReason.trim()) {
      toast.error('Veuillez préciser le motif du blocage.');
      return;
    }
    try {
      await statusMutation.mutateAsync({
        id: folder._id,
        status: 'en_attente',
        blockedReason: blockReason,
        note: `Intervention suspendue : ${blockReason}`,
      });
      toast.warning('Installation suspendue (en attente).');
      setShowBlockModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suspension.');
    }
  };

  // 4. Action : Reprendre les travaux
  const handleResumeWork = async () => {
    try {
      await statusMutation.mutateAsync({
        id: folder._id,
        status: 'en_cours',
        note: 'Reprise des travaux suite à la résolution du blocage.',
      });
      toast.success('Reprise de l’installation confirmée.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la reprise.');
    }
  };

  const handleStatusReviewSubmit = async (e) => {
    e.preventDefault();
    if (!canReviewTechnicianStatus || !reviewedStatus) {
      toast.error('Aucun statut récent transmis par le technicien ne peut être modifié.');
      return;
    }
    try {
      await statusMutation.mutateAsync({
        id: folder._id,
        status: reviewedStatus,
        note: statusReviewNote.trim() || `Statut terrain confirmé par ${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim(),
        reviewedTechnicianStatus: true,
      });
      toast.success('Le statut de l’installation a été mis à jour.');
      setShowStatusReviewModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du statut.');
    }
  };

  // 5. Action : Mise en service (Checklist + Boîtier IoT + GPS)
  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    const allChecked = Object.values(checklist).every(Boolean);
    if (!allChecked) {
      toast.error('Tous les 6 points de contrôle doivent être vérifiés avant la mise en service.');
      return;
    }
    if (!boxKitId.trim()) {
      toast.error('L’identifiant du Boîtier Djua connecté est obligatoire.');
      return;
    }
    try {
      await commissionMutation.mutateAsync({
        id: folder._id,
        kitId: boxKitId.trim(),
        gpsCoordinates: { latitude: Number(gpsLat), longitude: Number(gpsLng), accuracy: 5 },
        checklist,
        notes: 'Mise en service complète réalisée avec succès.',
      });
      toast.success('Installation mise en service avec succès !');
      setShowCommissionModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise en service.');
    }
  };

  // 6. Action : Validation finale administrative
  const handleAdminValidation = async () => {
    if (!window.confirm('Confirmez-vous la conformité finale de cette installation solaire ?')) return;
    try {
      await validateMutation.mutateAsync({
        id: folder._id,
        note: `Validation administrative de conformité par ${currentUser?.prenom} ${currentUser?.nom}`,
      });
      toast.success('Installation validée conforme et active !');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation.');
    }
  };

  // Géolocalisation automatique du navigateur
  const captureCurrentGps = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n’est pas supportée par votre navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        toast.success(`Coordonnées GPS capturées (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      () => toast.error('Impossible d’obtenir votre position GPS actuelle.')
    );
  };

  return (
    <div className="inst-detail-page">
      {/* Navigation supérieure */}
      <header className="inst-detail-nav">
        <div className="inst-detail-nav-left">
          <button
            type="button"
            className="inst-detail-back-link"
            onClick={() => navigate('/installations')}
          >
            <ArrowLeft size={16} /> Retour aux dossiers
          </button>
          <div className="inst-detail-breadcrumb">
            <span>Module 2 • Suivi des Installations</span>
            <ChevronRight size={14} />
            <strong>{folder.folderNumber}</strong>
          </div>
        </div>

        <div className="inst-detail-nav-actions">
          <button
            type="button"
            className="inst-detail-btn-refresh"
            onClick={() => refetch()}
            title="Rafraîchir les données"
          >
            <RefreshCw size={15} />
          </button>
          {canReviewTechnicianStatus && (
            <button type="button" className="inst-detail-btn-action" onClick={openStatusReview}>
              <RefreshCw size={14} /> Modifier le statut transmis
            </button>
          )}

          {/* Action : Assigner / Reprogrammer */}
          {((canManage && ['a_planifier', 'planifiee', 'en_attente'].includes(folder.status)) || (isAdmin && folder.status !== 'validee')) && (
            <button
              type="button"
              className="inst-detail-btn-action"
              onClick={() => setShowAssignModal(true)}
            >
              <Calendar size={15} />
              {folder.assignedTechnician ? 'Reprogrammer' : 'Assigner un technicien'}
            </button>
          )}

          {/* Action : Démarrer travaux */}
          {((canOperate && ['planifiee'].includes(folder.status)) || (isAdmin && ['a_planifier', 'planifiee'].includes(folder.status))) && (
            <button
              type="button"
              className="inst-detail-btn-action is-primary"
              onClick={handleStartWork}
            >
              <Play size={15} /> Démarrer l'installation
            </button>
          )}

          {/* Action : Suspendre / Bloquer */}
          {canOperate && ['en_cours'].includes(folder.status) && (
            <button
              type="button"
              className="inst-detail-btn-action is-warning"
              onClick={() => setShowBlockModal(true)}
            >
              <AlertCircle size={15} /> Signaler un blocage
            </button>
          )}

          {/* Action : Reprendre après blocage */}
          {canOperate && folder.status === 'en_attente' && (
            <button
              type="button"
              className="inst-detail-btn-action is-primary"
              onClick={handleResumeWork}
            >
              <Play size={15} /> Reprendre les travaux
            </button>
          )}

          {/* Action : Mise en service */}
          {((canOperate && ['en_cours', 'installee'].includes(folder.status)) || (isAdmin && ['planifiee', 'en_cours', 'installee'].includes(folder.status))) && (
            <button
              type="button"
              className="inst-detail-btn-action is-primary"
              onClick={() => setShowCommissionModal(true)}
            >
              <CheckCircle2 size={15} /> Mise en service
            </button>
          )}

          {/* Action : Validation Admin finale */}
          {isAdmin && ['installee', 'mise_en_service'].includes(folder.status) && (
            <button
              type="button"
              className="inst-detail-btn-action is-success"
              onClick={handleAdminValidation}
            >
              <ShieldCheck size={15} /> Validation Conforme (Admin)
            </button>
          )}

          {folder.status === 'validee' && (
            <span className="inst-detail-badge validated">
              <ShieldCheck size={14} /> Dossier Validé & Actif
            </span>
          )}
        </div>
      </header>

      <section className="inst-detail-hero inst-tech-contact-hero" aria-label="Technicien assigné">
        <div className="inst-assignment-box inst-assignment-tech-card">
          <div className="inst-assign-card-header">
            <span className="inst-assignment-lbl">Technicien assigné</span>
            {canManage && hasAssignedTechnician && (
              <button type="button" className="inst-assign-change-btn" onClick={() => setShowAssignModal(true)}>
                <Wrench size={12} /> Modifier
              </button>
            )}
          </div>
          {hasAssignedTechnician ? (
            <div className="inst-tech-badge">
              <div className="inst-tech-avatar">{folder.assignedTechnician?.prenom?.charAt(0) || 'T'}</div>
              <div>
                <strong>{assignedTechnicianName}</strong>
                <small>{folder.assignedTechnician?.zone || 'Zone Kinshasa'} · {folder.assignedTechnician?.phone || 'Contact non renseigné'}</small>
                {folder.technicianAcknowledgedAt ? (
                  <small className="inst-tech-assignment-status is-confirmed">
                    <Check size={12} /> Assignation acceptée le {formatDateShort(folder.technicianAcknowledgedAt)}
                  </small>
                ) : (
                  <small className="inst-tech-assignment-status">
                    <Clock size={12} /> En attente de confirmation
                  </small>
                )}
              </div>
            </div>
          ) : (
            <div className="inst-unassigned-action">
              <div className="inst-unassigned-icon"><User size={18} /></div>
              <div>
                <strong>Aucun technicien assigné</strong>
                <small>{canManage ? 'Assignez un technicien pour ouvrir la messagerie.' : 'La messagerie sera disponible après assignation.'}</small>
              </div>
              {canManage && (
                <button type="button" className="inst-detail-btn-action is-primary" onClick={() => setShowAssignModal(true)}>
                  Assigner
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      {hasAssignedTechnician && (
        <section className="inst-chat-section" aria-label="Messagerie avec le technicien">
          <h2>Messages avec {assignedTechnicianName}</h2>
          <InstallationChat
            installationId={folder._id}
            title={`Dossier ${folder.folderName || folder.folderNumber}`}
            recipientName={assignedTechnicianName}
          />
        </section>
      )}

      {/* MODAL 1 : Assigner un technicien & planifier date */}
      {showAssignModal && (
        <div className="inst-modal-backdrop" onClick={() => setShowAssignModal(false)}>
          <div className="inst-modal-box" onClick={e => e.stopPropagation()}>
            <div className="inst-modal-header">
              <h3>Assigner un technicien & planifier la date</h3>
              <button type="button" className="inst-modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={handleAssignSubmit} className="inst-modal-form">
              <label>
                Technicien responsable
                <select
                  required
                  value={selectedTech}
                  onChange={e => setSelectedTech(e.target.value)}
                >
                  <option value="">Sélectionner un technicien…</option>
                  {(teamUsers || []).map(t => (
                    <option key={t._id} value={t._id}>
                      {t.prenom} {t.nom} — {t.zone || 'Kinshasa'} ({t.identifier || t.phone})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date d'intervention prévue
                <input
                  type="date"
                  required
                  value={plannedDate}
                  onChange={e => setPlannedDate(e.target.value)}
                />
              </label>

              <label>
                Note pour l'équipe (optionnel)
                <textarea
                  rows={3}
                  value={assignNote}
                  placeholder="Instructions spécifiques pour le site…"
                  onChange={e => setAssignNote(e.target.value)}
                />
              </label>

              <div className="inst-modal-actions">
                <button type="button" className="inst-btn-ghost" onClick={() => setShowAssignModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="inst-btn-submit" disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? 'Enregistrement…' : 'Valider l’assignation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStatusReviewModal && (
        <div className="inst-modal-backdrop" onClick={() => setShowStatusReviewModal(false)}>
          <div className="inst-modal-box" onClick={e => e.stopPropagation()}>
            <div className="inst-modal-header">
              <h3>Vérifier le statut transmis par le technicien</h3>
              <button type="button" className="inst-modal-close" onClick={() => setShowStatusReviewModal(false)}>×</button>
            </div>
            <form onSubmit={handleStatusReviewSubmit} className="inst-modal-form">
              <p className="inst-status-review-context">
                Statut communiqué : <strong>{STATUS_CONFIG[folder.status]?.label || folder.status}</strong>
                {latestHistoryEvent?.note ? ` — ${latestHistoryEvent.note}` : ''}
              </p>
              <label>
                Statut à enregistrer
                <select required value={reviewedStatus} onChange={e => setReviewedStatus(e.target.value)}>
                  {Object.entries(STATUS_CONFIG)
                    .filter(([value]) => value !== 'validee')
                    .map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
                </select>
              </label>
              <label>
                Note de vérification (facultative)
                <textarea
                  rows={3}
                  value={statusReviewNote}
                  placeholder="Ajouter une précision sur la vérification du statut…"
                  onChange={e => setStatusReviewNote(e.target.value)}
                />
              </label>
              <div className="inst-modal-actions">
                <button type="button" className="inst-btn-ghost" onClick={() => setShowStatusReviewModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="inst-btn-submit" disabled={statusMutation.isPending || !canReviewTechnicianStatus}>
                  {statusMutation.isPending ? 'Enregistrement…' : 'Enregistrer le statut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : Signaler un blocage */}
      {showBlockModal && (
        <div className="inst-modal-backdrop" onClick={() => setShowBlockModal(false)}>
          <div className="inst-modal-box" onClick={e => e.stopPropagation()}>
            <div className="inst-modal-header">
              <h3>Signaler une suspension / blocage</h3>
              <button type="button" className="inst-modal-close" onClick={() => setShowBlockModal(false)}>×</button>
            </div>
            <form onSubmit={handleBlockSubmit} className="inst-modal-form">
              <label>
                Motif du blocage
                <select
                  required
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                >
                  <option value="">Sélectionner une raison…</option>
                  <option value="Accès au toit impossible / toiture fragile">Accès au toit impossible / toiture fragile</option>
                  <option value="Client absent lors de l'intervention">Client absent lors de l'intervention</option>
                  <option value="Câbles ou disjoncteur manquant sur place">Câbles ou disjoncteur manquant sur place</option>
                  <option value="Conditions météo dangereuses (pluie torrentielle)">Conditions météo dangereuses</option>
                  <option value="Autre motif spécifique">Autre motif spécifique</option>
                </select>
              </label>

              {blockReason === 'Autre motif spécifique' && (
                <label>
                  Précisions
                  <textarea
                    rows={3}
                    required
                    placeholder="Détaillez le problème rencontré…"
                    onChange={e => setBlockReason(e.target.value)}
                  />
                </label>
              )}

              <div className="inst-modal-actions">
                <button type="button" className="inst-btn-ghost" onClick={() => setShowBlockModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="inst-btn-submit is-danger" disabled={statusMutation.isPending}>
                  {statusMutation.isPending ? 'Enregistrement…' : 'Suspendre l’installation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 : Mise en service complète */}
      {showCommissionModal && (
        <div className="inst-modal-backdrop" onClick={() => setShowCommissionModal(false)}>
          <div className="inst-modal-box is-large" onClick={e => e.stopPropagation()}>
            <div className="inst-modal-header">
              <h3>Mise en service de l'installation solaire</h3>
              <button type="button" className="inst-modal-close" onClick={() => setShowCommissionModal(false)}>×</button>
            </div>
            <form onSubmit={handleCommissionSubmit} className="inst-modal-form">
              <div className="inst-commission-section">
                <h4>1. Appairage du Boîtier Connecté Djua</h4>
                <label>
                  Identifiant de la Box IoT
                  <input
                    type="text"
                    required
                    placeholder="Ex: DJ-KIT-48V-0012"
                    value={boxKitId}
                    onChange={e => setBoxKitId(e.target.value)}
                  />
                </label>
              </div>

              <div className="inst-commission-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>2. Coordonnées GPS du site</h4>
                  <button type="button" className="inst-btn-gps" onClick={captureCurrentGps}>
                    <Navigation size={13} /> Capturer ma position actuelle
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>
                    Latitude
                    <input
                      type="number"
                      step="any"
                      required
                      value={gpsLat}
                      onChange={e => setGpsLat(e.target.value)}
                    />
                  </label>
                  <label>
                    Longitude
                    <input
                      type="number"
                      step="any"
                      required
                      value={gpsLng}
                      onChange={e => setGpsLng(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="inst-commission-section">
                <h4>3. Checklist des 6 points de sécurité</h4>
                <div className="inst-switch-list">
                  <label className="inst-switch-item">
                    <input
                      type="checkbox"
                      checked={checklist.solarPanelsMounted}
                      onChange={e => setChecklist(prev => ({ ...prev, solarPanelsMounted: e.target.checked }))}
                    />
                    <span>1. Panneaux solaires montés et solidement fixés</span>
                  </label>

                  <label className="inst-switch-item">
                    <input
                      type="checkbox"
                      checked={checklist.wiringChecked}
                      onChange={e => setChecklist(prev => ({ ...prev, wiringChecked: e.target.checked }))}
                    />
                    <span>2. Câblage DC et AC vérifié et sans risque de court-circuit</span>
                  </label>

                  <label className="inst-switch-item">
                    <input
                      type="checkbox"
                      checked={checklist.inverterTested}
                      onChange={e => setChecklist(prev => ({ ...prev, inverterTested: e.target.checked }))}
                    />
                    <span>3. Onduleur testé sous charge et fonctionnel</span>
                  </label>

                  <label className="inst-switch-item">
                    <input
                      type="checkbox"
                      checked={checklist.safetyGrounding}
                      onChange={e => setChecklist(prev => ({ ...prev, safetyGrounding: e.target.checked }))}
                    />
                    <span>4. Mise à la terre installée et parafoudre en place</span>
                  </label>

                  <label className="inst-switch-item">
                    <input
                      type="checkbox"
                      checked={checklist.iotBoxPaired}
                      onChange={e => setChecklist(prev => ({ ...prev, iotBoxPaired: e.target.checked }))}
                    />
                    <span>5. Boîtier connecté Djua alimenté et signal reçu</span>
                  </label>

                  <label className="inst-switch-item">
                    <input
                      type="checkbox"
                      checked={checklist.customerTrainingDone}
                      onChange={e => setChecklist(prev => ({ ...prev, customerTrainingDone: e.target.checked }))}
                    />
                    <span>6. Client formé à l'utilisation et aux alertes</span>
                  </label>
                </div>
              </div>

              <div className="inst-modal-actions">
                <button type="button" className="inst-btn-ghost" onClick={() => setShowCommissionModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="inst-btn-submit is-primary" disabled={commissionMutation.isPending}>
                  {commissionMutation.isPending ? 'Validation…' : 'Confirmer la mise en service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
