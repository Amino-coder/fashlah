-- ============================================================================
-- MIGRATION 006 — fix game_history read policy
-- ============================================================================
-- The original policy only let the group's `created_by` (the very first
-- host) read game_history. Every other player in the session — including
-- the host of a later replay — would get an empty Results screen. Fixed to
-- allow any player who was actually in that session.
-- ============================================================================

drop policy if exists "game_history_group_read" on game_history;

create policy "game_history_session_read" on game_history for select using (
  session_id in (select session_id from players where user_id = auth.uid())
);
