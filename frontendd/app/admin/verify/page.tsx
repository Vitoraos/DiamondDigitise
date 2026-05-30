"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import toast from "react-hot-toast";

export default function VerifyBookingPage() {
  const [searchRef, setSearchRef] = useState("");
  const [queriedRef, setQueriedRef] = useState("");
  const queryClient = useQueryClient();

  // We only fetch when queriedRef is set
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["bookingByRef", queriedRef],
    queryFn: () =>
      api.get(`/api/bookings/ref/${queriedRef}`).then((res) => res.data.data),
    enabled: !!queriedRef,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    setQueriedRef(searchRef.trim().toUpperCase());
  };

  const checkInMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/bookings/${id}/verify`),
    onSuccess: () => {
      toast.success("Guest checked in successfully!");
      queryClient.invalidateQueries({ queryKey: ["bookingByRef", queriedRef] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Check-in failed"),
  });

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900 mb-2">
        Verify Booking
      </h1>
      <p className="text-slate-500 mb-8">
        Enter the booking reference or receipt number to verify payment and check the guest in.
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="e.g. HTL-20240501-A1B2"
            className="pl-12 h-14 rounded-full text-lg border-alabaster-200 bg-surface focus:ring-2 focus:ring-gold-500/20 uppercase"
          />
        </div>
        <Button
          type="submit"
          className="h-14 px-8 rounded-full bg-midnight-900 hover:bg-midnight-800 text-white font-medium shadow-soft"
        >
          Verify
        </Button>
      </form>

      {/* Results */}
      {isLoading && (
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-40 bg-alabaster-100 rounded-3xl" />
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700 text-center">
          <p className="font-semibold text-lg">Booking Not Found</p>
          <p className="text-sm mt-1">Please check the reference and try again.</p>
        </div>
      )}

      {booking && !isLoading && (
        <div className="bg-surface border border-alabaster-200 rounded-3xl shadow-soft overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-midnight-900/5 to-transparent p-6 border-b border-alabaster-200 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Booking Details
              </p>
              <h2 className="text-2xl font-display font-medium text-midnight-900 flex items-center gap-3">
                {booking.booking_ref}
                <StatusBadge status={booking.status} />
              </h2>
            </div>
            
            {/* The Check In Action */}
            {booking.status === "confirmed" && (
              <Button
                onClick={() => checkInMut.mutate(booking.id)}
                disabled={checkInMut.isPending}
                size="lg"
                className="rounded-full bg-gold-500 hover:bg-gold-600 text-midnight-900 font-bold px-8 shadow-md"
              >
                {checkInMut.isPending ? "Checking in..." : "Check In Guest"}
              </Button>
            )}
            {booking.status === "checked_in" && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Guest is Checked In</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Guest Information</p>
                <p className="text-lg font-medium text-midnight-900">{booking.guests?.name || "Unknown"}</p>
                <p className="text-slate-600">{booking.guests?.phone || "No phone"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Room</p>
                <p className="text-lg font-medium text-midnight-900">
                  {booking.rooms?.room_number || "N/A"} 
                  <span className="text-sm text-slate-500 ml-2 font-normal">({booking.categories?.name})</span>
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Payment</p>
                <p className="text-lg font-medium text-midnight-900">
                  ₦{Number(booking.total_amount).toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">{booking.num_nights} Night(s)</p>
              </div>
            </div>

            <div className="space-y-4 bg-alabaster-50 p-5 rounded-2xl border border-alabaster-100">
              <div className="flex items-center gap-2 mb-2 text-midnight-900 font-medium">
                <Clock className="w-5 h-5 text-gold-500" />
                Stay Schedule
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                  <p className="text-slate-500 mb-1">Check In</p>
                  <p className="font-semibold text-midnight-900">
                    {booking.check_in_at ? new Date(booking.check_in_at).toLocaleString("en-NG", {
                      dateStyle: "medium", timeStyle: "short"
                    }) : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Check Out</p>
                  <p className="font-semibold text-midnight-900">
                    {booking.check_out_at ? new Date(booking.check_out_at).toLocaleString("en-NG", {
                      dateStyle: "medium", timeStyle: "short"
                    }) : "Pending"}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-alabaster-200">
                <p className="text-xs text-slate-500 mb-1">Notice</p>
                <p className="text-xs text-slate-600">
                  The checkout countdown timer starts automatically at the moment of payment confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
