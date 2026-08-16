"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { CircleNav } from "@/components/CircleNav";
import { ReceiptDetailModal } from "@/components/ReceiptDetailModal";
import { fetchTransactions, type Transaction, type TxType } from "@/lib/transactions-client";
import { rangeForPreset, dayKey, dayHeaderLabel, type DatePreset } from "@/lib/date-ranges";

const TYPE_FILTERS: { value: TxType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sale", label: "Sales" },
  { value: "purchase", label: "Purchases" },
  { value: "expense", label: "Expenses" },
];

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const TYPE_COLOR_CLASS: Record<TxType, string> = {
  sale: "text-sale",
  purchase: "text-purchase",
  expense: "text-expense",
};

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState<TxType | "all">("all");
  const [preset, setPreset] = useState<DatePreset>("today");
  const [customMode, setCustomMode] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { from, to } = useMemo(() => {
    if (customMode) {
      return {
        from: customFrom ? new Date(customFrom + "T00:00:00").toISOString() : undefined,
        to: customTo ? new Date(customTo + "T23:59:59").toISOString() : undefined,
      };
    }
    const [presetFrom, presetTo] = rangeForPreset(preset);
    return { from: presetFrom ?? undefined, to: presetTo ?? undefined };
  }, [customMode, customFrom, customTo, preset]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const result = await fetchTransactions({
        type: typeFilter === "all" ? undefined : typeFilter,
        from,
        to,
        pageSize: 100,
      });

      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
      } else {
        setTransactions(result.result.data);
      }
      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [typeFilter, from, to]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const key = dayKey(tx.created_at);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    }
    // Map preserves insertion order; transactions arrive newest-first from the API
    return Array.from(groups.entries());
  }, [transactions]);

  return (
    <RequireAuth>
      {() => (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <h1 className="font-display text-4xl text-ivory">History</h1>

            {/* Type filter */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setTypeFilter(f.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    typeFilter === f.value
                      ? "bg-brass text-ink-deep"
                      : "bg-ink-light text-ivory-dim"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPreset(p.value);
                    setCustomMode(false);
                  }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    !customMode && preset === p.value
                      ? "bg-ink-light text-brass-bright border border-brass"
                      : "bg-ink-light text-ivory-dim"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  customMode
                    ? "bg-ink-light text-brass-bright border border-brass"
                    : "bg-ink-light text-ivory-dim"
                }`}
              >
                Custom
              </button>
            </div>

            {customMode && (
              <div className="mt-3 flex gap-3">
                <div className="flex-1">
                  <label htmlFor="fromDate" className="mb-1 block text-xs text-ivory-dim">
                    From
                  </label>
                  <input
                    id="fromDate"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-lg border border-ink-light bg-ink-deep px-3 py-2 text-sm text-ivory"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="toDate" className="mb-1 block text-xs text-ivory-dim">
                    To
                  </label>
                  <input
                    id="toDate"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-lg border border-ink-light bg-ink-deep px-3 py-2 text-sm text-ivory"
                  />
                </div>
              </div>
            )}

            {/* Results */}
            <div className="mt-6">
              {loading && <p className="text-sm text-ivory-dim">Loading…</p>}

              {!loading && error && (
                <p role="alert" className="text-sm text-expense">
                  {error}
                </p>
              )}

              {!loading && !error && grouped.length === 0 && (
                <p className="text-sm text-ivory-dim">No records for this range.</p>
              )}

              {!loading &&
                !error &&
                grouped.map(([key, txs]) => (
                  <div key={key} className="mb-6">
                    <h2 className="mb-2 text-sm font-semibold text-ivory-dim">
                      {dayHeaderLabel(key)}
                    </h2>
                    <div className="flex flex-col gap-2">
                      {txs.map((tx) => (
                        <button
                          key={tx.id}
                          type="button"
                          onClick={() => setSelected(tx)}
                          className="flex items-center justify-between rounded-xl bg-ink-light px-4 py-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-ivory">{tx.item_name}</p>
                            <p className={`text-xs font-medium ${TYPE_COLOR_CLASS[tx.type]}`}>
                              {tx.type === "sale"
                                ? "Sale"
                                : tx.type === "purchase"
                                  ? "Purchase"
                                  : "Expense"}
                              {" · "}
                              {new Date(tx.created_at).toLocaleTimeString("en-NG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <p className="ml-3 shrink-0 font-mono text-ivory">
                            ₦{tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <CircleNav />

          {selected && (
            <ReceiptDetailModal tx={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      )}
    </RequireAuth>
  );
}
