-- ============================================================================
-- QR scan tracking — one row per scan of any /go/<slug> QR code.
-- Run once in the Supabase SQL editor, after qr_redirects_schema.sql.
--
-- app/go/[slug]/route.ts records a row here on every redirect, right
-- before sending the person on to wherever that slug currently points.
-- This table only answers "a QR code was scanned, when, and which slug/
-- destination it was" — there's no identity yet at scan time (nobody has
-- signed up or even loaded a game page), so "who" scanned it means the
-- scan event itself, not a named person. See qr_scan_log.sql for the
-- query, including the honest limit on connecting a scan to what someone
-- actually ended up playing afterward.
-- ============================================================================

create table if not exists qr_scans (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  destination   text not null,
  user_agent    text,
  scanned_at    timestamptz default now()
);

create index if not exists idx_qr_scans_scanned_at on qr_scans(scanned_at desc);
create index if not exists idx_qr_scans_slug on qr_scans(slug);

alter table qr_scans enable row level security;

-- Public INSERT only, no public SELECT — the redirect route runs with
-- the anon key and needs to be able to log a scan, but the scan history
-- itself is operational data for you, not something exposed to anyone
-- hitting the API. Read it via the SQL editor (or a service-role admin
-- view), not the public client.
create policy "qr_scans_public_insert" on qr_scans for insert with check (true);
