-- ============================================================================
-- FAVORITES — which games a signed-in user has starred, home page shows
-- these first within each مع أصحابك / لحالك filter.
-- Run once in the Supabase SQL editor, after accounts_schema.sql.
--
-- Same shape/conventions as saved_results (supabase/accounts_schema.sql):
-- belongs to a REAL account only (never an anonymous play session) — the
-- app enforces this in code (see lib/favorites.ts, gated on getRealUser()
-- the same way SaveResult/game_access already are), not something RLS
-- alone can distinguish, since an anonymous session's auth.uid() is just
-- as valid a foreign key as a real account's.
-- ============================================================================

create table favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  game       text not null,
  created_at timestamptz default now(),
  unique (user_id, game) -- the actual duplicate-prevention guarantee — not just app-side care
);

create index idx_favorites_user on favorites(user_id);

alter table favorites enable row level security;

create policy "favorites_self" on favorites
  for all using (user_id = auth.uid());
