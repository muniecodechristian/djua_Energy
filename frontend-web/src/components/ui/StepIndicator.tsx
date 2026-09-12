interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`step-dot ${i + 1 < currentStep ? 'done' : i + 1 === currentStep ? 'active' : ''}`}
        />
      ))}
      <span className="step-label">{currentStep}/{totalSteps}</span>
    </div>
  );
}
