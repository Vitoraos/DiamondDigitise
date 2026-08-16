import "dotenv/config";
import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { authRoutes } from "./routes/auth.js";
import { transactionRoutes } from "./routes/transactions.js";
import { cronRoutes } from "./routes/cron.js";

const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

if (!FRONTEND_ORIGIN) {
  throw new Error(
    "FRONTEND_ORIGIN env var is required (e.g. https://diamond-residence.vercel.app) " +
      "so CORS can be locked to your actual frontend instead of left open."
  );
}

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: FRONTEND_ORIGIN,
  credentials: true, // required so the session cookie is sent cross-origin
});

await app.register(cookie);

await app.register(rateLimit, {
  global: false, // only routes that opt in (e.g. /login) are limited
});

app.get("/health", async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(transactionRoutes);
await app.register(cronRoutes);

app.setErrorHandler((err: FastifyError, req, reply) => {
  req.log.error({ err }, "Unhandled error");
  const statusCode = err.statusCode ?? 500;
  reply.code(statusCode).send({
    error: err.statusCode ? err.message : "Internal server error.",
  });
});

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
