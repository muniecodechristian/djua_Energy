import { Package, Battery, Zap, Info, Edit2 } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';

interface Props { onNext: () => void; onBack: () => void; }

export default function Step05Verify({ onNext, onBack }: Props) {
  const quoteData = useInstallStore(s => s.quoteData);

  if (!quoteData) {
    return (
      <div className="screen fade-enter">
        <div className="screen-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Aucun devis sélectionné.</p>
          <button className="btn btn-ghost" onClick={onBack}>Retour</button>
        </div>
      </div>
    );
  }

  const { system } = quoteData;
  const items = [
    { icon: <Package size={20} color="var(--success)" />, title: 'Panneaux solaires', details: [`${system.panels} × ${system.panelPower} W`, `${(system.panels * system.panelPower / 1000).toFixed(1)} kW`] },
    { icon: <Battery size={20} color="var(--success)" />, title: 'Batterie', details: [`${system.batteryCapacity} kWh`] },
    { icon: <Zap size={20} color="var(--success)" />, title: 'Onduleur', details: [`${system.inverterPower} kVA`] },
  ];

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={5} totalSteps={11} />

      <div className="screen-scroll">
        <h1 className="screen-title">Vérifier le système installé</h1>
        <p className="screen-desc">
          Les informations proviennent du devis. Confirmez qu'elles correspondent à l'installation.
        </p>

        {items.map((item, i) => (
          <div key={i} className="card-white" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: 'var(--success-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{item.title}</p>
                {item.details.map((d, j) => (
                  <p key={j} style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 2 }}>{d}</p>
                ))}
              </div>
              <button className="edit-btn"><Edit2 size={12} />Modifier</button>
            </div>
          </div>
        ))}

        <div className="alert alert-info">
          <Info size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="alert-title">Le système installé est différent du devis ?</p>
            <p>Vous pourrez ajuster les informations à l'étape suivante.</p>
          </div>
        </div>
        <div className="pb-safe" />
      </div>

      <div className="screen-footer">
        <Button title="Continuer" onClick={onNext} />
      </div>
    </div>
  );
}
