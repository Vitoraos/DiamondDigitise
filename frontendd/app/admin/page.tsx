"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { useRooms } from "@/hooks/queries/useRooms";
import { usePayments } from "@/hooks/queries/usePayments";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  DoorClosed,
  BookOpen,
  CreditCard,
  Receipt,
  Users,
  Bell,
  Hotel,
  LogOut,
  Plus,
} from "lucide-react";

type Section =
  | "dashboard"
  | "rooms"
  | "bookings"
  | "payments"
  | "receipts"
  | "staff"
  | "notifications";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const { signOut } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>("dashboard");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?expired=true");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-50">
        <p className="text-navy-700 animate-pulse">Checking permissions…</p>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, section: "dashboard" as Section, roles: ["owner", "manager", "front_desk"] },
    { label: "Rooms", icon: DoorClosed, section: "rooms" as Section, roles: ["owner", "manager"] },
    { label: "Bookings", icon: BookOpen, section: "bookings" as Section, roles: ["owner", "manager", "front_desk"] },
    { label: "Payments", icon: CreditCard, section: "payments" as Section, roles: ["owner", "manager"] },
    { label: "Receipts", icon: Receipt, section: "receipts" as Section, roles: ["owner", "manager", "front_desk"] },
    { label: "Staff", icon: Users, section: "staff" as Section, roles: ["owner"] },
    { label: "Notifications", icon: Bell, section: "notifications" as Section, roles: ["owner"] },
  ];

  const visibleItems = menuItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-beige-50">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-800 text-beige-100 flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-navy-700">
          <Hotel className="h-6 w-6 text-gold-400" />
          <span className="font-serif text-lg font-semibold">Vitora Admin</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            return (
              <button
                key={item.section}
                onClick={() => setActiveSection(item.section)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full text-left transition-colors ${
                  isActive
                    ? "bg-navy-700 text-gold-300 border-r-2 border-gold-500"
                    : "hover:bg-navy-700 hover:text-beige-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-navy-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-beige-300 hover:text-beige-100 hover:bg-navy-700"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {activeSection === "dashboard" && <DashboardSection />}
        {activeSection === "rooms" && <RoomsSection />}
        {activeSection === "bookings" && <BookingsSection />}
        {activeSection === "payments" && <PaymentsSection />}
        {activeSection === "receipts" && <ReceiptsSection />}
        {activeSection === "staff" && <StaffSection />}
        {activeSection === "notifications" && <NotificationsSection />}
      </main>
    </div>
  );
}

// ── Dashboard Section ─────────────────────────
function DashboardSection() {
  const { user } = useAuth();
  const { role } = useRole();
  const { data, isLoading, error } = useDashboard();

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow border border-beige-200 p-4 mb-6">
        <p className="text-navy-700">
          Welcome, <strong>{user?.email}</strong>. You are logged in as{" "}
          <strong>{role}</strong>.
        </p>
      </div>
      {isLoading && <p className="text-navy-600">Loading statistics…</p>}
      {error && <p className="text-red-600">Failed to load dashboard data.</p>}
      {data && <DashboardStats data={data} />}
    </div>
  );
}

// ── Rooms Section ─────────────────────────────
function RoomsSection() {
  const { data: rooms, isLoading, error } = useRooms();
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/rooms/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", "public"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", "public"] });
      toast.success("Room deleted");
      setDeleteRoomId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post("/api/rooms", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", "public"] });
      toast.success("Room created");
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => api.patch(`/api/rooms/${editingRoom?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", "public"] });
      toast.success("Room updated");
      setEditingRoom(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/rooms/categories").then((res) => res.data.data),
  });

  if (isLoading) return <p>Loading rooms...</p>;
  if (error) return <p className="text-red-600">Failed to load rooms.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif font-bold text-navy-800">Room Management</h1>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingRoom(null);
          }}
          className="bg-gold-500 hover:bg-gold-600 text-navy-900"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Room
        </Button>
      </div>

      {/* Create / Edit form dialog */}
      <Dialog open={showForm || !!editingRoom} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingRoom(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? `Edit Room ${editingRoom.room_number}` : "Create New Room"}
            </DialogTitle>
          </DialogHeader>
          <RoomFormComponent
            initialData={
              editingRoom
                ? {
                    room_number: editingRoom.room_number,
                    category_id: editingRoom.categories?.id || editingRoom.category_id,
                    floor: editingRoom.floor,
                    notes: editingRoom.notes,
                    image_urls: editingRoom.image_urls || [],
                  }
                : {}
            }
            categories={categories || []}
            onSubmit={async (data: any) => {
              if (editingRoom) {
                await updateMut.mutateAsync(data);
              } else {
                await createMut.mutateAsync(data);
              }
            }}
            submitLabel={editingRoom ? "Save Changes" : "Create Room"}
          />
        </DialogContent>
      </Dialog>

      {/* Room grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms?.map((room: any) => (
          <Card key={room.id} className="bg-white border border-beige-200 shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-serif font-semibold text-navy-800">
                  Room {room.room_number}
                </h2>
                <StatusBadge status={room.status} />
              </div>
              <p className="text-beige-700 text-sm">{room.categories?.name}</p>
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
                    onClick={() => statusMut.mutate({ id: room.id, status })}
                    disabled={room.status === status}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => setEditingRoom(room)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteRoomId(room.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600">Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoomId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteRoomId && deleteMut.mutate(deleteRoomId)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Small RoomForm component used inside the dialog ─
function RoomFormComponent({
  initialData = {},
  categories,
  onSubmit,
  submitLabel,
}: any) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="room_number">Room Number</Label>
        <Input
          id="room_number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
          disabled={!!initialData.room_number}
        />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Floor (optional)</Label>
        <Input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div>
        <Label>Room Images (up to 5)</Label>
        <ImageUpload existingUrls={imageUrls} onUpload={setImageUrls} />
      </div>
      <Button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

// ── Bookings Section ──────────────────────────
function BookingsSection() {
  const { role } = useRole();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", statusFilter],
    queryFn: () =>
      api.get("/api/bookings", { params: statusFilter ? { status: statusFilter } : {} }).then((res) => res.data.data),
  });

  const verifyMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/bookings/${id}/verify`),
    onSuccess: () => toast.success("Checked in"),
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const checkoutMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/bookings/${id}/checkout`),
    onSuccess: () => toast.success("Checked out"),
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/cancel`),
    onSuccess: () => toast.success("Cancelled"),
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  });

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Bookings</h1>
      <div className="mb-4 max-w-xs">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="incomplete_payment">Incomplete Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="w-full text-sm">
            <thead className="bg-beige-100 text-left">
              <tr>
                <th className="p-3">Ref</th>
                <th className="p-3">Guest</th>
                <th className="p-3">Room</th>
                <th className="p-3">Status</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings?.map((b: any) => (
                <tr key={b.id} className="border-t hover:bg-beige-50">
                  <td className="p-3 font-mono text-xs">{b.booking_ref}</td>
                  <td className="p-3">{b.guests?.name}</td>
                  <td className="p-3">{b.rooms?.room_number}</td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                  <td className="p-3">₦{parseInt(b.total_amount).toLocaleString()}</td>
                  <td className="p-3">
                    {b.status === "confirmed" && (
                      <Button size="sm" onClick={() => verifyMut.mutate(b.id)} disabled={verifyMut.isPending}>Check In</Button>
                    )}
                    {b.status === "checked_in" && (
                      <Button size="sm" onClick={() => checkoutMut.mutate(b.id)} disabled={checkoutMut.isPending}>Check Out</Button>
                    )}
                    {(b.status === "pending_payment" || b.status === "confirmed") &&
                      (role === "owner" || role === "manager") && (
                        <Button size="sm" variant="destructive" onClick={() => cancelMut.mutate(b.id)} disabled={cancelMut.isPending}>
                          Cancel
                        </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Payments Section ──────────────────────────
function PaymentsSection() {
  const { data: payments, isLoading, error } = usePayments();

  if (isLoading) return <p className="text-navy-700">Loading payments...</p>;
  if (error) return <p className="text-red-600">Failed to load payments.</p>;

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Payments</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="w-full text-sm">
          <thead className="bg-beige-100 text-left">
            <tr>
              <th className="p-3">Booking Ref</th>
              <th className="p-3">Guest</th>
              <th className="p-3">Expected</th>
              <th className="p-3">Received</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments?.map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-beige-50">
                <td className="p-3 font-mono text-xs">{p.bookings?.booking_ref}</td>
                <td className="p-3">{p.bookings?.guests?.name}</td>
                <td className="p-3">₦{parseInt(p.amount_expected).toLocaleString()}</td>
                <td className="p-3">₦{parseInt(p.amount_received || 0).toLocaleString()}</td>
                <td className="p-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Receipts Section ──────────────────────────
function ReceiptsSection() {
  const [bookingId, setBookingId] = useState("");
  const [searched, setSearched] = useState(false);
  const { data: receipt, isLoading, error } = useQuery({
    queryKey: ["admin-receipt", bookingId],
    queryFn: () => api.get(`/api/receipts/${bookingId}`).then((res) => res.data.data),
    enabled: !!bookingId && searched,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Receipts</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
        <Input
          placeholder="Enter Booking ID (UUID)"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          required
        />
        <Button type="submit" className="bg-gold-500 hover:bg-gold-600 text-navy-900">
          Lookup
        </Button>
      </form>

      {searched && isLoading && <p className="text-navy-700">Searching...</p>}
      {searched && error && <p className="text-red-600">Receipt not found for this ID.</p>}
      {searched && receipt && (
        <div className="bg-white rounded-lg shadow border p-6 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="text-navy-600 font-medium">Receipt Number</p>
            <p className="text-navy-800">{receipt.receipt_number}</p>
            <p className="text-navy-600 font-medium">Booking Ref</p>
            <p className="text-navy-800">{receipt.bookings?.booking_ref}</p>
            <p className="text-navy-600 font-medium">Guest</p>
            <p className="text-navy-800">{receipt.bookings?.guests?.name}</p>
            <p className="text-navy-600 font-medium">Total</p>
            <p className="text-navy-800 font-bold">₦{parseInt(receipt.bookings?.total_amount).toLocaleString()}</p>
          </div>
          {receipt.pdf_url && (
            <div className="text-center">
              <a
                href={receipt.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gold-500 hover:bg-gold-600 text-navy-900 px-6 py-2 rounded-lg font-semibold"
              >
                Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Placeholder sections ──────────────────────
function StaffSection() {
  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Staff Management</h1>
      <p className="text-navy-600">Staff list coming soon.</p>
    </div>
  );
}
function NotificationsSection() {
  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">Notifications</h1>
      <p className="text-navy-600">Notification test coming soon.</p>
    </div>
  );
}
