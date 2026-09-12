import { Cpu, Package, Battery, Zap, MapPin, Search } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { useInstallStore } from '../store/useInstallStore';

interface Props { onNext: () => void; onBack: (step: number) => void; }

export default function Step09Preview({ onNext, onBack }: Props) {
  const { boxId, hasQuote, quoteId, quoteData, manualData, location } = useInstallStore();
  
  const system = hasQuote && quoteData ? quoteData.system : manualData;
  const isComplete = boxId && system && location;

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={9} totalSteps={11} />

      <div className="screen-scroll">
        <h1 className="screen-title">Récapitulatif</h1>
        <p className="screen-desc">Vérifiez toutes les informations avant d'enregistrer l'installation.</p>

        {/* 1. Boîtier */}
        <div className="card-white" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={18} color="var(--brand)" /> Boîtier
            </h3>
            <button className="edit-btn" onClick={() => onBack(1)}>Modifier</button>
          </div>
          <div className="info-row">
            <span className="info-label">Identifiant</span>
            <span className="info-value">{boxId || 'Non défini'}</span>
          </div>
        </div>

        {/* 2. Système */}
        <div className="card-white" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={18} color="var(--brand)" /> Système installé
            </h3>
            <button className="edit-btn" onClick={() => onBack(hasQuote ? 4 : 6)}>Modifier</button>
          </div>
          
          {hasQuote && quoteData && (
            <div className="alert alert-info" style={{ marginBottom: 12, padding: '8px 12px' }}>
              <Search size={16} /> <span style={{ fontSize: 12 }}>Lié au devis <b>{quoteId}</b></span>
            </div>
          )}

          {system ? (
            <>
              <div className="info-row">
                <span className="info-label">Panneaux</span>
                <span className="info-value">{system.panels} × {system.panelPower} W</span>
              </div>
              <div className="info-row">
                <span className="info-label">Batterie</span>
                <span className="info-value">{system.batteryCapacity} kWh</span>
              </div>
              <div className="info-row">
                <span className="info-label">Onduleur</span>
                <span className="info-value">{system.inverterPower} kVA</span>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--error)', fontSize: 14 }}>Informations manquantes</p>
          )}
        </div>

        {/* 3. Localisation */}
        <div className="card-white">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={18} color="var(--brand)" /> Localisation
            </h3>
            <button className="edit-btn" onClick={() => onBack(7)}>Modifier</button>
          </div>
          {location ? (
            <>
              <div className="info-row">
                <span className="info-label">Lieu</span>
                <span className="info-value">{location.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Coordonnées</span>
                <span className="info-value" style={{ fontSize: 12 }}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--error)', fontSize: 14 }}>Localisation manquante</p>
          )}
        </div>
        
        <div className="pb-safe" />
      </div>

      <div className="screen-footer">
        <Button 
          title="Confirmer et enregistrer" 
          disabled={!isComplete}
          onClick={onNext} 
        />
      </div>
    </div>
  );
}
