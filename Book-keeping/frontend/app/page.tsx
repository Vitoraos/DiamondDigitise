"use client";

import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { CircleNav } from "@/components/CircleNav";
import { greetingForToday } from "@/lib/greetings";

export default function HomePage() {
  const router = useRouter();
  const message = greetingForToday();

  return (
    <RequireAuth>
      {(user) => (
        <div className="flex flex-1 flex-col">
          {/* Top ~two-thirds: the greeting */}
          <main className="flex flex-[2] flex-col justify-center px-6">
            <p className="font-display text-3xl leading-tight text-ivory-dim">
              Welcome back,
            </p>
            <h1 className="font-display text-6xl leading-[1.05] text-brass-bright">
              {user.displayName}
            </h1>
            <div className="mt-4 h-px w-16 bg-brass" aria-hidden="true" />
            <p className="mt-4 font-display text-2xl text-ivory">{message}</p>
          </main>

          {/* Bottom quarter: pill CTA + circular nav */}
          <div className="flex flex-1 flex-col justify-end px-6">
            <button
              type="button"
              onClick={() => router.push("/record")}
              className="w-full rounded-full bg-brass px-8 py-5 text-center text-lg font-semibold text-ink-deep transition-opacity hover:opacity-90 active:opacity-80"
            >
              Record an order
            </button>

            <CircleNav />
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
