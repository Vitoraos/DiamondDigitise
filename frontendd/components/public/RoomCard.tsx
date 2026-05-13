import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface RoomCardProps {
  room: {
    id: string;
    room_number: string;
    floor: number;
    status: string;
    categories: {
      name: string;
      price_per_night: number;
    };
  };
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/room/${room.id}`}>
      <Card className="bg-white border border-beige-200 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="h-40 bg-beige-100 rounded-t-lg flex items-center justify-center text-beige-400 text-sm">
          Room Image
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
            ₦{parseInt(room.categories.price_per_night).toLocaleString()}/night
          </p>
          <p className="text-gray-500 text-xs mt-2">Floor {room.floor}</p>
        </CardContent>
      </Card>
    </Link>
  );
}