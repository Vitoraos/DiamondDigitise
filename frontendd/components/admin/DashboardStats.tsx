import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardData } from "@/hooks/queries/useDashboard";
import { Hotel, BookOpen, DollarSign } from "lucide-react";

export function DashboardStats({ data }: { data: DashboardData }) {
  const roomStatusCards = [
    { label: "Available", value: data.rooms.available || 0, color: "text-green-700" },
    { label: "Occupied", value: data.rooms.occupied || 0, color: "text-red-700" },
    { label: "Cleaning", value: data.rooms.cleaning || 0, color: "text-yellow-700" },
    { label: "Maintenance", value: data.rooms.maintenance || 0, color: "text-gray-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="border-beige-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-navy-700">
            Rooms
          </CardTitle>
          <Hotel className="h-4 w-4 text-gold-500" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {roomStatusCards.map((status) => (
              <div key={status.label} className="flex justify-between">
                <span className="text-xs text-navy-600">{status.label}</span>
                <span className={`text-xs font-bold ${status.color}`}>
                  {status.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-beige-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-navy-700">
            Last 30 Days
          </CardTitle>
          <BookOpen className="h-4 w-4 text-gold-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-navy-800">
            {data.bookingsLast30Days}
          </div>
          <p className="text-xs text-muted-foreground">bookings</p>
        </CardContent>
      </Card>

      <Card className="border-beige-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-navy-700">
            Confirmed Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-gold-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-navy-800">
            ₦{data.revenueConfirmed.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">total revenue</p>
        </CardContent>
      </Card>
    </div>
  );
}