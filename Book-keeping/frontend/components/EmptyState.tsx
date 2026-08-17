interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="mt-16 flex animate-fade-up flex-col items-center px-6 text-center">
      <div className="animate-float">
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* A small open ledger — ties back to the app's account-book motif */}
          <path
            d="M10 18C10 15.7909 11.7909 14 14 14H34V56H14C11.7909 56 10 54.2091 10 52V18Z"
            fill="var(--color-ink-light)"
            stroke="var(--color-brass)"
            strokeWidth="1.5"
          />
          <path
            d="M62 18C62 15.7909 60.2091 14 58 14H38V56H58C60.2091 56 62 54.2091 62 52V18Z"
            fill="var(--color-ink-light)"
            stroke="var(--color-brass)"
            strokeWidth="1.5"
          />
          <line x1="36" y1="14" x2="36" y2="56" stroke="var(--color-brass)" strokeWidth="1.5" />
          <line x1="16" y1="24" x2="28" y2="24" stroke="var(--color-ivory-dim)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="30" x2="24" y2="30" stroke="var(--color-ivory-dim)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="24" x2="56" y2="24" stroke="var(--color-ivory-dim)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="30" x2="52" y2="30" stroke="var(--color-ivory-dim)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <p className="mt-5 font-display text-2xl text-ivory">{title}</p>
      {subtitle && <p className="mt-1.5 text-sm text-ivory-dim">{subtitle}</p>}
    </div>
  );
}
