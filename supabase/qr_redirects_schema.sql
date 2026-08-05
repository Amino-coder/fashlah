-- ============================================================================
-- QR redirects — lets a printed/shared QR code's destination be changed
-- anytime without ever reprinting it. The QR code itself always encodes
-- a stable URL on your own domain (e.g. bagdoonis.app/go/main); this
-- table is what that URL actually resolves to at request time.
--
-- To change where a QR code points, just update its row:
--   update qr_redirects set destination = '/qissa' where slug = 'main';
-- Takes effect immediately — no redeploy, no new QR code.
-- ============================================================================

create table if not exists qr_redirects (
  slug         text primary key,
  destination  text not null,
  updated_at   timestamptz default now()
);

alter table qr_redirects enable row level security;

-- Public read only — the redirect route needs to look this up, and the
-- destinations themselves aren't sensitive. There's deliberately no
-- public write policy: change a destination via the SQL editor (or the
-- Supabase table view) directly, not from the app itself.
create policy "qr_redirects_read" on qr_redirects for select using (true);

-- Seed the default QR code: points at the homepage until you decide
-- otherwise. `destination` can be either a path on your own site
-- ('/qaseeda', '/shofah/join?code=ABC123') or a full external URL
-- ('https://instagram.com/...') — the redirect route handles both.
insert into qr_redirects (slug, destination) values
  ('main', '/')
on conflict (slug) do nothing;
