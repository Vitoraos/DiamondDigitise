import type { FastifyReply, FastifyRequest } from "fastify";
import { sessionCookieOptions, verifySession, type SessionPayload } from "./session.js";

// Augment Fastify's request type so `req.user` is typed everywhere
// after this middleware runs, instead of `any`.
declare module "fastify" {
  interface FastifyRequest {
    user?: SessionPayload;
  }
}

/**
 * Attach as a preHandler on any route that requires login.
 * Sends 401 and stops the request if there's no valid session —
 * callers don't need to re-check req.user for undefined after this runs.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies[sessionCookieOptions.name];

  if (!token) {
    return reply.code(401).send({ error: "Not logged in." });
  }

  const session = verifySession(token);

  if (!session) {
    // token existed but was invalid/expired — clear it so the client
    // doesn't keep resending a dead cookie
    reply.clearCookie(sessionCookieOptions.name, { path: "/" });
    return reply.code(401).send({ error: "Session expired. Please log in again." });
  }

  req.user = session;
}

/**
 * Attach alongside requireAuth on owner-only routes (e.g. the
 * daily Telegram report trigger, if ever exposed manually).
 */
export async function requireOwner(req: FastifyRequest, reply: FastifyReply) {
  if (req.user?.role !== "owner") {
    return reply.code(403).send({ error: "Owner access only." });
  }
}
