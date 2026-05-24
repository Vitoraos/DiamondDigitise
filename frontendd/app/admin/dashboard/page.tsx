"use client";
import { useRole } from "@/hooks/useRole";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { DashboardStats } from "@/components/admin/DashboardStats";

export default function DashboardPage() {
  const { role, user } = useRole();
  const { data, isLoading, error } = useDashboard();

  return (
    <div>
      <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900 mb-6">
        Dashboard
      </h1>

      {/* Welcome Card */}
      <div className="bg-surface border border-alabaster-200 rounded-3xl p-6 mb-8 shadow-soft">
        <p className="text-slate-600">
          Welcome, <strong className="text-midnight-900">{user?.email}</strong>. 
          You are logged in as <strong className="text-midnight-900 capitalize">{role}</strong>.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-alabaster-100 rounded-3xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700">
          Failed to load dashboard data.
        </div>
      )}

      {data && <DashboardStats data={data} />}
    </div>
  );
}
