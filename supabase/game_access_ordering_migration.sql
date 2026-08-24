-- ============================================================================
-- Adds admin-controlled home page ordering and visibility to the
-- existing game_access table — the same table already driving the Plus
-- toggle, extended rather than creating a second parallel table for
-- what's conceptually the same "how does this game appear/behave on
-- the home page" concern.
--
-- display_order is seeded to match the CURRENT live home page order
-- (see app/page.tsx's entries array) so the first time an admin opens
-- this, the order they see is exactly what's already live — not a
-- reshuffled surprise they have to fix before it even reflects reality.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

alter table game_access add column if not exists display_order int;
alter table game_access add column if not exists hidden boolean default false;

-- Seed display_order to match the current live home page order exactly.
-- Uses upsert so this is safe to run even if some of these games don't
-- have a game_access row yet (checkGameAccess already treats a missing
-- row as "not Plus, not hidden," so this just makes that same default
-- explicit and orderable).
insert into game_access (game, display_order) values
  ('bidal', 1), ('shofah', 2), ('ihj', 3), ('wadak', 4),
  ('imposter', 5), ('ruin_story', 6), ('fashlah', 7), ('mareed', 8),
  ('qissa', 9), ('job', 10), ('qaseeda', 11), ('lifoo', 12), ('ibarat', 13)
on conflict (game) do update set display_order = excluded.display_order
where game_access.display_order is null;
