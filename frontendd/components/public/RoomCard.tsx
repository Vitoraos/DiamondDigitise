import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface RoomCardProps {
  room: {
    id: string;
    room_number: string;
    floor: number;
    status: string;
    image_urls?: string[];
    categories: {
      name: string;
      price_per_night: string | number;
    };
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const price =
    typeof room.categories.price_per_night === "string"
      ? parseFloat(room.categories.price_per_night)
      : room.categories.price_per_night;

  const imageUrl = room.image_urls?.[0] || null;

  return (
    <Link href={`/room/${room.id}`}>
      <Card className="bg-white border border-beige-200 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="h-40 bg-beige-100 rounded-t-lg overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Room ${room.room_number}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-beige-400 text-sm">
              Room Image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-serif font-semibold text-navy-800">
              Room {room.room_number}
            </h3>
            <StatusBadge status={room.status} />
          </div>
          <p className="text-beige-700 text-sm mb-1">{room.categories.name}</p>
          <p className="text-navy-700 font-medium">
            ₦{price.toLocaleString()}/night
          </p>
          <p className="text-gray-500 text-xs mt-2">Floor {room.floor}</p>
        </CardContent>
      </Card>
    </Link>
  );
}