import { useEffect, useState } from 'react';
import { CheckCircle2, Home, MapPin, Calendar, Lightbulb } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';
import { devicesApi } from '../services/api';

interface Props { onFinish: () => void; onError: (msg: string) => void; }

export default function Step10Success({ onFinish, onError }: Props) {
  const store = useInstallStore();
  const [isSubmitting, setIsSubmitting] = useState(true);

  useEffect(() => {
    const payload = store.buildPayload();
    if (!payload) {
      onError('Données incomplètes');
      return;
    }

    // Appel API simulé / réel
    devicesApi.registerInstall(payload)
      .then(res => {
        if (!res.success) throw new Error(res.error);
        setIsSubmitting(false);
      })
      .catch(err => {
        onError(err.message || "Erreur d'enregistrement");
      });
  }, []);

  if (isSubmitting) {
    return (
      <div className="screen fade-enter" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner spinner-brand" style={{ width: 40, height: 40, borderWidth: 4, marginBottom: 24 }} />
        <h2 className="screen-title">Enregistrement en cours...</h2>
        <p className="screen-desc">Veuillez patienter.</p>
      </div>
    );
  }

  const { boxId, location, hasQuote, quoteData, manualData } = store;
  const system = hasQuote && quoteData ? quoteData.system : manualData;
  const totalPower = system ? ((system.panels * system.panelPower) / 1000).toFixed(1) : '0';

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={10} totalSteps={11} />

      <div className="screen-scroll">
        <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 32 }}>
          <CheckCircle2 size={80} className="success-icon" style={{ margin: '0 auto 16px' }} />
          <h1 className="screen-title">Installation terminée !</h1>
          <p className="screen-desc">Le système est maintenant en ligne et surveillé.</p>
        </div>

        <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Boîtier Djua associé</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{boxId}</p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Home size={18} color="var(--text-muted)" />
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  Système {totalPower} kW • {system?.batteryCapacity} kWh
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <MapPin size={18} color="var(--text-muted)" />
              <p style={{ fontSize: 14, color: 'var(--text)' }}>{location?.name}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar size={18} color="var(--text-muted)" />
              <p style={{ fontSize: 14, color: 'var(--text)' }}>Installé aujourd'hui</p>
            </div>
          </div>
        </div>

        <div className="learning-card">
          <div className="learning-header">
            <Lightbulb size={18} color="#065F46" />
            <span className="learning-title">Phase d'apprentissage activée</span>
          </div>
          <p className="learning-desc">
            L'IA va maintenant analyser les habitudes de consommation pendant 48h pour optimiser la durée de vie de la batterie.
          </p>
        </div>
        
        <div className="pb-safe" />
      </div>

      <div className="screen-footer">
        <Button title="Terminer et fermer" onClick={onFinish} />
      </div>
    </div>
  );
}
