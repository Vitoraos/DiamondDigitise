import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. " +
      "This backend uses the service role key deliberately — RLS on the " +
      "transactions table denies all anon/authenticated access by design."
  );
}

// This client bypasses RLS. It must only ever be used server-side,
// after the request has already passed our own JWT auth middleware.
export const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});
