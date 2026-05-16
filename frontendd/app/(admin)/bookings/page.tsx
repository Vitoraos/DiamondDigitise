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

  if (isLoading) return <p className="text-navy-700">Loading bookings...</p>;

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Bookings</h1>
      <div className="mb-4 max-w-xs">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
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
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="w-full text-sm">
          <thead className="bg-beige-100 text-left">
            <tr>
              <th className="p-3">Ref</th>
              <th className="p-3">Guest</th>
              <th className="p-3">Room</th>
              <th className="p-3">Status</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.map((b: any) => (
              <tr key={b.id} className="border-t hover:bg-beige-50">
                <td className="p-3 font-mono text-xs">{b.booking_ref}</td>
                <td className="p-3">{b.guests?.name}</td>
                <td className="p-3">{b.rooms?.room_number}</td>
                <td className="p-3"><StatusBadge status={b.status} /></td>
                <td className="p-3">₦{parseInt(b.total_amount).toLocaleString()}</td>
                <td className="p-3 space-x-2">
                  {b.status === "confirmed" && (
                    <Button size="sm" onClick={() => verifyMut.mutate(b.id)} disabled={verifyMut.isPending}>
                      Check In
                    </Button>
                  )}
                  {b.status === "checked_in" && (
                    <Button size="sm" onClick={() => checkoutMut.mutate(b.id)} disabled={checkoutMut.isPending}>
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
                      >
                        Cancel
                      </Button>
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
