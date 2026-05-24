"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
      <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900 mb-8">
        Receipts
      </h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Enter Booking ID (UUID)"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            required
            className="pl-10 rounded-full border-alabaster-200 bg-surface focus:ring-2 focus:ring-gold-500/20"
          />
        </div>
        <Button type="submit" className="rounded-full bg-midnight-900 hover:bg-midnight-800 text-white px-6">
          Lookup
        </Button>
      </form>

      {searched && isLoading && <p className="text-slate-500">Searching...</p>}
      {searched && error && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700">
          Receipt not found.
        </div>
      )}

      {searched && receipt && (
        <div className="bg-surface rounded-3xl border border-alabaster-200 shadow-soft p-8 space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="text-slate-500 font-medium">Receipt Number</p>
            <p className="text-midnight-900 font-medium">{receipt.receipt_number}</p>

            <p className="text-slate-500 font-medium">Booking Ref</p>
            <p className="text-midnight-900 font-medium">{receipt.bookings?.booking_ref}</p>

            <p className="text-slate-500 font-medium">Guest</p>
            <p className="text-midnight-900 font-medium">{receipt.bookings?.guests?.name}</p>

            <p className="text-slate-500 font-medium">Total</p>
            <p className="text-midnight-900 font-bold text-lg">
              ₦{parseInt(receipt.bookings?.total_amount).toLocaleString()}
            </p>
          </div>

          {receipt.pdf_url && (
            <div className="text-center pt-4 border-t border-alabaster-200">
              <a
                href={receipt.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-midnight-900 px-6 py-3 rounded-full font-medium transition-all shadow-soft hover:shadow-hover"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
