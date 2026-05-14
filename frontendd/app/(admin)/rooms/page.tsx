"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminRoomsPage() {
  const queryClient = useQueryClient();
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: () => api.get("/api/rooms").then((res) => res.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/rooms/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success("Room deleted");
      setDeleteRoomId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  if (isLoading) return <p className="text-navy-700">Loading rooms...</p>;
  if (error) return <p className="text-red-600">Failed to load rooms.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif font-bold text-navy-800">
          Room Management
        </h1>
        <Link href="/admin/rooms/new">
          <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">
            Add Room
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms?.map((room: any) => (
          <div key={room.id} className="bg-white border border-beige-200 rounded-lg shadow p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-serif font-semibold text-navy-800">
                Room {room.room_number}
              </h2>
              <StatusBadge status={room.status} />
            </div>
            <p className="text-beige-700 text-sm mb-1">{room.categories?.name}</p>
            <p className="text-navy-700 font-medium">
              ₦{parseInt(room.categories?.price_per_night).toLocaleString()}/night
            </p>
            <p className="text-gray-500 text-xs mt-2">Floor {room.floor}</p>

            <div className="flex gap-1 mt-3">
              {["available", "occupied", "maintenance"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  className={`text-xs ${room.status === status ? "bg-gray-100" : ""}`}
                  onClick={() => statusMutation.mutate({ id: room.id, status })}
                  disabled={room.status === status}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 mt-3 mt-auto">
              <Link href={`/admin/rooms/${room.id}/edit`}>
                <Button variant="secondary" size="sm" className="text-xs">
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => setDeleteRoomId(room.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600">
            Are you sure you want to delete this room? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoomId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteRoomId && deleteMutation.mutate(deleteRoomId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}