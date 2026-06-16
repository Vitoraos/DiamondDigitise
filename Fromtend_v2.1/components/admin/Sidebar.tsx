"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, DoorClosed, BookOpen, CreditCard,
  Receipt, Users, Bell, Hotel, LogOut, MoreHorizontal, X, Activity, Search
} from "lucide-react";

interface MenuItem { label: string; icon: React.ElementType; href: string; roles: string[]; }

const menuItems: MenuItem[] = [
  { label: "Dashboard",   icon: LayoutDashboard, href: "/admin/dashboard",      roles: ["owner", "manager"] },
  { label: "Rooms",       icon: DoorClosed,      href: "/admin/rooms",          roles: ["owner", "manager", "front_desk"] },
  { label: "Room Status", icon: Activity,        href: "/admin/rooms/status",   roles: ["owner", "manager", "front_desk"] },
  { label: "Bookings",    icon: BookOpen,        href: "/admin/bookings",       roles: ["owner", "manager", "front_desk"] },
  { label: "Verify",      icon: Search,          href: "/admin/verify",         roles: ["owner", "manager", "front_desk"] },
  { label: "Payments",    icon: CreditCard,      href: "/admin/payments",       roles: ["owner", "manager"] },
  { label: "Receipts",    icon: Receipt,         href: "/admin/receipts",       roles: ["owner", "manager", "front_desk"] },
  { label: "Staff",       icon: Users,           href: "/admin/staff",          roles: ["owner"] },
  { label: "Notifications", icon: Bell,          href: "/admin/notifications",  roles: ["owner"] },
];

const BOTTOM_NAV_MAX = 4;

export function Sidebar() {
  const pathname = usePathname();
  const { role, loading: roleLoading } = useRole();
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleItems = menuItems.filter(
    (item) => !roleLoading && role && item.roles.includes(role)
  );

  const primaryItems  = visibleItems.slice(0, BOTTOM_NAV_MAX);
  const overflowItems = visibleItems.slice(BOTTOM_NAV_MAX);
  const hasOverflow   = overflowItems.length > 0;

  const overflowActive = overflowItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-50 hidden lg:flex w-64 bg-[#070C17] border-r border-ghost flex-col">
        <div className="p-6 border-b border-ghost">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold flex items-center justify-center">
              <Hotel className="w-5 h-5 text-void" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] uppercase text-white">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {roleLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-white/5 animate-pulse" />
            ))
          ) : (
            visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-gold text-void font-bold"
                      : "text-dim hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 1.5} />
                  {item.label}
                </Link>
              );
            })
          )}
        </nav>

        <div className="p-4 border-t border-ghost">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-sm text-dim hover:text-error transition-colors w-full"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#070C17] border-t border-ghost">
        <div className="flex justify-around items-center h-16">
          {roleLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-white/5 animate-pulse" />
            ))
          ) : (
            <>
              {primaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                      isActive ? "text-gold" : "text-dim"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {hasOverflow && (
                <button
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                    overflowActive ? "text-gold" : "text-dim"
                  )}
                >
                  <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-[10px] mt-1 font-medium">More</span>
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Mobile More Drawer */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] lg:hidden bg-[#070C17] border-t border-ghost pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-ghost" />
            </div>
            <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-ghost">
              <span className="text-xs font-bold text-white uppercase tracking-wider">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 text-dim hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-1">
              {overflowItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 transition-all",
                      isActive
                        ? "bg-gold text-void font-bold"
                        : "text-dim hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => { setMoreOpen(false); signOut(); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-error hover:bg-error/10 transition-all mt-2"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
            <div className="h-6" />
          </div>
        </>
      )}
    </>
  );
}
