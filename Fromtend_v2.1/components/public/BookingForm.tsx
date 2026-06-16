"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateBooking } from "@/hooks/queries/useBookings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validators } from "@/lib/validate";
import toast from "react-hot-toast";

interface BookingFormProps {
  roomId: string;
  numNights: number;
  totalAmount: number;
  roomNumber: string;
  categoryName: string;
}

export function BookingForm({ roomId, numNights, totalAmount, roomNumber, categoryName }: BookingFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bookingMutation = useCreateBooking();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const nameErr = validators.guestName(name);
    if (nameErr) newErrors.name = nameErr;
    const phoneErr = validators.guestPhone(phone);
    if (phoneErr) newErrors.phone = phoneErr;
    const emailErr = validators.guestEmail(email);
    if (emailErr) newErrors.email = emailErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await bookingMutation.mutateAsync({
        roomId,
        guestName: name.trim(),
        guestPhone: phone.trim(),
        guestEmail: email.trim() || undefined,
        numNights,
      });
      toast.success("Booking created! Proceed to payment.");
      router.push(`/pay/${result.paymentRef}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Booking failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface border border-ghost p-6 mb-8">
        <p className="text-label mb-4">Booking Summary</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dim">Room</span>
            <span className="text-white font-medium">Room {roomNumber} ({categoryName})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Nights</span>
            <span className="text-white font-medium">{numNights}</span>
          </div>
          <div className="flex justify-between border-t border-ghost pt-2 mt-2">
            <span className="text-dim">Total</span>
            <span className="text-gold font-bold text-lg">₦{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className={errors.name ? "border-error" : ""}
        />
        {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08012345678"
          className={errors.phone ? "border-error" : ""}
        />
        {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={errors.email ? "border-error" : ""}
        />
        {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
      </div>

      <Button
        type="submit"
        disabled={bookingMutation.isPending}
        className="w-full"
      >
        {bookingMutation.isPending ? "Processing..." : "Proceed to Payment"}
      </Button>
    </form>
  );
}
