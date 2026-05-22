"use client";

import { usePayments } from "@/hooks/queries/usePayments";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function AdminPaymentsPage() {
  const { data: payments, isLoading, error } = usePayments();

  if (isLoading) return <p className="text-navy-700">Loading payments...</p>;
  if (error) return <p className="text-red-600">Failed to load payments.</p>;

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Payments</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="w-full text-sm">
          <thead className="bg-beige-100 text-left">
            <tr>
              <th className="p-3">Booking Ref</th>
              <th className="p-3">Guest</th>
              <th className="p-3">Expected</th>
              <th className="p-3">Received</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments?.map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-beige-50">
                <td className="p-3 font-mono text-xs">{p.bookings?.booking_ref}</td>
                <td className="p-3">{p.bookings?.guests?.name}</td>
                <td className="p-3">₦{parseInt(p.amount_expected).toLocaleString()}</td>
                <td className="p-3">₦{parseInt(p.amount_received || 0).toLocaleString()}</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
