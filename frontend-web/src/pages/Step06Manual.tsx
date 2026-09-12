import { useState } from 'react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';

interface Props { onNext: () => void; }

export default function Step06Manual({ onNext }: Props) {
  const setManualData = useInstallStore(s => s.setManualData);
  const [panels, setPanels] = useState(4);
  const [panelPower, setPanelPower] = useState('600');
  const [batteryCapacity, setBatteryCapacity] = useState('5');
  const [inverterPower, setInverterPower] = useState('3');
  const [expectedLoad, setExpectedLoad] = useState('1.5');

  const totalPower = ((panels * (parseFloat(panelPower) || 0)) / 1000).toFixed(1);

  const handleContinue = () => {
    setManualData({
      panels,
      panelPower: parseFloat(panelPower) || 0,
      batteryCapacity: parseFloat(batteryCapacity) || 0,
      inverterPower: parseFloat(inverterPower) || 0,
      expectedLoad: parseFloat(expectedLoad) || undefined,
    });
    onNext();
  };

  const NumInput = ({
    label, value, onChange, unit,
  }: { label: string; value: string; onChange: (v: string) => void; unit: string }) => (
    <div className="form-row">
      <span className="label-text">{label}</span>
      <div className="input-wrap" style={{ width: 110 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          type="number"
          min="0"
          style={{ textAlign: 'right' }}
        />
        <span className="unit-text">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={6} totalSteps={11} />

      <div className="screen-scroll">
        <h1 className="screen-title">Informations du système</h1>
        <p className="screen-desc">Renseignez les principaux composants installés.</p>

        {/* Panneaux */}
        <p className="section-title">Panneaux solaires</p>
        <div className="form-row">
          <span className="label-text">Nombre de panneaux</span>
          <div className="number-control">
            <button className="num-btn" onClick={() => setPanels(Math.max(1, panels - 1))}>−</button>
            <span className="num-value">{panels}</span>
            <button className="num-btn" onClick={() => setPanels(panels + 1)}>+</button>
          </div>
        </div>
        <NumInput label="Puissance d'un panneau" value={panelPower} onChange={setPanelPower} unit="W" />
        <div className="total-box" style={{ marginBottom: 28 }}>
          <p className="total-label">Puissance totale</p>
          <p className="total-value">{totalPower} kW</p>
        </div>

        {/* Batterie */}
        <p className="section-title">Batterie</p>
        <NumInput label="Capacité totale" value={batteryCapacity} onChange={setBatteryCapacity} unit="kWh" />

        {/* Onduleur */}
        <p className="section-title" style={{ marginTop: 4 }}>Onduleur</p>
        <NumInput label="Puissance" value={inverterPower} onChange={setInverterPower} unit="kVA" />

        {/* Charge */}
        <p className="section-title" style={{ marginTop: 4 }}>Charge prévue <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(optionnel)</span></p>
        <NumInput label="Puissance de charge prévue" value={expectedLoad} onChange={setExpectedLoad} unit="kW" />
        <div className="pb-safe" />
      </div>

      <div className="screen-footer">
        <Button title="Continuer" onClick={handleContinue} />
      </div>
    </div>
  );
}
