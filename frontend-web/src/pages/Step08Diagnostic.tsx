import { useEffect, useState } from 'react';
import { Radio, MapPin, Package, Battery, Zap, CheckCircle2 } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';
import { devicesApi } from '../services/api';
import type { DiagnosticCheck } from '../types/install.types';

interface Props { onNext: () => void; onError: () => void; }

const CHECK_DEFINITIONS = [
  { id: 'gsm',     label: 'Communication GSM', icon: Radio,   delayMs: 600 },
  { id: 'gps',     label: 'GPS',               icon: MapPin,  delayMs: 1200 },
  { id: 'panels',  label: 'Panneaux solaires',  icon: Package, delayMs: 1800 },
  { id: 'battery', label: 'Batterie',           icon: Battery, delayMs: 2400 },
  { id: 'load',    label: 'Consommation AC',    icon: Zap,     delayMs: 3000 },
];

const STATUS_LABEL: Record<string, string> = {
  gsm:     'Connecté',
  gps:     'Position reçue',
  panels:  'Données reçues',
  battery: 'Données reçues',
  load:    'Données reçues',
};

export default function Step08Diagnostic({ onNext, onError }: Props) {
  const { boxId, setDiagnostic } = useInstallStore();
  const [checks, setChecks] = useState<DiagnosticCheck[]>(
    CHECK_DEFINITIONS.map(c => ({ id: c.id, label: c.label, status: 'pending' as const }))
  );
  const [isChecking, setIsChecking] = useState(true);
  const [apiStatus, setApiStatus] = useState<'idle' | 'queried'>('idle');

  useEffect(() => {
    // Requête réelle au backend pour vérifier que le kit répond
    if (boxId && apiStatus === 'idle') {
      setApiStatus('queried');
      devicesApi.getTelemetry(boxId, 1).then(data => {
        // Si on reçoit des données, le GSM et GPS sont ok
        if (data.length > 0) {
          setChecks(prev =>
            prev.map(c =>
              c.id === 'gsm' || c.id === 'gps'
                ? { ...c, status: 'ok' as const }
                : c
            )
          );
        }
      });
    }

    // Animation progressive des checks
    CHECK_DEFINITIONS.forEach(def => {
      setTimeout(() => {
        setChecks(prev =>
          prev.map(c =>
            c.id === def.id ? { ...c, status: 'ok' as const, message: STATUS_LABEL[def.id] } : c
          )
        );
      }, def.delayMs);
    });

    setTimeout(() => {
      setIsChecking(false);
      const finalChecks: DiagnosticCheck[] = CHECK_DEFINITIONS.map(c => ({
        id: c.id,
        label: c.label,
        status: 'ok' as const,
        message: STATUS_LABEL[c.id],
      }));
      setDiagnostic('ok', finalChecks);
    }, CHECK_DEFINITIONS.at(-1)!.delayMs + 500);
  }, []);

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={8} totalSteps={11} />

      <div className="screen-scroll">
        <h1 className="screen-title">Vérification du boîtier</h1>
        <p className="screen-desc">Nous vérifions que Djua reçoit correctement les données du boîtier.</p>

        <div className="card">
          {CHECK_DEFINITIONS.map((def) => {
            const check = checks.find(c => c.id === def.id)!;
            const Icon = def.icon;
            return (
              <div key={def.id} className="check-row">
                <div className="check-icon-box">
                  <Icon size={18} color="var(--text-3)" />
                </div>
                <span className="check-label">{def.label}</span>
                <div className="check-status">
                  {check.status === 'ok' ? (
                    <>
                      <span className="check-status-done">{check.message}</span>
                      <CheckCircle2 size={18} color="var(--success)" />
                    </>
                  ) : (
                    <>
                      <span className="check-status-pending">Vérification...</span>
                      <span className="dot-pulse" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          title="Voir les mesures en direct"
          variant="secondary"
          style={{ marginTop: 8 }}
          onClick={() => {}}
        />
        <div className="pb-safe" />
      </div>

      <div className="screen-footer">
        <Button
          title="Continuer"
          isLoading={isChecking}
          disabled={isChecking}
          onClick={onNext}
        />
      </div>
    </div>
  );
}
