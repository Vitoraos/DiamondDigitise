"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BookingForm } from "@/components/public/BookingForm";
import { Skeleton } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import Link from "next/link";
import { Hotel, ArrowLeft } from "lucide-react";

export default function BookPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const nights = parseInt(searchParams.get("nights") || "0");
  const total = parseInt(searchParams.get("total") || "0");

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => api.get(`/api/rooms/${roomId}`).then((res) => res.data.data),
    enabled: !!roomId,
  });

  if (isLoading || !room) {
    return (
      <main className="min-h-screen bg-void pt-24 pb-32">
        <div className="container-custom max-w-xl">
          <div className="space-y-4">
            <div className="h-8 w-1/3 skeleton-shimmer" />
            <div className="h-64 skeleton-shimmer" />
            <div className="h-12 skeleton-shimmer" />
            <div className="h-12 skeleton-shimmer" />
          </div>
        </div>
      </main>
    );
  }

  if (nights <= 0 || total <= 0) {
    return (
      <main className="min-h-screen bg-void pt-24 pb-32">
        <div className="container-custom max-w-xl">
          <ErrorState 
            title="Invalid Booking"
            message="Please select your stay dates first."
            action={
              <Link href={`/rooms/${roomId}`}>
                <span className="text-gold text-sm hover:underline">← Back to Room</span>
              </Link>
            }
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
        </div>
      </header>

      <div className="container-custom max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href={`/rooms/${roomId}`} className="text-xs text-dim hover:text-gold transition-colors uppercase tracking-widest mb-8 inline-block">
            ← Back to Room
          </Link>
          
          <h1 className="text-h1 text-white mb-2">Guest Details</h1>
          <p className="text-body mb-8">Complete your reservation details below.</p>

          <BookingForm
            roomId={roomId}
            numNights={nights}
            totalAmount={total}
            roomNumber={room.room_number}
            categoryName={room.categories?.name}
          />
        </motion.div>
      </div>
    </main>
  );
                                           }
