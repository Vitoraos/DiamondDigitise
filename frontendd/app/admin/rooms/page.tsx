"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils"; // ✅ ADD THIS IMPORT
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
import { Plus, Pencil, Trash2 } from "lucide-react";

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

  if (isLoading) return <p className="text-slate-500">Loading rooms...</p>;
  if (error) return <p className="text-red-600">Failed to load rooms.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900">
          Room Management
        </h1>
        <Link href="/admin/rooms/new">
          <Button className="bg-midnight-900 hover:bg-midnight-800 text-white rounded-full px-6 py-2.5 shadow-soft hover:shadow-hover transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room: any) => (
          <div
            key={room.id}
            className="bg-surface border border-alabaster-200 rounded-3xl shadow-soft p-6 flex flex-col hover:shadow-hover transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-medium tracking-tight text-midnight-900">
                Room {room.room_number}
              </h2>
              <StatusBadge status={room.status} />
            </div>

            <p className="text-slate-500 text-sm mb-2">{room.categories?.name}</p>
            <p className="text-midnight-900 font-medium text-lg">
              ₦{parseInt(room.categories?.price_per_night).toLocaleString()}/night
            </p>
            <p className="text-slate-400 text-xs mt-3">Floor {room.floor}</p>

            {/* Status Quick Actions */}
            <div className="flex gap-2 mt-4">
              {["available", "occupied", "maintenance"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  className={cn(
                    "text-xs rounded-full border-alabaster-200",
                    room.status === status
                      ? "bg-midnight-900 text-white border-midnight-900"
                      : "hover:bg-midnight-50"
                  )}
                  onClick={() => statusMutation.mutate({ id: room.id, status })}
                  disabled={room.status === status}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Edit/Delete Actions */}
            <div className="flex gap-3 mt-auto pt-4 border-t border-alabaster-200">
              <Link href={`/admin/rooms/${room.id}/edit`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full rounded-full text-xs">
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setDeleteRoomId(room.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <DialogContent className="rounded-3xl border-alabaster-200">
          <DialogHeader>
            <DialogTitle className="font-display text-midnight-900">Delete Room</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete this room? This action cannot be undone.
          </p>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteRoomId(null)} className="rounded-full">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteRoomId && deleteMutation.mutate(deleteRoomId)}
              disabled={deleteMutation.isPending}
              className="rounded-full"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
