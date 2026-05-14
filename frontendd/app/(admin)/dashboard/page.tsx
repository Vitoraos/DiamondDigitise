"use client";

import { useRole } from "@/hooks/useRole";

export default function DashboardPage() {
  const { role, user } = useRole();

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">
        Dashboard
      </h1>
      <div className="bg-white rounded-lg shadow border border-beige-200 p-6">
        <p className="text-navy-700">
          Welcome, <strong>{user?.email}</strong>. You are logged in as{" "}
          <strong>{role}</strong>.
        </p>
      </div>
    </div>
  );
}