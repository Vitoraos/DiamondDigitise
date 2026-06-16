import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Link href={`/rooms/${room.id}`} className="group block">
      <Card className="overflow-hidden border-ghost hover:border-gold transition-colors duration-300">
        <div className="aspect-[4/3] relative bg-depth overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Room ${room.room_number}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-dim text-sm">
              Room Image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">
              Room {room.room_number}
            </h3>
            <Badge status={room.status} />
          </div>
          <p className="text-sm text-dim mb-2">{room.categories.name}</p>
          <p className="text-price text-gold">
            ₦{price.toLocaleString()}<span className="text-dim text-sm font-normal">/night</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}.
