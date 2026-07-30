-- ============================================================================
-- SCHEDULED CLEANUP — mark long-idle sessions as cancelled
-- ============================================================================
-- Run this once in the Supabase SQL editor. It does three things:
--   1. Extends شوفة/مين بيتوظف/كمل القصيدة's status column to allow
--      'cancelled' (فشلة already has it — its status check already included
--      'cancelled' from the start, the others never did).
--   2. Creates cleanup_stale_sessions(), which marks any session that's
--      been idle past a threshold as cancelled instead of leaving it
--      lying about being 'waiting'/'in_progress' forever.
--   3. Schedules that function to run automatically every 30 minutes via
--      pg_cron.
--
-- THRESHOLDS: waiting > 3 hours, in_progress > 2 hours, with no activity.
-- These are deliberately generous — a real game here finishes in well
-- under 30 minutes end to end — specifically so this never touches an
-- actual live session. Tune the intervals below if you want it tighter.
--
-- CAVEAT: the client apps don't currently have any UI for a 'cancelled'
-- status — none of the four games' session pages branch on it. In
-- practice this is a non-issue given how generous the thresholds are (no
-- real player is ever mid-game 2+ hours after their last round), but if
-- you ever want a graceful "this session was cancelled" screen instead of
-- whatever the client happens to render for an unrecognized status, that
-- would be a small follow-up to the app code, not this script.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Allow 'cancelled' on شوفة / مين بيتوظف / كمل القصيدة (فشلة already
--    allows it). Looks up each table's actual status check constraint by
--    name rather than guessing it, so this is safe to re-run regardless
--    of how Postgres happened to auto-name it.
-- ----------------------------------------------------------------------------
do $$
declare
  tbl text;
  cname text;
begin
  foreach tbl in array array['shofah_sessions', 'job_sessions', 'qaseeda_sessions']
  loop
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
end;
$$;

-- Only pg_cron (running as the job owner) or you from the SQL editor
-- should ever call this — never exposed to the browser client.
revoke execute on function cleanup_stale_sessions() from public;
revoke execute on function cleanup_stale_sessions() from anon;
revoke execute on function cleanup_stale_sessions() from authenticated;

-- ----------------------------------------------------------------------------
-- 3. Schedule it — every 30 minutes.
-- ----------------------------------------------------------------------------
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-stale-bagdoonis-sessions',
  '*/30 * * * *',
  $$ select cleanup_stale_sessions(); $$
);


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

-- Run it once immediately, without waiting for the schedule:
-- select cleanup_stale_sessions();

-- Change the schedule (e.g. to hourly):
-- select cron.alter_job(
--   (select jobid from cron.job where jobname = 'cleanup-stale-bagdoonis-sessions'),
--   schedule => '0 * * * *'
-- );

-- Turn it off entirely:
-- select cron.unschedule('cleanup-stale-bagdoonis-sessions');
