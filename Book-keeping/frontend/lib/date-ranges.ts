export type DatePreset = "today" | "week" | "month" | "all";

// Lagos is fixed UTC+1 year-round, no DST — same approach as the backend's daily report.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

function lagosNow(): Date {
  return new Date(Date.now() + LAGOS_OFFSET_MS);
}

function toUtcInstant(lagosDate: Date): Date {
  return new Date(lagosDate.getTime() - LAGOS_OFFSET_MS);
}

/** Returns [fromISO, toISO] for a given preset, or [null, null] for "all". */
export function rangeForPreset(preset: DatePreset): [string | null, string | null] {
  const now = lagosNow();

  if (preset === "all") return [null, null];

  if (preset === "today") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    return [toUtcInstant(start).toISOString(), toUtcInstant(end).toISOString()];
  }

  if (preset === "week") {
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    return [toUtcInstant(start).toISOString(), toUtcInstant(end).toISOString()];
  }

  // month
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
  return [toUtcInstant(start).toISOString(), toUtcInstant(end).toISOString()];
}

/** Groups transactions by their day-of (Lagos-local calendar day) for section headers. */
export function dayKey(isoTimestamp: string): string {
  const d = new Date(new Date(isoTimestamp).getTime() + LAGOS_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function dayHeaderLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1, d));

  const today = lagosNow();
  const todayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterday.getUTCDate()).padStart(2, "0")}`;

  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";

  return target.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: target.getUTCFullYear() === today.getUTCFullYear() ? undefined : "numeric",
  });
}
