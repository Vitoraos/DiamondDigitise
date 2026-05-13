"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCreateBooking } from "@/hooks/queries/useBookings";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import toast from "react-hot-toast";

export default function RoomDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: () => api.get(`/api/rooms/${id}`).then((res) => res.data.data),
    enabled: !!id,
  });

  const bookingMutation = useCreateBooking();

  if (isLoading || !room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-navy-700 animate-pulse">Loading room details...</p>
      </div>
    );
  }

  const nights =
    endDate
      ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const totalAmount = nights * parseFloat(room.categories?.price_per_night || 0);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endDate || nights <= 0) {
      toast.error("Please select a checkout date.");
      return;
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      toast.error("Name and phone are required.");
      return;
    }

    try {
      const result = await bookingMutation.mutateAsync({
        roomId: id,
        guestName,
        guestPhone,
        guestEmail: guestEmail || undefined,
        numNights: nights,
      });
      toast.success("Booking created! Redirecting to payment...");
      router.push(`/booking/${result.paymentRef}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Booking failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left: room info */}
      <div>
        <div className="h-64 bg-beige-100 rounded-lg flex items-center justify-center text-beige-400 mb-4">
          Room Image
        </div>
        <StatusBadge status={room.status} />
        <h1 className="text-3xl font-serif font-bold text-navy-800 mt-2">
          Room {room.room_number}
        </h1>
        <p className="text-beige-700 mt-1">{room.categories?.name}</p>
        <p className="text-navy-700 text-lg font-medium mt-2">
          ₦{parseInt(room.categories?.price_per_night).toLocaleString()} / night
        </p>
        {room.notes && (
          <p className="text-gray-600 mt-4 text-sm">{room.notes}</p>
        )}
      </div>

      {/* Right: booking form */}
      <form onSubmit={handleBook} className="bg-white p-6 rounded-lg shadow-lg border border-beige-200">
        <h2 className="font-serif text-xl text-navy-800 mb-4">Book This Room</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Check‑in: <strong>{new Date().toLocaleDateString()}</strong>
          </p>
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
            disabled={{ before: new Date() }}
            className="rounded-md border"
          />
          {endDate && (
            <p className="text-sm mt-2 text-navy-700">
              Nights: {nights} – Total: ₦{totalAmount.toLocaleString()}
            </p>
          )}
        </div>

        <Input
          placeholder="Full Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
          className="mb-3"
        />
        <Input
          placeholder="Phone Number"
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          required
          className="mb-3"
        />
        <Input
          placeholder="Email (optional)"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="mb-4"
        />

        <Button
          type="submit"
          disabled={bookingMutation.isPending || room.status !== "available"}
          className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold"
        >
          {room.status !== "available"
            ? "Room not available"
            : bookingMutation.isPending
            ? "Booking..."
            : "Proceed to Payment"}
        </Button>
      </form>
    </div>
  );
}
