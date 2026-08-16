# Diamond Residence — Backend

Fastify API for the sales/purchase/expense record app. Deployed standalone on Render, separate from the Next.js frontend.

## Local setup

```bash
npm install
cp .env.example .env   # fill in the real values
npm run dev
```

## Adding/removing a staff account

1. Generate a password hash:
   ```bash
   npm run hash-password -- "theirPassword"
   ```
2. Paste the printed hash into `src/lib/accounts.ts` as a new entry (or delete an entry to remove someone).
3. Redeploy.

Passwords are never stored in plaintext, even in this hardcoded file — if it ever leaks, credentials aren't handed out for free.

## Deploying to Render

1. New → Web Service → connect this repo (backend folder as root if monorepo).
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all env vars from `.env.example` under Environment.
5. Once deployed, note the service URL (e.g. `https://diamond-backend.onrender.com`) — this is what the frontend calls.

## Setting up the daily Telegram report

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → get your `TELEGRAM_BOT_TOKEN`.
2. Message your new bot at least once (so it's allowed to message you back).
3. Message [@userinfobot](https://t.me/userinfobot) to get your `TELEGRAM_CHAT_ID`.
4. Set both as env vars on Render.
5. In Render, create a **separate Cron Job** (not the web service):
   - Schedule: e.g. `0 22 * * *` (22:00 UTC = 23:00 WAT — adjust for when you want end-of-day to trigger)
   - Command: a `curl` call hitting your deployed endpoint:
     ```bash
     curl -X POST https://diamond-backend.onrender.com/cron/daily-report \
       -H "X-Cron-Secret: $CRON_SECRET"
     ```
   - Give the Cron Job the same `CRON_SECRET` value as the web service.

This is a *separate* Render service from the web app on purpose — a scheduled Cron Job runs reliably on its own timer, rather than depending on the web service's process staying alive with a timer inside it.

## Notes on the security choices made here (not defaults, deliberate)

- **Passwords are bcrypt-hashed**, not plaintext, even though the account list itself is a hardcoded file.
- **RLS is enabled with zero policies** on the `transactions` table in Supabase — only this backend, using the service role key, can touch it. The frontend never talks to Supabase directly.
- **Login is rate-limited** (5 attempts/minute/IP) since it's a small fixed account list and a natural brute-force target.
- **CORS is locked to one exact origin** (`FRONTEND_ORIGIN`), not left open.
- **The cron endpoint is secret-protected**, not just "unlisted" — it's a real auth check, since it writes a report containing all of the day's financial data.
