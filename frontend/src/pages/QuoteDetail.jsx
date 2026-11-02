import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Battery, Calendar, Check, CheckCircle2,
  Clock3, FileText, FolderPlus, MapPin, Mail, Phone,
  Printer, ShieldCheck, Sun, UserRound, X, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import './QuoteDetail.css';

const statusConfig = {
  draft: { label: 'En attente', tone: 'draft' },
  approved: { label: 'Accepté', tone: 'approved' },
  rejected: { label: 'Refusé', tone: 'rejected' },
  installing: { label: 'Installation en cours', tone: 'installing' },
  installed: { label: 'Installé', tone: 'installed' },
};

const formatCurrency = (amount, currency = 'CDF') => {
  if (amount == null) return '—';
  return `${new Intl.NumberFormat('fr-CD', { maximumFractionDigits: 0 }).format(Number(amount))} ${currency}`;
};

function formatDate(value, withTime = false) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Non renseignée';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Kinshasa',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

function todayKinshasa() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kinshasa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return parts.filter(part => ['year', 'month', 'day'].includes(part.type)).map(part => part.value).join('-');
}

function personName(person) {
  if (!person || typeof person !== 'object') return 'Non renseigné';
  return [person.prenom, person.nom].filter(Boolean).join(' ') || 'Non renseigné';
}

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('follow-up');
  const [folderName, setFolderName] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [createdFolder, setCreatedFolder] = useState(null);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['quote-detail', id],
    queryFn: async () => {
      const response = await api.get(`/api/quotes/${encodeURIComponent(id)}`);
      return response.data?.data;
    },
    enabled: Boolean(id),
  });

  const { data: linkedInstallation, isLoading: isLoadingInstallation, error: installationError, refetch: refetchInstallation } = useQuery({
    queryKey: ['quote-linked-installation', quote?.number],
    queryFn: async () => {
      const response = await api.get(`/api/installations?search=${encodeURIComponent(quote.number)}`);
      const installations = response.data?.data?.installations || [];
      return installations.find(item => item.quoteNumber === quote.number || item.quote?._id === quote._id) || null;
    },
    enabled: Boolean(quote?.number),
  });

  const refreshQuoteViews = () => {
    queryClient.invalidateQueries({ queryKey: ['quote-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['quote-linked-installation', quote?.number] });
    queryClient.invalidateQueries({ queryKey: ['quote-workspace'] });
    queryClient.invalidateQueries({ queryKey: ['sales-quotes'] });
    queryClient.invalidateQueries({ queryKey: ['admin-reports-quotes'] });
    queryClient.invalidateQueries({ queryKey: ['installations'] });
  };

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/api/quotes/${encodeURIComponent(quote.number)}/approve`);
      return response.data?.data;
    },
    onSuccess: () => {
      toast.success('L’acceptation du devis a été enregistrée.');
      refreshQuoteViews();
    },
    onError: errorResponse => toast.error(errorResponse.response?.data?.message || 'Impossible d’enregistrer l’acceptation.'),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/api/quotes/${encodeURIComponent(quote.number)}/reject`);
      return response.data?.data;
    },
    onSuccess: () => {
      toast.success('Le refus du devis a été enregistré.');
      refreshQuoteViews();
    },
    onError: errorResponse => toast.error(errorResponse.response?.data?.message || 'Impossible d’enregistrer le refus.'),
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/quotes/${encodeURIComponent(quote.number)}/installation`, {
        folderName: folderName.trim() || `Installation - ${quote.customer?.name || quote.number}`,
        ...(plannedDate ? { plannedDate } : {}),
      });
      return response.data?.data;
    },
    onSuccess: folder => {
      setCreatedFolder(folder);
      toast.success('Le dossier d’installation a été créé.');
      refreshQuoteViews();
    },
    onError: errorResponse => toast.error(errorResponse.response?.data?.message || 'Impossible de créer le dossier d’installation.'),
  });

  if (isLoading) {
    return <div className="quote-detail-loading-screen"><div className="quote-detail-spinner" /><p>Chargement du devis…</p></div>;
  }

  if (error || !quote) {
    return (
      <div className="quote-detail-error-container">
        <h2>Devis introuvable</h2>
        <p>Le devis demandé n'existe pas ou vous n'avez pas l'autorisation d'y accéder.</p>
        <Link to="/devis" className="quote-detail-back-btn"><ArrowLeft size={16} />Retour aux devis</Link>
      </div>
    );
  }

  const isAdmin = ['admin', 'administration'].includes(currentUser?.role);
  const isCreator = quote.owner && String(quote.owner._id || quote.owner) === String(currentUser?._id);
  const isShopManager = currentUser?.role === 'shop_manager' &&
    (!quote.shopManager || String(quote.shopManager._id || quote.shopManager) === String(currentUser?._id));
  const canManageQuote = isAdmin || isCreator || isShopManager;
  const canRecordDecision = canManageQuote && quote.status === 'draft';
  const isAccepted = ['approved', 'installing', 'installed'].includes(quote.status);
  const customer = quote.customer || {};
  const customerDetails = customer.details || {};
  const site = quote.site || {};
  const system = quote.system || {};
  const appliances = Array.isArray(quote.appliances) ? quote.appliances : [];
  const lineItems = Array.isArray(quote.lineItems) ? quote.lineItems : [];
  const status = statusConfig[quote.status] || { label: quote.status || 'Statut inconnu', tone: 'draft' };
  const installation = createdFolder || linkedInstallation;
  const installationId = installation?._id;
  const installationNumber = installation?.folderNumber;
  const acceptedDate = quote.acceptedAt || quote.validatedAt;
  const ownerName = personName(quote.owner);
  const batteryCapacityKwh = Number(system.batteryCapacity || 0) > 100
    ? Number(system.batteryCapacity) / 1000
    : Number(system.batteryCapacity || 0);
  const address = [site.adresse || customer.address, site.quartier, site.commune, site.ville, customerDetails.province]
    .filter(Boolean)
    .join(', ');
  const totalDailyWh = appliances.reduce(
    (total, appliance) => total + Number(appliance.quantity || 1) * Number(appliance.watts || 0) * Number(appliance.hours || 0),
    0,
  );
  const panelPowerKw = Number(system.panels || 0) * Number(system.panelPower || 0) / 1000;
  const actionPending = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <main className="quote-detail-page">
      <header className="quote-detail-nav no-print">
        <button type="button" className="quote-detail-back-link" onClick={() => navigate('/devis')}>
          <ArrowLeft size={16} />Retour aux devis
        </button>
        <div className="quote-detail-nav-actions">
          <button type="button" className="quote-detail-btn-secondary" onClick={() => window.print()}>
            <Printer size={16} />Imprimer / PDF
          </button>
        </div>
      </header>

      <section className="quote-detail-heading">
        <div>
          <div className="quote-detail-title-row">
            <h1>Devis {quote.number}</h1>
            <span className={`quote-detail-badge ${status.tone}`}>{status.label}</span>
          </div>
          <p>Créé par {ownerName} · {formatDate(quote.createdAt, true)}</p>
        </div>
      </section>

      <section className="quote-summary-card" aria-label="Résumé du devis">
        <div className="quote-summary-customer">
          <span className="quote-summary-icon"><UserRound size={19} /></span>
          <div><strong>{customer.name || 'Client non renseigné'}</strong><span>{customer.profile === 'entreprise' ? 'Entreprise' : customer.profile === 'personne' ? 'Particulier' : 'Profil non renseigné'}</span><small>{address || 'Adresse du site non renseignée'}</small></div>
        </div>
        <div className="quote-summary-fact"><span><Calendar size={16} />Date du devis</span><strong>{formatDate(quote.createdAt)}</strong></div>
        <div className="quote-summary-fact"><span><ShieldCheck size={16} />Réponse client</span><strong>{isAccepted ? `Accepté le ${formatDate(acceptedDate, true)}` : quote.rejectedAt ? `Refusé le ${formatDate(quote.rejectedAt, true)}` : 'En attente'}</strong></div>
        <div className="quote-summary-amount"><span>Montant du devis</span><strong>{formatCurrency(quote.amount, quote.currency)}</strong></div>
      </section>

      <div className="quote-detail-layout">
        <section className="quote-detail-main">
          <nav className="quote-detail-tabs no-print" aria-label="Sections du devis">
            <button type="button" className={activeTab === 'follow-up' ? 'is-active' : ''} onClick={() => setActiveTab('follow-up')}>Suivi du devis</button>
            <button type="button" className={activeTab === 'details' ? 'is-active' : ''} onClick={() => setActiveTab('details')}>Détails du devis</button>
          </nav>

          {activeTab === 'follow-up' ? (
            <div className="quote-followup-content">
              {quote.status === 'draft' && (
                <section className="quote-action-card">
                  <div className="quote-action-card-heading">
                    <span className="quote-action-icon pending"><Clock3 size={19} /></span>
                    <div><h2>Réponse du client attendue</h2><p>Enregistrez la décision du client pour continuer le traitement du devis.</p></div>
                  </div>
                  {canRecordDecision ? (
                    <div className="quote-decision-actions no-print">
                      <button type="button" className="quote-decision-button accept" disabled={actionPending} onClick={() => acceptMutation.mutate()}>
                        <Check size={16} />{acceptMutation.isPending ? 'Enregistrement…' : 'Marquer comme accepté'}
                      </button>
                      <button type="button" className="quote-decision-button reject" disabled={actionPending} onClick={() => rejectMutation.mutate()}>
                        <X size={16} />{rejectMutation.isPending ? 'Enregistrement…' : 'Marquer comme refusé'}
                      </button>
                    </div>
                  ) : <p className="quote-action-note">La décision du devis est réservée à son créateur, au responsable shop ou à l’administration.</p>}
                </section>
              )}

              {quote.status === 'rejected' && (
                <section className="quote-decision-result rejected">
                  <span className="quote-action-icon rejected"><X size={20} /></span>
                  <div><h2>Le devis a été refusé</h2><p>Réponse enregistrée le {formatDate(quote.rejectedAt, true)}.</p></div>
                </section>
              )}

              {isAccepted && (
                <section className="quote-installation-ready">
                  <div className="quote-ready-heading">
                    <span className="quote-action-icon accepted"><CheckCircle2 size={21} /></span>
                    <div><h2>{installation ? 'Dossier d’installation prêt' : 'Le devis a été accepté !'}</h2><p>{installation ? `Le dossier ${installationNumber || ''} est rattaché à ce devis.` : 'Le client est prêt à passer à l’installation. Vous pouvez maintenant créer son dossier.'}</p></div>
                  </div>
                  <div className="quote-ready-facts">
                    <div><span>Décision client</span><strong>Accepté</strong><small>{formatDate(acceptedDate, true)}</small></div>
                    <div><span>Système proposé</span><strong>{panelPowerKw ? `${panelPowerKw.toLocaleString('fr-FR')} kWc` : 'Puissance non renseignée'} · {batteryCapacityKwh.toLocaleString('fr-FR')} kWh · {system.inverterPower ?? '—'} kVA</strong><small>{system.panels ?? 0} panneau(x) · {system.panelPower ?? 0} W par panneau</small></div>
                    <div><span>Site d’installation</span><strong>{site.ville || 'Ville non renseignée'}{site.commune ? `, ${site.commune}` : ''}</strong><small>{address || 'Adresse non renseignée'}</small></div>
                    <div><span>Montant du devis</span><strong>{formatCurrency(quote.amount, quote.currency)}</strong><small>{appliances.length} équipement(s) déclaré(s)</small></div>
                  </div>
                  {installationId ? (
                    <Link className="quote-create-folder-button" to={`/installations/${installationId}`}>
                      <FolderPlus size={16} />Accéder au dossier<ArrowRight size={15} />
                    </Link>
                  ) : installationError ? (
                    <div className="quote-installation-error" role="alert">
                      <p>Impossible de vérifier si un dossier existe déjà. Réessayez avant d’en créer un.</p>
                      <button type="button" className="quote-decision-button" onClick={() => refetchInstallation()}>Réessayer</button>
                    </div>
                  ) : canManageQuote ? (
                    <form className="quote-create-folder-form no-print" onSubmit={event => { event.preventDefault(); createFolderMutation.mutate(); }}>
                      <label>
                        Nom du dossier
                        <input value={folderName} onChange={event => setFolderName(event.target.value)} placeholder={`Installation - ${customer.name || quote.number}`} maxLength={120} />
                      </label>
                      <label>
                        Date d’installation <span>(facultative)</span>
                        <input type="date" min={todayKinshasa()} value={plannedDate} onChange={event => setPlannedDate(event.target.value)} />
                      </label>
                      <button className="quote-create-folder-button" type="submit" disabled={createFolderMutation.isPending || isLoadingInstallation}>
                        <FolderPlus size={16} />{createFolderMutation.isPending ? 'Création en cours…' : 'Créer le dossier'}
                      </button>
                    </form>
                  ) : <p className="quote-action-note">La création du dossier est réservée au créateur du devis, au responsable shop ou à l’administration.</p>}
                </section>
              )}

              {isAccepted && installation && (
                <div className="quote-installation-notice">
                  <FileText size={17} /><div><strong>Dossier créé à partir des données du devis</strong><span>Client, site, système et équipements sont repris automatiquement.</span></div>
                </div>
              )}
            </div>
          ) : (
            <div className="quote-technical-details">
              <section className="quote-detail-section quote-line-items-section">
                <h2><FileText size={18} />Détail des équipements et prestations</h2>
                {lineItems.length > 0 ? (
                  <div className="quote-appliances-wrap">
                    <table className="quote-appliances-table quote-line-items-table">
                      <thead><tr><th>Élément</th><th>Détails</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
                      <tbody>{lineItems.map((item, index) => (
                        <tr key={`${item.category}-${item.name}-${index}`}>
                          <td><span className="quote-line-item-category">{item.category}</span><strong>{item.name}</strong></td>
                          <td className="quote-line-item-description">{item.description || '—'}</td>
                          <td>{item.unit === 'forfait' ? 'Forfait' : item.quantity}</td>
                          <td>{item.unit === 'forfait' ? '—' : formatCurrency(item.unitPrice, item.currency || quote.currency)}</td>
                          <td><strong>{formatCurrency(item.total ?? Number(item.quantity || 0) * Number(item.unitPrice || 0), item.currency || quote.currency)}</strong></td>
                        </tr>
                      ))}</tbody>
                      <tfoot><tr><td colSpan="4">Total du devis</td><td><strong>{formatCurrency(quote.amount, quote.currency)}</strong></td></tr></tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="quote-line-items-unavailable">
                    <p>La ventilation tarifaire n’a pas été enregistrée pour ce devis. Le montant total conservé en base est :</p>
                    <strong>{formatCurrency(quote.amount, quote.currency)}</strong>
                  </div>
                )}
              </section>

              <section className="quote-detail-section">
                <h2><UserRound size={18} />Informations client</h2>
                <dl className="quote-detail-facts">
                  <div><dt>Nom / raison sociale</dt><dd>{customer.name || 'Non renseigné'}</dd></div>
                  <div><dt>Profil</dt><dd>{customer.profile === 'entreprise' ? 'Entreprise' : customer.profile === 'personne' ? 'Particulier' : 'Non renseigné'}</dd></div>
                  <div><dt>Téléphone</dt><dd>{customer.phone || 'Non renseigné'}</dd></div>
                  <div><dt>E-mail</dt><dd>{customer.email || 'Non renseigné'}</dd></div>
                  {customerDetails.companyName && <div><dt>Société</dt><dd>{customerDetails.companyName}</dd></div>}
                  {customerDetails.rccm && <div><dt>RCCM</dt><dd>{customerDetails.rccm}</dd></div>}
                </dl>
              </section>

              <section className="quote-detail-section">
                <h2><MapPin size={18} />Site d’installation</h2>
                <dl className="quote-detail-facts">
                  <div><dt>Adresse</dt><dd>{site.adresse || customer.address || 'Non renseignée'}</dd></div>
                  <div><dt>Quartier</dt><dd>{site.quartier || 'Non renseigné'}</dd></div>
                  <div><dt>Commune</dt><dd>{site.commune || 'Non renseignée'}</dd></div>
                  <div><dt>Ville</dt><dd>{site.ville || 'Non renseignée'}</dd></div>
                  <div><dt>Type de bâtiment</dt><dd>{quote.buildingType || 'Non renseigné'}</dd></div>
                  {Number.isFinite(site.lat) && Number.isFinite(site.lng) && <div><dt>Coordonnées GPS</dt><dd>{site.lat}, {site.lng}</dd></div>}
                </dl>
              </section>

              <section className="quote-detail-section">
                <h2><Zap size={18} />Système proposé</h2>
                <div className="quote-system-grid">
                  <div><Sun size={17} /><span>Panneaux</span><strong>{system.panels ?? '—'} × {system.panelPower ?? '—'} W</strong><small>{panelPowerKw ? `${panelPowerKw.toLocaleString('fr-FR')} kWc` : 'Puissance totale non renseignée'}</small></div>
                  <div><Battery size={17} /><span>Batterie</span><strong>{batteryCapacityKwh.toLocaleString('fr-FR')} kWh</strong></div>
                  <div><Zap size={17} /><span>Onduleur</span><strong>{system.inverterPower ?? '—'} kVA</strong></div>
                  <div><Clock3 size={17} /><span>Consommation calculée</span><strong>{(totalDailyWh / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kWh/j</strong></div>
                </div>
              </section>

              <section className="quote-detail-section">
                <h2><FileText size={18} />Équipements déclarés ({appliances.length})</h2>
                {appliances.length ? (
                  <div className="quote-appliances-wrap"><table className="quote-appliances-table">
                    <thead><tr><th>Équipement</th><th>Quantité</th><th>Puissance</th><th>Utilisation</th><th>Énergie / jour</th></tr></thead>
                    <tbody>{appliances.map((appliance, index) => {
                      const dailyWh = Number(appliance.quantity || 1) * Number(appliance.watts || 0) * Number(appliance.hours || 0);
                      return <tr key={`${appliance.name}-${index}`}><td>{appliance.name || 'Non renseigné'}</td><td>{appliance.quantity ?? '—'}</td><td>{appliance.watts ?? '—'} W</td><td>{appliance.hours ?? '—'} h/j</td><td>{(dailyWh / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kWh</td></tr>;
                    })}</tbody>
                    <tfoot><tr><td colSpan="4">Consommation journalière calculée</td><td>{(totalDailyWh / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kWh</td></tr></tfoot>
                  </table></div>
                ) : <p className="quote-detail-empty">Aucun équipement n’a été enregistré pour ce devis.</p>}
              </section>

              <section className="quote-detail-section">
                <h2><ShieldCheck size={18} />Traçabilité</h2>
                <dl className="quote-detail-facts">
                  <div><dt>Créé par</dt><dd>{ownerName}</dd></div>
                  <div><dt>Créé le</dt><dd>{formatDate(quote.createdAt, true)}</dd></div>
                  {acceptedDate && <div><dt>Accepté le</dt><dd>{formatDate(acceptedDate, true)}</dd></div>}
                  {quote.rejectedAt && <div><dt>Refusé le</dt><dd>{formatDate(quote.rejectedAt, true)}</dd></div>}
                  {quote.kitId && <div><dt>Kit associé</dt><dd>{quote.kitId}</dd></div>}
                </dl>
              </section>
            </div>
          )}
        </section>

        <aside className="quote-detail-sidebar">
          <section className="quote-sidebar-card">
            <h2>Paiement</h2>
            <div className="quote-sidebar-total">{formatCurrency(quote.amount, quote.currency)}</div>
            <p>Montant total du devis</p>
            <div className="quote-payment-unavailable"><span>Modalités de paiement</span><strong>Non renseignées</strong></div>
            <small className="quote-payment-note">Aucune échéance ni durée de paiement n’est enregistrée pour ce devis.</small>
          </section>
          <section className="quote-sidebar-card">
            <h2>Informations client</h2>
            <strong className="quote-sidebar-customer">{customer.name || 'Client non renseigné'}</strong>
            {customer.phone && <a href={`tel:${customer.phone}`}><Phone size={15} />{customer.phone}</a>}
            {customer.email && <a href={`mailto:${customer.email}`}><Mail size={15} />{customer.email}</a>}
            {customer.phone && <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Phone size={15} />Contacter sur WhatsApp</a>}
            <p><MapPin size={15} />{address || 'Adresse non renseignée'}</p>
          </section>
          {installationNumber && <section className="quote-sidebar-card">
            <h2>Dossier d’installation</h2>
            <p><FolderPlus size={15} />{installationNumber}</p>
            {installation?.plannedDate && <p><Calendar size={15} />{formatDate(installation.plannedDate)}</p>}
            {installationId && <Link className="quote-sidebar-link" to={`/installations/${installationId}`}>Ouvrir le dossier<ArrowRight size={14} /></Link>}
          </section>}
        </aside>
      </div>
    </main>
  );
}
