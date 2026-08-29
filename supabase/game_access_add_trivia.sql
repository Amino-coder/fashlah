-- ============================================================================
-- Adds سؤال وجواب to game_access — without this row, the game still
-- works fine (checkGameAccess/PlusGate already treat a missing row as
-- "free, not hidden" by default), but it won't show up in the admin
-- panel's reorder/hide/Plus-toggle list at all, since that list is
-- populated from this table, not a hardcoded game list.
--
-- Ordered last (14), after every game seeded in
-- game_access_ordering_migration.sql — matches how it was appended at
-- the end of the home page's own entries array too.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

insert into game_access (game, display_order) values ('trivia', 14)
on conflict (game) do update set display_order = excluded.display_order
where game_access.display_order is null;
