-- ============================================================================
-- MIGRATION 001 — per-player round tracking
-- ============================================================================
-- Run this once in the Supabase SQL editor on your existing project (schema.sql
-- has already been updated too, so fresh projects get this column automatically).
--
-- Why: players confirmed they want each player to move through Round 1/2/3 at
-- their own pace instead of waiting for the group, so gameplay UI needs to know
-- where *this player* is, separate from sessions.current_round (which still
-- tracks the session's overall lifecycle: waiting → in_progress → completed).
-- ============================================================================

alter table players
  add column if not exists current_round int default 1;

comment on column players.current_round is
  'This player''s own progress through the rounds (1, 2, 3, or 4 = finished all rounds). Independent of sessions.current_round.';
