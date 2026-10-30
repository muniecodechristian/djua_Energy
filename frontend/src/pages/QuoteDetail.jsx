import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Printer, Download, Calendar, CheckCircle2,
  Clock, MapPin, Phone, Mail, Building2, User, Sun,
  Battery, Zap, ShieldCheck, FileText, ArrowRight,
  FolderCheck, Sparkles, Check, ChevronRight, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import './QuoteDetail.css';

const statusConfig = {
  draft: { label: 'À valider', tone: 'draft', desc: 'En attente de validation commerciale' },
  approved: { label: 'Validé · Installation créée', tone: 'approved', desc: 'Dossier d’installation planifié' },
  installing: { label: 'Installation en cours', tone: 'installing', desc: 'Travaux sur le site client' },
  installed: { label: 'Installé & Opérationnel', tone: 'installed', desc: 'Système mis en service avec succès' },
};

function formatCurrency(amount, currency = 'CDF') {
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

function todayKinshasa() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kinshasa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return parts.find(p => p.type === 'year').value + '-' +
         parts.find(p => p.type === 'month').value + '-' +
         parts.find(p => p.type === 'day').value;
}

function addDays(days) {
  const date = new Date(`${todayKinshasa()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const queryClient = useQueryClient();

  const [plannedDate, setPlannedDate] = useState('');
  const [createdFolder, setCreatedFolder] = useState(null);

  // Charger le devis par son numéro ou son id
  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['quote-detail', id],
    queryFn: async () => {
      const res = await api.get(`/api/quotes/${encodeURIComponent(id)}`);
      return res.data?.data;
    },
    enabled: Boolean(id),
  });

  // Charger le dossier d'installation associé si existant
  const { data: linkedInstallation } = useQuery({
    queryKey: ['quote-linked-installation', quote?.number],
    queryFn: async () => {
      if (!quote?.number) return null;
      const res = await api.get(`/api/installations?search=${encodeURIComponent(quote.number)}`);
      const list = res.data?.data?.installations || [];
      return list.find(item => item.quoteNumber === quote.number || item.quote?._id === quote._id) || null;
    },
    enabled: Boolean(quote?.number),
  });

  // Mutation validation devis -> crée automatiquement le dossier d'installation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/quotes/${encodeURIComponent(quote.number)}/approve`, {
        plannedDate,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Devis validé ! Le dossier d’installation a été créé automatiquement.');
      setCreatedFolder(data?.installationFolder || true);
      queryClient.invalidateQueries({ queryKey: ['quote-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['quote-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['sales-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['installations'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation du devis.');
    },
  });

  if (isLoading) {
    return (
      <div className="quote-detail-loading-screen">
        <div className="quote-detail-spinner" />
        <p>Chargement du devis en cours…</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="quote-detail-error-container">
        <AlertTriangle size={48} className="quote-detail-error-icon" />
        <h2>Devis introuvable</h2>
        <p>Le devis demandé n'existe pas ou vous n'avez pas l'autorisation d'y accéder.</p>
        <Link to="/devis" className="quote-detail-back-btn">
          <ArrowLeft size={16} /> Retour à la liste des devis
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'administration';
  const isCreator = quote.owner && (
    String(quote.owner._id || quote.owner) === String(currentUser?._id)
  );
  const canValidate = (isAdmin || isCreator) && quote.status === 'draft';

  const customer = quote.customer || {};
  const details = customer.details || {};
  const site = quote.site || {};
  const system = quote.system || {};
  const appliances = Array.isArray(quote.appliances) ? quote.appliances : [];
  const status = statusConfig[quote.status] || { label: quote.status, tone: 'draft', desc: '' };

  const totalWh = appliances.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.watts || 0) * Number(item.hours || 0)), 0);
  const totalWatts = appliances.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.watts || 0)), 0);

  const installationFolderId = linkedInstallation?._id || createdFolder?._id;
  const installationFolderNumber = linkedInstallation?.folderNumber || createdFolder?.folderNumber;

  return (
    <div className="quote-detail-page">
      {/* Barre de navigation supérieure */}
      <header className="quote-detail-nav">
        <div className="quote-detail-nav-left">
          <button
            type="button"
            className="quote-detail-back-link"
            onClick={() => navigate('/devis')}
          >
            <ArrowLeft size={16} /> Retour aux devis
          </button>
          <div className="quote-detail-breadcrumb">
            <span>Devis</span>
            <ChevronRight size={14} />
            <strong>{quote.number}</strong>
          </div>
        </div>

        <div className="quote-detail-nav-actions no-print">
          <button
            type="button"
            className="quote-detail-btn-secondary"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Imprimer / PDF
          </button>
          {quote.status === 'approved' && installationFolderId && (
            <button
              type="button"
              className="quote-detail-btn-primary"
              onClick={() => navigate(`/installations/${installationFolderId}`)}
            >
              <FolderCheck size={16} /> Voir Dossier Installation <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* En-tête principal de la fiche */}
      <section className="quote-detail-hero">
        <div className="quote-detail-hero-main">
          <div className="quote-detail-title-row">
            <span className={`quote-detail-badge ${status.tone}`}>
              <span className="quote-badge-dot" />
              {status.label}
            </span>
            <span className="quote-detail-number">{quote.number}</span>
            <span className="quote-detail-created-date">Créé le {formatDateShort(quote.createdAt)}</span>
          </div>
          <h1 className="quote-detail-client-headline">
            {customer.name || 'Client sans nom'}
          </h1>
          <p className="quote-detail-site-sub">
            <MapPin size={15} />
            {[site.adresse, site.quartier, site.commune, site.ville || 'Kinshasa'].filter(Boolean).join(', ') || 'Adresse non renseignée'}
          </p>
        </div>

        <div className="quote-detail-hero-financial">
          <span className="quote-detail-amount-label">Montant Total TTC</span>
          <div className="quote-detail-amount-val">
            {formatCurrency(quote.amount, quote.currency)}
          </div>
          <span className="quote-detail-amount-sub">
            Devise officielle : {quote.currency || 'USD'}
          </span>
        </div>
      </section>

      {/* Bannière dossier installation si déjà validé */}
      {(linkedInstallation || createdFolder) && (
        <div className="quote-detail-installation-banner">
          <div className="quote-banner-icon-wrap">
            <FolderCheck size={22} />
          </div>
          <div className="quote-banner-info">
            <span className="quote-banner-tag">Module 2 • Dossier d'Installation Actif</span>
            <h4>
              Dossier N° <strong>{installationFolderNumber}</strong>
            </h4>
            <p>
              Créé par{' '}
              <strong>
                {quote.validatedBy?.prenom || currentUser?.prenom || 'Le validateur'} {quote.validatedBy?.nom || currentUser?.nom || ''}
              </strong>
              {quote.plannedDate && (
                <> • Date d'intervention prévue : <strong>{formatDateShort(quote.plannedDate)}</strong></>
              )}
            </p>
          </div>
          {installationFolderId && (
            <button
              type="button"
              className="quote-banner-action-btn"
              onClick={() => navigate(`/installations/${installationFolderId}`)}
            >
              Accéder au suivi d'installation <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}

      {/* Panneau de validation et création de dossier (si statut draft et utilisateur autorisé) */}
      {canValidate && (
        <section className="quote-detail-validation-card">
          <div className="quote-validation-header">
            <div className="quote-val-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Validation du Devis & Création du Dossier d'Installation</h3>
              <p>
                Conformément au cahier des charges, valider ce devis va créer officiellement le{' '}
                <strong>dossier d'installation</strong> rattaché à votre compte (<strong>{currentUser?.prenom} {currentUser?.nom}</strong>)
                avec visibilité complète pour l'administrateur.
              </p>
            </div>
          </div>

          <form
            className="quote-validation-form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              if (!plannedDate) {
                toast.error('Veuillez sélectionner la date d’installation prévue.');
                return;
              }
              approveMutation.mutate();
            }}
          >
            <div className="quote-val-field">
              <label htmlFor="quote-planned-date">Date d’intervention / installation prévue</label>
              <div className="quote-val-input-group">
                <Calendar size={17} />
                <input
                  id="quote-planned-date"
                  type="date"
                  min={todayKinshasa()}
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  required
                />
              </div>
              <div className="quote-val-chips">
                <button
                  type="button"
                  className={plannedDate === todayKinshasa() ? 'is-active' : ''}
                  onClick={() => setPlannedDate(todayKinshasa())}
                >
                  Aujourd’hui
                </button>
                <button
                  type="button"
                  className={plannedDate === addDays(1) ? 'is-active' : ''}
                  onClick={() => setPlannedDate(addDays(1))}
                >
                  Demain
                </button>
                <button
                  type="button"
                  className={plannedDate === addDays(3) ? 'is-active' : ''}
                  onClick={() => setPlannedDate(addDays(3))}
                >
                  Dans 3 jours
                </button>
                <button
                  type="button"
                  className={plannedDate === addDays(7) ? 'is-active' : ''}
                  onClick={() => setPlannedDate(addDays(7))}
                >
                  Dans 1 semaine
                </button>
              </div>
            </div>

            <div className="quote-val-submit-col">
              <button
                type="submit"
                className="quote-val-submit-btn"
                disabled={!plannedDate || approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <>Création du dossier en cours…</>
                ) : (
                  <>
                    <CheckCircle2 size={17} /> Valider & Créer le Dossier d'Installation
                  </>
                )}
              </button>
              <span className="quote-val-help">
                Action immédiate • Déclenche le flux opérationnel
              </span>
            </div>
          </form>
        </section>
      )}

      {/* 4 Métriques clés (icônes strictement monochromes) */}
      <section className="quote-detail-kpis">
        <div className="quote-kpi-card">
          <div className="quote-kpi-icon">
            <Sun size={19} />
          </div>
          <div className="quote-kpi-meta">
            <span className="quote-kpi-label">Puissance Solaire</span>
            <strong className="quote-kpi-value">
              {((Number(system.panels || 0) * Number(system.panelPower || 0)) / 1000).toFixed(1)} kWc
            </strong>
            <span className="quote-kpi-sub">
              {system.panels || 0} panneaux de {system.panelPower || 0} W
            </span>
          </div>
        </div>

        <div className="quote-kpi-card">
          <div className="quote-kpi-icon">
            <Battery size={19} />
          </div>
          <div className="quote-kpi-meta">
            <span className="quote-kpi-label">Stockage Batterie</span>
            <strong className="quote-kpi-value">
              {system.batteryCapacity || 0} kWh
            </strong>
            <span className="quote-kpi-sub">Technologie Lithium LiFePO4</span>
          </div>
        </div>

        <div className="quote-kpi-card">
          <div className="quote-kpi-icon">
            <Zap size={19} />
          </div>
          <div className="quote-kpi-meta">
            <span className="quote-kpi-label">Puissance Onduleur</span>
            <strong className="quote-kpi-value">
              {system.inverterPower || 0} kVA
            </strong>
            <span className="quote-kpi-sub">Pur sinus Hybride</span>
          </div>
        </div>

        <div className="quote-kpi-card">
          <div className="quote-kpi-icon">
            <Clock size={19} />
          </div>
          <div className="quote-kpi-meta">
            <span className="quote-kpi-label">Consommation Estimée</span>
            <strong className="quote-kpi-value">
              {(totalWh / 1000).toFixed(1)} kWh/j
            </strong>
            <span className="quote-kpi-sub">
              {appliances.length} appareil(s) recensé(s)
            </span>
          </div>
        </div>
      </section>

      {/* Grille principale : Spécifications et Détails */}
      <div className="quote-detail-grid">
        {/* Colonne gauche : Client & Site */}
        <div className="quote-detail-col">
          {/* Fiche Client */}
          <div className="quote-section-card">
            <div className="quote-section-header">
              <User size={18} className="quote-section-icon" />
              <h3>Informations Client & Contact</h3>
            </div>
            <div className="quote-info-list">
              <div className="quote-info-row">
                <span className="quote-info-label">Nom complet / Raison sociale</span>
                <span className="quote-info-value font-medium">{customer.name || '—'}</span>
              </div>
              <div className="quote-info-row">
                <span className="quote-info-label">Type de profil</span>
                <span className="quote-info-value capitalize">
                  {customer.profile === 'entreprise' ? '🏢 Entreprise / Commerce' : '👤 Particulier'}
                </span>
              </div>
              <div className="quote-info-row">
                <span className="quote-info-label">Téléphone de contact</span>
                <span className="quote-info-value font-mono">
                  <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {customer.phone || '—'}
                </span>
              </div>
              {customer.email && (
                <div className="quote-info-row">
                  <span className="quote-info-label">Adresse Email</span>
                  <span className="quote-info-value">
                    <Mail size={13} style={{ display: 'inline', marginRight: 4 }} />
                    {customer.email}
                  </span>
                </div>
              )}
              {details.companyName && (
                <div className="quote-info-row">
                  <span className="quote-info-label">Nom de la société</span>
                  <span className="quote-info-value">{details.companyName}</span>
                </div>
              )}
              {details.rccm && (
                <div className="quote-info-row">
                  <span className="quote-info-label">Numéro RCCM</span>
                  <span className="quote-info-value font-mono">{details.rccm}</span>
                </div>
              )}
              {details.idNationale && (
                <div className="quote-info-row">
                  <span className="quote-info-label">ID Nationale</span>
                  <span className="quote-info-value font-mono">{details.idNationale}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fiche Site d'installation */}
          <div className="quote-section-card">
            <div className="quote-section-header">
              <MapPin size={18} className="quote-section-icon" />
              <h3>Site de l'Installation</h3>
            </div>
            <div className="quote-info-list">
              <div className="quote-info-row">
                <span className="quote-info-label">Adresse complète</span>
                <span className="quote-info-value">{site.adresse || '—'}</span>
              </div>
              <div className="quote-info-row">
                <span className="quote-info-label">Quartier & Commune</span>
                <span className="quote-info-value">
                  {[site.quartier, site.commune].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="quote-info-row">
                <span className="quote-info-label">Ville & Province</span>
                <span className="quote-info-value">{site.ville || 'Kinshasa'}</span>
              </div>
              <div className="quote-info-row">
                <span className="quote-info-label">Type de bâtiment</span>
                <span className="quote-info-value capitalize">{quote.buildingType || 'Résidentiel'}</span>
              </div>
            </div>
          </div>

          {/* Fiche Traçabilité commerciale */}
          <div className="quote-section-card">
            <div className="quote-section-header">
              <ShieldCheck size={18} className="quote-section-icon" />
              <h3>Gouvernance & Audit Trail</h3>
            </div>
            <div className="quote-info-list">
              <div className="quote-info-row">
                <span className="quote-info-label">Créé par l'agent</span>
                <span className="quote-info-value font-medium">
                  {quote.owner?.prenom} {quote.owner?.nom} ({quote.owner?.role || 'commercial'})
                </span>
              </div>
              <div className="quote-info-row">
                <span className="quote-info-label">Date de création</span>
                <span className="quote-info-value">{formatDate(quote.createdAt)}</span>
              </div>
              {quote.validatedBy && (
                <div className="quote-info-row">
                  <span className="quote-info-label">Validé par</span>
                  <span className="quote-info-value font-medium">
                    {quote.validatedBy?.prenom} {quote.validatedBy?.nom}
                  </span>
                </div>
              )}
              {quote.validatedAt && (
                <div className="quote-info-row">
                  <span className="quote-info-label">Date de validation</span>
                  <span className="quote-info-value">{formatDate(quote.validatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite : Dimensionnement et Appareils */}
        <div className="quote-detail-col">
          {/* Dimensionnement Technique */}
          <div className="quote-section-card">
            <div className="quote-section-header">
              <Zap size={18} className="quote-section-icon" />
              <h3>Dimensionnement & Équipements</h3>
            </div>
            <div className="quote-specs-grid">
              <div className="quote-spec-box">
                <span className="quote-spec-lbl">Nombre de panneaux</span>
                <strong className="quote-spec-val">{system.panels || 0}</strong>
                <span className="quote-spec-hint">Mono-cristallins</span>
              </div>
              <div className="quote-spec-box">
                <span className="quote-spec-lbl">Puissance unitaire</span>
                <strong className="quote-spec-val">{system.panelPower || 0} W</strong>
                <span className="quote-spec-hint">Haute efficience</span>
              </div>
              <div className="quote-spec-box">
                <span className="quote-spec-lbl">Stockage batterie</span>
                <strong className="quote-spec-val">{system.batteryCapacity || 0} kWh</strong>
                <span className="quote-spec-hint">BMS intégré</span>
              </div>
              <div className="quote-spec-box">
                <span className="quote-spec-lbl">Puissance onduleur</span>
                <strong className="quote-spec-val">{system.inverterPower || 0} kVA</strong>
                <span className="quote-spec-hint">Réseau / Groupe / PV</span>
              </div>
            </div>
          </div>

          {/* Liste des Appareils déclarés */}
          <div className="quote-section-card">
            <div className="quote-section-header">
              <FileText size={18} className="quote-section-icon" />
              <h3>Bilan Énergétique Client ({appliances.length} appareils)</h3>
            </div>
            {appliances.length === 0 ? (
              <p className="quote-empty-text">Aucun appareil spécifié dans ce devis.</p>
            ) : (
              <div className="quote-appliances-table-wrap">
                <table className="quote-appliances-table">
                  <thead>
                    <tr>
                      <th>Appareil</th>
                      <th>Quantité</th>
                      <th>Puissance</th>
                      <th>Usage</th>
                      <th>Total / jour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appliances.map((app, idx) => {
                      const dailyWh = Number(app.quantity || 1) * Number(app.watts || 0) * Number(app.hours || 0);
                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{app.name}</strong>
                            {app.period && (
                              <span className="quote-period-pill">
                                {app.period === 'day' ? 'Journée' : app.period === 'night' ? 'Nuit' : 'Continu'}
                              </span>
                            )}
                          </td>
                          <td>{app.quantity}</td>
                          <td>{app.watts} W</td>
                          <td>{app.hours} h/j</td>
                          <td>
                            <strong>{dailyWh >= 1000 ? `${(dailyWh / 1000).toFixed(2)} kWh` : `${dailyWh} Wh`}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2"><strong>Total journalier</strong></td>
                      <td><strong>{totalWatts} W</strong></td>
                      <td>—</td>
                      <td>
                        <strong className="quote-total-highlight">
                          {(totalWh / 1000).toFixed(2)} kWh/j
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Récapitulatif Financier */}
          <div className="quote-section-card quote-financial-card">
            <div className="quote-section-header">
              <FileText size={18} className="quote-section-icon" />
              <h3>Décomposition Financière</h3>
            </div>
            <div className="quote-financial-list">
              <div className="quote-financial-row">
                <span>Fourniture des kits solaires & accessoires</span>
                <span>{formatCurrency(Math.round(quote.amount * 0.82), quote.currency)}</span>
              </div>
              <div className="quote-financial-row">
                <span>Main d'œuvre certifiée Djua & câblage</span>
                <span>{formatCurrency(Math.round(quote.amount * 0.18), quote.currency)}</span>
              </div>
              <div className="quote-financial-row quote-financial-total">
                <strong>Total TTC</strong>
                <strong className="quote-financial-grand-total">
                  {formatCurrency(quote.amount, quote.currency)}
                </strong>
              </div>
            </div>
            <div className="quote-financial-guarantee">
              <ShieldCheck size={16} />
              <span>Garantie équipement Djua 2 ans • Maintenance technique préventive incluse</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
