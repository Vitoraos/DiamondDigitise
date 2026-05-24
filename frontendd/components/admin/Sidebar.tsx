"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
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
import { Button } from "@/components/ui/button";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    roles: ["owner", "manager", "front_desk"],
  },
  {
    label: "Rooms",
    icon: DoorClosed,
    href: "/admin/rooms",
    roles: ["owner", "manager"],
  },
  {
    label: "Bookings",
    icon: BookOpen,
    href: "/admin/bookings",
    roles: ["owner", "manager", "front_desk"],
  },
  {
    label: "Payments",
    icon: CreditCard,
    href: "/admin/payments",
    roles: ["owner", "manager"],
  },
  {
    label: "Receipts",
    icon: Receipt,
    href: "/admin/receipts",
    roles: ["owner", "manager", "front_desk"],
  },
  {
    label: "Staff",
    icon: Users,
    href: "/admin/staff",
    roles: ["owner"],
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/admin/notifications",
    roles: ["owner"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const { signOut } = useAuth();

  const visibleItems = menuItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    // Apple-style floating glass sidebar
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
      <div className="glass rounded-3xl p-3 flex flex-col gap-2 shadow-soft border border-white/40">
        {/* Logo */}
        <div className="p-2 mb-2 border-b border-black/5 flex justify-center">
          <div className="w-10 h-10 rounded-2xl bg-midnight-900 flex items-center justify-center">
            <Hotel className="w-5 h-5 text-gold-400" />
          </div>
        </div>

        {/* Navigation Items */}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 group",
                isActive
                  ? "bg-midnight-900 text-gold-400 shadow-md"
                  : "text-slate-400 hover:bg-midnight-50 hover:text-midnight-700"
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />

              {/* Tooltip on hover */}
              <div className="absolute left-14 px-3 py-1.5 rounded-lg bg-midnight-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="mt-2 p-2 text-slate-400 hover:text-red-500 transition-colors rounded-2xl hover:bg-red-50 flex justify-center"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
