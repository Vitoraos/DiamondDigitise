"use client";

import { useRole } from "@/hooks/useRole";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { DashboardStats } from "@/components/admin/DashboardStats";

export default function DashboardPage() {
  const { role, user } = useRole();
  const { data, isLoading, error } = useDashboard();

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">
        Dashboard
      </h1>
      <div className="bg-white rounded-lg shadow border border-beige-200 p-4 mb-6">
        <p className="text-navy-700">
          Welcome, <strong>{user?.email}</strong>. You are logged in as{" "}
          <strong>{role}</strong>.
        </p>
      </div>

      {isLoading && (
        <p className="text-navy-600 animate-pulse">Loading statistics…</p>
      )}
      {error && (
        <p className="text-red-600">Failed to load dashboard data.</p>
      )}
      {data && <DashboardStats data={data} />}
    </div>
  );
}
