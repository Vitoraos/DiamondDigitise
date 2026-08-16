"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(identifier, password);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/");
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-5xl leading-none text-brass-bright">
          Diamond Residence
        </h1>
        <div className="mt-2 h-px w-24 bg-brass" aria-hidden="true" />
        <p className="mt-4 text-ivory-dim text-sm">
          Sign in to record and review the day&apos;s business.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="identifier" className="mb-1.5 block text-sm text-ivory-dim">
              Username or phone number
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-ink-light bg-ink-deep px-4 py-3 text-ivory placeholder:text-ivory-dim/50 focus:border-brass"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-ivory-dim">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink-light bg-ink-deep px-4 py-3 text-ivory placeholder:text-ivory-dim/50 focus:border-brass"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-expense">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-brass px-6 py-3.5 text-center font-semibold text-ink-deep transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
