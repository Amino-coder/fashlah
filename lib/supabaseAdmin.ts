import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from a "use client" component — the
// service role key bypasses every RLS policy in the database. It must only
// ever run inside a Next.js Route Handler (app/api/**/route.ts), which
// executes on the server and never ships this key to the browser.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in your environment (Vercel project
// settings + .env.local) — deliberately NOT prefixed with NEXT_PUBLIC_, so
// Next.js won't bundle it into client-side JS. Get it from Supabase:
// Project Settings → API → service_role key.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "Supabase admin env vars are missing. Set SUPABASE_SERVICE_ROLE_KEY (server-only, no NEXT_PUBLIC_ prefix) alongside NEXT_PUBLIC_SUPABASE_URL."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
