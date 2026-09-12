import { FileText, PencilLine, ChevronRight } from 'lucide-react';
import { StepIndicator } from '../components/ui/StepIndicator';
import { useInstallStore } from '../store/useInstallStore';

interface Props { onNext: (step?: number) => void; }

export default function Step03Source({ onNext }: Props) {
  const setHasQuote = useInstallStore(s => s.setHasQuote);

  const handleSelect = (hasQuote: boolean) => {
    setHasQuote(hasQuote);
    onNext(hasQuote ? 4 : 6); // Saute à l'étape 4 (devis) ou 6 (manuel)
  };

  return (
    <div className="screen fade-enter">
      <StepIndicator currentStep={3} totalSteps={11} />

      <div className="screen-content">
        <h1 className="screen-title">Associer l'installation</h1>
        <p className="screen-desc">
          Ce boîtier sera associé à une installation. Le devis de cette installation a-t-il été créé dans Djua ?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button className="option-card active" onClick={() => handleSelect(true)}>
            <div className="option-icon option-icon-brand">
              <FileText size={24} color="var(--brand)" />
            </div>
            <div className="option-text">
              <div className="option-title brand">Oui, j'ai un numéro de devis</div>
              <div className="option-desc">Retrouver un devis existant et préremplir les informations.</div>
            </div>
            <ChevronRight size={20} color="var(--brand)" />
          </button>

          <button className="option-card" onClick={() => handleSelect(false)}>
            <div className="option-icon option-icon-gray">
              <PencilLine size={24} color="var(--text-muted)" />
            </div>
            <div className="option-text">
              <div className="option-title">Non, enregistrer le kit manuellement</div>
              <div className="option-desc">Renseigner les informations du système installé.</div>
            </div>
            <ChevronRight size={20} color="var(--text-placeholder)" />
          </button>
        </div>
      </div>
    </div>
  );
}
