-- ============================================================================
-- Adds الِّفوا أغنية to cleanup_stale_sessions() — it was missing entirely
-- since the game didn't exist when admin_cleanup_stale_sessions.sql (and
-- later migration_009_bidal_stale_cleanup.sql) were written. Same gap
-- بدل الكلمة had before migration_009 fixed it: without this, an
-- abandoned lifoo lobby or an in-progress game whose host disappeared
-- mid-round just sits there forever showing up in
-- active_sessions_all_games.sql.
--
-- lifoo_sessions has a phase_started_at column (same shape as قصيدة), so
-- this follows قصيدة's block exactly: coalesce(phase_started_at,
-- started_at, created_at) for the in_progress check.
--
-- Safe to run standalone; re-defines the same function migration_009
-- did, adding these two lifoo UPDATEs on top of everything already
-- there. Does not touch the pg_cron schedule, which already calls this
-- function by name and will pick up the new version on its next run.
-- ============================================================================

create or replace function cleanup_stale_sessions()
returns void
language plpgsql
security definer
as $$
begin
  -- فشلة
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

  -- بدل الكلمة (kept for safety even though it's fully local now and this
  -- table should stay empty — a harmless no-op update, not worth removing)
  update bidal_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update bidal_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(started_at, created_at) < now() - interval '2 hours';

  -- الِّفوا أغنية (new — same shape as قصيدة)
  update lifoo_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update lifoo_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';
end;
$$;

-- ============================================================================
-- Run it once immediately to clear out whatever's already stuck.
-- Uncomment and run, or run separately from the Supabase SQL editor.
-- ============================================================================
-- select cleanup_stale_sessions();
