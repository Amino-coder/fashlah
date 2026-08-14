-- ============================================================================
-- ACCOUNT SYSTEM — optional magic-link accounts + save-results
-- ============================================================================
-- Run once in the Supabase SQL editor, after schema.sql.
--
-- DESIGN — read this before touching anything else in the account feature:
--
-- Every visitor already gets an anonymous Supabase auth session the moment
-- they load any game (see ensureUser() in lib/supabase.ts) with a matching
-- row in `users`. That anonymous identity is what every session/player/
-- answer row's user_id already points at — nothing about that changes.
--
-- A "real" account (created via magic link) is a SEPARATE Supabase auth
-- user with its own auth.uid() — NOT an upgrade of the anonymous one.
-- This is deliberate, not an accident: supabase.auth.signInWithOtp()
-- either creates a brand-new user or signs into whichever existing user
-- already owns that email, and that's exactly the "existing email logs
-- into the existing account, new email creates one" behavior the spec
-- asks for. The trade-off is that the result someone just played under
-- their anonymous identity has to be explicitly re-saved under the real
-- account's id once login completes — see lib/auth.ts's pending-result
-- helpers, which is how "don't lose the result during authentication" is
-- actually satisfied. There's no attempt here to merge or migrate the
-- anonymous identity itself; only the specific result being saved.
--
-- `users` already has `display_name` — reused as-is for "اسمك" rather
-- than adding a redundant `name` column.
-- ============================================================================

alter table users add column if not exists email text;
alter table users add column if not exists phone text;

-- Only enforced among rows that HAVE an email — anonymous rows (the vast
-- majority) all have email = null, and a plain unique index would be fine
-- with that in Postgres anyway (nulls are never considered duplicates),
-- but being explicit here documents the intent.
create unique index if not exists users_email_unique_idx on users (email) where email is not null;

-- ----------------------------------------------------------------------------
-- SAVED_RESULTS — one row per "احفظ نتيجتك" tap, across every game.
-- Deliberately a light, denormalized table rather than joining back into
-- each game's own session/answer tables: those tables' shapes are all
-- different (this is the whole reason each game has its own FinalReveal),
-- and a personal history page just needs "what game, when, what
-- happened" — not the full replay data. `result_detail` is there for
-- anything a future history UI wants beyond the one-line summary,
-- without needing a schema change to add it.
-- ----------------------------------------------------------------------------
create table saved_results (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  game           text not null,           -- e.g. 'bidal_solo', 'shofah', 'lifoo', 'wadak'
  result_summary text not null,           -- short human-readable line, e.g. "خلصت الأغنية 🎶" or "المركز الأول 🥇"
  result_detail  jsonb,                   -- optional structured extra (score, placement, word count, etc.)
  session_code   text,                    -- multiplayer room code, null for solo games
  created_at     timestamptz default now()
);

create index idx_saved_results_user on saved_results(user_id, created_at desc);

alter table saved_results enable row level security;

create policy "saved_results_self" on saved_results
  for all using (user_id = auth.uid());
