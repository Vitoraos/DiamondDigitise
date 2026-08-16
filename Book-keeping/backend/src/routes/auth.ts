import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { findAccount } from "../lib/accounts.js";
import { signSession, sessionCookieOptions } from "../lib/session.js";

interface LoginBody {
  identifier?: string; // username or phone
  password?: string;
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: LoginBody }>(
    "/login",
    {
      config: {
        // 5 attempts per 60s per IP — deliberately tight since this
        // is a small hardcoded account list, not a public signup system
        rateLimit: { max: 5, timeWindow: "1 minute" },
      },
    },
    async (req, reply) => {
      const { identifier, password } = req.body ?? {};

      if (!identifier?.trim() || !password) {
        return reply.code(400).send({ error: "Username/phone and password are required." });
      }

      const account = findAccount(identifier);

      // Same generic error whether the account doesn't exist or the
      // password is wrong — don't leak which one it was.
      const invalidCredentials = () =>
        reply.code(401).send({ error: "Invalid credentials." });

      if (!account) {
        return invalidCredentials();
      }

      const passwordMatches = await bcrypt.compare(password, account.passwordHash);

      if (!passwordMatches) {
        return invalidCredentials();
      }

      const token = signSession({
        username: account.username,
        displayName: account.displayName,
        role: account.role,
      });

      reply.setCookie(sessionCookieOptions.name, token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none", // frontend and backend are on different domains (Vercel + Render)
        maxAge: sessionCookieOptions.maxAgeSeconds,
      });

      return reply.send({
        username: account.username,
        displayName: account.displayName,
        role: account.role,
      });
    }
  );

  app.post("/logout", async (req, reply) => {
    reply.clearCookie(sessionCookieOptions.name, { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/me", async (req, reply) => {
    const token = req.cookies[sessionCookieOptions.name];
    if (!token) return reply.code(401).send({ error: "Not logged in." });

    const { verifySession } = await import("../lib/session.js");
    const session = verifySession(token);
    if (!session) return reply.code(401).send({ error: "Session expired." });

    return reply.send(session);
  });
}
