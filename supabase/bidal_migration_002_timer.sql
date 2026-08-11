-- ============================================================================
-- Fixes the solo timer default at the database layer. The client-side
-- config (lib/bidal-letters.ts, SOLO_TIME_LIMIT_SECONDS) already governs
-- every NEW session, since the create flow always passes it explicitly —
-- but the column's own default was still 90, which is where a stray old
-- value could come from for any row that didn't get it set explicitly.
-- ============================================================================

alter table bidal_sessions alter column time_limit_seconds set default 50;

-- Any solo session that hasn't started yet picks up the corrected value —
-- sessions already in progress or completed are left untouched, since
-- changing a timer mid-game (or after it's over) would be meaningless.
update bidal_sessions
set time_limit_seconds = 50
where mode = 'solo' and status = 'waiting';
