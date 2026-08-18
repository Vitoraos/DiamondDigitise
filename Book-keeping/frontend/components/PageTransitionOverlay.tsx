"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const OVERLAY_DURATION_MS = 550;

/**
 * Renders once at the root layout, so it wraps every route. Next.js swaps
 * the page content on navigation faster than a human notices, which can
 * feel abrupt between very different-looking screens (the greeting vs.
 * the wizard vs. history). This plays a short branded overlay on top of
 * the already-swapped content instead of trying to delay the swap itself —
 * simpler to get right, and it never blocks real data loading (RequireAuth
 * has its own loading state for that).
 */
export function PageTransitionOverlay() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // Don't play the transition on the very first page load —
      // only on actual navigation between routes.
      isFirstRender.current = false;
      return;
    }

    setShow(true);
    const timeout = setTimeout(() => setShow(false), OVERLAY_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-ink animate-curtain-fade"
    >
      <div className="h-10 w-10 animate-spin-ring rounded-full border-2 border-brass border-t-transparent" />
    </div>
  );
}
