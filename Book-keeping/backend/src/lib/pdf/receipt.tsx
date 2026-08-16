import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ReceiptData {
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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  letterhead: {
    textAlign: "center",
    marginBottom: 24,
    borderBottom: "2 solid #1a1a1a",
    paddingBottom: 12,
  },
  hotelName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  hotelSub: {
    fontSize: 9,
    color: "#555555",
    marginTop: 4,
  },
  typeBadge: {
    marginTop: 12,
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: "0.5 solid #dddddd",
  },
  label: {
    color: "#555555",
  },
  value: {
    fontFamily: "Helvetica-Bold",
  },
  amountBlock: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    textAlign: "center",
  },
  amountLabel: {
    fontSize: 10,
    color: "#555555",
  },
  amountValue: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999999",
  },
});

const typeLabels: Record<ReceiptData["type"], string> = {
  sale: "Sale / Stock Out",
  purchase: "Purchase / Stock In",
  expense: "Expense",
};

const typeColors: Record<ReceiptData["type"], string> = {
  sale: "#d1fae5",
  purchase: "#fef3c7",
  expense: "#fee2e2",
};

function formatNaira(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function ReceiptDocument({ tx }: { tx: ReceiptData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.letterhead}>
          <Text style={styles.hotelName}>DIAMOND RESIDENCE</Text>
          <Text style={styles.hotelSub}>Transaction Receipt</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeColors[tx.type] }]}>
            <Text>{typeLabels[tx.type]}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Receipt ID</Text>
          <Text style={styles.value}>{tx.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date &amp; Time</Text>
          <Text style={styles.value}>{formatDate(tx.created_at)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{tx.type === "expense" ? "Description" : "Item"}</Text>
          <Text style={styles.value}>{tx.item_name}</Text>
        </View>

        {tx.type === "expense" && tx.category && (
          <View style={styles.row}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{tx.category}</Text>
          </View>
        )}

        {(tx.type === "sale" || tx.type === "purchase") && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>{tx.type === "sale" ? "Customer" : "Supplier"}</Text>
              <Text style={styles.value}>{tx.counterparty ?? "Not provided"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Quantity</Text>
              <Text style={styles.value}>{tx.quantity}</Text>
            </View>
          </>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>{tx.payment_method}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Recorded By</Text>
          <Text style={styles.value}>{tx.created_by}</Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>AMOUNT</Text>
          <Text style={styles.amountValue}>{formatNaira(tx.amount)}</Text>
        </View>

        <Text style={styles.footer}>
          Diamond Residence — Generated automatically. Retain for your records.
        </Text>
      </Page>
    </Document>
  );
}
