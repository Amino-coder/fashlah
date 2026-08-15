-- Active sessions (waiting or in_progress) across every game, with player
-- count and nicknames for the games that have named players, plus recent
-- activity on the pages that don't have real sessions (وش شخصيتك, شوفة
-- solo, بدل الكلمة, الِّفوا أغنية solo, إنسان حيوان جماد solo) — those
-- count as "active" only if opened in the last hour AND not yet finished
-- (no matching 'complete' event for that same visit).
-- Requires supabase/page_views_schema.sql AND
-- supabase/page_views_migration_001_completion.sql to have been run.
-- Run in the Supabase SQL editor.

select 'fashlah' as game, s.id, s.code, s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from players p where p.session_id = s.id) as player_count,
  (select string_agg(p.nickname, ', ') from players p where p.session_id = s.id) as player_names
from sessions s where s.status in ('waiting','in_progress')
union all
select 'shofah', s.id, s.code, s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from shofah_players p where p.session_id = s.id),
  (select string_agg(p.nickname, ', ') from shofah_players p where p.session_id = s.id)
from shofah_sessions s where s.status in ('waiting','in_progress')
union all
select 'job', s.id, s.code, s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from job_players p where p.session_id = s.id),
  (select string_agg(p.nickname, ', ') from job_players p where p.session_id = s.id)
from job_sessions s where s.status in ('waiting','in_progress')
union all
select 'qaseeda', s.id, s.code, s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from qaseeda_players p where p.session_id = s.id),
  (select string_agg(p.nickname, ', ') from qaseeda_players p where p.session_id = s.id)
from qaseeda_sessions s where s.status in ('waiting','in_progress')
union all
select 'lifoo', s.id, s.code, s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from lifoo_players p where p.session_id = s.id),
  (select string_agg(p.nickname, ', ') from lifoo_players p where p.session_id = s.id)
from lifoo_sessions s where s.status in ('waiting','in_progress')
union all
select 'qissa', s.id, s.code, s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from qissa_players p where p.session_id = s.id),
  (select string_agg(p.nickname, ', ') from qissa_players p where p.session_id = s.id)
from qissa_sessions s where s.status in ('waiting','in_progress')
union all
-- بدل الكلمة is fully local now (no session/player rows at all — see
-- app/bidal/solo/page.tsx) so, same as وش شخصيتك and شوفة solo below,
-- "active" here means opened in the last hour with no matching
-- 'complete' event yet, read from page_views instead of a sessions table.
select 'bidal_solo', v.id, null::text, 'view', (v.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh, null::bigint, null::text
from page_views v
where v.page = 'bidal_solo' and v.event = 'view' and v.created_at > now() - interval '1 hour'
  and not exists (
    select 1 from page_views c
    where c.page = 'bidal_solo' and c.event = 'complete'
      and c.session_key = v.session_key and v.session_key is not null
  )
union all
select 'ihj', s.id, s.code, s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from ihj_players p where p.session_id = s.id),
  (select string_agg(p.nickname, ', ') from ihj_players p where p.session_id = s.id)
from ihj_sessions s where s.status in ('waiting','in_progress')
union all
select 'wadak', v.id, null::text, 'view', (v.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh, null::bigint, null::text
from page_views v
where v.page = 'wadak' and v.event = 'view' and v.created_at > now() - interval '1 hour'
  and not exists (
    select 1 from page_views c
    where c.page = 'wadak' and c.event = 'complete'
      and c.session_key = v.session_key and v.session_key is not null
  )
union all
select 'shofah_solo', v.id, null::text, 'view', (v.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh, null::bigint, null::text
from page_views v
where v.page = 'shofah_solo' and v.event = 'view' and v.created_at > now() - interval '1 hour'
  and not exists (
    select 1 from page_views c
    where c.page = 'shofah_solo' and c.event = 'complete'
      and c.session_key = v.session_key and v.session_key is not null
  )
union all
select 'lifoo_solo', v.id, null::text, 'view', (v.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh, null::bigint, null::text
from page_views v
where v.page = 'lifoo_solo' and v.event = 'view' and v.created_at > now() - interval '1 hour'
  and not exists (
    select 1 from page_views c
    where c.page = 'lifoo_solo' and c.event = 'complete'
      and c.session_key = v.session_key and v.session_key is not null
  )
union all
select 'ihj_solo', v.id, null::text, 'view', (v.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh, null::bigint, null::text
from page_views v
where v.page = 'ihj_solo' and v.event = 'view' and v.created_at > now() - interval '1 hour'
  and not exists (
    select 1 from page_views c
    where c.page = 'ihj_solo' and c.event = 'complete'
      and c.session_key = v.session_key and v.session_key is not null
  )
order by created_at_riyadh desc;
