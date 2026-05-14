"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LayoutDashboard,
  DoorClosed,
  BookOpen,
  CreditCard,
  Receipt,
  Users,
  Bell,
  Hotel,
  LogOut,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { role } = useRole();
  const { data, isLoading, error } = useDashboard();
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?expired=true");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-50">
        <p className="text-navy-700 animate-pulse">Checking permissions…</p>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard", roles: ["owner", "manager", "front_desk"] },
    { label: "Rooms", icon: DoorClosed, href: "/admin/rooms", roles: ["owner", "manager"] },
    { label: "Bookings", icon: BookOpen, href: "/admin/bookings", roles: ["owner", "manager", "front_desk"] },
    { label: "Payments", icon: CreditCard, href: "/admin/payments", roles: ["owner", "manager"] },
    { label: "Receipts", icon: Receipt, href: "/admin/receipts", roles: ["owner", "manager", "front_desk"] },
    { label: "Staff", icon: Users, href: "/admin/staff", roles: ["owner"] },
    { label: "Notifications", icon: Bell, href: "/admin/notifications", roles: ["owner"] },
  ];

  const visibleItems = menuItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-beige-50">
      <aside className="w-64 bg-navy-800 text-beige-100 flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-navy-700">
          <Hotel className="h-6 w-6 text-gold-400" />
          <span className="font-serif text-lg font-semibold">Vitora Admin</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-navy-700 hover:text-beige-50 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-navy-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-beige-300 hover:text-beige-100 hover:bg-navy-700"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">
          Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow border border-beige-200 p-4 mb-6">
          <p className="text-navy-700">
            Welcome, <strong>{user?.email}</strong>. You are logged in as{" "}
            <strong>{role}</strong>.
          </p>
        </div>
        {isLoading && <p className="text-navy-600 animate-pulse">Loading statistics…</p>}
        {error && <p className="text-red-600">Failed to load dashboard data.</p>}
        {data && <DashboardStats data={data} />}
      </main>
    </div>
  );
}
