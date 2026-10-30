import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Folder, Search, RefreshCw, Calendar, MapPin, Eye,
  AlertTriangle, ArrowRight, List, LayoutGrid, Clock,
  CheckCircle2, AlertOctagon, Wrench, ShieldCheck, Zap
} from 'lucide-react';
import { useGetInstallations } from '../hooks/tanstack/useInstallations';
import { formatDate } from '../lib/operations';
import './InstallationsTracker.css';

// ── CONFIGURATION DES ÉTAPES DU CYCLE DE VIE (UP TABS) ──────────────────────
const STATUS_TABS = [
  { id: 'all', label: 'Tous les dossiers', icon: Folder },
  { id: 'a_planifier', label: 'À planifier', icon: Clock },
  { id: 'planifiee', label: 'Planifiées', icon: Calendar },
  { id: 'en_cours', label: 'En cours d’installation', icon: Wrench },
  { id: 'en_attente', label: 'En attente / Bloqués', icon: AlertOctagon },
  { id: 'installee', label: 'Installées', icon: CheckCircle2 },
  { id: 'mise_en_service', label: 'Mises en service', icon: Zap },
  { id: 'overdue', label: 'Échéances Dépassées', icon: AlertTriangle, isAlert: true },
];

const STATUS_CONFIG = {
  a_planifier: { label: 'À planifier', tone: 'pending' },
  planifiee: { label: 'Planifiée', tone: 'info' },
  en_cours: { label: 'En cours', tone: 'progress' },
  en_attente: { label: 'En attente', tone: 'danger' },
  installee: { label: 'Installée', tone: 'info' },
  mise_en_service: { label: 'Mise en service', tone: 'success' },
  validee: { label: 'Validée', tone: 'verified' },
};

export default function InstallationsTracker() {
  const navigate = useNavigate();

  // Filtre statut actif
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Requête API
  const { data, isLoading, isError, refetch } = useGetInstallations({
    status: activeStatus !== 'overdue' ? activeStatus : undefined,
    search: search.trim() || undefined,
  });

  const rawInstallations = useMemo(() => data?.installations || [], [data]);
  const stats = data?.statusCounts || {};

  // Filtrage local si filtre "Échéance dépassée"
  const installations = activeStatus === 'overdue'
    ? rawInstallations.filter(i => i.isOverdue)
    : rawInstallations;

  const totalCount = activeStatus === 'overdue'
    ? (stats.overdue ?? rawInstallations.filter(i => i.isOverdue).length)
    : (stats[activeStatus] ?? (activeStatus === 'all' ? (stats.total || installations.length) : installations.length));

  const overdueCount = stats.overdue || rawInstallations.filter(i => i.isOverdue).length;
  const recentInstallations = installations.slice(0, 4);

  return (
    <div className="djua-tracker-page">
      {/* ── 1. UP TABS : DOSSIERS DJUA & ÉTAPES DU CYCLE DE VIE ───────────────── */}
      <header className="djua-uptabs-card">
        {/* Bandeau Titre Senior */}
        <div className="djua-uptabs-top">
          <div className="djua-uptabs-brand">
            <div className="djua-brand-icon">
              <Folder size={22} />
            </div>
            <div>
              <div className="djua-brand-badge">
                <span>Dossiers Djua</span>
                <span className="djua-brand-dot">•</span>
                <strong>Module 2 Déploiement</strong>
              </div>
              <h1 className="djua-brand-title">Suivi des Installations</h1>
            </div>
          </div>

          <div className="djua-uptabs-meta">
            <span className="djua-cycle-label">Étapes du Cycle de Vie</span>
            <span className="djua-cycle-count">{totalCount} dossiers au total</span>
          </div>
        </div>

        {/* Barre horizontale des 8 étapes + Échéances dépassées */}
        <nav className="djua-uptabs-nav" aria-label="Étapes du Cycle de Vie">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeStatus === tab.id;
            let count = 0;
            if (tab.id === 'all') count = stats.total ?? rawInstallations.length;
            else if (tab.id === 'overdue') count = overdueCount;
            else count = stats[tab.id] ?? 0;

            return (
              <button
                key={tab.id}
                type="button"
                className={`djua-uptab-btn ${isActive ? 'is-active' : ''} ${tab.isAlert && count > 0 ? 'is-alert-tab' : ''}`}
                onClick={() => setActiveStatus(tab.id)}
              >
                <Icon size={15} className="djua-uptab-icon" />
                <span className="djua-uptab-text">{tab.label}</span>
                <span className={`djua-uptab-badge ${tab.isAlert && count > 0 ? 'is-alert-badge' : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── 2. BARRE D'ACTIONS : RECHERCHE & AFFICHAGE LISTE/GRILLE ────────────── */}
      <section className="djua-tracker-toolbar">
        <div className="djua-toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher par dossier N°, client, kit, technicien…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="djua-toolbar-controls">
          {/* Toggle Liste / Grille */}
          <div className="djua-view-switch">
            <button
              type="button"
              className={`djua-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vue en liste détaillée"
            >
              <List size={15} />
              <span>Liste</span>
            </button>
            <button
              type="button"
              className={`djua-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vue en cartes grille"
            >
              <LayoutGrid size={15} />
              <span>Grille</span>
            </button>
          </div>

          {/* Bouton rafraîchir */}
          <button
            type="button"
            className="djua-btn-refresh"
            onClick={() => refetch()}
            title="Rafraîchir les données"
          >
            <RefreshCw size={15} className={isLoading ? 'ops-spin' : ''} />
          </button>
        </div>
      </section>

      {/* ── 3. DOSSIERS RÉCENTS (Documents Cards stylées Djua) ────────────────── */}
      {recentInstallations.length > 0 && !search && activeStatus === 'all' && (
        <section className="djua-recent-row">
          <div className="djua-recent-header">
            <h3>Dossiers Récents</h3>
            <span className="djua-recent-meta">Derniers chantiers initiés suite à validation de devis</span>
          </div>

          <div className="djua-recent-cards-grid">
            {recentInstallations.map(item => {
              const statusMeta = STATUS_CONFIG[item.status] || { label: item.status, tone: 'pending' };
              const systemPower = ((Number(item.system?.panels || 0) * Number(item.system?.panelPower || 0)) / 1000).toFixed(1);

              return (
                <div
                  key={item._id}
                  className="djua-recent-card"
                  onClick={() => navigate(`/installations/${item._id}`)}
                >
                  <div className="djua-recent-card-top">
                    <div className="djua-folder-badge">
                      <Folder size={18} />
                    </div>
                    {item.isOverdue ? (
                      <span className="djua-overdue-tag"><AlertTriangle size={12} /> Retard</span>
                    ) : (
                      <span className={`djua-status-pill ${statusMeta.tone}`}>
                        {statusMeta.label}
                      </span>
                    )}
                  </div>

                  <strong className="djua-recent-client">
                    {item.customer?.name || 'Client sans nom'}
                  </strong>
                  <span className="djua-recent-folder-num font-mono">
                    {item.folderNumber}
                  </span>

                  <div className="djua-recent-footer">
                    <span>{systemPower} kWc • {item.system?.batteryCapacity || 0} kWh</span>
                    <span className="djua-recent-date">{formatDate(item.plannedDate || item.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. CONTENU PRINCIPAL : LISTE OU GRILLE ────────────────────────────── */}
      <section className="djua-tracker-content">
        {isLoading ? (
          <div className="djua-empty-state">
            <RefreshCw size={26} className="ops-spin" />
            <p>Chargement des dossiers d'installation en direct…</p>
          </div>
        ) : isError ? (
          <div className="djua-empty-state is-error">
            <AlertTriangle size={26} />
            <p>Impossible de joindre le serveur pour charger les installations.</p>
            <button type="button" onClick={() => refetch()} className="djua-retry-btn">Réessayer</button>
          </div>
        ) : installations.length === 0 ? (
          <div className="djua-empty-state">
            <Folder size={36} />
            <h4>Aucun dossier d'installation trouvé</h4>
            <p>
              {search
                ? 'Aucun dossier ne correspond à votre recherche.'
                : activeStatus === 'overdue'
                ? 'Excellente nouvelle ! Aucun chantier n’a d’échéance dépassée.'
                : activeStatus !== 'all'
                ? `Aucun dossier au statut « ${STATUS_TABS.find(f => f.id === activeStatus)?.label} ».`
                : 'Les dossiers d’installation sont automatiquement générés lors de la validation d’un devis.'}
            </p>
            <Link to="/devis" className="djua-link-cta">
              Consulter les devis à valider <ArrowRight size={14} />
            </Link>
          </div>
        ) : viewMode === 'list' ? (
          /* VUE LISTE TABLEAU COMPLET */
          <div className="djua-table-card">
            <table className="djua-table">
              <thead>
                <tr>
                  <th>Dossier N° & Devis</th>
                  <th>Client & Emplacement</th>
                  <th>Système Solaire</th>
                  <th>Technicien Assigné</th>
                  <th>Date d'intervention</th>
                  <th>Statut Opérationnel</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {installations.map(inst => {
                  const statusMeta = STATUS_CONFIG[inst.status] || { label: inst.status, tone: 'pending' };
                  const systemPower = ((Number(inst.system?.panels || 0) * Number(inst.system?.panelPower || 0)) / 1000).toFixed(1);

                  return (
                    <tr
                      key={inst._id}
                      className="djua-table-row"
                      onClick={() => navigate(`/installations/${inst._id}`)}
                    >
                      <td>
                        <div className="djua-cell-folder">
                          <Folder size={16} className="djua-folder-icon" />
                          <div>
                            <strong>{inst.folderNumber}</strong>
                            <small>Devis {inst.quoteNumber}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{inst.customer?.name || 'Client sans nom'}</strong>
                        <small>{[inst.site?.quartier, inst.site?.ville || 'Kinshasa'].filter(Boolean).join(', ')}</small>
                      </td>

                      <td>
                        <strong>{systemPower} kWc PV</strong>
                        <small>{inst.system?.batteryCapacity || 0} kWh • {inst.system?.inverterPower || 0} kVA</small>
                      </td>

                      <td>
                        {inst.assignedTechnician ? (
                          <div className="djua-tech-chip">
                            <span className="djua-tech-avatar">
                              {inst.assignedTechnician.prenom?.charAt(0) || 'T'}
                            </span>
                            <span>{inst.assignedTechnician.prenom} {inst.assignedTechnician.nom}</span>
                          </div>
                        ) : (
                          <span className="djua-unassigned">Non assigné</span>
                        )}
                      </td>

                      <td>
                        <div className="djua-date-cell">
                          <Calendar size={13} />
                          <span>{formatDate(inst.plannedDate)}</span>
                        </div>
                      </td>

                      <td>
                        <div className="djua-status-wrap">
                          <span className={`djua-status-pill ${statusMeta.tone}`}>
                            <span className="djua-pill-dot" />
                            {statusMeta.label}
                          </span>
                          {inst.isOverdue && (
                            <span className="djua-overdue-tag"><AlertTriangle size={12} /> Retard</span>
                          )}
                          {inst.blockedReason && (
                            <small className="djua-blocked-reason">
                              {inst.blockedReason}
                            </small>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="djua-table-action-btn"
                          title="Consulter la fiche détaillée complète"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/installations/${inst._id}`);
                          }}
                        >
                          <Eye size={14} /> Fiche Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* VUE GRILLE CARTES */
          <div className="djua-grid-cards">
            {installations.map(inst => {
              const statusMeta = STATUS_CONFIG[inst.status] || { label: inst.status, tone: 'pending' };
              const systemPower = ((Number(inst.system?.panels || 0) * Number(inst.system?.panelPower || 0)) / 1000).toFixed(1);

              return (
                <div
                  key={inst._id}
                  className="djua-grid-card"
                  onClick={() => navigate(`/installations/${inst._id}`)}
                >
                  <div className="djua-grid-card-head">
                    <div className="djua-folder-badge">
                      <Folder size={18} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inst.isOverdue && (
                        <span className="djua-overdue-tag"><AlertTriangle size={12} /> Retard</span>
                      )}
                      <span className={`djua-status-pill ${statusMeta.tone}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  <h4 className="djua-grid-client">
                    {inst.customer?.name || 'Client sans nom'}
                  </h4>
                  <span className="djua-grid-folder font-mono">
                    {inst.folderNumber}
                  </span>

                  <p className="djua-grid-location">
                    <MapPin size={12} />
                    {[inst.site?.quartier, inst.site?.ville || 'Kinshasa'].filter(Boolean).join(', ')}
                  </p>

                  <div className="djua-grid-specs-box">
                    <div>
                      <small>Puissance</small>
                      <strong>{systemPower} kWc</strong>
                    </div>
                    <div>
                      <small>Stockage</small>
                      <strong>{inst.system?.batteryCapacity || 0} kWh</strong>
                    </div>
                  </div>

                  <div className="djua-grid-card-footer">
                    {inst.assignedTechnician ? (
                      <div className="djua-tech-chip">
                        <span className="djua-tech-avatar">
                          {inst.assignedTechnician.prenom?.charAt(0) || 'T'}
                        </span>
                        <span>{inst.assignedTechnician.prenom}</span>
                      </div>
                    ) : (
                      <span className="djua-unassigned">Non assigné</span>
                    )}
                    <span className="djua-grid-date">
                      {formatDate(inst.plannedDate || inst.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
