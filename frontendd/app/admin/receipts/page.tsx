"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";

export default function AdminReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: receipts, isLoading, error } = useQuery({
    queryKey: ["admin-receipts-list"],
    queryFn: () => api.get(`/api/receipts`).then((res) => res.data.data),
  });

  const filteredReceipts = useMemo(() => {
    if (!receipts) return [];
    if (!searchTerm) return receipts;
    const term = searchTerm.toLowerCase();
    return receipts.filter((r: any) => 
      r.bookings?.booking_ref?.toLowerCase().includes(term) ||
      r.bookings?.guests?.name?.toLowerCase().includes(term) ||
      r.receipt_number?.toLowerCase().includes(term)
    );
  }, [receipts, searchTerm]);

  const formatNaira = (val: any) => `₦${Number(val || 0).toLocaleString("en-NG")}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "2-digit" });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900">Receipts</h1>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search Booking Ref, Guest, or Receipt #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full border-alabaster-200 bg-surface focus:ring-2 focus:ring-gold-500/20"
          />
        </div>
      </div>

      <div className="overflow-hidden bg-surface rounded-3xl border border-alabaster-200 shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-midnight-900/5 to-transparent">
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Receipt #</th>
              <th className="p-4 font-medium">Booking Ref</th>
              <th className="p-4 font-medium">Guest</th>
              <th className="p-4 font-medium">Room</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium text-right">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-alabaster-200">
            {isLoading && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading receipts...</td></tr>}
            {error && <tr><td colSpan={7} className="p-8 text-center text-red-500">Failed to load receipts.</td></tr>}
            {filteredReceipts?.length === 0 && !isLoading && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No receipts found.</td></tr>
            )}
            {filteredReceipts?.map((r: any) => (
              <tr key={r.id} className="hover:bg-alabaster-50 transition-colors">
                <td className="p-4 font-mono text-xs text-slate-500">{r.receipt_number}</td>
                <td className="p-4 font-mono text-xs text-midnight-900 font-semibold">{r.bookings?.booking_ref}</td>
                <td className="p-4 text-midnight-900 font-medium">{r.bookings?.guests?.name}</td>
                <td className="p-4 text-slate-600">{r.bookings?.rooms?.room_number}</td>
                <td className="p-4 text-midnight-900 font-medium">{formatNaira(r.bookings?.total_amount)}</td>
                <td className="p-4 text-xs text-slate-500">{formatDate(r.issued_at || r.bookings?.check_in_at)}</td>
                <td className="p-4 text-right">
                  {r.pdf_url ? (
                    <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold-700 hover:text-gold-900 font-medium transition-colors">
                      <FileText className="w-4 h-4" /> View
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">No PDF</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
