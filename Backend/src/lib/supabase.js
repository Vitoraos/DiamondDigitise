// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// Two Supabase clients:
//
//   supabaseAnon        — uses anon key, respects RLS.
//                         Use for anything that should obey row-level rules.
//
//   supabaseAdmin       — uses service role key, BYPASSES RLS.
//                         Use ONLY for trusted backend operations:
//                         creating guests, writing payments, etc.
//                         Never expose this client to frontend code.
// ─────────────────────────────────────────────────────────────
'use strict';

const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: { persistSession: false },
  }
);

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

module.exports = { supabaseAnon, supabaseAdmin };
