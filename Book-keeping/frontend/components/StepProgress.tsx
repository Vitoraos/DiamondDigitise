interface StepProgressProps {
  current: 1 | 2 | 3;
}

const STEP_LABELS = ["Type", "Details", "Done"];

export function StepProgress({ current }: StepProgressProps) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of 3`}>
      {[1, 2, 3].map((step) => {
        const isActive = step === current;
        const isComplete = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`
                flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm
                ${isActive ? "bg-brass text-ink-deep" : ""}
                ${isComplete ? "bg-ink-light text-brass" : ""}
                ${!isActive && !isComplete ? "bg-ink-light text-ivory-dim" : ""}
              `}
              aria-current={isActive ? "step" : undefined}
            >
              {step}
            </div>
            <span
              className={`text-xs ${isActive ? "text-ivory" : "text-ivory-dim"}`}
            >
              {STEP_LABELS[step - 1]}
            </span>
            {step < 3 && <div className="ml-1 h-px w-4 bg-ink-light" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
