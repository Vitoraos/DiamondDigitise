"use client";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

export function QuantityStepper({ value, onChange, min = 1 }: QuantityStepperProps) {
  function clamp(n: number) {
    return Number.isFinite(n) && n >= min ? n : min;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-light text-xl text-ivory disabled:opacity-30"
      >
        –
      </button>

      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        aria-label="Quantity"
        className="w-16 rounded-lg border border-ink-light bg-ink-deep py-2 text-center font-mono text-lg text-ivory"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-light text-xl text-ivory"
      >
        +
      </button>
    </div>
  );
}
