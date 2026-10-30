import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, Clock, Calendar, User, MapPin,
  Cpu, Wrench, ShieldCheck, AlertCircle, Play, Check,
  FileText, ExternalLink, ChevronRight, Layers, Phone,
  Activity, Navigation, Compass, AlertTriangle, RefreshCw, MessageSquare
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

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '—';
  const displayCurrency = (!currency || currency === 'XAF' || currency === 'CDF' || currency === 'FC') ? 'Francs' : currency;
  return new Intl.NumberFormat('fr-CD', { maximumFractionDigits: 0 }).format(amount) + ' ' + displayCurrency;
}

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

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
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'checklist' | 'iot' | 'history'

  // Action Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);

  // Form states
  const [selectedTech, setSelectedTech] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [assignNote, setAssignNote] = useState('');
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

  // Query techniciens (pour assignation)
  const { data: teamUsers } = useQuery({
    queryKey: ['team-technicians'],
    queryFn: async () => {
      const res = await api.get('/users/all-users');
      const list = res.data?.users || res.data?.data || [];
      return list.filter(u => u.role === 'technician');
    },
    enabled: Boolean(currentUser?.role === 'admin' || currentUser?.role === 'administration' || currentUser?.role === 'shop_manager'),
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
  const isAssignedTech = currentUser?.role === 'technician' && String(folder.assignedTechnician?._id) === String(currentUser?._id);
  const canManage = isAdmin || isManager;
  const canOperate = isAdmin || isManager || isAssignedTech;

  const status = STATUS_CONFIG[folder.status] || { label: folder.status, tone: 'pending', desc: '' };
  const customer = folder.customer || {};
  const site = folder.site || {};
  const system = folder.system || {};
  const appliances = folder.appliances || [];

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

  const checklistCount = Object.values(checklist).filter(Boolean).length;

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

      {/* Hero Header Dossier */}
      <section className="inst-detail-hero">
        <div className="inst-detail-hero-main">
          <div className="inst-detail-title-row">
            <span className={`inst-detail-badge ${status.tone}`}>
              <span className="inst-badge-dot" />
              {status.label}
            </span>
            {folder.isOverdue && (
              <span className="inst-overdue-pill" title="La date d'intervention prévue est dépassée sans confirmation d'installation">
                <AlertTriangle size={12} /> Échéance dépassée
              </span>
            )}
            <span className="inst-detail-folder-num">{folder.folderNumber}</span>
            <span className="inst-detail-creator-pill">
              Initié par <strong>{folder.createdBy?.prenom} {folder.createdBy?.nom || 'Validateur'}</strong> ({folder.createdBy?.role || 'commercial'})
            </span>
          </div>

          <h1 className="inst-detail-title">
            Installation Solaire • {customer.name || 'Client sans nom'}
          </h1>

          <div className="inst-detail-meta-row">
            <span className="inst-detail-meta-item">
              <MapPin size={14} />
              {[site.adresse, site.quartier, site.ville || 'Kinshasa'].filter(Boolean).join(', ') || 'Adresse non renseignée'}
            </span>
            <span className="inst-detail-meta-divider">•</span>
            <span className="inst-detail-meta-item">
              <Phone size={14} /> {customer.phone || '—'}
            </span>
            <span className="inst-detail-meta-divider">•</span>
            <Link to={`/devis/${encodeURIComponent(folder.quoteNumber)}`} className="inst-detail-quote-link">
              <FileText size={14} /> Devis associé {folder.quoteNumber} <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Bloc Technicien & Planning */}
        <div className="inst-detail-hero-assignment">
          <div className="inst-assignment-box">
            <span className="inst-assignment-lbl">Technicien assigné</span>
            {folder.assignedTechnician ? (
              <div className="inst-tech-badge">
                <div className="inst-tech-avatar">
                  {folder.assignedTechnician.prenom?.charAt(0) || 'T'}
                </div>
                <div>
                  <strong>{folder.assignedTechnician.prenom} {folder.assignedTechnician.nom}</strong>
                  <small>{folder.assignedTechnician.zone || 'Zone Kinshasa'}</small>
                </div>
              </div>
            ) : (
              <span className="inst-unassigned">Non assigné pour le moment</span>
            )}
          </div>

          <div className="inst-assignment-box">
            <span className="inst-assignment-lbl">Date prévue d'intervention</span>
            <div className="inst-date-badge">
              <Calendar size={15} />
              <strong>{folder.plannedDate ? formatDateShort(folder.plannedDate) : 'À planifier'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Message de blocage si statut en_attente */}
      {folder.status === 'en_attente' && folder.blockedReason && (
        <div className="inst-detail-blocked-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Intervention temporairement suspendue</strong>
            <p>Motif déclaré : {folder.blockedReason}</p>
          </div>
        </div>
      )}

      {/* 4 Métriques techniques monochromes */}
      <section className="inst-detail-kpis">
        <div className="inst-kpi-card">
          <div className="inst-kpi-icon">
            <Layers size={18} />
          </div>
          <div className="inst-kpi-meta">
            <span className="inst-kpi-label">Puissance Solaire</span>
            <strong className="inst-kpi-val">
              {((Number(system.panels || 0) * Number(system.panelPower || 0)) / 1000).toFixed(1)} kWc
            </strong>
            <span className="inst-kpi-sub">{system.panels || 0} panneaux ({system.panelPower || 0} W)</span>
          </div>
        </div>

        <div className="inst-kpi-card">
          <div className="inst-kpi-icon">
            <Activity size={18} />
          </div>
          <div className="inst-kpi-meta">
            <span className="inst-kpi-label">Batterie & Onduleur</span>
            <strong className="inst-kpi-val">
              {system.batteryCapacity || 0} kWh • {system.inverterPower || 0} kVA
            </strong>
            <span className="inst-kpi-sub">LiFePO4 Hybride</span>
          </div>
        </div>

        <div className="inst-kpi-card">
          <div className="inst-kpi-icon">
            <Cpu size={18} />
          </div>
          <div className="inst-kpi-meta">
            <span className="inst-kpi-label">Boîtier IoT Connecté</span>
            <strong className="inst-kpi-val font-mono">
              {folder.kitId || 'Non appairé'}
            </strong>
            <span className="inst-kpi-sub">
              {folder.kitId ? 'En ligne • Suivi actif' : 'En attente de mise en service'}
            </span>
          </div>
        </div>

        <div className="inst-kpi-card">
          <div className="inst-kpi-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="inst-kpi-meta">
            <span className="inst-kpi-label">Checklist Conformité</span>
            <strong className="inst-kpi-val">
              {checklistCount} / 6 points
            </strong>
            <span className="inst-kpi-sub">
              {checklistCount === 6 ? 'Contrôle 100% validé' : 'Points restants à valider'}
            </span>
          </div>
        </div>
      </section>

      {/* Onglets de navigation */}
      <nav className="inst-detail-tabs">
        <button
          type="button"
          className={`inst-tab-btn ${activeTab === 'summary' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FileText size={15} /> Vue d'ensemble & Spécifications
        </button>
        <button
          type="button"
          className={`inst-tab-btn ${activeTab === 'checklist' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <CheckCircle2 size={15} /> Checklist de Conformité ({checklistCount}/6)
        </button>
        <button
          type="button"
          className={`inst-tab-btn ${activeTab === 'iot' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('iot')}
        >
          <Cpu size={15} /> Télémétrie & Coordonnées GPS
        </button>
        <button
          type="button"
          className={`inst-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={15} /> Journal d'Audit ({folder.history?.length || 0})
        </button>
        <button
          type="button"
          className={`inst-tab-btn ${activeTab === 'chat' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={15} /> Messagerie & Vocaux direct
        </button>
      </nav>

      {/* Contenu des Onglets */}
      <div className="inst-tab-content">
        {/* Onglet 1 : Vue d'ensemble */}
        {activeTab === 'summary' && (
          <div className="inst-grid-summary">
            {/* Fiche Client & Emplacement */}
            <div className="inst-card">
              <div className="inst-card-header">
                <User size={17} className="inst-card-icon" />
                <h3>Client & Emplacement du Site</h3>
              </div>
              <div className="inst-info-list">
                <div className="inst-info-row">
                  <span>Nom complet</span>
                  <strong>{customer.name || '—'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Téléphone</span>
                  <strong className="font-mono">{customer.phone || '—'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Profil client</span>
                  <strong className="capitalize">{customer.profile || 'Particulier'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Adresse</span>
                  <strong>{site.adresse || '—'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Quartier & Commune</span>
                  <strong>{[site.quartier, site.commune].filter(Boolean).join(', ') || '—'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Ville & Zone</span>
                  <strong>{site.ville || 'Kinshasa'} {folder.zone ? `(${folder.zone})` : ''}</strong>
                </div>
              </div>
            </div>

            {/* Fiche Matériel Solaire */}
            <div className="inst-card">
              <div className="inst-card-header">
                <Layers size={17} className="inst-card-icon" />
                <h3>Matériel Prévu pour l'Installation</h3>
              </div>
              <div className="inst-specs-grid">
                <div className="inst-spec-box">
                  <span className="inst-spec-lbl">Panneaux Photovoltaïques</span>
                  <strong className="inst-spec-val">{system.panels || 0} unités</strong>
                  <span className="inst-spec-hint">{system.panelPower || 0} W par panneau</span>
                </div>
                <div className="inst-spec-box">
                  <span className="inst-spec-lbl">Capacité de Stockage</span>
                  <strong className="inst-spec-val">{system.batteryCapacity || 0} kWh</strong>
                  <span className="inst-spec-hint">Batterie Lithium LiFePO4</span>
                </div>
                <div className="inst-spec-box">
                  <span className="inst-spec-lbl">Onduleur Hybride</span>
                  <strong className="inst-spec-val">{system.inverterPower || 0} kVA</strong>
                  <span className="inst-spec-hint">Gestion réseau & PV</span>
                </div>
                <div className="inst-spec-box">
                  <span className="inst-spec-lbl">Montant du Projet</span>
                  <strong className="inst-spec-val">{formatCurrency(folder.amount, folder.currency)}</strong>
                  <span className="inst-spec-hint">Validé le {formatDateShort(folder.createdAt)}</span>
                </div>
              </div>

              {appliances.length > 0 && (
                <div className="inst-appliances-section">
                  <h4>Appareils pris en compte ({appliances.length})</h4>
                  <div className="inst-appliances-tags">
                    {appliances.map((app, idx) => (
                      <span key={idx} className="inst-app-tag">
                        {app.quantity}× {app.name} ({app.watts} W)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fiche Responsables & Traçabilité */}
            <div className="inst-card">
              <div className="inst-card-header">
                <ShieldCheck size={17} className="inst-card-icon" />
                <h3>Gouvernance Opérationnelle</h3>
              </div>
              <div className="inst-info-list">
                <div className="inst-info-row">
                  <span>Dossier créé par</span>
                  <strong>{folder.createdBy?.prenom} {folder.createdBy?.nom} ({folder.createdBy?.role || 'commercial'})</strong>
                </div>
                <div className="inst-info-row">
                  <span>Responsable Boutique</span>
                  <strong>{folder.shopManager ? `${folder.shopManager.prenom} ${folder.shopManager.nom}` : 'Direction Kinshasa'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Technicien assigné</span>
                  <strong>{folder.assignedTechnician ? `${folder.assignedTechnician.prenom} ${folder.assignedTechnician.nom}` : 'À assigner'}</strong>
                </div>
                {folder.validatedBy && (
                  <div className="inst-info-row">
                    <span>Validation finale par</span>
                    <strong>{folder.validatedBy.prenom} {folder.validatedBy.nom}</strong>
                  </div>
                )}
                {folder.commissionedAt && (
                  <div className="inst-info-row">
                    <span>Mise en service le</span>
                    <strong>{formatDate(folder.commissionedAt)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet 2 : Checklist de conformité */}
        {activeTab === 'checklist' && (
          <div className="inst-card inst-checklist-card">
            <div className="inst-card-header">
              <CheckCircle2 size={18} className="inst-card-icon" />
              <div>
                <h3>Contrôle Qualité & Conformité Terrain</h3>
                <p>Les 6 étapes indispensables avant toute validation finale de l'installation.</p>
              </div>
            </div>

            <div className="inst-checklist-items">
              <div className={`inst-check-item ${checklist.solarPanelsMounted ? 'is-done' : ''}`}>
                <div className="inst-check-status">
                  {checklist.solarPanelsMounted ? <Check size={16} /> : <span className="inst-check-num">1</span>}
                </div>
                <div className="inst-check-text">
                  <strong>Fixation des panneaux solaires</strong>
                  <p>Structure ancrée solidement, orientation optimale vers le nord/sud avec inclinaison adéquate.</p>
                </div>
              </div>

              <div className={`inst-check-item ${checklist.wiringChecked ? 'is-done' : ''}`}>
                <div className="inst-check-status">
                  {checklist.wiringChecked ? <Check size={16} /> : <span className="inst-check-num">2</span>}
                </div>
                <div className="inst-check-text">
                  <strong>Câblage DC et AC sécurisé</strong>
                  <p>Section des câbles respectée, goulottes et presse-étoupes étanches, polarités vérifiées.</p>
                </div>
              </div>

              <div className={`inst-check-item ${checklist.inverterTested ? 'is-done' : ''}`}>
                <div className="inst-check-status">
                  {checklist.inverterTested ? <Check size={16} /> : <span className="inst-check-num">3</span>}
                </div>
                <div className="inst-check-text">
                  <strong>Test de mise sous tension onduleur</strong>
                  <p>Démarrage normal, calibration des paramètres de charge et commutation réseau/PV sans coupure.</p>
                </div>
              </div>

              <div className={`inst-check-item ${checklist.safetyGrounding ? 'is-done' : ''}`}>
                <div className="inst-check-status">
                  {checklist.safetyGrounding ? <Check size={16} /> : <span className="inst-check-num">4</span>}
                </div>
                <div className="inst-check-text">
                  <strong>Mise à la terre et parafoudre</strong>
                  <p>Piquet de terre relié, impédance de boucle conforme, protection contre les surtensions active.</p>
                </div>
              </div>

              <div className={`inst-check-item ${checklist.iotBoxPaired ? 'is-done' : ''}`}>
                <div className="inst-check-status">
                  {checklist.iotBoxPaired ? <Check size={16} /> : <span className="inst-check-num">5</span>}
                </div>
                <div className="inst-check-text">
                  <strong>Appairage du Boîtier Connecté Djua</strong>
                  <p>Transmission GSM/IoT effective vers le serveur central Djua, télémétrie en temps réel confirmée.</p>
                </div>
              </div>

              <div className={`inst-check-item ${checklist.customerTrainingDone ? 'is-done' : ''}`}>
                <div className="inst-check-status">
                  {checklist.customerTrainingDone ? <Check size={16} /> : <span className="inst-check-num">6</span>}
                </div>
                <div className="inst-check-text">
                  <strong>Formation éco-gestes du client</strong>
                  <p>Remise du guide utilisateur, explications sur les appareils prioritaires et la jauge de batterie.</p>
                </div>
              </div>
            </div>

            {canOperate && !['validee', 'mise_en_service'].includes(folder.status) && (
              <div className="inst-checklist-footer">
                <button
                  type="button"
                  className="inst-detail-btn-action is-primary"
                  onClick={() => setShowCommissionModal(true)}
                >
                  <CheckCircle2 size={16} /> Mettre à jour la checklist & Mettre en service
                </button>
              </div>
            )}
          </div>
        )}

        {/* Onglet 3 : Télémétrie & Coordonnées GPS */}
        {activeTab === 'iot' && (
          <div className="inst-grid-summary">
            <div className="inst-card">
              <div className="inst-card-header">
                <Cpu size={18} className="inst-card-icon" />
                <h3>Boîtier Connecté Djua IoT</h3>
              </div>
              <div className="inst-info-list">
                <div className="inst-info-row">
                  <span>Numéro de série / ID Box</span>
                  <strong className="font-mono text-base">{folder.kitId || 'Non encore associé'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Statut de liaison</span>
                  <strong className={folder.kitId ? 'text-green-600 font-semibold' : 'text-slate-500'}>
                    {folder.kitId ? 'Connecté au cloud Djua' : 'En attente d’association'}
                  </strong>
                </div>
                <div className="inst-info-row">
                  <span>Dernière synchronisation</span>
                  <strong>{folder.commissionedAt ? formatDate(folder.commissionedAt) : 'Aucune trame'}</strong>
                </div>
              </div>
            </div>

            <div className="inst-card">
              <div className="inst-card-header">
                <Compass size={18} className="inst-card-icon" />
                <h3>Coordonnées GPS du Site</h3>
              </div>
              <div className="inst-info-list">
                <div className="inst-info-row">
                  <span>Latitude</span>
                  <strong className="font-mono">{folder.gpsCoordinates?.latitude?.toFixed(6) || '—'}</strong>
                </div>
                <div className="inst-info-row">
                  <span>Longitude</span>
                  <strong className="font-mono">{folder.gpsCoordinates?.longitude?.toFixed(6) || '—'}</strong>
                </div>
                {folder.gpsCoordinates?.latitude && folder.gpsCoordinates?.longitude && (
                  <div style={{ marginTop: 16 }}>
                    <a
                      href={`https://maps.google.com/?q=${folder.gpsCoordinates.latitude},${folder.gpsCoordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inst-detail-btn-action"
                    >
                      <Navigation size={14} /> Voir sur Google Maps <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet 4 : Journal d'Audit & Traçabilité */}
        {activeTab === 'history' && (
          <div className="inst-card">
            <div className="inst-card-header">
              <Clock size={18} className="inst-card-icon" />
              <h3>Traçabilité Complète du Dossier (Module 2)</h3>
            </div>
            {(!folder.history || folder.history.length === 0) ? (
              <p className="inst-empty-text">Aucun événement enregistré.</p>
            ) : (
              <div className="inst-timeline">
                {folder.history.map((ev, index) => (
                  <div key={index} className="inst-timeline-item">
                    <div className="inst-timeline-dot" />
                    <div className="inst-timeline-content">
                      <div className="inst-timeline-meta">
                        <span className="inst-timeline-status">
                          {STATUS_CONFIG[ev.status]?.label || ev.status}
                        </span>
                        <span className="inst-timeline-time">{formatDate(ev.timestamp)}</span>
                      </div>
                      <p className="inst-timeline-note">{ev.note || 'Mise à jour d’étape'}</p>
                      {ev.changedBy && (
                        <span className="inst-timeline-author">
                          Par <strong>{ev.changedBy.prenom} {ev.changedBy.nom}</strong> ({ev.changedBy.role || 'utilisateur'})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Onglet 5 : Messagerie & Vocaux direct (Chat WhatsApp) */}
        {activeTab === 'chat' && (
          <div className="inst-chat-tab-wrap">
            <InstallationChat
              installationId={folder._id}
              title={`Dossier ${folder.folderNumber}`}
              recipientName={folder.assignedTechnician ? `${folder.assignedTechnician.prenom} ${folder.assignedTechnician.nom}` : 'Technicien'}
            />
          </div>
        )}
      </div>

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
