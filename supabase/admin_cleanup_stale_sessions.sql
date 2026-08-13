-- ============================================================================
-- SCHEDULED CLEANUP — mark long-idle sessions as cancelled
-- ============================================================================
-- THE canonical version of this script. It supersedes and folds together
-- everything that was previously spread across four incremental patches
-- (migration_009_bidal_stale_cleanup.sql, migration_010_lifoo_stale_
-- cleanup.sql, migration_011_ihj_stale_cleanup.sql, migration_012_lifoo_
-- status_constraint_fix.sql) — those were all applied one at a time as
-- each game's gap was found, and by the end it was no longer obvious
-- which single file reflected the current, correct, complete state. This
-- file is that state. The four migration_0XX files can be deleted/
-- ignored from here on; nothing further needs to be run from them.
--
-- Safe to run again any time (e.g. after adding a brand-new game, or on
-- a fresh database) — every step here is idempotent: constraint changes
-- look up the existing constraint by name rather than assuming one
-- exists, the function is CREATE OR REPLACE, and re-scheduling the same
-- named cron job replaces it rather than erroring.
--
-- What it does:
--   1. Makes sure every session table's status column allows
--      'cancelled'. فشلة، بدل الكلمة، and إنسان حيوان جماد already had
--      it from the start; شوفة، مين بيتوظف، قصيدة، قصة، and لفوا didn't
--      (لفوا's was a straight-up bug in the original schema file —
--      caught the hard way, see the conversation this migration came
--      from).
--   2. (Re)creates cleanup_stale_sessions() — marks any session idle
--      past a threshold as cancelled, across all 8 games.
--   3. Schedules that function to run automatically every 30 minutes
--      via pg_cron.
--
-- THRESHOLDS: waiting > 3 hours, in_progress > 2 hours, with no
-- activity. Deliberately generous — a real game finishes in well under
-- 30 minutes end to end — specifically so this never touches an actual
-- live session.
--
-- بدل الكلمة NOTE: بدل الكلمة is fully local now (no session/player rows
-- at all — see app/bidal/solo/page.tsx). bidal_sessions stays in this
-- function as a harmless no-op purely for safety, since the table
-- should just sit empty going forward.
--
-- CAVEAT: no client UI branches on a 'cancelled' status — every game's
-- session page just renders whatever it renders for an unrecognized
-- status. Non-issue in practice given how generous the thresholds are,
-- but a graceful "this session was cancelled" screen would be a client-
-- side follow-up, not something this script can do.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Allow 'cancelled' on every session table that doesn't already.
--    Looks up each table's actual status check constraint by name rather
--    than guessing it, so this is safe to re-run regardless of how
--    Postgres happened to auto-name it, and safe for tables that already
--    allow 'cancelled' (the lookup finds nothing to drop, then the
--    add-constraint step is skipped via the same "does it already exist"
--    check).
-- ----------------------------------------------------------------------------
do $$
declare
  tbl text;
  cname text;
  already_ok boolean;
begin
  foreach tbl in array array[
    'sessions', 'shofah_sessions', 'job_sessions', 'qaseeda_sessions',
    'qissa_sessions', 'bidal_sessions', 'lifoo_sessions', 'ihj_sessions'
  ]
  loop
    select pg_get_constraintdef(oid) ilike '%''cancelled''%'
    into already_ok
    from pg_constraint
    where conrelid = tbl::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%in%';

    if already_ok then
      continue;
    end if;

    select conname into cname
    from pg_constraint
    where conrelid = tbl::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%in%';

    if cname is not null then
      execute format('alter table %I drop constraint %I', tbl, cname);
    end if;

    execute format(
      'alter table %I add constraint %I check (status in (''waiting'',''in_progress'',''completed'',''cancelled''))',
      tbl, tbl || '_status_check'
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2. The cleanup function itself — one game at a time, since there's no
--    shared sessions table to do this in a single statement.
-- ----------------------------------------------------------------------------
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

  -- بدل الكلمة (fully local now — this table stays empty going forward;
  -- kept here as a harmless no-op rather than special-cased out)
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

  -- إنسان حيوان جماد
  update ihj_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'waiting' and created_at < now() - interval '3 hours';

  update ihj_sessions
  set status = 'cancelled', ended_at = now()
  where status = 'in_progress'
    and coalesce(phase_started_at, started_at, created_at) < now() - interval '2 hours';
end;
$$;

revoke execute on function cleanup_stale_sessions() from public;
revoke execute on function cleanup_stale_sessions() from anon;
revoke execute on function cleanup_stale_sessions() from authenticated;

-- ----------------------------------------------------------------------------
-- 3. Schedule it — every 30 minutes. Re-running select cron.schedule()
--    with the same job name replaces the existing job rather than
--    erroring, so this is safe even though it was already scheduled.
-- ----------------------------------------------------------------------------
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-stale-bagdoonis-sessions',
  '*/30 * * * *',
  $$ select cleanup_stale_sessions(); $$
);

-- Run it once immediately, so anything already stuck clears right now
-- instead of waiting for the next cron tick.
select cleanup_stale_sessions();


-- ============================================================================
-- MANAGING THE JOB — uncomment whichever you need
-- ============================================================================

-- See all scheduled jobs (and confirm this one is registered):
-- select * from cron.job;

-- See its run history (success/failure, how long each run took):
-- select * from cron.job_run_details
-- where jobid = (select jobid from cron.job where jobname = 'cleanup-stale-bagdoonis-sessions')
-- order by start_time desc
-- limit 20;

-- Change the schedule (e.g. to hourly):
-- select cron.alter_job(
--   (select jobid from cron.job where jobname = 'cleanup-stale-bagdoonis-sessions'),
--   schedule => '0 * * * *'
-- );

-- Turn it off entirely:
-- select cron.unschedule('cleanup-stale-bagdoonis-sessions');
