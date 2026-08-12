-- ============================================================================
-- Adds بدل الكلمة to cleanup_stale_sessions(). It was missing from the
-- original admin_cleanup_stale_sessions.sql — every other multiplayer game
-- got covered, bidal didn't, which is why solo-abandoned bidal sessions
-- (someone opens the game, never finishes, never comes back) pile up
-- forever in 'waiting'/'in_progress'.
--
-- bidal_sessions.status already allows 'cancelled' (built that way from
-- the start, unlike the other four which needed step 1 of the original
-- script), so no constraint change needed here — just re-defining the
-- function to add the two bidal UPDATE statements, same thresholds and
-- same pattern as فشلة (no phase_started_at column, so
-- coalesce(started_at, created_at) is used for the in_progress check).
--
-- Safe to run standalone; does not touch the pg_cron schedule, which
-- already points at this function by name and will pick up the new
-- version automatically on its next run.
-- ============================================================================

create or replace function cleanup_stale_sessions()
returns void
language plpgsql
security definer
as $$
begin
  -- فشلة (no phase_started_at column — created_at/started_at is all there is)
  update sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(started_at, created_at) < now() - interval '2 hours';

  -- أبي أتزوج
  update shofah_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update shofah_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';

  -- مين بيتوظف
  update job_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update job_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';

  -- كمل القصيدة
  update qaseeda_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update qaseeda_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';

  -- كمل القصة
  update qissa_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update qissa_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';

  -- بدل الكلمة (no phase_started_at column — same shape as فشلة)
  update bidal_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update bidal_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(started_at, created_at) < now() - interval '2 hours';
end;
$$;

-- ============================================================================
-- Run it once immediately to clear out the 4 sessions already stuck.
-- Uncomment and run, or run separately from the Supabase SQL editor.
-- ============================================================================
-- select cleanup_stale_sessions();
