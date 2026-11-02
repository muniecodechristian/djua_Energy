import React from 'react';
import {
  X, Printer, User, MapPin, Sun, Battery, Zap,
  Layers, FileText, ShieldCheck, ArrowRight, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './QuoteDetailModal.css';

const statusLabels = {
  draft: 'En attente',
  approved: 'Accepté',
  rejected: 'Refusé',
  installing: 'En cours d’installation',
  installed: 'Installé & Opérationnel',
};

function formatFrancs(amount, currency = 'CDF') {
  if (amount == null) return '—';
  const displayCurrency = (!currency || currency === 'XAF' || currency === 'CDF' || currency === 'FC') ? 'Francs' : currency;
  return new Intl.NumberFormat('fr-CD', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + displayCurrency;
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

export default function QuoteDetailModal({ quote, onClose }) {
  const navigate = useNavigate();

  if (!quote) return null;

  const customer = quote.customer || {};
  const details = customer.details || {};
  const site = quote.site || {};
  const system = quote.system || {};
  const appliances = Array.isArray(quote.appliances) ? quote.appliances : [];
  const status = quote.status || 'draft';
  // Calculs totaux des appareils
  const totalDailyWh = appliances.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.watts || 0) * Number(item.hours || 0)), 0);
  const totalPowerW = appliances.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.watts || 0)), 0);
  const totalPvKw = system.panels && system.panelPower ? ((system.panels * system.panelPower) / 1000).toFixed(2) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="quote-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quote-modal-card">
        {/* Entête */}
        <header className="quote-modal-header">
          <div className="quote-modal-title-group">
            <div className="quote-modal-icon-badge">
              <FileText size={22} />
            </div>
            <div>
              <h2>
                Devis {quote.number}
                <span className={`quote-modal-status-pill ${status}`}>
                  {statusLabels[status] || status}
                </span>
              </h2>
              <p>Créé le {formatDate(quote.createdAt)} · RDC (Kinshasa)</p>
            </div>
          </div>
          <div className="quote-modal-actions">
            <button type="button" className="quote-modal-btn" onClick={handlePrint} title="Imprimer ou enregistrer en PDF">
              <Printer size={15} /> Imprimer
            </button>
            <button type="button" className="quote-modal-btn icon-only" onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Contenu Déroulant */}
        <div className="quote-modal-body">
          {/* Métriques Clés */}
          <div className="quote-modal-highlight-grid">
            <div className="quote-modal-kpi accent">
              <span className="quote-modal-kpi-label">
                <TrendingUp size={14} /> Montant Total Estimé
              </span>
              <span className="quote-modal-kpi-value">
                {formatFrancs(quote.amount, quote.currency)}
              </span>
              <span className="quote-modal-kpi-sub">
                {quote.currency === 'CDF' || !quote.currency ? 'Francs Congolais (FC)' : quote.currency}
              </span>
            </div>

            <div className="quote-modal-kpi">
              <span className="quote-modal-kpi-label">
                <Sun size={14} /> Puissance Solaire
              </span>
              <span className="quote-modal-kpi-value">
                {system.panels || 0} panneaux
              </span>
              <span className="quote-modal-kpi-sub">
                {system.panelPower || 0} Wc / panneau · {totalPvKw ? `${totalPvKw} kWc total` : '—'}
              </span>
            </div>

            <div className="quote-modal-kpi">
              <span className="quote-modal-kpi-label">
                <Battery size={14} /> Stockage & Onduleur
              </span>
              <span className="quote-modal-kpi-value">
                {system.batteryCapacity || 0} kWh
              </span>
              <span className="quote-modal-kpi-sub">
                Onduleur {system.inverterPower || 0} kVA
              </span>
            </div>

            <div className="quote-modal-kpi">
              <span className="quote-modal-kpi-label">
                <Zap size={14} /> Consommation Client
              </span>
              <span className="quote-modal-kpi-value">
                {(totalDailyWh / 1000).toFixed(2)} kWh/j
              </span>
              <span className="quote-modal-kpi-sub">
                {appliances.length} équipement(s) répertorié(s)
              </span>
            </div>
          </div>

          {/* Section 1 : Informations Client & Société */}
          <section className="quote-modal-section">
            <h3 className="quote-modal-section-title">
              <User size={16} /> Informations Client & Profil
            </h3>
            <div className="quote-modal-details-grid">
              <div className="quote-modal-fact">
                <dt>Client / Raison Sociale</dt>
                <dd>{customer.name || details.companyName || details.fullName || 'Non spécifié'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Profil Client</dt>
                <dd>{customer.profile === 'entreprise' ? 'Entreprise / Professionnel' : 'Particulier'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Numéro de Téléphone</dt>
                <dd>{customer.phone || 'Non renseigné'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Adresse Email</dt>
                <dd>{customer.email || 'Non renseigné'}</dd>
              </div>
              {details.contactName && (
                <div className="quote-modal-fact">
                  <dt>Personne de Contact</dt>
                  <dd>{details.contactName}</dd>
                </div>
              )}
              {details.rccm && (
                <div className="quote-modal-fact">
                  <dt>RCCM</dt>
                  <dd>{details.rccm}</dd>
                </div>
              )}
              {details.idNationale && (
                <div className="quote-modal-fact">
                  <dt>ID Nationale</dt>
                  <dd>{details.idNationale}</dd>
                </div>
              )}
              {details.tva && (
                <div className="quote-modal-fact">
                  <dt>N° TVA</dt>
                  <dd>{details.tva}</dd>
                </div>
              )}
              {details.secteur && (
                <div className="quote-modal-fact">
                  <dt>Secteur d'Activité</dt>
                  <dd>{details.secteur}</dd>
                </div>
              )}
              {quote.owner && (
                <div className="quote-modal-fact">
                  <dt>Créé Par (Commercial / Agent)</dt>
                  <dd>
                    {typeof quote.owner === 'object'
                      ? `${quote.owner.nom || ''} ${quote.owner.prenom || ''} (${quote.owner.role || 'Commercial'})`
                      : 'Agent Djua'}
                  </dd>
                </div>
              )}
            </div>
          </section>

          {/* Section 2 : Emplacement du Site d'Installation */}
          <section className="quote-modal-section">
            <h3 className="quote-modal-section-title">
              <MapPin size={16} /> Emplacement du Site d'Installation
            </h3>
            <div className="quote-modal-details-grid">
              <div className="quote-modal-fact">
                <dt>Adresse</dt>
                <dd>{site.adresse || customer.address || 'Non précisée'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Quartier / Commune</dt>
                <dd>{[site.quartier, site.commune].filter(Boolean).join(', ') || '—'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Ville & Province</dt>
                <dd>{[site.ville, details.province].filter(Boolean).join(' · ') || 'Kinshasa'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Type de Bâtiment</dt>
                <dd>{quote.buildingType || 'Résidentiel'}</dd>
              </div>
              {Number.isFinite(site.lat) && Number.isFinite(site.lng) && (
                <div className="quote-modal-fact">
                  <dt>Coordonnées GPS</dt>
                  <dd>{site.lat.toFixed(5)}, {site.lng.toFixed(5)}</dd>
                </div>
              )}
            </div>
          </section>

          {/* Section 3 : Bilan Exhaustif des Appareils du Client */}
          <section className="quote-modal-section">
            <h3 className="quote-modal-section-title">
              <Layers size={16} /> Bilan Énergétique & Appareils ({appliances.length})
            </h3>
            {appliances.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: 0 }}>
                Aucun appareil spécifique n'a été enregistré pour ce devis.
              </p>
            ) : (
              <div className="quote-modal-table-container">
                <table className="quote-modal-table">
                  <thead>
                    <tr>
                      <th>Équipement</th>
                      <th>Quantité</th>
                      <th>Puissance unitaire</th>
                      <th>Utilisation</th>
                      <th>Période</th>
                      <th>Conso journalière</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appliances.map((app, idx) => {
                      const dailyWh = (Number(app.quantity || 1) * Number(app.watts || 0) * Number(app.hours || 0));
                      const periodMap = {
                        day: 'Jour',
                        night: 'Nuit',
                        both: 'Jour & Nuit',
                        mixed: 'Mixte',
                        continuous: 'Continu (24h/24)',
                      };
                      return (
                        <tr key={idx}>
                          <td><strong>{app.name || 'Appareil'}</strong></td>
                          <td>{app.quantity || 1}</td>
                          <td>{app.watts || 0} W</td>
                          <td>{app.hours || 0} h/jour</td>
                          <td>{periodMap[app.period] || app.period || 'Mixte'}</td>
                          <td><strong>{dailyWh >= 1000 ? `${(dailyWh / 1000).toFixed(2)} kWh/j` : `${dailyWh} Wh/j`}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--panel-alt, #1c202a)', fontWeight: 700 }}>
                      <td colSpan="2">Total {appliances.length} appareil(s)</td>
                      <td>{totalPowerW} W connectés</td>
                      <td colSpan="2">Total énergie quotidienne</td>
                      <td>{(totalDailyWh / 1000).toFixed(2)} kWh/jour</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Section 4 : Suivi & Traçabilité Installation */}
          <section className="quote-modal-section">
            <h3 className="quote-modal-section-title">
              <ShieldCheck size={16} /> Traçabilité & Suivi d'Installation
            </h3>
            <div className="quote-modal-details-grid">
              <div className="quote-modal-fact">
                <dt>Date d'installation prévue</dt>
                <dd>{quote.plannedDate ? formatDate(quote.plannedDate) : 'À planifier après acceptation'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Kit solaire associé</dt>
                <dd>{quote.kitId ? <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{quote.kitId}</span> : 'Aucun kit raccordé pour l’instant'}</dd>
              </div>
              <div className="quote-modal-fact">
                <dt>Date effective d'enregistrement</dt>
                <dd>{quote.installedDay || 'Non enregistrée'}</dd>
              </div>
              {quote.recommendationId && (
                <div className="quote-modal-fact">
                  <dt>Réf étude IA (Solar Advisor)</dt>
                  <dd style={{ fontFamily: 'monospace', fontSize: 11 }}>{quote.recommendationId}</dd>
                </div>
              )}
              {quote.validatedBy && (
                <div className="quote-modal-fact">
                  <dt>Validé par</dt>
                  <dd>
                    {typeof quote.validatedBy === 'object'
                      ? `${quote.validatedBy.nom || ''} ${quote.validatedBy.prenom || ''}`
                      : 'Responsable / Admin'}
                  </dd>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="quote-modal-footer">
        <div className="quote-modal-approve-box">
          <div className="quote-modal-approval-copy">
            <span>{status === 'draft' ? 'PROCHAINE ÉTAPE' : 'SUIVI DU DEVIS'}</span>
            <strong>{status === 'draft' ? 'Enregistrer la réponse du client' : `Devis ${statusLabels[status] || status}`}</strong>
            <small>Ouvrez la fiche de suivi pour gérer l’acceptation et la création du dossier.</small>
          </div>
          <button
            type="button"
            className="quote-modal-btn primary"
            onClick={() => {
              onClose();
              navigate(`/devis/${encodeURIComponent(quote.number)}`);
            }}
          >
            Ouvrir le suivi<ArrowRight size={15} />
          </button>
        </div>

          <button type="button" className="quote-modal-btn" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
