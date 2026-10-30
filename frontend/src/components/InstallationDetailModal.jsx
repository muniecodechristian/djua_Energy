import React, { useState } from 'react';
import { 
  X, Check, UserCheck, Calendar, Play, AlertCircle, 
  CheckCircle2, MapPin, Cpu, ArrowUpRight, ShieldCheck, 
  Wrench, FileText, Clock, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useAssignTechnician, 
  useUpdateInstallationStatus, 
  useCommissionInstallation, 
  useValidateInstallation 
} from '../hooks/tanstack/useInstallations';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import api from '../api/axios';
import { useQuery } from '@tanstack/react-query';
import './InstallationDetailModal.css';

const STATUS_LABELS = {
  a_planifier: 'À planifier',
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  en_attente: 'En attente (Bloqué)',
  installee: 'Installée',
  mise_en_service: 'Mise en service',
  validee: 'Validée & Active',
};

export default function InstallationDetailModal({ folder, onClose, onRefresh }) {
  const user = useAuthStore(state => state.user);
  const isAdmin = ['admin', 'administration'].includes(user?.role);
  const isManager = user?.role === 'shop_manager';
  const isTech = user?.role === 'technician';

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'checklist' | 'iot' | 'history'

  // États pour les actions
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showCommissionForm, setShowCommissionForm] = useState(false);

  // Formulaire assignation
  const [selectedTech, setSelectedTech] = useState(folder.assignedTechnician?._id || '');
  const [plannedDate, setPlannedDate] = useState(folder.plannedDate || '');
  const [assignNote, setAssignNote] = useState('');

  // Formulaire blocage
  const [blockReason, setBlockReason] = useState('');

  // Formulaire mise en service
  const [boxKitId, setBoxKitId] = useState(folder.kitId || '');
  const [gpsLat, setGpsLat] = useState(folder.gpsCoordinates?.latitude || -4.3276);
  const [gpsLng, setGpsLng] = useState(folder.gpsCoordinates?.longitude || 15.3136);
  const [checklist, setChecklist] = useState({
    solarPanelsMounted: folder.checklist?.solarPanelsMounted || false,
    wiringChecked: folder.checklist?.wiringChecked || false,
    inverterTested: folder.checklist?.inverterTested || false,
    safetyGrounding: folder.checklist?.safetyGrounding || false,
    iotBoxPaired: folder.checklist?.iotBoxPaired || false,
    customerTrainingDone: folder.checklist?.customerTrainingDone || false,
  });

  // Récupérer la liste des techniciens
  const { data: teamUsers } = useQuery({
    queryKey: ['team-technicians'],
    queryFn: async () => {
      const res = await api.get('/users/all-users');
      const list = res.data?.users || res.data?.data || [];
      return list.filter(u => u.role === 'technician');
    },
    enabled: Boolean(isAdmin || isManager),
  });

  // Mutations
  const assignMutation = useAssignTechnician();
  const statusMutation = useUpdateInstallationStatus();
  const commissionMutation = useCommissionInstallation();
  const validateMutation = useValidateInstallation();

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
      setShowAssignForm(false);
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’assignation.');
    }
  };

  // 2. Action : Démarrer les travaux
  const handleStartWork = async () => {
    try {
      await statusMutation.mutateAsync({
        id: folder._id,
        status: 'en_cours',
        note: 'Démarrage de l’intervention terrain par le technicien.',
      });
      toast.success('Travaux démarrés ! L’installation passe au statut "En cours".');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de démarrer l’installation.');
    }
  };

  // 3. Action : Bloquer / Mettre en attente
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
      toast.warning('Installation mise en attente.');
      setShowBlockForm(false);
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise en attente.');
    }
  };

  // 4. Action : Capturer le GPS du navigateur
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n’est pas supportée par votre navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(Number(pos.coords.latitude.toFixed(6)));
        setGpsLng(Number(pos.coords.longitude.toFixed(6)));
        toast.success(`Position GPS capturée : ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => toast.error('Impossible de récupérer la position GPS.')
    );
  };

  // 5. Action : Mise en service & Checklist
  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    if (!boxKitId.trim()) {
      toast.error('Le numéro du boîtier IoT ou du kit est requis.');
      return;
    }
    try {
      await commissionMutation.mutateAsync({
        id: folder._id,
        kitId: boxKitId.trim(),
        gpsCoordinates: { latitude: Number(gpsLat), longitude: Number(gpsLng) },
        checklist,
        notes: 'Mise en service réalisée avec validation de la checklist.',
      });
      toast.success('Mise en service enregistrée ! La Box IoT est désormais appairée.');
      setShowCommissionForm(false);
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise en service.');
    }
  };

  // 6. Action : Validation finale Administrateur
  const handleAdminValidate = async () => {
    try {
      await validateMutation.mutateAsync({
        id: folder._id,
        note: 'Validation définitive de la conformité par l’administrateur.'
      });
      toast.success('Installation validée ! Elle est officiellement sous surveillance active dans le parc.');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation.');
    }
  };

  return (
    <div className="idm-overlay" onClick={onClose}>
      <div className="idm-modal" onClick={e => e.stopPropagation()}>
        {/* En-tête */}
        <header className="idm-header">
          <div>
            <div className="idm-title-row">
              <span className="idm-folder-num">{folder.folderNumber}</span>
              <span className="idm-status-pill">{STATUS_LABELS[folder.status] || folder.status}</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              Issu du devis <strong>{folder.quoteNumber}</strong> • Validé et créé par <strong>{folder.createdBy?.prenom} {folder.createdBy?.nom}</strong> ({folder.createdBy?.role})
            </div>
          </div>
          <button className="idm-btn" style={{ padding: 6, borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        {/* Barre de boutons d'actions contextuels */}
        <div className="idm-actions-bar">
          {(isAdmin || isManager) && (
            <button className="idm-btn" onClick={() => setShowAssignForm(!showAssignForm)}>
              <UserCheck size={15} /> {folder.assignedTechnician ? 'Réassigner technicien' : 'Assigner technicien'}
            </button>
          )}

          {(isTech || isAdmin || isManager) && ['planifiee', 'a_planifier', 'en_attente'].includes(folder.status) && (
            <button className="idm-btn idm-btn-dark" onClick={handleStartWork}>
              <Play size={15} /> Démarrer les travaux
            </button>
          )}

          {(isTech || isAdmin || isManager) && folder.status === 'en_cours' && (
            <>
              <button className="idm-btn idm-btn-danger" onClick={() => setShowBlockForm(!showBlockForm)}>
                <AlertCircle size={15} /> Signaler un blocage
              </button>
              <button className="idm-btn idm-btn-dark" onClick={() => setShowCommissionForm(!showCommissionForm)}>
                <CheckCircle2 size={15} /> Renseigner mise en service & checklist
              </button>
            </>
          )}

          {isAdmin && folder.status !== 'validee' && (
            <button 
              className="idm-btn idm-btn-dark" 
              style={{ marginLeft: 'auto' }}
              onClick={handleAdminValidate}
            >
              <ShieldCheck size={15} /> Valider définitivement l’installation
            </button>
          )}
        </div>

        {/* Formulaire rétractable d'assignation */}
        {showAssignForm && (
          <div style={{ padding: '16px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Affecter un technicien</h4>
            <form onSubmit={handleAssignSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label className="idm-field-label">Technicien</label>
                <select 
                  className="idm-btn" 
                  style={{ width: '100%', height: 38 }}
                  value={selectedTech} 
                  onChange={e => setSelectedTech(e.target.value)}
                  required
                >
                  <option value="">Sélectionner</option>
                  {teamUsers?.map(t => (
                    <option key={t._id} value={t._id}>{t.prenom} {t.nom} ({t.zone || 'RDC'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="idm-field-label">Date prévue</label>
                <input 
                  type="date" 
                  className="idm-btn" 
                  style={{ width: '100%', height: 38 }}
                  value={plannedDate} 
                  onChange={e => setPlannedDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="idm-field-label">Note d’intervention</label>
                <input 
                  type="text" 
                  className="idm-btn" 
                  style={{ width: '100%', height: 38 }}
                  placeholder="Consignes..."
                  value={assignNote} 
                  onChange={e => setAssignNote(e.target.value)}
                />
              </div>
              <button type="submit" className="idm-btn idm-btn-dark" style={{ height: 38 }}>
                Valider
              </button>
            </form>
          </div>
        )}

        {/* Formulaire rétractable de blocage */}
        {showBlockForm && (
          <div style={{ padding: '16px 32px', background: '#fff1f2', borderBottom: '1px solid #fecdd3' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#9f1239', marginBottom: 10 }}>Déclarer un blocage terrain</h4>
            <form onSubmit={handleBlockSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input 
                type="text" 
                className="idm-btn" 
                style={{ flex: 1, height: 38 }}
                placeholder="Ex. : Client absent, toiture non accessible, intempéries..."
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                required
              />
              <button type="submit" className="idm-btn idm-btn-danger" style={{ height: 38 }}>
                Confirmer la mise en attente
              </button>
            </form>
          </div>
        )}

        {/* Formulaire rétractable de mise en service & checklist */}
        {showCommissionForm && (
          <div style={{ padding: '20px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Checklist terrain & Association Box IoT</h4>
            <form onSubmit={handleCommissionSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="idm-field-label">Identifiant / Matricule Box IoT *</label>
                  <input 
                    type="text" 
                    className="idm-btn" 
                    style={{ width: '100%', height: 38 }}
                    placeholder="Ex: KIT-2026-0012"
                    value={boxKitId}
                    onChange={e => setBoxKitId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="idm-field-label">Coordonnées GPS</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input 
                      type="number" 
                      step="any"
                      className="idm-btn" 
                      style={{ width: '50%', height: 38 }}
                      value={gpsLat}
                      onChange={e => setGpsLat(e.target.value)}
                    />
                    <input 
                      type="number" 
                      step="any"
                      className="idm-btn" 
                      style={{ width: '50%', height: 38 }}
                      value={gpsLng}
                      onChange={e => setGpsLng(e.target.value)}
                    />
                  </div>
                </div>
                <button type="button" className="idm-btn" style={{ height: 38, marginTop: 'auto' }} onClick={handleCaptureGPS}>
                  <MapPin size={14} /> GPS actuel
                </button>
              </div>

              {/* Contrôles checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { key: 'solarPanelsMounted', label: 'Panneaux solaires fixés solidement' },
                  { key: 'wiringChecked', label: 'Câblage et cosses vérifiés' },
                  { key: 'inverterTested', label: 'Onduleur démarré et testé' },
                  { key: 'safetyGrounding', label: 'Mise à la terre raccordée' },
                  { key: 'iotBoxPaired', label: 'Box IoT connectée et synchronisée' },
                  { key: 'customerTrainingDone', label: 'Client formé aux règles d’usage' },
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="idm-btn" onClick={() => setShowCommissionForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="idm-btn idm-btn-dark">
                  Valider la mise en service
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Onglets du corps */}
        <div className="idm-body">
          <nav className="idm-tabs">
            <button 
              className={`idm-tab-link ${activeTab === 'summary' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Synthèse & Matériel
            </button>
            <button 
              className={`idm-tab-link ${activeTab === 'checklist' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('checklist')}
            >
              Contrôles de Conformité
            </button>
            <button 
              className={`idm-tab-link ${activeTab === 'iot' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('iot')}
            >
              Localisation & Box IoT
            </button>
            <button 
              className={`idm-tab-link ${activeTab === 'history' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Journal de Traçabilité ({folder.history?.length || 0})
            </button>
          </nav>

          {/* CONTENU ONGLETS */}
          {activeTab === 'summary' && (
            <div>
              <div className="idm-grid-2">
                {/* Client & Intervention */}
                <div className="idm-card">
                  <div className="idm-card-title">
                    <UserCheck size={14} /> Client & Assignation
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Nom du client</div>
                    <div className="idm-field-val">{folder.customer?.name}</div>
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Téléphone</div>
                    <div className="idm-field-val">{folder.customer?.phone}</div>
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Technicien assigné</div>
                    <div className="idm-field-val">
                      {folder.assignedTechnician ? `${folder.assignedTechnician.prenom} ${folder.assignedTechnician.nom}` : 'Non assigné'}
                    </div>
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Date planifiée</div>
                    <div className="idm-field-val">{folder.plannedDate || 'À définir'}</div>
                  </div>
                </div>

                {/* Spécifications solaires */}
                <div className="idm-card">
                  <div className="idm-card-title">
                    <Cpu size={14} /> Système Solaire Validé
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Panneaux solaires</div>
                    <div className="idm-field-val">{folder.system?.panels} x {folder.system?.panelPower} W</div>
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Capacité batterie</div>
                    <div className="idm-field-val">{folder.system?.batteryCapacity} Wh</div>
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Puissance onduleur</div>
                    <div className="idm-field-val">{folder.system?.inverterPower} W</div>
                  </div>
                  <div className="idm-field">
                    <div className="idm-field-label">Montant du contrat</div>
                    <div className="idm-field-val">{folder.amount} {folder.currency}</div>
                  </div>
                </div>
              </div>

              {/* Appareils à alimenter */}
              <div className="idm-card">
                <div className="idm-card-title">
                  <Wrench size={14} /> Appareils inclus dans le dimensionnement
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {folder.appliances?.map((app, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                      <strong>{app.name}</strong> ({app.quantity}x)
                      <div style={{ fontSize: 11, color: '#64748b' }}>{app.watts} W • {app.hours} h/j</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div>
              <div className="idm-card" style={{ marginBottom: 16 }}>
                <div className="idm-card-title">
                  <CheckCircle2 size={14} /> Points de contrôle de mise en service
                </div>
                {[
                  { label: 'Fixation mécanique des panneaux solaires sur le toit', checked: folder.checklist?.solarPanelsMounted },
                  { label: 'Contrôle du câblage électrique et serrage des borniers', checked: folder.checklist?.wiringChecked },
                  { label: 'Test onduleur et mesure de tension batterie', checked: folder.checklist?.inverterTested },
                  { label: 'Raccordement de sécurité et piquet de terre', checked: folder.checklist?.safetyGrounding },
                  { label: 'Appairage et premier signal de la Box IoT', checked: folder.checklist?.iotBoxPaired },
                  { label: 'Formation du client et remise de la fiche', checked: folder.checklist?.customerTrainingDone },
                ].map((item, idx) => (
                  <div key={idx} className="idm-check-row">
                    <div className={`idm-check-box ${item.checked ? 'checked' : ''}`}>
                      {item.checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span style={{ color: item.checked ? 'inherit' : '#94a3b8' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'iot' && (
            <div className="idm-grid-2">
              <div className="idm-card">
                <div className="idm-card-title">
                  <Cpu size={14} /> Boîtier IoT Appairé
                </div>
                <div className="idm-field">
                  <div className="idm-field-label">Numéro de série / Matricule</div>
                  <div className="idm-field-val">{folder.kitId || 'Non encore associé'}</div>
                </div>
                <div className="idm-field">
                  <div className="idm-field-label">Statut télémétrique</div>
                  <div className="idm-field-val">
                    {folder.status === 'validee' ? 'Actif dans le monitoring' : 'En attente de mise en service'}
                  </div>
                </div>
              </div>

              <div className="idm-card">
                <div className="idm-card-title">
                  <MapPin size={14} /> Coordonnées GPS réelles
                </div>
                <div className="idm-field">
                  <div className="idm-field-label">Position géographique</div>
                  <div className="idm-field-val">
                    {folder.gpsCoordinates?.latitude ? (
                      <a 
                        href={`https://www.google.com/maps?q=${folder.gpsCoordinates.latitude},${folder.gpsCoordinates.longitude}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: '#0f172a', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {folder.gpsCoordinates.latitude.toFixed(5)}, {folder.gpsCoordinates.longitude.toFixed(5)}
                        <ArrowUpRight size={14} />
                      </a>
                    ) : (
                      'Non capturées'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="idm-card">
              <div className="idm-card-title">
                <Clock size={14} /> Historique et Audit Trail complet
              </div>
              <div className="idm-timeline">
                {folder.history?.map((h, i) => (
                  <div key={i} className="idm-timeline-point">
                    <div className="idm-timeline-dot" />
                    <strong>{STATUS_LABELS[h.status] || h.status}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(h.timestamp).toLocaleString('fr-FR')} • Par : {h.changedBy?.prenom || 'Système'} {h.changedBy?.nom || ''} ({h.changedBy?.role || 'admin'})
                    </div>
                    {h.note && (
                      <div style={{ fontSize: 12, marginTop: 4, background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>
                        {h.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
