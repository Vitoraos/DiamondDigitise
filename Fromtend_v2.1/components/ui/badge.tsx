import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  available: "text-gold border-gold bg-transparent",
  occupied: "text-white border-dim bg-transparent",
  cleaning: "text-blue-400 border-blue-400 bg-transparent",
  maintenance: "text-error border-error bg-transparent",
  pending_payment: "text-dim border-ghost bg-transparent",
  confirmed: "text-gold border-gold bg-transparent",
  checked_in: "text-success border-success bg-transparent",
  checked_out: "text-dim border-ghost bg-transparent",
  cancelled: "text-error border-error bg-transparent",
  incomplete_payment: "text-error border-error bg-transparent",
};

export function Badge({ status, className }: { status: string; className?: string }) {
  const styles = statusStyles[status] || "text-dim border-ghost bg-transparent";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 text-[0.6rem] font-semibold tracking-[0.15em] uppercase border",
        styles,
        className
      )}
    >
      <span className="w-1.5 h-1.5 bg-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
}
