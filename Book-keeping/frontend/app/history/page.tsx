"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { CircleNav } from "@/components/CircleNav";
import { ReceiptDetailModal } from "@/components/ReceiptDetailModal";
import { HistorySkeleton } from "@/components/HistorySkeleton";
import { EmptyState } from "@/components/EmptyState";
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
    return Array.from(groups.entries());
  }, [transactions]);

  return (
    <RequireAuth>
      {() => (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <h1 className="font-display text-4xl text-ivory">History</h1>

            {/* Filters, grouped in their own card for visual separation from the list */}
            <div className="mt-6 rounded-2xl bg-ink-light/40 p-4">
              <div>
                <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-ivory-dim">
                  Type
                </span>
                <div className="flex flex-wrap gap-2">
                  {TYPE_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setTypeFilter(f.value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        typeFilter === f.value
                          ? "bg-brass text-ink-deep"
                          : "bg-ink-light text-ivory-dim"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-ivory-dim">
                  Date range
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setPreset(p.value);
                        setCustomMode(false);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        !customMode && preset === p.value
                          ? "border-brass bg-ink-light text-brass-bright"
                          : "border-transparent bg-ink-light text-ivory-dim"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomMode(true)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      customMode
                        ? "border-brass bg-ink-light text-brass-bright"
                        : "border-transparent bg-ink-light text-ivory-dim"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {customMode && (
                  <div className="mt-4 flex gap-3">
                    <div className="flex-1">
                      <label htmlFor="fromDate" className="mb-1.5 block text-xs text-ivory-dim">
                        From
                      </label>
                      <input
                        id="fromDate"
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="w-full rounded-lg border border-ink-light bg-ink-deep px-3 py-2.5 text-sm text-ivory"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="toDate" className="mb-1.5 block text-xs text-ivory-dim">
                        To
                      </label>
                      <input
                        id="toDate"
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="w-full rounded-lg border border-ink-light bg-ink-deep px-3 py-2.5 text-sm text-ivory"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className={loading ? "" : "mt-8"}>
              {loading && <HistorySkeleton />}

              {!loading && error && (
                <p role="alert" className="mt-8 text-sm text-expense">
                  {error}
                </p>
              )}

              {!loading && !error && grouped.length === 0 && (
                <EmptyState
                  title="Nothing here yet"
                  subtitle="Records for this range will show up here once you start logging."
                />
              )}

              {!loading &&
                !error &&
                grouped.map(([key, txs], i) => (
                  <div key={key} className={i === 0 ? "mb-8" : "mb-8 border-t border-ink-light pt-8"}>
                    <h2 className="mb-3 text-sm font-semibold text-ivory-dim">
                      {dayHeaderLabel(key)}
                    </h2>
                    <div className="flex flex-col gap-3">
                      {txs.map((tx) => (
                        <button
                          key={tx.id}
                          type="button"
                          onClick={() => setSelected(tx)}
                          className="flex items-center justify-between rounded-2xl bg-ink-light px-4 py-4 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-ivory">{tx.item_name}</p>
                            <p className={`mt-0.5 text-xs font-medium ${TYPE_COLOR_CLASS[tx.type]}`}>
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
