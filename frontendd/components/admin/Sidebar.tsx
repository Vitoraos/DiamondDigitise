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
  { label: "Dashboard",   icon: LayoutDashboard, href: "/admin/dashboard",      roles: ["owner", "manager", "front_desk"] },
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
      {/* ── Desktop Floating Sidebar ─────────────────────────── */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
        <div className="glass rounded-3xl p-3 flex flex-col gap-2 shadow-soft border border-white/40">
          <div className="p-2 mb-2 border-b border-black/5 flex justify-center">
            <div className="w-10 h-10 rounded-2xl bg-midnight-900 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-gold-400" />
            </div>
          </div>

          {roleLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-2xl bg-midnight-50 animate-pulse" />
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
                    "relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all group",
                    isActive
                      ? "bg-midnight-900 text-gold-400 shadow-md"
                      : "text-slate-400 hover:bg-midnight-50 hover:text-midnight-700"
                  )}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                  <div className="absolute left-14 px-3 py-1.5 rounded-lg bg-midnight-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    {item.label}
                  </div>
                </Link>
              );
            })
          )}

          <button
            onClick={signOut}
            className="mt-2 p-2 text-slate-400 hover:text-red-500 rounded-2xl hover:bg-red-50 flex justify-center"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-alabaster-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {roleLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-alabaster-100 animate-pulse" />
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
                      isActive ? "text-midnight-900" : "text-slate-400"
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
                    overflowActive ? "text-midnight-900" : "text-slate-400"
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

      {/* ── More Drawer ──────────────────────────────────────── */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] lg:hidden bg-white rounded-t-3xl shadow-2xl border-t border-alabaster-200 pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-alabaster-300" />
            </div>
            <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-alabaster-100">
              <span className="text-sm font-semibold text-midnight-900 uppercase tracking-wider">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-alabaster-100 text-slate-400 hover:text-midnight-900 transition-colors"
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
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all",
                      isActive
                        ? "bg-midnight-900 text-gold-400"
                        : "text-slate-600 hover:bg-alabaster-50 hover:text-midnight-900"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400" />}
                  </Link>
                );
              })}
              <button
                onClick={() => { setMoreOpen(false); signOut(); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all mt-2"
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
