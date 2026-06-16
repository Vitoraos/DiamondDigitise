import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardData } from "@/hooks/queries/useDashboard";
import { Hotel, BookOpen, DollarSign } from "lucide-react";

export function DashboardStats({ data }: { data: DashboardData }) {
  const roomStatusCards = [
    { label: "Available", value: data.rooms.available || 0, color: "text-gold", bg: "bg-gold/10" },
    { label: "Occupied", value: data.rooms.occupied || 0, color: "text-white", bg: "bg-white/5" },
    { label: "Cleaning", value: data.rooms.cleaning || 0, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Maintenance", value: data.rooms.maintenance || 0, color: "text-dim", bg: "bg-white/5" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="border-ghost">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-dim">Rooms</CardTitle>
          <Hotel className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {roomStatusCards.map((status) => (
              <div key={status.label} className={`flex justify-between items-center p-3 ${status.bg}`}>
                <span className="text-xs text-dim">{status.label}</span>
                <span className={`text-lg font-bold ${status.color}`}>{status.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-ghost">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-dim">Last 30 Days</CardTitle>
          <BookOpen className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{data.bookingsLast30Days}</div>
          <p className="text-xs text-dim mt-1">bookings</p>
        </CardContent>
      </Card>

      <Card className="border-ghost">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-dim">Confirmed Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gold">₦{data.revenueConfirmed.toLocaleString()}</div>
          <p className="text-xs text-dim mt-1">total revenue</p>
        </CardContent>
      </Card>
    </div>
  );
}
