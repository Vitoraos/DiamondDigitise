const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export type TxType = "sale" | "purchase" | "expense";

export interface CreateTransactionInput {
  type: TxType;
  item_name: string;
  amount: number;
  payment_method: string;
  counterparty?: string | null;
  quantity?: number | null;
  category?: string | null;
}

export interface Transaction extends CreateTransactionInput {
  id: string;
  created_by: string;
  created_at: string;
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<{ ok: true; transaction: Transaction } | { ok: false; error: string }> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: body?.error ?? "Could not save the record. Please try again." };
  }

  return { ok: true, transaction: body as Transaction };
}

export function receiptPdfUrl(transactionId: string): string {
  return `${API_BASE}/transactions/${transactionId}/pdf`;
}

export interface FetchTransactionsParams {
  type?: TxType;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  pageSize?: number;
}

export interface FetchTransactionsResult {
  data: Transaction[];
  page: number;
  pageSize: number;
  total: number;
}

export async function fetchTransactions(
  params: FetchTransactionsParams
): Promise<{ ok: true; result: FetchTransactionsResult } | { ok: false; error: string }> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`, {
    credentials: "include",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: body?.error ?? "Could not load history. Please try again." };
  }

  return { ok: true, result: body as FetchTransactionsResult };
}

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "POS", "Other"] as const;
