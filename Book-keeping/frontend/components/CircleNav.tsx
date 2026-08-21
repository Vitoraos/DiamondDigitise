"use client";

import { Home, History, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/auth-client";
import { useNavigation } from "@/lib/navigation-context";

interface NavButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function NavButton({ label, active, onClick, children }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`
        flex h-14 w-14 items-center justify-center rounded-full
        transition-colors duration-150
        ${active ? "bg-brass text-ink-deep" : "bg-ink-light text-ivory-dim hover:text-ivory"}
      `}
    >
      {children}
    </button>
  );
}

export function CircleNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { navigate } = useNavigation();

  async function handleLogout() {
    await logout();
    navigate("/login");
    router.refresh();
  }

  return (
    <nav
      aria-label="Primary"
      className="flex items-center justify-center gap-6 pb-8 pt-4"
    >
      <NavButton label="Home" active={pathname === "/"} onClick={() => navigate("/")}>
        <Home size={22} strokeWidth={2} aria-hidden="true" />
      </NavButton>
      <NavButton
        label="History"
        active={pathname === "/history"}
        onClick={() => navigate("/history")}
      >
        <History size={22} strokeWidth={2} aria-hidden="true" />
      </NavButton>
      <NavButton label="Log out" onClick={handleLogout}>
        <LogOut size={22} strokeWidth={2} aria-hidden="true" />
      </NavButton>
    </nav>
  );
}
