"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth-client";

/**
 * Wrap any protected page's content with this. Since auth lives in a
 * separate Fastify service (not Next.js middleware/cookies we control
 * server-side here), the check happens client-side on mount.
 */
export function RequireAuth({
  children,
}: {
  children: (user: SessionUser) => React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser().then((u) => {
      if (cancelled) return;
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
      }
      setChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-ivory-dim font-body text-sm">Loading…</p>
      </div>
    );
  }

  return <>{children(user)}</>;
}
