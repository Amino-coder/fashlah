-- ============================================================================
-- Fixes the actual root cause of migration_011's failure: lifoo_sessions'
-- status check constraint was written as
--   check (status in ('waiting', 'in_progress', 'completed'))
-- in supabase/lifoo_schema.sql — 'cancelled' was simply left out. That's
-- a mistake in the original schema, not something that changed later.
-- Every other game needed this same fix once (see step 1 of
-- admin_cleanup_stale_sessions.sql for شوفة/مين بيتوظف/قصيدة/قصة, and
-- بدل الكلمة/إنسان حيوان جماد both happened to already allow it from the
-- start) — لفوا just never got it done at schema-creation time.
--
-- Same dynamic constraint lookup as admin_cleanup_stale_sessions.sql
-- step 1, so this is safe to re-run regardless of the constraint's
-- actual auto-generated name.
-- ============================================================================

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'lifoo_sessions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%in%';

  if cname is not null then
    execute format('alter table lifoo_sessions drop constraint %I', cname);
  end if;

  execute
    'alter table lifoo_sessions add constraint lifoo_sessions_status_check '
    || 'check (status in (''waiting'',''in_progress'',''completed'',''cancelled''))';
end $$;

-- Now that the constraint actually permits it, re-run the cleanup this
-- failed partway through — it's fine that ihj_sessions' update already
-- succeeded before lifoo_sessions' update hit the error; re-running is
-- idempotent, it just re-marks whatever's still genuinely stale.
select cleanup_stale_sessions();
