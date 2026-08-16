import type { FastifyInstance } from "fastify";
import { buildDailyReport, todayInLagos } from "../lib/daily-report.js";
import { sendTelegramMessage } from "../lib/telegram.js";

const CRON_SECRET = process.env.CRON_SECRET;

export async function cronRoutes(app: FastifyInstance) {
  // Called by Render's Cron Job scheduler once a day (e.g. 23:00 WAT).
  // Protected by a shared secret, NOT by the staff login system —
  // this is machine-to-machine, not a user-facing route.
  app.post("/cron/daily-report", async (req, reply) => {
    if (!CRON_SECRET) {
      req.log.error("CRON_SECRET env var not set — refusing to run.");
      return reply.code(500).send({ error: "Server misconfigured." });
    }

    const providedSecret = req.headers["x-cron-secret"];
    if (providedSecret !== CRON_SECRET) {
      return reply.code(401).send({ error: "Unauthorized." });
    }

    try {
      const [dayStart, dayEnd] = todayInLagos();
      const report = await buildDailyReport(dayStart, dayEnd);
      await sendTelegramMessage(report);
      return reply.send({ ok: true });
    } catch (err) {
      req.log.error({ err }, "Daily report failed");
      return reply.code(500).send({ error: "Failed to generate/send daily report." });
    }
  });
}
