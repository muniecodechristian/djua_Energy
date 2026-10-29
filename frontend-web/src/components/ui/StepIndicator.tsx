interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const compact = totalSteps === 11;
  const compactStep = currentStep <= 2 ? 1 : currentStep <= 6 ? 2 : currentStep <= 8 ? 3 : 4;
  const displayStep = compact ? compactStep : currentStep;
  const displayTotal = compact ? 4 : totalSteps;

  return (
    <div className="step-indicator">
      {Array.from({ length: displayTotal }, (_, i) => (
        <div
          key={i}
          className={`step-dot ${i + 1 < displayStep ? 'done' : i + 1 === displayStep ? 'active' : ''}`}
        />
      ))}
      <span className="step-label">{displayStep}/{displayTotal}</span>
    </div>
  );
}
