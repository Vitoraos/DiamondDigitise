"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { useRole } from "@/hooks/useRole";
import { Filter } from "lucide-react";

export default function AdminBookingsPage() {
  const { role } = useRole();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", statusFilter],
    queryFn: () =>
      api
        .get("/api/bookings", { params: statusFilter ? { status: statusFilter } : {} })
        .then((res) => res.data.data),
  });

  const verifyMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/bookings/${id}/verify`),
    onSuccess: () => {
      toast.success("Checked in");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const checkoutMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/bookings/${id}/checkout`),
    onSuccess: () => {
      toast.success("Checked out");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/cancel`),
    onSuccess: () => {
      toast.success("Cancelled");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  if (isLoading) return <p className="text-slate-500">Loading bookings...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900">
          Bookings
        </h1>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48 rounded-full border-alabaster-200 bg-surface">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-alabaster-200">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="incomplete_payment">Incomplete Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Luxury Table */}
      <div className="overflow-hidden bg-surface rounded-3xl border border-alabaster-200 shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-midnight-900/5 to-transparent">
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Ref</th>
              <th className="p-4 font-medium">Guest</th>
              <th className="p-4 font-medium">Room</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-alabaster-200">
            {bookings?.map((b: any) => (
              <tr key={b.id} className="hover:bg-alabaster-50 transition-colors">
                <td className="p-4 font-mono text-xs text-slate-500">{b.booking_ref}</td>
                <td className="p-4 text-midnight-900 font-medium">{b.guests?.name}</td>
                <td className="p-4 text-slate-600">{b.rooms?.room_number}</td>
                <td className="p-4"><StatusBadge status={b.status} /></td>
                <td className="p-4 text-midnight-900 font-medium">
                  ₦{parseInt(b.total_amount).toLocaleString()}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {b.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => verifyMut.mutate(b.id)}
                        disabled={verifyMut.isPending}
                        className="rounded-full text-xs bg-midnight-900 hover:bg-midnight-800 text-white"
                      >
                        Check In
                      </Button>
                    )}
                    {b.status === "checked_in" && (
                      <Button
                        size="sm"
                        onClick={() => checkoutMut.mutate(b.id)}
                        disabled={checkoutMut.isPending}
                        className="rounded-full text-xs bg-gold-500 hover:bg-gold-600 text-midnight-900"
                      >
                        Check Out
                      </Button>
                    )}
                    {(b.status === "pending_payment" || b.status === "confirmed") &&
                      (role === "owner" || role === "manager") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelMut.mutate(b.id)}
                          disabled={cancelMut.isPending}
                          className="rounded-full text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
