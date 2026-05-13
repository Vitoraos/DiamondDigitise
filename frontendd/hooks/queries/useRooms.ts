import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms", "public"],
    queryFn: async () => {
      const { data } = await api.get("/api/rooms");
      return data.data;
    },
  });
}