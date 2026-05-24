"use client";

import { usePayments } from "@/hooks/queries/usePayments";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Payment = {
  id: string;
  amount_expected: number | string;
  amount_received?: number | string | null;
  status: string;
  created_at: string;
  bookings?: {
    booking_ref?: string;
    guests?: {
      name?: string;
    };
  };
};

const formatNaira = (value: number | string | null | undefined) => {
  return Number(value ?? 0).toLocaleString("en-NG");
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function AdminPaymentsPage() {
  const { data: payments, isLoading, error } = usePayments();

  if (isLoading) {
    return <p className="text-slate-500">Loading payments...</p>;
  }

  if (error) {
    return <p className="text-red-600">Failed to load payments.</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900 mb-8">
        Payments
      </h1>

      <div className="overflow-hidden bg-surface rounded-3xl border border-alabaster-200 shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-midnight-900/5 to-transparent">
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Booking Ref</th>
              <th className="p-4 font-medium">Guest</th>
              <th className="p-4 font-medium">Expected</th>
              <th className="p-4 font-medium">Received</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-alabaster-200">
            {payments?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  No payments found
                </td>
              </tr>
            )}

            {payments?.map((p: Payment) => {
              const bookingRef = p.bookings?.booking_ref ?? "—";
              const guestName = p.bookings?.guests?.name ?? "Unknown Guest";

              return (
                <tr key={p.id} className="hover:bg-alabaster-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {bookingRef}
                  </td>

                  <td className="p-4 text-midnight-900 font-medium">
                    {guestName}
                  </td>

                  <td className="p-4 text-slate-600">
                    ₦{formatNaira(p.amount_expected)}
                  </td>

                  <td className="p-4 text-midnight-900 font-medium">
                    ₦{formatNaira(p.amount_received)}
                  </td>

                  <td className="p-4">
                    <StatusBadge status={p.status} />
                  </td>

                  <td className="p-4 text-xs text-slate-400">
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
