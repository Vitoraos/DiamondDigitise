"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RoomForm } from "@/components/admin/RoomForm";
import toast from "react-hot-toast";

export default function EditRoomPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/rooms/categories").then((res) => res.data.data),
  });

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: () => api.get(`/api/rooms/${id}`).then((res) => res.data.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/api/rooms/${id}`, data),
    onSuccess: () => {
      toast.success("Room updated");
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      router.push("/admin/rooms");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update room"),
  });

  if (isLoading || !room) return <p className="text-navy-700">Loading room...</p>;
  if (!categories) return <p className="text-navy-700">Loading categories...</p>;

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">
        Edit Room {room.room_number}
      </h1>
      <div className="max-w-xl">
        <RoomForm
          initialData={{
            room_number: room.room_number,
            category_id: room.category_id || room.categories?.id,
            floor: room.floor,
            notes: room.notes,
            image_urls: room.image_urls,
          }}
          categories={categories}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data);
          }}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
