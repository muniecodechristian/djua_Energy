import React, { useState } from 'react';
import {
  X, Printer, User, MapPin, Sun, Battery, Zap,
  Layers, CheckCircle2, Calendar, FileText, Phone, Mail,
  Building2, Hash, ShieldCheck, Check, Clock, TrendingUp
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../api/axios';
import './QuoteDetailModal.css';

const statusLabels = {
  draft: 'À valider',
  approved: 'Validé · Installation prévue',
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

function addKinshasaDays(days) {
  const date = new Date(`${todayKinshasa()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function QuoteDetailModal({ quote, onClose }) {
  const [plannedDate, setPlannedDate] = useState(quote?.plannedDate || '');
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/quotes/${encodeURIComponent(quote.number)}/approve`, {
        plannedDate,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      toast.success('Le devis a été validé avec succès.');
      queryClient.invalidateQueries({ queryKey: ['quote-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['sales-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-quotes'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation du devis.');
    },
  });

  if (!quote) return null;

  const customer = quote.customer || {};
  const details = customer.details || {};
  const site = quote.site || {};
  const system = quote.system || {};
  const appliances = Array.isArray(quote.appliances) ? quote.appliances : [];
  const status = quote.status || 'draft';
  const today = todayKinshasa();
  const quickDates = [
    { label: 'Aujourd’hui', value: today },
    { label: 'Demain', value: addKinshasaDays(1) },
    { label: 'Dans une semaine', value: addKinshasaDays(7) },
  ];

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
                <dd>{quote.plannedDate ? formatDate(quote.plannedDate) : 'À fixer lors de la validation'}</dd>
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

        {/* Pied de page avec action de validation si brouillon */}
        <footer className="quote-modal-footer">
          {status === 'draft' ? (
            <form
              className="quote-modal-approve-box"
              onSubmit={(e) => {
                e.preventDefault();
                approveMutation.mutate();
              }}
            >
              <div className="quote-modal-approval-copy">
                <span>PROCHAINE ÉTAPE</span>
                <strong>Planifier l’installation</strong>
                <small>Choisissez une date à confirmer avec le client.</small>
              </div>
              <div className="quote-modal-date-controls">
                <div className="quote-modal-date-quick" role="group" aria-label="Choix rapides de date">
                  {quickDates.map(option => <button key={option.value} type="button" className={plannedDate === option.value ? 'is-selected' : ''} aria-pressed={plannedDate === option.value} onClick={() => setPlannedDate(option.value)}>{option.label}</button>)}
                </div>
                <label className="quote-modal-date-field" htmlFor="quote-planned-date">
                  <span><Calendar size={14} />Date prévue · Kinshasa</span>
                  <input id="quote-planned-date" type="date" required min={today} value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
                </label>
              </div>
              <button
                type="submit"
                className="quote-modal-btn primary"
                disabled={!plannedDate || plannedDate < today || approveMutation.isPending}
              >
                <Check size={15} />
                {approveMutation.isPending ? 'Validation en cours…' : 'Valider ce devis'}
              </button>
            </form>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              Ce devis est au statut <strong>{statusLabels[status] || status}</strong>.
            </div>
          )}

          <button type="button" className="quote-modal-btn" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
