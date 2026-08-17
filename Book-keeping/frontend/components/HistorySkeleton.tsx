import type { CSSProperties } from "react";

// CSS custom properties inherit through the cascade (unlike animation-delay
// itself), so setting --shimmer-delay on the row lets each row's shimmer
// ::after pick it up and stagger the sweep left-to-right, top-to-bottom.
function rowDelayStyle(index: number): CSSProperties {
  return { "--shimmer-delay": `${index * 120}ms` } as CSSProperties;
}

export function HistorySkeleton() {
  return (
    <div className="mt-8 animate-fade-up" aria-hidden="true">
      <div className="mb-3 h-4 w-16 rounded shimmer" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={rowDelayStyle(i)}
            className="flex items-center justify-between rounded-2xl bg-ink-light px-4 py-4"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-4 w-2/5 rounded shimmer" />
              <div className="h-3 w-1/4 rounded shimmer" />
            </div>
            <div className="ml-3 h-4 w-16 shrink-0 rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
