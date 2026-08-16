import type { FastifyInstance } from "fastify";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../lib/auth-middleware.js";
import { ReceiptDocument, type ReceiptData } from "../lib/pdf/receipt.js";

type TxType = "sale" | "purchase" | "expense";
const VALID_TYPES: TxType[] = ["sale", "purchase", "expense"];

interface CreateTransactionBody {
  type?: TxType;
  item_name?: string;
  amount?: number;
  payment_method?: string;
  counterparty?: string | null;
  quantity?: number | null;
  category?: string | null;
}

function validateCreateBody(body: CreateTransactionBody): string | null {
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return `type must be one of: ${VALID_TYPES.join(", ")}`;
  }
  if (!body.item_name?.trim()) {
    return "item_name is required.";
  }
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return "amount must be a positive number.";
  }
  if (!body.payment_method?.trim()) {
    return "payment_method is required.";
  }

  if (body.type === "sale" || body.type === "purchase") {
    if (
      body.quantity == null ||
      !Number.isInteger(body.quantity) ||
      body.quantity <= 0
    ) {
      return "quantity is required and must be a positive whole number for sales/purchases.";
    }
    if (body.category) {
      return "category is not applicable to sales/purchases — did you mean to submit an expense?";
    }
    // counterparty is optional by design (walk-in customer / anonymous cash buy)
    if (body.counterparty !== undefined && body.counterparty !== null && !body.counterparty.trim()) {
      return "counterparty was sent as an empty string — omit it entirely for a walk-in/anonymous transaction.";
    }
  }

  if (body.type === "expense") {
    if (!body.category?.trim()) {
      return "category is required for expenses.";
    }
    if (body.quantity != null) {
      return "quantity is not applicable to expenses.";
    }
    if (body.counterparty) {
      return "counterparty is not applicable to expenses.";
    }
  }

  return null;
}

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post<{ Body: CreateTransactionBody }>("/transactions", async (req, reply) => {
    const body = req.body ?? {};
    const validationError = validateCreateBody(body);

    if (validationError) {
      return reply.code(400).send({ error: validationError });
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        type: body.type,
        item_name: body.item_name!.trim(),
        amount: body.amount,
        payment_method: body.payment_method!.trim(),
        counterparty: body.counterparty?.trim() || null,
        quantity: body.quantity ?? null,
        category: body.category?.trim() || null,
        created_by: req.user!.username,
      })
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Failed to insert transaction");
      // Postgres constraint violations land here too (e.g. a race past
      // our own validation) — surface a clean 400 instead of a raw 500.
      return reply.code(400).send({ error: "Could not save transaction. " + error.message });
    }

    return reply.code(201).send(data);
  });

  app.get<{
    Querystring: {
      type?: TxType;
      from?: string; // ISO date
      to?: string; // ISO date
      page?: string;
      pageSize?: string;
    };
  }>("/transactions", async (req, reply) => {
    const { type, from, to } = req.query;

    if (type && !VALID_TYPES.includes(type)) {
      return reply.code(400).send({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
    }
    if (from && Number.isNaN(Date.parse(from))) {
      return reply.code(400).send({ error: "from must be a valid ISO date." });
    }
    if (to && Number.isNaN(Date.parse(to))) {
      return reply.code(400).send({ error: "to must be a valid ISO date." });
    }

    const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize ?? "50", 10) || 50));
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(rangeFrom, rangeTo);

    if (type) query = query.eq("type", type);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error, count } = await query;

    if (error) {
      req.log.error({ err: error }, "Failed to fetch transactions");
      return reply.code(500).send({ error: "Could not fetch transaction history." });
    }

    return reply.send({ data, page, pageSize, total: count ?? 0 });
  });

  app.get<{ Params: { id: string } }>("/transactions/:id", async (req, reply) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      req.log.error({ err: error }, "Failed to fetch transaction");
      return reply.code(500).send({ error: "Could not fetch transaction." });
    }
    if (!data) {
      return reply.code(404).send({ error: "Transaction not found." });
    }

    return reply.send(data);
  });

  app.get<{ Params: { id: string } }>("/transactions/:id/pdf", async (req, reply) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      req.log.error({ err: error }, "Failed to fetch transaction for PDF");
      return reply.code(500).send({ error: "Could not generate receipt." });
    }
    if (!data) {
      return reply.code(404).send({ error: "Transaction not found." });
    }

    let pdfBuffer: Buffer;
    try {
      // @react-pdf/renderer's types expect a <Document> element directly;
      // our ReceiptDocument wraps one. Safe to cast — it's a Document at
      // render time even though TS can't see that through the wrapper.
      const element = React.createElement(ReceiptDocument, {
        tx: data as ReceiptData,
      }) as unknown as Parameters<typeof renderToBuffer>[0];
      pdfBuffer = await renderToBuffer(element);
    } catch (renderErr) {
      req.log.error({ err: renderErr }, "PDF rendering failed");
      return reply.code(500).send({ error: "Could not generate receipt PDF." });
    }

    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `inline; filename="diamond-residence-receipt-${data.id.slice(0, 8)}.pdf"`
    );
    return reply.send(pdfBuffer);
  });
}
