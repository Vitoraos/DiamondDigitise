import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardData } from "@/hooks/queries/useDashboard";
import { Hotel, BookOpen, DollarSign } from "lucide-react";

export function DashboardStats({ data }: { data: DashboardData }) {
  const roomStatusCards = [
    { label: "Available", value: data.rooms.available || 0, color: "text-green-700", bg: "bg-green-50" },
    { label: "Occupied", value: data.rooms.occupied || 0, color: "text-red-700", bg: "bg-red-50" },
    { label: "Cleaning", value: data.rooms.cleaning || 0, color: "text-yellow-700", bg: "bg-yellow-50" },
    { label: "Maintenance", value: data.rooms.maintenance || 0, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Rooms Status Card */}
      <Card className="border-alabaster-200 rounded-3xl shadow-soft overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-midnight-900/5 to-transparent">
          <CardTitle className="text-sm font-medium text-slate-600">Rooms</CardTitle>
          <Hotel className="h-4 w-4 text-gold-500" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {roomStatusCards.map((status) => (
              <div key={status.label} className={`flex justify-between items-center p-3 rounded-2xl ${status.bg}`}>
                <span className="text-xs text-slate-600">{status.label}</span>
                <span className={`text-lg font-bold ${status.color}`}>{status.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Card */}
      <Card className="border-alabaster-200 rounded-3xl shadow-soft overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-midnight-900/5 to-transparent">
          <CardTitle className="text-sm font-medium text-slate-600">Last 30 Days</CardTitle>
          <BookOpen className="h-4 w-4 text-gold-500" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-3xl font-display font-medium tracking-tight text-midnight-900">
            {data.bookingsLast30Days}
          </div>
          <p className="text-xs text-slate-400 mt-1">bookings</p>
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card className="border-alabaster-200 rounded-3xl shadow-soft overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-midnight-900/5 to-transparent">
          <CardTitle className="text-sm font-medium text-slate-600">Confirmed Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-gold-500" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-3xl font-display font-medium tracking-tight text-midnight-900">
            ₦{data.revenueConfirmed.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">total revenue</p>
        </CardContent>
      </Card>
    </div>
  );
}
