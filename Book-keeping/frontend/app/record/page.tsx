"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
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

export default function RecordPage() {
  const router = useRouter();
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

  function goToStep2(chosen: TxType) {
    setType(chosen);
    resetForm();
    setStep(2);
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
        <div className="flex flex-1 flex-col px-6 py-6">
          <div className="mb-8 flex items-center justify-between">
            <StepProgress current={step} />
          </div>

          {/* ── Step 1: pick type ── */}
          {step === 1 && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-display text-4xl leading-tight text-ivory">
                What type of order?
              </h1>

              <div className="mt-10 flex flex-1 flex-col gap-4">
                <button
                  type="button"
                  onClick={() => goToStep2("sale")}
                  className="rounded-full border-2 border-sale bg-sale/10 px-6 py-5 text-left transition-colors hover:bg-sale/20"
                >
                  <span className="block text-lg font-semibold text-sale">Sale</span>
                  <span className="text-sm text-ivory-dim">Stock out</span>
                </button>

                <button
                  type="button"
                  onClick={() => goToStep2("purchase")}
                  className="rounded-full border-2 border-purchase bg-purchase/10 px-6 py-5 text-left transition-colors hover:bg-purchase/20"
                >
                  <span className="block text-lg font-semibold text-purchase">Purchase</span>
                  <span className="text-sm text-ivory-dim">Stock in</span>
                </button>

                <button
                  type="button"
                  onClick={() => goToStep2("expense")}
                  className="mt-2 rounded-full border-2 border-expense bg-expense/10 px-6 py-4 text-center text-lg font-semibold text-expense transition-colors hover:bg-expense/20"
                >
                  Expenses
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: form ── */}
          {step === 2 && type && (
            <div className="flex flex-1 flex-col">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-4 self-start text-sm text-ivory-dim underline"
              >
                ← Change type
              </button>

              <h1 className="font-display text-4xl leading-tight text-ivory">
                {TYPE_META[type].label} details
              </h1>

              <div className="mt-6 flex flex-1 flex-col gap-4">
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

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 rounded-full bg-brass px-8 py-4 text-center text-lg font-semibold text-ink-deep transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Generate receipt"}
              </button>
            </div>
          )}

          {/* ── Step 3: done / receipt ── */}
          {step === 3 && savedTx && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
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
                  onClick={() => router.push("/")}
                  className="text-sm text-ivory-dim underline"
                >
                  Back to home
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </RequireAuth>
  );
}
