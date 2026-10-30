import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, KeyRound, LogOut, ShieldCheck, QrCode, Bell, MessageSquare } from 'lucide-react';
import { useInstallStore } from './store/useInstallStore';
import { authApi, installationApi, type TechnicianProfile } from './services/api';

import Step01Scan        from './pages/Step01Scan';
import StepKitExists     from './pages/StepKitExists';
import Step02Detected    from './pages/Step02Detected';
import Step03Source      from './pages/Step03Source';
import Step04Search      from './pages/Step04Search';
import Step05Verify      from './pages/Step05Verify';
import Step06Manual      from './pages/Step06Manual';
import Step07Location    from './pages/Step07Location';
import Step08Diagnostic  from './pages/Step08Diagnostic';
import Step09Preview     from './pages/Step09Preview';
import Step10Success     from './pages/Step10Success';
import Step11Error       from './pages/Step11Error';
import TechnicianNotifications from './pages/TechnicianNotifications';
import TechnicianMessages      from './pages/TechnicianMessages';

// ─── Étapes ───────────────────────────────────────────────────────────────────
// Les étapes numérotées suivent le wizard normal.
// L'étape spéciale 'kit-exists' est un état terminal non numéroté.
type Step = number | 'kit-exists';

function IdentityPage({ onNext, onKitExists }: { onNext: () => void; onKitExists: () => void }) {
  const [detected, setDetected] = useState(false);
  return detected
    ? <Step02Detected onNext={onNext} />
    : <Step01Scan onNext={() => setDetected(true)} onKitExists={onKitExists} />;
}

function AssociationPage({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<'source' | 'search' | 'verify' | 'manual'>('source');
  if (phase === 'source') return <Step03Source onNext={(target) => setPhase(target === 4 ? 'search' : 'manual')} />;
  if (phase === 'search') return <Step04Search onNext={() => setPhase('verify')} />;
  if (phase === 'verify') return <Step05Verify onNext={onNext} onBack={() => setPhase('search')} />;
  return <Step06Manual onNext={onNext} />;
}

function InstallationPage({ onNext, onError }: { onNext: () => void; onError: () => void }) {
  const [phase, setPhase] = useState<'location' | 'diagnostic'>('location');
  return phase === 'location'
    ? <Step07Location onNext={() => setPhase('diagnostic')} />
    : <Step08Diagnostic onNext={onNext} onError={onError} />;
}

function FinalizationPage({ errorMessage, onRetry, onFinish, onError }: { errorMessage: string; onRetry: () => void; onFinish: () => void; onError: (message: string) => void }) {
  const [phase, setPhase] = useState<'preview' | 'success' | 'error'>(errorMessage ? 'error' : 'preview');
  if (phase === 'error') return <Step11Error onRetry={onRetry} onForceContinue={() => setPhase('preview')} errorType="diagnostic" errorMessage={errorMessage} />;
  if (phase === 'success') return <Step10Success onFinish={onFinish} onError={(message) => { onError(message); setPhase('error'); }} />;
  return <Step09Preview onNext={() => setPhase('success')} onBack={() => undefined} />;
}

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState<'scan' | 'notifications' | 'messages'>('notifications');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  const [step, setStep]           = useState<Step>(1);
  const [errorMsg, setErrorMsg]   = useState('');
  const [errorType, setErrorType] = useState<'network' | 'diagnostic' | 'submit'>('diagnostic');
  const resetStore                = useInstallStore(s => s.reset);
  const setInstalledBy            = useInstallStore(s => s.setInstalledBy);
  const [user, setUser] = useState<TechnicianProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [passwordPromptDismissed, setPasswordPromptDismissed] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const profile = await authApi.getMe();
        if (profile.role !== 'technician') {
          await authApi.logout().catch(() => undefined);
          return;
        }
        if (active) {
          setUser(profile);
          setInstalledBy(profile.identifier);
          setPasswordPromptDismissed(sessionStorage.getItem(`djua-password-reminder-dismissed:${profile._id}`) === 'true');
          // Charger le nombre de missions en attente d'accusé de réception
          installationApi.getAssignedInstallations().then(list => {
            const pending = list.filter(i => !i.technicianAcknowledgedAt).length;
            setUnacknowledgedCount(pending);
          }).catch(() => undefined);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsCheckingAuth(false);
      }
    };
    restoreSession();
    return () => { active = false; };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const profile = await authApi.login(identifier.trim(), loginPassword);
      setUser(profile);
      setInstalledBy(profile.identifier);
      sessionStorage.removeItem(`djua-password-reminder-dismissed:${profile._id}`);
      setLoginPassword('');
      setPasswordPromptDismissed(false);
    } catch (error: any) {
      setLoginError(error.response?.data?.message || error.message || 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setUser(previous => previous ? { ...previous, mustChangePassword: false } : previous);
      setPasswordPromptDismissed(true);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => undefined);
    if (user) sessionStorage.removeItem(`djua-password-reminder-dismissed:${user._id}`);
    resetStore();
    setUser(null);
    setPasswordPromptDismissed(false);
  };

  const dismissPasswordReminder = () => {
    if (user) sessionStorage.setItem(`djua-password-reminder-dismissed:${user._id}`, 'true');
    setPasswordPromptDismissed(true);
  };

  // ─── Navigation ─────────────────────────────────────────────────────────
  const goTo = (s: Step) => {
    window.scrollTo(0, 0);
    setStep(s);
  };

  const next = () => {
    if (typeof step === 'number') goTo(step + 1);
  };

  const back = () => {
    if(step === 7 && useInstallStore.getState().hasQuote) return goTo(5);
    if (typeof step === 'number') goTo(Math.max(1, step - 1));
  };

  const handleFinish = () => {
    resetStore();
    goTo(1);
  };

  // ─── Rendu conditionnel par étape ────────────────────────────────────────
  const renderStep = () => {
    // Étape spéciale : kit déjà installé en BDD
    if (step === 'kit-exists') {
      return (
        <StepKitExists
          onScanAnother={() => {
            resetStore();
            goTo(1);
          }}
        />
      );
    }

    switch (step) {
      case 1: return <IdentityPage onNext={() => goTo(2)} onKitExists={() => goTo('kit-exists')} />;
      case 2: return <AssociationPage onNext={() => goTo(3)} />;
      case 3: return <InstallationPage onNext={() => goTo(4)} onError={() => { setErrorType('diagnostic'); setErrorMsg('Le diagnostic du kit n’a pas pu être validé.'); goTo(4); }} />;
      case 4: return <FinalizationPage errorMessage={errorMsg} onRetry={() => { setErrorMsg(''); goTo(3); }} onFinish={handleFinish} onError={(msg) => { setErrorType('submit'); setErrorMsg(msg); }} />;
      default: return <Step01Scan onNext={next} onKitExists={() => goTo('kit-exists')} />;
    }
  };

  // ─── Afficher le bouton retour uniquement sur les étapes du wizard ────────
  const showBackButton =
    typeof step === 'number' && step > 1 && step < 10 && step !== 11;

  if (isCheckingAuth) {
    return <div className="app-shell"><main className="app-card technician-login"><div className="spinner spinner-brand" aria-label="Vérification de la session"/></main></div>;
  }

  if (!user) {
    return <div className="app-shell"><main className="app-card technician-login">
      <div className="technician-login-brand"><span><ShieldCheck size={22}/></span><div><strong>Djua Équipe</strong><small>ESPACE TECHNICIEN</small></div></div>
      <h1 className="screen-title">Connexion technicien</h1>
      <p className="screen-desc">Connectez-vous avec l’adresse email ou le numéro de téléphone fourni par votre responsable.</p>
      <form className="technician-login-form" onSubmit={handleLogin}>
        <label className="technician-login-label">Email ou téléphone<div className="input-wrap"><input type="text" autoComplete="username" value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="nom@exemple.com ou +243…" required/></div></label>
        <label className="technician-login-label">Mot de passe<div className="input-wrap"><input type="password" autoComplete="current-password" value={loginPassword} onChange={event => setLoginPassword(event.target.value)} placeholder="Votre mot de passe" required/></div></label>
        {loginError && <div className="alert alert-error" role="alert">{loginError}</div>}
        <button className="btn btn-primary" type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </main></div>;
  }

  return (
    <div className="app-shell">
      <div className="app-card" style={{ paddingBottom: 68 }}>
        <header className="technician-toolbar">
          <div>
            <strong>Djua Équipe</strong>
            <small>{user.identifier}{user.zone ? ` · ${user.zone}` : ''}</small>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={handleLogout}>
            <LogOut size={16}/> Déconnexion
          </button>
        </header>

        {/* ─── BARRE D'ONGLETS PRINCIPALE DU TECHNICIEN (3 TABS) ─── */}
        <nav style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#FFFFFF',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('scan')}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: activeMainTab === 'scan' ? 700 : 500,
              color: activeMainTab === 'scan' ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: activeMainTab === 'scan' ? '2.5px solid var(--brand)' : '2.5px solid transparent'
            }}
          >
            <QrCode size={18} />
            <span>Scannage Kit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('notifications')}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: activeMainTab === 'notifications' ? 700 : 500,
              color: activeMainTab === 'notifications' ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: activeMainTab === 'notifications' ? '2.5px solid var(--brand)' : '2.5px solid transparent',
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative' }}>
              <Bell size={18} />
              {unacknowledgedCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  background: '#EF4444',
                  color: '#FFF',
                  fontSize: 10,
                  fontWeight: 800,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unacknowledgedCount}
                </span>
              )}
            </div>
            <span>Missions & Notifs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('messages')}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: activeMainTab === 'messages' ? 700 : 500,
              color: activeMainTab === 'messages' ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: activeMainTab === 'messages' ? '2.5px solid var(--brand)' : '2.5px solid transparent'
            }}
          >
            <MessageSquare size={18} />
            <span>Discussions</span>
          </button>
        </nav>

        {user.mustChangePassword && !passwordPromptDismissed && (
          <section className="technician-password-reminder" aria-label="Mot de passe temporaire">
            <div className="technician-reminder-heading">
              <KeyRound size={18}/>
              <div>
                <strong>Mot de passe initial</strong>
                <p>Changez-le maintenant ou plus tard. Vous pouvez continuer votre travail sans interruption.</p>
              </div>
            </div>
            {!showPasswordForm ? (
              <div className="technician-reminder-actions">
                <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowPasswordForm(true)}>Changer le mot de passe</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={dismissPasswordReminder}>Plus tard</button>
              </div>
            ) : (
              <form className="technician-password-form" onSubmit={handlePasswordChange}>
                <label className="technician-login-label">Mot de passe actuel<div className="input-wrap"><input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required/></div></label>
                <label className="technician-login-label">Nouveau mot de passe<div className="input-wrap"><input type="password" autoComplete="new-password" minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#:;.]).{8,}" value={newPassword} onChange={event => setNewPassword(event.target.value)} required/></div></label>
                <label className="technician-login-label">Confirmer le mot de passe<div className="input-wrap"><input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required/></div></label>
                <small>8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</small>
                {passwordError && <div className="alert alert-error" role="alert">{passwordError}</div>}
                <div className="technician-reminder-actions">
                  <button className="btn btn-primary btn-sm" type="submit" disabled={isChangingPassword}>{isChangingPassword ? 'Mise à jour…' : 'Enregistrer'}</button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setShowPasswordForm(false); dismissPasswordReminder(); }}>Plus tard</button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* ── CONTENU DE L'ONGLET ACTIF ── */}
        {activeMainTab === 'notifications' && (
          <TechnicianNotifications
            onOpenChat={(instId) => {
              setSelectedChatId(instId);
              setActiveMainTab('messages');
            }}
            onStartScan={() => {
              setActiveMainTab('scan');
            }}
          />
        )}

        {activeMainTab === 'messages' && (
          <TechnicianMessages
            initialInstallationId={selectedChatId}
            onBackToMissions={() => setActiveMainTab('notifications')}
          />
        )}

        {activeMainTab === 'scan' && (
          <>
            {showBackButton && (
              <header style={{
                height: 56, display: 'flex', alignItems: 'center', padding: '0 16px',
                background: 'var(--bg)', borderBottom: '1px solid var(--border)',
              }}>
                <button
                  onClick={back}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: 'var(--text-3)', fontSize: 15, fontWeight: 600,
                    padding: 8, marginLeft: -8,
                  }}
                >
                  <ChevronLeft size={20} />
                  Retour
                </button>
              </header>
            )}

            {renderStep()}
          </>
        )}
      </div>
    </div>
  );
}
