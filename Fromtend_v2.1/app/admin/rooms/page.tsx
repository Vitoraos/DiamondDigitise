"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/4 skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 skeleton-shimmer" />)}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message="Failed to load rooms." onRetry={() => window.location.reload()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h2 text-white mb-1">Room Management</h1>
          <p className="text-body text-sm">Manage all rooms and categories</p>
        </div>
        <Link href="/admin/rooms/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Room
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room: any) => (
          <div
            key={room.id}
            className="bg-surface border border-ghost p-6 flex flex-col hover:border-gold transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Room {room.room_number}
              </h2>
              <Badge status={room.status} />
            </div>

            <p className="text-dim text-sm mb-2">{room.categories?.name}</p>
            <p className="text-gold font-bold text-lg mb-1">
              ₦{parseInt(room.categories?.price_per_night).toLocaleString()}/night
            </p>
            <p className="text-dim text-xs mb-4">Floor {room.floor}</p>

            <div className="flex gap-2 mb-4">
              {["available", "occupied", "maintenance"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  className={cn(
                    "text-xs",
                    room.status === status
                      ? "bg-gold text-void border-gold hover:bg-gold hover:text-void"
                      : "border-ghost text-dim hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => statusMutation.mutate({ id: room.id, status })}
                  disabled={room.status === status}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex gap-3 mt-auto pt-4 border-t border-ghost">
              <Link href={`/admin/rooms/${room.id}/edit`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full text-xs gap-2">
                  <Pencil className="w-3 h-3" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => setDeleteRoomId(room.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Delete Room</DialogTitle>
          </DialogHeader>
          <p className="text-dim">
            Are you sure you want to delete this room? This action cannot be undone.
          </p>
          <DialogFooter className="gap-3">
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
