"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?expired=true");
  }, [user, authLoading, router]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-alabaster-50"><div className="w-8 h-8 border-2 border-midnight-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-alabaster-50">
      <Sidebar />
      {/* ✅ FIX: Adjusted pl-28 for desktop, added pb-24 for mobile bottom nav clearance */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 lg:pl-28 pb-24 lg:pb-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
