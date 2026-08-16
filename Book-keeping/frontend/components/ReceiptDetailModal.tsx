"use client";

import type { Transaction } from "@/lib/transactions-client";
import { receiptPdfUrl } from "@/lib/transactions-client";
import { shareReceipt } from "@/lib/share-receipt";

const TYPE_LABEL: Record<Transaction["type"], string> = {
  sale: "Sale",
  purchase: "Purchase",
  expense: "Expense",
};

const TYPE_COLOR_CLASS: Record<Transaction["type"], string> = {
  sale: "text-sale",
  purchase: "text-purchase",
  expense: "text-expense",
};

export function ReceiptDetailModal({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-ink-light p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold uppercase ${TYPE_COLOR_CLASS[tx.type]}`}>
            {TYPE_LABEL[tx.type]}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ivory-dim hover:text-ivory"
          >
            ✕
          </button>
        </div>

        <h2 id="receipt-modal-title" className="mt-3 font-display text-3xl text-ivory">
          {tx.item_name}
        </h2>

        <p className="mt-1 font-mono text-2xl text-brass-bright">
          ₦{tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between border-b border-ink-deep pb-2">
            <dt className="text-ivory-dim">Date</dt>
            <dd className="text-ivory">
              {new Date(tx.created_at).toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>

          {tx.type !== "expense" && (
            <>
              <div className="flex justify-between border-b border-ink-deep pb-2">
                <dt className="text-ivory-dim">{tx.type === "sale" ? "Customer" : "Supplier"}</dt>
                <dd className="text-ivory">{tx.counterparty ?? "Not provided"}</dd>
              </div>
              <div className="flex justify-between border-b border-ink-deep pb-2">
                <dt className="text-ivory-dim">Quantity</dt>
                <dd className="text-ivory">{tx.quantity}</dd>
              </div>
            </>
          )}

          {tx.type === "expense" && tx.category && (
            <div className="flex justify-between border-b border-ink-deep pb-2">
              <dt className="text-ivory-dim">Category</dt>
              <dd className="text-ivory">{tx.category}</dd>
            </div>
          )}

          <div className="flex justify-between border-b border-ink-deep pb-2">
            <dt className="text-ivory-dim">Payment method</dt>
            <dd className="text-ivory">{tx.payment_method}</dd>
          </div>

          <div className="flex justify-between pb-2">
            <dt className="text-ivory-dim">Recorded by</dt>
            <dd className="text-ivory">{tx.created_by}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          
            <a
  href={receiptPdfUrl(tx.id)}
  target="_blank"
  rel="noreferrer"
  className="flex-1 rounded-full bg-brass px-4 py-3 text-center font-semibold text-ink-deep"
>
  Download
</a>
          <button
            type="button"
            onClick={() => shareReceipt(receiptPdfUrl(tx.id))}
            className="flex-1 rounded-full border border-brass px-4 py-3 text-center font-semibold text-brass"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
