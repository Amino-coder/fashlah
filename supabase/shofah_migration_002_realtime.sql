-- ============================================================================
-- SHOFAH migration 002 — enable realtime
-- Without this, INSERT/UPDATE events on these tables never broadcast to
-- subscribed clients, so the lobby player list and the "game started"
-- transition only ever update on a manual page refresh.
-- ============================================================================

alter publication supabase_realtime add table shofah_sessions;
alter publication supabase_realtime add table shofah_players;
alter publication supabase_realtime add table shofah_answers;
alter publication supabase_realtime add table shofah_votes;
