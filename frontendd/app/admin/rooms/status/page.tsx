"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { DoorClosed, Wrench, CheckCircle, RefreshCw, ChevronDown } from "lucide-react";

// Valid statuses staff can manually set.
// 'cleaning' is intentionally excluded — backend auto-sets it on checkout.
// 'occupied' is excluded — set automatically on confirmed booking.
const MANUAL_STATUSES = [
  { value: "available",   label: "Available",    color: "bg-green-100 text-green-800  border-green-200",  dot: "bg-green-500"  },
  { value: "maintenance", label: "Maintenance",  color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
];

// Read-only display statuses (not selectable)
const STATUS_DISPLAY: Record<string, { label: string; color: string; dot: string }> = {
  available:   { label: "Available",   color: "bg-green-100  text-green-800  border-green-200",  dot: "bg-green-500"  },
  occupied:    { label: "Occupied",    color: "bg-blue-100   text-blue-800   border-blue-200",   dot: "bg-blue-500"   },
  cleaning:    { label: "Cleaning",    color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  maintenance: { label: "Maintenance", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_DISPLAY[status] ?? { label: status, color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", s.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function StatusDropdown({
  roomId,
  currentStatus,
  isPending,
  onUpdate,
}: {
  roomId: string;
  currentStatus: string;
  isPending: boolean;
  onUpdate: (roomId: string, newStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Occupied and cleaning can only be changed TO available or maintenance
  const options = MANUAL_STATUSES.filter((s) => s.value !== currentStatus);

  if (currentStatus === "occupied" || currentStatus === "cleaning") {
    // Only allow moving to available or maintenance from these auto-states
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
          "bg-white border-alabaster-200 text-midnight-700 hover:border-midnight-300 hover:bg-alabaster-50",
          isPending && "opacity-50 cursor-not-allowed"
        )}
      >
        {isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
        Change
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white border border-alabaster-200 rounded-2xl shadow-lg overflow-hidden min-w-[140px]">
            {options.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setOpen(false);
                  onUpdate(roomId, s.value);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-alabaster-50 transition-colors"
              >
                <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function RoomStatusPage() {
  const { role } = useRole();
  const queryClient = useQueryClient();

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ["admin-rooms-status"],
    queryFn: () => api.get("/api/rooms").then((res) => res.data.data),
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  const updateMut = useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: string }) =>
      api.patch(`/api/rooms/${roomId}/status`, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Room marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-rooms-status"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to update room status"),
  });

  const handleUpdate = (roomId: string, newStatus: string) => {
    updateMut.mutate({ roomId, status: newStatus });
  };

  // Group by floor
  const byFloor: Record<number, any[]> = {};
  if (rooms) {
    for (const room of rooms) {
      const floor = room.floor ?? 0;
      if (!byFloor[floor]) byFloor[floor] = [];
      byFloor[floor].push(room);
    }
  }

  const floors = Object.keys(byFloor)
    .map(Number)
    .sort((a, b) => a - b);

  // Summary counts
  const counts = rooms
    ? rooms.reduce((acc: Record<string, number>, r: any) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900">
            Room Status
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and update room availability across all floors
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-rooms-status"] })}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-midnight-900 transition-colors px-3 py-1.5 rounded-xl hover:bg-alabaster-100"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary pills */}
      {rooms && (
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(STATUS_DISPLAY).map(([key, val]) =>
            counts[key] ? (
              <div
                key={key}
                className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border", val.color)}
              >
                <span className={cn("w-2 h-2 rounded-full", val.dot)} />
                {counts[key]} {val.label}
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-alabaster-100 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
          Failed to load rooms. Please refresh.
        </div>
      )}

      {/* Room list grouped by floor */}
      {rooms && floors.map((floor) => (
        <div key={floor} className="mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
            {floor === 0 ? "Ground Floor" : `Floor ${floor}`}
          </h2>

          <div className="bg-white border border-alabaster-200 rounded-3xl shadow-soft overflow-hidden">
            {byFloor[floor].map((room: any, idx: number) => {
              const isUpdating =
                updateMut.isPending &&
                updateMut.variables?.roomId === room.id;

              return (
                <div
                  key={room.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 transition-colors",
                    idx !== byFloor[floor].length - 1 && "border-b border-alabaster-100",
                    isUpdating && "bg-alabaster-50"
                  )}
                >
                  {/* Room icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    room.status === "available"   && "bg-green-100",
                    room.status === "occupied"    && "bg-blue-100",
                    room.status === "cleaning"    && "bg-yellow-100",
                    room.status === "maintenance" && "bg-orange-100",
                  )}>
                    {room.status === "maintenance"
                      ? <Wrench className="w-4 h-4 text-orange-600" />
                      : room.status === "available"
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <DoorClosed className="w-4 h-4 text-blue-600" />
                    }
                  </div>

                  {/* Room info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-midnight-900 text-sm">
                        Room {room.room_number}
                      </span>
                      <span className="text-xs text-slate-400">
                        {room.categories?.name}
                      </span>
                    </div>
                    {room.status === "cleaning" && room.cleaning_started_at && (
                      <p className="text-xs text-yellow-600 mt-0.5">
                        Cleaning since {new Date(room.cleaning_started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={room.status} />

                  {/* Change dropdown — all roles can update status */}
                  <StatusDropdown
                    roomId={room.id}
                    currentStatus={room.status}
                    isPending={isUpdating}
                    onUpdate={handleUpdate}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
