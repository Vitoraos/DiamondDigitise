"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminBookingsPage() {
  const { role } = useRole();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ["bookings", statusFilter],
    queryFn: () =>
      api
        .get("/api/bookings", { params: statusFilter ? { status: statusFilter } : {} })
        .then((res) => res.data.data),
  });

  const verifyMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/bookings/${id}/verify`),
    onSuccess: () => {
      toast.success("Guest checked in");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const checkoutMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/bookings/${id}/checkout`),
    onSuccess: () => {
      toast.success("Guest checked out");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/cancel`),
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/4 skeleton-shimmer" />
        <div className="h-96 skeleton-shimmer" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load bookings." onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-h2 text-white mb-1">Bookings</h1>
          <p className="text-body text-sm">Manage all reservations</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dim" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48 bg-surface border-ghost text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-ghost">
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

      <div className="bg-surface border border-ghost overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-dim text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Ref</th>
                <th className="p-4 font-medium">Guest</th>
                <th className="p-4 font-medium">Room</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ghost">
              {bookings?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState title="No bookings found" />
                  </td>
                </tr>
              )}
              {bookings?.map((b: any) => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-xs text-dim">{b.booking_ref}</td>
                  <td className="p-4 text-white font-medium">{b.guests?.name}</td>
                  <td className="p-4 text-dim">{b.rooms?.room_number}</td>
                  <td className="p-4"><Badge status={b.status} /></td>
                  <td className="p-4 text-white font-medium">
                    ₦{parseInt(b.total_amount).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {b.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => verifyMut.mutate(b.id)}
                          disabled={verifyMut.isPending}
                          className="text-xs"
                        >
                          Check In
                        </Button>
                      )}
                      {b.status === "checked_in" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => checkoutMut.mutate(b.id)}
                          disabled={checkoutMut.isPending}
                          className="text-xs"
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
                            className="text-xs"
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
    </div>
  );
      }
