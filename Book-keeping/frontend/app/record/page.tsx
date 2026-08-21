"use client";

import { useState } from "react";
import { useNavigation } from "@/lib/navigation-context";
import { RequireAuth } from "@/components/RequireAuth";
import { CircleNav } from "@/components/CircleNav";
import { StepProgress } from "@/components/StepProgress";
import { QuantityStepper } from "@/components/QuantityStepper";
import {
  createTransaction,
  receiptPdfUrl,
  PAYMENT_METHODS,
  type TxType,
  type Transaction,
} from "@/lib/transactions-client";
import { shareReceipt } from "@/lib/share-receipt";

type Step = 1 | 2 | 3;

const TYPE_META: Record<TxType, { label: string; sub: string }> = {
  sale: { label: "Sale", sub: "Stock out" },
  purchase: { label: "Purchase", sub: "Stock in" },
  expense: { label: "Expense", sub: "" },
};

// Solid, opaque selection colors — no translucent /10 or /20 fills.
// Unselected = solid ink-light card with a colored border and label.
// Selected = solid color fill with dark ink text, same weight as the
// primary brass CTA elsewhere in the app.
type TypeStyle = { border: string; text: string; selectedBg: string };

const TYPE_STYLES: Record<TxType, TypeStyle> = {
  sale: { border: "border-sale", text: "text-sale", selectedBg: "bg-sale" },
  purchase: { border: "border-purchase", text: "text-purchase", selectedBg: "bg-purchase" },
  expense: { border: "border-expense", text: "text-expense", selectedBg: "bg-expense" },
};

export default function RecordPage() {
  const { navigate } = useNavigation();
  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<TxType | null>(null);

  // Shared + type-specific form state
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [counterparty, setCounterparty] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTx, setSavedTx] = useState<Transaction | null>(null);

  function resetForm() {
    setItemName("");
    setAmount("");
    setQuantity(1);
    setCounterparty("");
    setCategory("");
    setPaymentMethod(PAYMENT_METHODS[0]);
  }

  function handleNextFromStep1() {
    if (!type) return;
    resetForm();
    setStep(2);
  }

  function handlePreviousFromStep2() {
    setStep(1);
  }

  async function handleSubmit() {
    if (!type) return;
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!itemName.trim()) {
      setError(type === "expense" ? "Please enter a description." : "Please enter an item name.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (type === "expense" && !category.trim()) {
      setError("Please enter a category.");
      return;
    }

    setSubmitting(true);

    const result = await createTransaction({
      type,
      item_name: itemName.trim(),
      amount: parsedAmount,
      payment_method: paymentMethod,
      counterparty: type === "expense" ? null : counterparty.trim() || null,
      quantity: type === "expense" ? null : quantity,
      category: type === "expense" ? category.trim() : null,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSavedTx(result.transaction);
    setStep(3);
  }

  return (
    <RequireAuth>
      {() => (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-8 flex items-center justify-between">
              <StepProgress current={step} />
            </div>

            {/* ── Step 1: pick type ── */}
            {step === 1 && (
              <div className="flex flex-col">
                <h1 className="font-display text-4xl leading-tight text-ivory">
                  What type of order?
                </h1>

                <div className="mt-10 flex flex-col gap-4">
                  {(["sale", "purchase"] as const).map((t) => {
                    const selected = type === t;
                    const s = TYPE_STYLES[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setType(t)}
                        className={`rounded-full border-2 px-6 py-5 text-left transition-colors ${s.border} ${
                          selected ? `${s.selectedBg} text-ink-deep` : "bg-ink-light"
                        }`}
                      >
                        <span className={`block text-lg font-semibold ${selected ? "text-ink-deep" : s.text}`}>
                          {TYPE_META[t].label}
                        </span>
                        <span className={selected ? "text-ink-deep/70" : "text-ivory-dim"}>
                          {TYPE_META[t].sub}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    aria-pressed={type === "expense"}
                    onClick={() => setType("expense")}
                    className={`mt-2 rounded-full border-2 px-6 py-4 text-center text-lg font-semibold transition-colors border-expense ${
                      type === "expense" ? "bg-expense text-ink-deep" : "bg-ink-light text-expense"
                    }`}
                  >
                    Expenses
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  disabled={!type}
                  className="mt-8 rounded-full bg-brass px-8 py-4 text-center text-lg font-semibold text-ink-deep transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}

            {/* ── Step 2: form ── */}
            {step === 2 && type && (
              <div className="flex flex-col">
                <h1 className="font-display text-4xl leading-tight text-ivory">
                  {TYPE_META[type].label} details
                </h1>

                <div className="mt-6 flex flex-col gap-4">
                  <div>
                    <label htmlFor="itemName" className="mb-1.5 block text-sm text-ivory-dim">
                      {type === "expense" ? "Description" : "Item name"}
                    </label>
                    <input
                      id="itemName"
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full rounded-xl border border-ink-light bg-ink-deep px-4 py-3 text-ivory"
                    />
                  </div>

                  {type === "expense" && (
                    <div>
                      <label htmlFor="category" className="mb-1.5 block text-sm text-ivory-dim">
                        Category
                      </label>
                      <input
                        id="category"
                        type="text"
                        placeholder="e.g. Utilities, Maintenance, Salaries"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-ink-light bg-ink-deep px-4 py-3 text-ivory placeholder:text-ivory-dim/50"
                      />
                    </div>
                  )}

                  {type !== "expense" && (
                    <>
                      <div>
                        <label htmlFor="counterparty" className="mb-1.5 block text-sm text-ivory-dim">
                          {type === "sale" ? "Customer name (optional)" : "Supplier name (optional)"}
                        </label>
                        <input
                          id="counterparty"
                          type="text"
                          value={counterparty}
                          onChange={(e) => setCounterparty(e.target.value)}
                          className="w-full rounded-xl border border-ink-light bg-ink-deep px-4 py-3 text-ivory"
                        />
                      </div>

                      <div>
                        <span className="mb-1.5 block text-sm text-ivory-dim">Quantity</span>
                        <QuantityStepper value={quantity} onChange={setQuantity} />
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="amount" className="mb-1.5 block text-sm text-ivory-dim">
                      Amount (₦)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-ink-light bg-ink-deep px-4 py-3 font-mono text-ivory"
                    />
                  </div>

                  <div>
                    <label htmlFor="paymentMethod" className="mb-1.5 block text-sm text-ivory-dim">
                      Payment method
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-xl border border-ink-light bg-ink-deep px-4 py-3 text-ivory"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-expense">
                      {error}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousFromStep2}
                    className="flex-1 rounded-full border border-ink-light px-6 py-4 text-center text-lg font-semibold text-ivory-dim transition-colors hover:text-ivory"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded-full bg-brass px-6 py-4 text-center text-lg font-semibold text-ink-deep transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Next"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: done / receipt ── */}
            {step === 3 && savedTx && (
              <div className="flex flex-col items-center pt-8 text-center">
                <h1 className="font-display text-4xl text-brass-bright">Recorded!</h1>
                <p className="mt-2 text-ivory-dim">
                  {TYPE_META[savedTx.type].label} of ₦
                  {savedTx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} saved.
                </p>

                <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
                  
                    href={receiptPdfUrl(savedTx.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-brass px-6 py-4 text-center font-semibold text-ink-deep"
                  >
                    Download receipt
                  </a>
                  <button
                    type="button"
                    onClick={() => shareReceipt(receiptPdfUrl(savedTx.id))}
                    className="rounded-full border border-brass px-6 py-4 text-center font-semibold text-brass"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSavedTx(null);
                      setType(null);
                      setStep(1);
                    }}
                    className="mt-2 text-sm text-ivory-dim underline"
                  >
                    Record another
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-sm text-ivory-dim underline"
                  >
                    Back to home
                  </button>
                </div>
              </div>
            )}
          </div>

          <CircleNav />
        </div>
      )}
    </RequireAuth>
  );
}
