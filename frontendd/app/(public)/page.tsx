"use client";

import { useRooms } from "@/hooks/queries/useRooms";
import { RoomCard } from "@/components/public/RoomCard";

export default function PublicHomePage() {
  const { data: rooms, isLoading, error } = useRooms();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-8">
        Our Luxury Rooms
      </h1>
      {isLoading && (
        <p className="text-navy-700 animate-pulse">Loading rooms...</p>
      )}
      {error && (
        <p className="text-red-600">Failed to load rooms. Please try again later.</p>
      )}
      {rooms && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room: any) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}