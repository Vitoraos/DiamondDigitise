"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function ReceiptPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["receipt", bookingId],
    queryFn: () =>
      api.get(`/api/receipts/${bookingId}`).then((res) => res.data.data),
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-navy-700 animate-pulse">Loading receipt...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-600">Receipt not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-8 text-center">
        Booking Receipt
      </h1>
      <div className="bg-white rounded-lg shadow-lg border border-beige-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p className="text-navy-600 font-medium">Receipt Number</p>
          <p className="text-navy-800">{data.receipt_number}</p>

          <p className="text-navy-600 font-medium">Booking Reference</p>
          <p className="text-navy-800">{data.bookings?.booking_ref}</p>

          <p className="text-navy-600 font-medium">Guest Name</p>
          <p className="text-navy-800">{data.bookings?.guests?.name}</p>

          <p className="text-navy-600 font-medium">Room</p>
          <p className="text-navy-800">
            {data.bookings?.rooms?.room_number} ({data.bookings?.categories?.name})
          </p>

          <p className="text-navy-600 font-medium">Check‑in</p>
          <p className="text-navy-800">
            {new Date(data.bookings?.check_in_at).toLocaleString()}
          </p>

          <p className="text-navy-600 font-medium">Check‑out</p>
          <p className="text-navy-800">
            {new Date(data.bookings?.check_out_at).toLocaleString()}
          </p>

          <p className="text-navy-600 font-medium">Total Paid</p>
          <p className="text-navy-800 font-bold">
            ₦{parseInt(data.bookings?.total_amount).toLocaleString()}
          </p>
        </div>

        {data.pdf_url && (
          <div className="text-center mt-6">
            <a
              href={data.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold-500 hover:bg-gold-600 text-navy-900 px-6 py-2 rounded-lg font-semibold"
            >
              Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
