import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useInstallStore } from './store/useInstallStore';
import { authApi, type TechnicianProfile } from './services/api';

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

// ─── Étapes ───────────────────────────────────────────────────────────────────
// Les étapes numérotées suivent le wizard normal.
// L'étape spéciale 'kit-exists' est un état terminal non numéroté.
type Step = number | 'kit-exists';

export default function App() {
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
      case 1:
        return (
          <Step01Scan
            onNext={next}
            onKitExists={() => goTo('kit-exists')}
          />
        );
      case 2:  return <Step02Detected onNext={next} />;
      case 3:  return <Step03Source onNext={(s) => s ? goTo(s) : next()} />;
      case 4:  return <Step04Search onNext={next} />;
      case 5:  return <Step05Verify onNext={() => goTo(7)} onBack={() => goTo(4)} />;
      case 6:  return <Step06Manual onNext={next} />;
      case 7:  return <Step07Location onNext={next} />;
      case 8:  return (
        <Step08Diagnostic
          onNext={next}
          onError={() => { setErrorType('diagnostic'); goTo(11); }}
        />
      );
      case 9:  return <Step09Preview onNext={next} onBack={goTo} />;
      case 10: return (
        <Step10Success
          onFinish={handleFinish}
          onError={(msg) => { setErrorMsg(msg); setErrorType('submit'); goTo(11); }}
        />
      );
      case 11: return (
        <Step11Error
          onRetry={() => goTo(errorType === 'submit' ? 9 : 8)}
          onForceContinue={() => goTo(9)}
          errorType={errorType}
          errorMessage={errorMsg}
        />
      );
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
      <div className="app-card">
        <header className="technician-toolbar"><div><strong>Djua Équipe</strong><small>{user.identifier}{user.zone ? ` · ${user.zone}` : ''}</small></div><button className="btn btn-ghost btn-sm" type="button" onClick={handleLogout}><LogOut size={16}/>Déconnexion</button></header>
        {user.mustChangePassword && !passwordPromptDismissed && <section className="technician-password-reminder" aria-label="Mot de passe temporaire">
          <div className="technician-reminder-heading"><KeyRound size={18}/><div><strong>Mot de passe initial</strong><p>Changez-le maintenant ou plus tard. Vous pouvez continuer votre travail sans interruption.</p></div></div>
          {!showPasswordForm ? <div className="technician-reminder-actions"><button className="btn btn-primary btn-sm" type="button" onClick={() => setShowPasswordForm(true)}>Changer le mot de passe</button><button className="btn btn-ghost btn-sm" type="button" onClick={dismissPasswordReminder}>Plus tard</button></div> : <form className="technician-password-form" onSubmit={handlePasswordChange}>
            <label className="technician-login-label">Mot de passe actuel<div className="input-wrap"><input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required/></div></label>
            <label className="technician-login-label">Nouveau mot de passe<div className="input-wrap"><input type="password" autoComplete="new-password" minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#:;.]).{8,}" value={newPassword} onChange={event => setNewPassword(event.target.value)} required/></div></label>
            <label className="technician-login-label">Confirmer le mot de passe<div className="input-wrap"><input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required/></div></label>
            <small>8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</small>
            {passwordError && <div className="alert alert-error" role="alert">{passwordError}</div>}
            <div className="technician-reminder-actions"><button className="btn btn-primary btn-sm" type="submit" disabled={isChangingPassword}>{isChangingPassword ? 'Mise à jour…' : 'Enregistrer'}</button><button className="btn btn-ghost btn-sm" type="button" onClick={() => { setShowPasswordForm(false); dismissPasswordReminder(); }}>Plus tard</button></div>
          </form>}
        </section>}
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
      </div>
    </div>
  );
}
