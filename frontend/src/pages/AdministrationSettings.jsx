import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Gauge,
  Info,
  Languages,
  LockKeyhole,
  Moon,
  Settings2,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import PageEntrance from '../components/PageEntrance';
import ThemeToggle from '../components/ThemeToggle';
import TeamAccountForm from '../components/TeamAccountForm';
import useAuthStore from '../hooks/Zustand/useAuthStore';
import './AdministrationSettings.css';

const preferenceStorageKey = 'djua-admin-preferences';

const sections = [
  { id: 'organisation', label: 'Organisation', icon: Building2 },
  { id: 'acces', label: 'Utilisateurs & accès', icon: Users },
  { id: 'equipes', label: 'Shops & équipes', icon: ShieldCheck },
  { id: 'dimensionnement', label: 'Dimensionnement', icon: Gauge },
  { id: 'monitoring', label: 'Monitoring & alertes', icon: Activity },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'interventions', label: 'Maintenances & interventions', icon: Wrench },
  { id: 'devis', label: 'Devis', icon: FileText },
  { id: 'compte', label: 'Mon compte', icon: LockKeyhole },
];

const sectionDescriptions = {
  acces: 'Consultez votre session et les rôles disponibles dans l’espace.',
  equipes: 'Créez les comptes responsables qui pourront gérer leurs équipes de terrain.',
  interventions: 'Consultez les maintenances, les interventions planifiées et leurs comptes-rendus.',
  dimensionnement: 'Retrouvez le parcours de dimensionnement et les recommandations solaires.',
  monitoring: 'Accédez au parc connecté et aux alertes techniques.',
  notifications: 'Consultez les alertes et événements remontés par la plateforme.',
  devis: 'Suivez les propositions commerciales et les validations en cours.',
  compte: 'Informations de session et préférences d’affichage de ce navigateur.',
};

function readPreferences() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(preferenceStorageKey) || '{}') || {};
    return {
      language: 'fr',
      dateFormat: saved.dateFormat === 'MM/dd/yyyy' ? 'MM/dd/yyyy' : 'dd/MM/yyyy',
    };
  } catch {
    return { language: 'fr', dateFormat: 'dd/MM/yyyy' };
  }
}

function SettingsNotice({ children }) {
  return (
    <div className="admin-settings-notice" role="note">
      <Info size={16} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function SectionLink({ to, children }) {
  return (
    <Link className="admin-settings-link" to={to}>
      {children}<ChevronRight size={15} aria-hidden="true" />
    </Link>
  );
}

function OrganisationPanel({ preferences, onPreferenceChange }) {
  return (
    <div className="admin-settings-columns">
      <div className="admin-settings-main-column">
        <section className="admin-settings-card">
          <header className="admin-settings-card-heading">
            <div>
              <h2><Building2 size={17} />Informations générales</h2>
              <p>Identité de l’espace de travail Djua Energy.</p>
            </div>
            <span className="admin-settings-readonly">Espace de travail</span>
          </header>
          <dl className="admin-settings-details">
            <div><dt>Nom de l’organisation</dt><dd>Djua Energy</dd></div>
            <div><dt>Activité</dt><dd>Solutions et supervision solaires</dd></div>
            <div><dt>Zone de service</dt><dd>République démocratique du Congo</dd></div>
            <div><dt>Adresse, site web et coordonnées légales</dt><dd className="is-muted">Non renseignés dans la plateforme</dd></div>
          </dl>
          <SettingsNotice>
            Les informations d’identité et les coordonnées légales ne sont pas encore gérées par le serveur.
            Elles ne sont pas modifiables depuis cet écran.
          </SettingsNotice>
        </section>

        <section className="admin-settings-card">
          <header className="admin-settings-card-heading">
            <div>
              <h2><Settings2 size={17} />Préférences d’affichage</h2>
              <p>Préférences enregistrées dans ce navigateur.</p>
            </div>
          </header>
          <div className="admin-settings-preferences">
            <label htmlFor="admin-language"><span><Languages size={15} />Langue de l’interface</span>
              <select id="admin-language" value={preferences.language} onChange={event => onPreferenceChange('language', event.target.value)}>
                <option value="fr">Français</option>
              </select>
            </label>
            <label htmlFor="admin-date-format"><span><CalendarDays size={15} />Format de date</span>
              <select id="admin-date-format" value={preferences.dateFormat} onChange={event => onPreferenceChange('dateFormat', event.target.value)}>
                <option value="dd/MM/yyyy">31/08/2026 — jour/mois/année</option>
                <option value="MM/dd/yyyy">08/31/2026 — mois/jour/année</option>
              </select>
            </label>
            <div className="admin-settings-theme">
              <span><Sun size={15} />Thème de l’interface</span>
              <ThemeToggle />
              <Moon size={15} aria-hidden="true" />
            </div>
          </div>
          <SettingsNotice>
            La langue disponible est le français. Le format choisi est mémorisé sur cet appareil; il n’est pas
            encore appliqué uniformément aux autres écrans faute de préférence globale côté serveur.
          </SettingsNotice>
        </section>
      </div>

      <aside className="admin-settings-side-column">
        <section className="admin-settings-card admin-settings-legal">
          <header className="admin-settings-card-heading">
            <div><h2><Info size={17} />Informations légales</h2></div>
          </header>
          <dl className="admin-settings-details">
            <div><dt>Raison sociale</dt><dd>À renseigner</dd></div>
            <div><dt>N° d’enregistrement</dt><dd>À renseigner</dd></div>
            <div><dt>N° d’identification fiscale</dt><dd>À renseigner</dd></div>
          </dl>
          <p className="admin-settings-legal-note">Ces données doivent être confirmées par l’organisation avant publication.</p>
        </section>
        <section className="admin-settings-card admin-settings-account-summary">
          <header className="admin-settings-card-heading">
            <div><h2><ShieldCheck size={17} />Espace sécurisé</h2></div>
          </header>
          <p>La gestion des comptes utilise les autorisations définies par le serveur. Les comptes d’équipe sont créés avec un rôle et une zone.</p>
          <button className="admin-settings-link" type="button" onClick={() => onSelectSection('acces')}>Gérer les accès <ChevronRight size={15} aria-hidden="true" /></button>
        </section>
      </aside>
    </div>
  );
}

function SettingsSectionContent({ activeSection, user, onSelectSection }) {
  if (activeSection === 'equipes') {
    return (
      <div className="admin-settings-single-column">
        <section className="admin-settings-card">
          <header className="admin-settings-card-heading">
            <div><h2><Users size={17} />Créer un responsable shop</h2><p>Le responsable pourra créer les comptes technicien et commercial de sa zone.</p></div>
          </header>
          <div className="admin-settings-card-body"><TeamAccountForm initialRole="shop_manager" allowedRoles={["shop_manager"]} /></div>
        </section>
        <SectionLink to="/equipe">Voir la liste complète des équipes</SectionLink>
        <SettingsNotice>
          Le serveur permet la création de comptes responsables. Il ne propose pas encore à l’administrateur
          une liste centralisée des shops et des équipes existants.
        </SettingsNotice>
      </div>
    );
  }

  if (activeSection === 'acces') {
    return (
      <div className="admin-settings-single-column">
        <section className="admin-settings-card">
          <header className="admin-settings-card-heading">
            <div><h2><ShieldCheck size={17} />Votre accès administrateur</h2><p>Session et rôle associés au compte actuellement connecté.</p></div>
          </header>
          <dl className="admin-settings-details">
            <div><dt>Compte</dt><dd>{user?.identifier || [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Administrateur'}</dd></div>
            <div><dt>Rôle</dt><dd>Administrateur</dd></div>
            <div><dt>Portée</dt><dd>Administration de la plateforme Djua Energy</dd></div>
          </dl>
        </section>
      </div>
    );
  }

  if (activeSection === 'compte') {
    return (
      <div className="admin-settings-single-column">
        <section className="admin-settings-card">
          <header className="admin-settings-card-heading">
            <div><h2><LockKeyhole size={17} />Mon compte</h2><p>Identité et rôle de la session administrateur active.</p></div>
          </header>
          <dl className="admin-settings-details">
            <div><dt>Nom affiché</dt><dd>{[user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Administrateur'}</dd></div>
            <div><dt>Identifiant</dt><dd>{user?.identifier || 'Non renseigné'}</dd></div>
            <div><dt>Rôle</dt><dd>Administrateur</dd></div>
            <div><dt>Zone</dt><dd>{user?.zone || 'Non renseignée'}</dd></div>
          </dl>
        </section>
        <SettingsNotice>
          La modification du profil et du mot de passe n’est pas encore proposée par l’API de la plateforme.
          Utilisez la commande de déconnexion dans le menu latéral pour fermer cette session.
        </SettingsNotice>
      </div>
    );
  }

  const config = {
    dimensionnement: {
      icon: Gauge,
      title: 'Dimensionnement solaire',
      description: 'Le dimensionnement se fait dans le parcours de devis avec les appareils, le site et les besoins du client.',
      link: '/devis/nouveau',
      linkLabel: 'Ouvrir le dimensionnement',
    },
    monitoring: {
      icon: Activity,
      title: 'Monitoring du parc',
      description: 'Consultez les installations, leurs informations disponibles et les fiches de télémétrie.',
      link: '/parc',
      linkLabel: 'Ouvrir le parc solaire',
    },
    notifications: {
      icon: Bell,
      title: 'Alertes et notifications',
      description: 'Les alertes disponibles sont consultables dans le flux de supervision.',
      link: '/notification',
      linkLabel: 'Consulter les alertes',
    },
    interventions: {
      icon: Wrench,
      title: 'Maintenance & interventions',
      description: 'Consultez les interventions, leurs statuts, les responsables et les rapports terrain.',
      link: '/InterventionWizard',
      linkLabel: 'Voir les maintenances et interventions',
    },
    devis: {
      icon: FileText,
      title: 'Gestion des devis',
      description: 'Retrouvez les propositions enregistrées, les validations et les clients à suivre.',
      link: '/devis',
      linkLabel: 'Ouvrir les devis',
    },
  }[activeSection];
  const Icon = config?.icon || Wrench;

  return (
    <div className="admin-settings-single-column">
      <section className="admin-settings-card admin-settings-feature-card">
        <div className="admin-settings-feature-icon"><Icon size={22} /></div>
        <div>
          <h2>{config?.title || 'Préférences du compte'}</h2>
          <p>{config?.description || 'La session affichée est celle du compte administrateur actuellement connecté.'}</p>
          {config ? <SectionLink to={config.link}>{config.linkLabel}</SectionLink> : <SectionLink to="/">Retour à la connexion</SectionLink>}
        </div>
      </section>
      <SettingsNotice>
        Les règles de fonctionnement détaillées ne sont pas encore configurables depuis les paramètres.
        Cet écran vous conduit vers les fonctions actuellement disponibles dans la plateforme.
      </SettingsNotice>
    </div>
  );
}

export default function AdministrationSettings() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'administration';
  const [activeSection, setActiveSection] = useState('organisation');
  const [preferences, setPreferences] = useState(readPreferences);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserRole, setCreateUserRole] = useState(null);

  if (!isAdmin) return <Navigate to={user?.role === 'shop_manager' ? '/equipe' : '/dashboard'} replace />;

  const selectedSection = sections.find(section => section.id === activeSection) || sections[0];

  const updatePreference = (key, value) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    try {
      window.localStorage.setItem(preferenceStorageKey, JSON.stringify(next));
    } catch (error) {
      console.error('[AdministrationSettings] Impossible d’enregistrer les préférences.', error);
    }
  };

  const selectSection = id => {
    setActiveSection(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <PageEntrance className="admin-settings-page">
      <header className="admin-settings-page-heading">
        <h1>Paramètres</h1>
        <p>Gérez votre organisation, les utilisateurs et les règles de fonctionnement de Djua.</p>
      </header>

      <div className="admin-settings-layout">
        <nav className="admin-settings-nav" aria-label="Sections des paramètres">
          <p className="admin-settings-nav-caption">ESPACE DE TRAVAIL</p>
          <div className="admin-settings-workspace">
            <span className="admin-settings-workspace-mark">D</span>
            <span><strong>Djua Energy</strong><small>Organisation</small></span>
          </div>
          <div className="admin-settings-nav-items">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={activeSection === id ? 'is-active' : ''} aria-current={activeSection === id ? 'page' : undefined} onClick={() => selectSection(id)}>
                <Icon size={16} /><span>{label}</span>
              </button>
            ))}
          </div>
          <div className="admin-settings-nav-help"><CircleHelp size={15} /><span><strong>Besoin d’aide ?</strong><small>Consultez les fonctions disponibles dans cet espace.</small></span></div>
        </nav>

        <main className="admin-settings-content">
          <header className="admin-settings-section-heading">
            <div>
              <h2>{selectedSection.label}</h2>
              <p>{activeSection === 'organisation' ? 'Informations générales et préférences de votre espace de travail.' : sectionDescriptions[activeSection]}</p>
            </div>
            {activeSection === 'organisation' && <span className="admin-settings-saved"><Check size={14} />Préférences locales</span>}
          </header>

          {activeSection === 'organisation'
            ? <OrganisationPanel preferences={preferences} onPreferenceChange={updatePreference} />
            : <SettingsSectionContent activeSection={activeSection} user={user} onSelectSection={selectSection} />}
        </main>
      </div>

      {/* Floating Action Button (FAB) pour créer un utilisateur */}
      <button
        type="button"
        className="admin-fab-create-user"
        onClick={() => { setCreateUserRole(null); setIsCreateUserModalOpen(true); }}
        aria-label="Créer un utilisateur"
        title="Créer un utilisateur"
      >
        <UserPlus size={18} />
        <span>Créer un utilisateur</span>
      </button>

      {/* Modal de création d'utilisateur */}
      {isCreateUserModalOpen && (
        <div className="admin-create-user-modal-backdrop" onClick={() => setIsCreateUserModalOpen(false)}>
          <div className="admin-create-user-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-create-user-title">
            <header className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <h2 id="modal-create-user-title" className="text-base font-bold text-zinc-900 dark:text-white">{createUserRole ? `Créer ${createUserRole === 'admin' ? 'un administrateur' : 'un responsable de shop'}` : 'Quel compte souhaitez-vous créer ?'}</h2>
              </div>
              <button
                type="button"
                onClick={() => { setIsCreateUserModalOpen(false); setCreateUserRole(null); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </header>
            {!createUserRole ? (
              <div className="admin-create-role-grid">
                <button type="button" className="admin-create-role-option" onClick={() => setCreateUserRole('admin')}>
                  <span><ShieldCheck size={19} /></span>
                  <strong>Administrateur</strong>
                  <small>Accès complet à la plateforme</small>
                  <ChevronRight size={16} />
                </button>
                <button type="button" className="admin-create-role-option" onClick={() => setCreateUserRole('shop_manager')}>
                  <span><Users size={19} /></span>
                  <strong>Responsable de shop</strong>
                  <small>Gère l’équipe et sa zone</small>
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <button type="button" className="admin-create-role-back" onClick={() => setCreateUserRole(null)}>← Changer le type de compte</button>
                <TeamAccountForm key={createUserRole} initialRole={createUserRole} allowedRoles={[createUserRole]} onCreated={() => { setIsCreateUserModalOpen(false); setCreateUserRole(null); }} />
              </>
            )}
          </div>
        </div>
      )}
    </PageEntrance>
  );
}
