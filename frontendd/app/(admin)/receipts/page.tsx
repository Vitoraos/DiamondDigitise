"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminReceiptsPage() {
  const [bookingId, setBookingId] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: receipt, isLoading, error } = useQuery({
    queryKey: ["admin-receipt", bookingId],
    queryFn: () => api.get(`/api/receipts/${bookingId}`).then((res) => res.data.data),
    enabled: !!bookingId && searched,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Receipts</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
        <Input
          placeholder="Enter Booking ID (UUID)"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          required
        />
        <Button type="submit" className="bg-gold-500 hover:bg-gold-600 text-navy-900">
          Lookup
        </Button>
      </form>
      {searched && isLoading && <p className="text-navy-700">Searching...</p>}
      {searched && error && <p className="text-red-600">Receipt not found.</p>}
      {searched && receipt && (
        <div className="bg-white rounded-lg shadow border p-6 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="text-navy-600 font-medium">Receipt Number</p>
            <p className="text-navy-800">{receipt.receipt_number}</p>
            <p className="text-navy-600 font-medium">Booking Ref</p>
            <p className="text-navy-800">{receipt.bookings?.booking_ref}</p>
            <p className="text-navy-600 font-medium">Guest</p>
            <p className="text-navy-800">{receipt.bookings?.guests?.name}</p>
            <p className="text-navy-600 font-medium">Total</p>
            <p className="text-navy-800 font-bold">
              ₦{parseInt(receipt.bookings?.total_amount).toLocaleString()}
            </p>
          </div>
          {receipt.pdf_url && (
            <div className="text-center">
              <a
                href={receipt.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gold-500 hover:bg-gold-600 text-navy-900 px-6 py-2 rounded-lg font-semibold"
              >
                Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
