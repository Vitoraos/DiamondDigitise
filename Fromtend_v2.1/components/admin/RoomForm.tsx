"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface RoomFormProps {
  initialData?: {
    room_number?: string;
    category_id?: string;
    floor?: number;
    notes?: string;
    image_urls?: string[];
  };
  categories: { id: string; name: string }[];
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
}

export function RoomForm({
  initialData = {},
  categories,
  onSubmit,
  submitLabel = "Save Room",
}: RoomFormProps) {
  const [roomNumber, setRoomNumber] = useState(initialData.room_number || "");
  const [categoryId, setCategoryId] = useState(initialData.category_id || "");
  const [floor, setFloor] = useState(initialData.floor?.toString() || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [imageUrls, setImageUrls] = useState<string[]>(initialData.image_urls || []);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        room_number: roomNumber,
        category_id: categoryId,
        floor: floor ? parseInt(floor) : null,
        notes,
        image_urls: imageUrls,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-ghost p-6">
      <div className="space-y-2">
        <Label htmlFor="room_number">Room Number</Label>
        <Input
          id="room_number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
          disabled={!!initialData.room_number}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="floor">Floor (optional)</Label>
        <Input
          id="floor"
          type="number"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Room Images (up to 5)</Label>
        <ImageUpload existingUrls={imageUrls} onUpload={setImageUrls} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
