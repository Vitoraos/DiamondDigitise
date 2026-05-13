import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-300",
  occupied: "bg-red-100 text-red-800 border-red-300",
  cleaning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  maintenance: "bg-gray-100 text-gray-800 border-gray-300",
};

export function StatusBadge({ status }: { status: string }) {
  const styles = statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-300";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        styles
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}