import { supabase } from "./supabase.js";

interface TxRow {
  id: string;
  type: "sale" | "purchase" | "expense";
  item_name: string;
  amount: number;
  payment_method: string;
  counterparty: string | null;
  quantity: number | null;
  category: string | null;
  created_by: string;
  created_at: string;
}

function formatNaira(n: number): string {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

/**
 * Builds the day's report for the given date range (defaults to
 * "today" in WAT / Africa/Lagos, since that's where the business is).
 */
export async function buildDailyReport(dayStart: Date, dayEnd: Date): Promise<string> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("created_at", dayStart.toISOString())
    .lte("created_at", dayEnd.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch transactions for daily report: ${error.message}`);
  }

  const rows = (data ?? []) as TxRow[];
  const dateLabel = dayStart.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (rows.length === 0) {
    return `<b>Diamond Residence — Daily Report</b>\n${dateLabel}\n\nNo transactions recorded today.`;
  }

  const sales = rows.filter((r) => r.type === "sale");
  const purchases = rows.filter((r) => r.type === "purchase");
  const expenses = rows.filter((r) => r.type === "expense");

  const sum = (arr: TxRow[]) => arr.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalSales = sum(sales);
  const totalPurchases = sum(purchases);
  const totalExpenses = sum(expenses);
  const netCashflow = totalSales - totalPurchases - totalExpenses;

  const byUser = new Map<string, number>();
  for (const r of rows) {
    byUser.set(r.created_by, (byUser.get(r.created_by) ?? 0) + 1);
  }

  const lines: string[] = [];
  lines.push(`<b>Diamond Residence — Daily Report</b>`);
  lines.push(dateLabel);
  lines.push("");
  lines.push(`<b>Summary</b>`);
  lines.push(`Sales: ${formatNaira(totalSales)} (${sales.length} record${sales.length === 1 ? "" : "s"})`);
  lines.push(`Purchases: ${formatNaira(totalPurchases)} (${purchases.length} record${purchases.length === 1 ? "" : "s"})`);
  lines.push(`Expenses: ${formatNaira(totalExpenses)} (${expenses.length} record${expenses.length === 1 ? "" : "s"})`);
  lines.push(`<b>Net: ${formatNaira(netCashflow)}</b>`);
  lines.push("");
  lines.push(`<b>Recorded by</b>`);
  for (const [user, count] of byUser) {
    lines.push(`${user}: ${count} record${count === 1 ? "" : "s"}`);
  }
  lines.push("");
  lines.push(`<b>Transaction log</b>`);
  for (const r of rows) {
    const time = new Date(r.created_at).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const typeTag = r.type === "sale" ? "SALE" : r.type === "purchase" ? "PURCHASE" : "EXPENSE";
    lines.push(
      `${time} — [${typeTag}] ${r.item_name} — ${formatNaira(Number(r.amount))} — by ${r.created_by}`
    );
  }

  return lines.join("\n");
}

/** Returns [start, end] of "today" in Africa/Lagos (UTC+1, no DST). */
export function todayInLagos(): [Date, Date] {
  const now = new Date();
  // Lagos is fixed UTC+1 year-round — no DST to account for.
  const lagosOffsetMs = 60 * 60 * 1000;
  const lagosNow = new Date(now.getTime() + lagosOffsetMs);

  const start = new Date(
    Date.UTC(lagosNow.getUTCFullYear(), lagosNow.getUTCMonth(), lagosNow.getUTCDate(), 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(lagosNow.getUTCFullYear(), lagosNow.getUTCMonth(), lagosNow.getUTCDate(), 23, 59, 59)
  );

  // convert back to true UTC instants for the query
  return [new Date(start.getTime() - lagosOffsetMs), new Date(end.getTime() - lagosOffsetMs)];
}
