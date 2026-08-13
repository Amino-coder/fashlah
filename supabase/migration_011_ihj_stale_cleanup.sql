-- ============================================================================
-- Adds إنسان حيوان جماد to cleanup_stale_sessions() — this is the actual
-- fix for the ihj rows sitting in active_sessions_all_games.sql. ihj was
-- flagged as missing from cleanup coverage back when بدل الكلمة's gap was
-- first diagnosed, but only بدل الكلمة actually got added at the time —
-- ihj was never followed up on. That's on me; this migration corrects it.
--
-- Also re-asserts لفوا's block from migration_010, in case that file was
-- never actually executed (only the one-off manual UPDATE for the two
-- specific stuck codes was run afterward, which fixed those two rows but
-- never touched the function itself) — so AR5PFD and any future
-- abandoned لفوا lobby actually get swept up by the recurring cron job
-- instead of relying on a manual UPDATE every time.
--
-- ihj_sessions has phase_started_at (same shape as قصيدة/شوفة/مين
-- بيتوظف/قصة/لفوا), so it follows their block, not بدل الكلمة's.
--
-- Unlike migration_009/010, the cleanup_stale_sessions() call at the
-- bottom is NOT commented out — it runs as part of this script, so
-- anything already stuck gets cleared the moment this is executed
-- instead of waiting on the uncomment step, which is what actually
-- caused لفوا's AR5PFD to sit around uncleaned even after the function
-- itself may have been correctly updated by migration_010.
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

  -- بدل الكلمة (kept as a harmless no-op — table stays empty now that it's fully local)
  update bidal_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update bidal_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(started_at, created_at) < now() - interval '2 hours';

  -- الِّفوا أغنية
  update lifoo_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update lifoo_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';

  -- إنسان حيوان جماد (new — the actual fix this migration is for)
  update ihj_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update ihj_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';
end;
$$;

-- Runs immediately — clears out everything already stuck right now,
-- not just future sessions going forward.
select cleanup_stale_sessions();
