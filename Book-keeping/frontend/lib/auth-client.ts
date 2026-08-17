const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE && typeof window !== "undefined") {
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
    credentials: "include",
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
  let res: Response;
  try {
    res = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  } catch {
    return {
      ok: false,
      error: "Couldn't reach the server. Check your connection and try again.",
    };
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: body?.error ?? "Login failed. Please try again." };
  }

  return { ok: true, user: body as SessionUser };
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/logout", { method: "POST" });
  } catch {
    // Best-effort — if the network call fails, the client-side redirect
    // in the caller still gets the user out of protected pages.
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const res = await apiFetch("/me");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
