"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ImageGallery } from "@/components/public/ImageGallery";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import Link from "next/link";
import { Hotel, ArrowLeft } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";

export default function RoomDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: room, isLoading, error } = useQuery({
    queryKey: ["room", id],
    queryFn: () => api.get(`/api/rooms/${id}`).then((res) => res.data.data),
    enabled: !!id,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nights = endDate ? differenceInDays(endDate, today) : 0;
  const pricePerNight = room ? parseFloat(room.categories?.price_per_night || 0) : 0;
  const totalAmount = nights > 0 ? nights * pricePerNight : 0;

  const handleProceed = () => {
    if (nights <= 0) return;
    router.push(`/book/${id}?nights=${nights}&total=${totalAmount}&checkOut=${endDate?.toISOString()}`);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-void pt-24 pb-32">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-[4/3] skeleton-shimmer" />
            <div className="space-y-4">
              <div className="h-8 w-1/3 skeleton-shimmer" />
              <div className="h-4 w-2/3 skeleton-shimmer" />
              <div className="h-64 skeleton-shimmer" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen bg-void pt-24 pb-32">
        <div className="container-custom">
          <ErrorState 
            title="Room not found"
            message="We couldn't find this room. It may have been removed or is temporarily unavailable."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pt-24 pb-32">
      <header className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-sm border-b border-ghost">
        <div className="container-custom h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Hotel className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">
              Diamond Residence
            </span>
          </Link>
          <Link href="/rooms">
            <span className="text-xs text-dim hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              All Rooms
            </span>
          </Link>
        </div>
      </header>

      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-8">
            <Link href="/rooms" className="text-xs text-dim hover:text-gold transition-colors uppercase tracking-widest mb-4 inline-block">
              ← Back to Rooms
            </Link>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-h1 text-white">Room {room.room_number}</h1>
              <Badge status={room.status} />
            </div>
            <p className="text-dim">{room.categories?.name}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <ImageGallery 
              images={room.image_urls || []} 
              alt={`Room ${room.room_number}`} 
            />

            <div className="space-y-8">
              <div className="bg-surface border border-ghost p-6">
                <p className="text-label mb-4">Select Stay Duration</p>
                <p className="text-sm text-dim mb-4">
                  Check-in: <span className="text-white font-medium">{format(today, "PPP")}</span>
                </p>

                <div className="bg-void border border-ghost p-4 inline-block">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={{ before: addDays(today, 1) }}
                    className="border-0"
                  />
                </div>

                {endDate && nights > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 pt-6 border-t border-ghost"
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-sm text-dim mb-1">Duration</p>
                        <p className="text-white font-medium">{nights} Night{nights !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-dim mb-1">Total</p>
                        <p className="text-2xl font-bold text-gold">₦{totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleProceed} 
                      disabled={room.status !== "available"}
                      className="w-full"
                    >
                      {room.status !== "available" ? "Room Not Available" : "Proceed to Details"}
                    </Button>
                  </motion.div>
                )}

                {endDate && nights <= 0 && (
                  <p className="mt-4 text-error text-sm">Please select a future date.</p>
                )}
              </div>

              <div className="bg-surface border border-ghost p-6">
                <p className="text-label mb-4">Details</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dim">Category</span>
                    <span className="text-white">{room.categories?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dim">Floor</span>
                    <span className="text-white">{room.floor || "Ground"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dim">Price per Night</span>
                    <span className="text-gold font-medium">₦{pricePerNight.toLocaleString()}</span>
                  </div>
                  {room.notes && (
                    <div className="pt-3 border-t border-ghost">
                      <p className="text-dim">{room.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
