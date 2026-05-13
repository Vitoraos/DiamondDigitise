import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CreateBookingPayload {
  roomId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  numNights: number;
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) =>
      api.post("/api/bookings", payload).then((res) => res.data.data),
  });
}
