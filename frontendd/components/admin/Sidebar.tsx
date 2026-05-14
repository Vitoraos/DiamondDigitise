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
    <aside className="w-64 bg-navy-800 text-beige-100 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-4 border-b border-navy-700">
        <Hotel className="h-6 w-6 text-gold-400" />
        <span className="font-serif text-lg font-semibold">Vitora Admin</span>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-navy-700 text-gold-300 border-r-2 border-gold-500"
                  : "hover:bg-navy-700 hover:text-beige-50"
              )}
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
  );
}