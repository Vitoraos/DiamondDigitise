import jwt from "jsonwebtoken";

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "JWT_SECRET env var is missing or too short (need 32+ chars). " +
      "Generate one with: openssl rand -base64 48"
  );
}

// Narrowed to a definite string past the guard above — TS can't infer
// that a module-level const stays narrowed, so we re-bind it explicitly.
const JWT_SECRET: string = rawSecret;

export interface SessionPayload {
  username: string;
  displayName: string;
  role: "owner" | "staff";
}

const SESSION_COOKIE_NAME = "diamond_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days — "stay logged in until logout"

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as SessionPayload;
  } catch {
    // covers expired token, tampered token, malformed token — all treated
    // the same way from the caller's perspective: not authenticated.
    return null;
  }
}

export const sessionCookieOptions = {
  name: SESSION_COOKIE_NAME,
  maxAgeSeconds: SESSION_MAX_AGE_SECONDS,
};
