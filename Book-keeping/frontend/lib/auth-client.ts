const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE && typeof window !== "undefined") {
  // Fail loudly in dev rather than silently hitting a relative path
  // that happens to 404 in a confusing way.
  console.error(
    "NEXT_PUBLIC_API_BASE_URL is not set. Set it to your Fastify backend URL, e.g. http://localhost:4000"
  );
}

export interface SessionUser {
  username: string;
  displayName: string;
  role: "owner" | "staff";
}

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include", // send/receive the httpOnly session cookie
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function login(
  identifier: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const res = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: body?.error ?? "Login failed. Please try again." };
  }

  return { ok: true, user: body as SessionUser };
}

export async function logout(): Promise<void> {
  await apiFetch("/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const res = await apiFetch("/me");
  if (!res.ok) return null;
  return res.json();
}
