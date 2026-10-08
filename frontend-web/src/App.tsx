import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useInstallStore } from './store/useInstallStore';

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

  // ─── Navigation ─────────────────────────────────────────────────────────
  const goTo = (s: Step) => {
    window.scrollTo(0, 0);
    setStep(s);
  };

  const next = () => {
    if (typeof step === 'number') goTo(step + 1);
  };

  const back = () => {
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

  return (
    <div className="app-shell">
      <div className="app-card">
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
