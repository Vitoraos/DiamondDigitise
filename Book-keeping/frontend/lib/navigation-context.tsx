"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavigationContextValue {
  isNavigating: boolean;
  navigate: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const targetRef = useRef<string | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return; // already there — no transition needed
      targetRef.current = href;
      setIsNavigating(true);
      router.push(href);
    },
    [router, pathname]
  );

  useEffect(() => {
    if (targetRef.current && pathname === targetRef.current) {
      targetRef.current = null;
      // The route has swapped, but wait a couple of paint frames before
      // dropping the overlay so we never reveal a half-rendered page —
      // this is what makes the spinner's duration track the real
      // transition instead of a fixed guess.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsNavigating(false));
      });
    }
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ isNavigating, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
