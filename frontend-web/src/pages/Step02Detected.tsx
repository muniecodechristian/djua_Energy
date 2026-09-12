import { useEffect } from 'react';
import { Cpu } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';

interface Props { onNext: () => void; }

const MOCK_BOX_ID = 'DJB-00482';

export default function Step02Detected({ onNext }: Props) {
  const { boxId, setBoxId } = useInstallStore();

  useEffect(() => {
    if (!boxId) setBoxId(MOCK_BOX_ID);
  }, []);

  const id = boxId || MOCK_BOX_ID;

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={2} totalSteps={11} />

      <div className="screen-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
        {/* Illustration boîtier */}
        <div style={{
          width: 200, height: 140, background: 'var(--surface)',
          borderRadius: 20, border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 40,
        }}>
          <Cpu size={56} color="var(--text-muted)" strokeWidth={1.2} />
        </div>

        <h1 className="screen-title" style={{ textAlign: 'center' }}>Boîtier détecté</h1>
        <p className="device-id-badge">{id}</p>

        <div className="card" style={{ width: '100%' }}>
          <div className="info-row">
            <span className="info-label">Modèle</span>
            <span className="info-value">Djua Box v1</span>
          </div>
          <div className="info-row">
            <span className="info-label">Statut</span>
            <span className="status-badge">
              <span className="status-dot" />
              Non associé
            </span>
          </div>
        </div>
      </div>

      <div className="screen-footer">
        <Button title="Continuer" onClick={onNext} />
      </div>
    </div>
  );
}
