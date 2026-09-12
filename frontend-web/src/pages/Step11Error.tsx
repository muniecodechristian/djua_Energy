import { AlertTriangle, WifiOff, XCircle } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';

interface Props { 
  onRetry: () => void;
  onForceContinue: () => void;
  errorType?: 'network' | 'diagnostic' | 'submit';
  errorMessage?: string;
}

export default function Step11Error({ onRetry, onForceContinue, errorType = 'diagnostic', errorMessage }: Props) {
  const diagnosticChecks = useInstallStore(s => s.diagnosticChecks);
  
  const isSubmitError = errorType === 'submit';
  
  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={11} totalSteps={11} />

      <div className="screen-scroll">
        <div className="error-icon-bg">
          {errorType === 'network' ? (
            <WifiOff size={40} color="var(--error)" />
          ) : (
            <AlertTriangle size={40} color="var(--error)" />
          )}
        </div>
        
        <h1 className="screen-title" style={{ textAlign: 'center' }}>
          {isSubmitError ? "Erreur d'enregistrement" : "Connexion au boîtier impossible"}
        </h1>
        
        <p className="screen-desc" style={{ textAlign: 'center', marginBottom: 32 }}>
          {errorMessage || 
            (isSubmitError 
              ? "Une erreur est survenue lors de la communication avec nos serveurs." 
              : "Le boîtier ne répond pas. Vérifiez qu'il est bien allumé et que la couverture réseau est suffisante.")}
        </p>

        {!isSubmitError && diagnosticChecks.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="section-title">Résultats partiels</h3>
            {diagnosticChecks.map(check => (
              <div key={check.id} className="check-row">
                <span className="check-label">{check.label}</span>
                {check.status === 'ok' ? (
                  <span className="check-status-done">{check.message}</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--error)' }}>Échec</span>
                    <XCircle size={16} color="var(--error)" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="alert alert-warning">
          <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="alert-title">Vous pouvez forcer l'enregistrement</p>
            <p>Si vous êtes certain que l'installation est correcte, vous pouvez enregistrer maintenant. Les données remonteront plus tard.</p>
          </div>
        </div>
        
        <div className="pb-safe" />
      </div>

      <div className="screen-footer">
        <Button title="Réessayer" onClick={onRetry} />
        <Button 
          title="Forcer l'enregistrement" 
          variant="secondary"
          onClick={onForceContinue} 
        />
      </div>
    </div>
  );
}
