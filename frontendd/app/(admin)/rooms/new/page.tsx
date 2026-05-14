"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RoomForm } from "@/components/admin/RoomForm";
import toast from "react-hot-toast";

export default function NewRoomPage() {
  const router = useRouter();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/rooms/categories").then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/rooms", data),
    onSuccess: () => {
      toast.success("Room created");
      router.push("/admin/rooms");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create room"),
  });

  if (!categories) return <p className="text-navy-700">Loading categories...</p>;

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">
        Create New Room
      </h1>
      <div className="max-w-xl">
        <RoomForm
          categories={categories}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          submitLabel="Create Room"
        />
      </div>
    </div>
  );
}