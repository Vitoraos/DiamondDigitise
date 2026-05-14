import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardData {
  rooms: Record<string, number>;
  bookingsLast30Days: number;
  revenueConfirmed: number;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () =>
      api.get("/api/admin/dashboard").then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
  });
}