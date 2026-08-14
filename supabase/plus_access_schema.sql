-- ============================================================================
-- BAGDOONIS PLUS — per-game access gating + admin auth foundations
-- ============================================================================
-- Run once in the Supabase SQL editor, after schema.sql and accounts_schema.sql.
--
-- MODEL (as described): Plus is a single time window per account —
-- users.plus_expires_at. Doesn't matter if someone bought a week or a
-- month; once determined, it collapses to one timestamp. Access to a
-- specific game is simply: "does this game require Plus, and if so, is
-- plus_expires_at in the future for the signed-in account." No payment
-- processing lives here at all — this is purely the access-control half
-- (see game_access below); granting real Plus happens later, whenever
-- payments are wired up, by setting plus_expires_at on checkout success.
--
-- Right now, with no payment flow live, every account's plus_expires_at
-- is null — nobody has Plus, by construction, exactly as intended. The
-- ADMIN TOGGLE (game_access.requires_plus) is independent of that: you
-- can mark a game as Plus-only today, and it'll correctly block
-- everyone (since nobody has an active plus_expires_at yet) without
-- needing payments to exist first.
--
-- SECURITY FIX WHILE HERE: admin_users (schema.sql) was created without
-- RLS ever being enabled on it — meaning, depending on default grants,
-- its password_hash column could potentially be readable through
-- Supabase's public REST API. Locking it down below: RLS enabled, zero
-- policies, so only the service-role key (used server-side in the admin
-- API routes, never exposed to the browser) can touch it at all.
-- ============================================================================

alter table users add column if not exists plus_expires_at timestamptz;
alter table users add column if not exists plus_plan text; -- 'weekly' | 'monthly' — informational only, not used for the access check itself

-- ----------------------------------------------------------------------------
-- GAME_ACCESS — one row per game, toggled from /admin. `game` uses the
-- same short keys already used everywhere else (saved_results.game,
-- page_views.page, EndGameShare's EndGameKey): 'fashlah', 'shofah',
-- 'job', 'qaseeda', 'qissa', 'lifoo', 'ihj', 'bidal', 'wadak', 'ibarat'.
-- ----------------------------------------------------------------------------
create table if not exists game_access (
  game          text primary key,
  requires_plus boolean not null default false,
  updated_at    timestamptz default now()
);

alter table game_access enable row level security;

-- Public read — every game's landing page needs to check this (via the
-- anon key, before anyone's necessarily signed in) to know whether to
-- show the paywall. No public write policy: only /admin's API routes
-- (service role) can change it.
create policy "game_access_read" on game_access for select using (true);

-- Seed every current game as free (requires_plus = false) — toggling is
-- something you do deliberately from /admin afterward, never a surprise
-- default.
insert into game_access (game, requires_plus) values
  ('fashlah', false),
  ('shofah', false),
  ('job', false),
  ('qaseeda', false),
  ('qissa', false),
  ('lifoo', false),
  ('ihj', false),
  ('bidal', false),
  ('wadak', false),
  ('ibarat', false)
on conflict (game) do nothing;

-- ----------------------------------------------------------------------------
-- admin_users RLS lockdown (see header). Nothing else about this table
-- changes — same columns, same data, just now properly access-controlled.
-- ----------------------------------------------------------------------------
alter table admin_users enable row level security;
-- Deliberately zero policies — no anon/authenticated role can select,
-- insert, or update this table under any circumstance. Every admin API
-- route uses the service-role key, which bypasses RLS entirely, so this
-- doesn't block the admin panel itself — it only blocks the public.
