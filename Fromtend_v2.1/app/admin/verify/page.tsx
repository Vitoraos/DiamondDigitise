"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/spinner";

export default function VerifyBookingPage() {
  const [searchRef, setSearchRef] = useState("");
  const [queriedRef, setQueriedRef] = useState("");
  const queryClient = useQueryClient();

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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-h2 text-white mb-2">Verify Booking</h1>
      <p className="text-body mb-8">
        Enter the booking reference or receipt number to verify payment and check the guest in.
      </p>

      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
          <Input
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="e.g. HTL-20240501-A1B2"
            className="pl-12 h-14 text-lg uppercase"
          />
        </div>
        <Button type="submit" className="h-14 px-8">
          Verify
        </Button>
      </form>

      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="h-40 skeleton-shimmer" />
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-surface border border-ghost p-6 text-center">
          <p className="text-lg font-bold text-white mb-1">Booking Not Found</p>
          <p className="text-sm text-dim">Please check the reference and try again.</p>
        </div>
      )}

      <AnimatePresence>
        {booking && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5 }}
            className="bg-surface border border-ghost overflow-hidden"
          >
            <div className="bg-white/5 p-6 border-b border-ghost flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-label mb-1">Booking Details</p>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  {booking.booking_ref}
                  <Badge status={booking.status} />
                </h2>
              </div>
              
              {booking.status === "confirmed" && (
                <Button
                  onClick={() => checkInMut.mutate(booking.id)}
                  disabled={checkInMut.isPending}
                  size="lg"
                  className="gap-2"
                >
                  {checkInMut.isPending ? "Checking in..." : "Check In Guest"}
                </Button>
              )}
              {booking.status === "checked_in" && (
                <div className="flex items-center gap-2 text-success bg-success/10 px-4 py-2 border border-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium text-sm">Guest is Checked In</span>
                </div>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-label mb-1">Guest Information</p>
                  <p className="text-lg font-medium text-white">{booking.guests?.name || "Unknown"}</p>
                  <p className="text-dim">{booking.guests?.phone || "No phone"}</p>
                </div>

                <div>
                  <p className="text-label mb-1">Room</p>
                  <p className="text-lg font-medium text-white">
                    {booking.rooms?.room_number || "N/A"} 
                    <span className="text-sm text-dim ml-2 font-normal">({booking.categories?.name})</span>
                  </p>
                </div>
                
                <div>
                  <p className="text-label mb-1">Payment</p>
                  <p className="text-lg font-medium text-gold">
                    ₦{Number(booking.total_amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-dim">{booking.num_nights} Night(s)</p>
                </div>
              </div>

              <div className="space-y-4 bg-void p-5 border border-ghost">
                <div className="flex items-center gap-2 mb-2 text-white font-medium">
                  <span className="w-1 h-1 bg-gold" />
                  Stay Schedule
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <p className="text-dim mb-1">Check In</p>
                    <p className="font-semibold text-white">
                      {booking.check_in_at ? new Date(booking.check_in_at).toLocaleString("en-NG", {
                        dateStyle: "medium", timeStyle: "short"
                      }) : "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-dim mb-1">Check Out</p>
                    <p className="font-semibold text-white">
                      {booking.check_out_at ? new Date(booking.check_out_at).toLocaleString("en-NG", {
                        dateStyle: "medium", timeStyle: "short"
                      }) : "Pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
                      }
