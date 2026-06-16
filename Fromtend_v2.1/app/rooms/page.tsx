"use client";

import { useRooms } from "@/hooks/queries/useRooms";
import { RoomCard } from "@/components/public/RoomCard";
import { Skeleton } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import Link from "next/link";
import { Hotel, ArrowLeft } from "lucide-react";

export default function RoomsPage() {
  const { data: rooms, isLoading, error } = useRooms();

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
          <Link href="/">
            <span className="text-xs text-dim hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Home
            </span>
          </Link>
        </div>
      </header>

      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="text-label mb-4">Accommodations</p>
          <h1 className="text-h1 text-white mb-4">Our Rooms</h1>
          <p className="text-body max-w-xl">
            Select from our carefully curated collection of rooms and suites, 
            each designed to provide an exceptional stay.
          </p>
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/3] skeleton-shimmer" />
                <div className="h-4 w-2/3 skeleton-shimmer" />
                <div className="h-4 w-1/3 skeleton-shimmer" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <ErrorState 
            message="Failed to load rooms. Please check your connection and try again."
            onRetry={() => window.location.reload()}
          />
        )}

        {rooms && rooms.length === 0 && (
          <EmptyState 
            title="No rooms available" 
            description="All rooms are currently booked or under maintenance. Please check back later."
          />
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room: any, i: number) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: Math.min(i * 0.1, 0.4), ease: [0.16, 1, 0.3, 1] }}
              >
                <RoomCard room={room} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
