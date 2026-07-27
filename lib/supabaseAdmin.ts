import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from a "use client" component — the
// service role key bypasses every RLS policy in the database. It must only
// ever run inside a Next.js Route Handler (app/api/**/route.ts), which
// executes on the server and never ships this key to the browser.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in your environment (Vercel project
// settings + .env.local) — deliberately NOT prefixed with NEXT_PUBLIC_, so
// Next.js won't bundle it into client-side JS. Get it from Supabase:
// Project Settings → API → service_role key.
//
// The client is built lazily, on first use, rather than at module load.
// That matters at build time: `next build` imports every route module to
// collect page data, and creating the client at module scope made the
// whole build crash with "supabaseKey is required" on any machine that
// didn't have the service-role secret — CI, a fresh clone, a preview
// build. A missing key is a runtime configuration problem, so it should
// surface as a clean 500 on the one request that needs it, not as a failed
// build of the entire app.

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase admin env vars are missing. Set SUPABASE_SERVICE_ROLE_KEY (server-only, no NEXT_PUBLIC_ prefix) alongside NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
