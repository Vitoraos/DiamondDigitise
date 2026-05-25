import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function useStaff() {
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery<StaffMember[]>({
    queryKey: ["admin-staff"],
    queryFn: () => api.get("/api/admin/users").then((res) => res.data.data),
  });

  const createMut = useMutation({
    mutationFn: (payload: { fullName: string; email: string; role: string }) =>
      api.post("/api/admin/users", payload),
    onSuccess: () => {
      toast.success("Staff invited successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to invite staff"),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/users/${id}/deactivate`),
    onSuccess: () => {
      toast.success("Staff deactivated");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to deactivate"),
  });

  return { staff, isLoading, createMut, deactivateMut };
}
