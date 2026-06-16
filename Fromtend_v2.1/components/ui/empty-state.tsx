import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      <p className="text-sm font-medium text-dim uppercase tracking-widest mb-2">{title}</p>
      {description && <p className="text-sm text-dim/60 max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}
