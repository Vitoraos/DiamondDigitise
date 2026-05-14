import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePayments() {
  return useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => api.get("/api/payments").then((res) => res.data.data),
  });
}
