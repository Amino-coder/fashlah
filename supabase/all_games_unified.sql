-- ============================================================================
-- ALL GAMES, ONE TABLE — multiplayer + solo + demo + عبارات, this
-- calendar month. Run in the Supabase SQL editor.
--
-- Multiplayer games (real session rows, one row per session created):
--   فشلة، شوفة، مين بيتوظف، قصيدة، قصة، الِّفوا أغنية، إنسان حيوان جماد
--
-- Solo games (no session table — page_views 'view'/'complete' pairs,
-- one row per visit; 'completed' means that visit's session_key has a
-- matching 'complete' event, 'in_progress_or_left' means it doesn't —
-- same logic as all_sessions_month_to_date.sql's page_views branches):
--   بدل الكلمة، شوفة solo، الِّفوا أغنية solo، وش شخصيتك، إنسان حيوان
--   جماد solo
--
-- Demo pages (same page_views pattern):
--   فشلة، شوفة، مين بيتوظف، قصيدة، قصة demo modes
--
-- عبارات (عبارات has no session/game concept at all — every "visit" is
-- just drawing a card or not — tracked the same page_views way as solo
-- games above)
--
-- This list is the exact set of page keys the app code currently calls
-- trackPageView/trackPageComplete with — grep for
-- `trackPageView("` across the repo if a new solo/demo page is ever
-- added and this needs a new page_views branch to match.
--
-- Requires supabase/page_views_schema.sql AND
-- supabase/page_views_migration_001_completion.sql to have been run.
-- ============================================================================

with multiplayer as (
  select 'فشلة' as game, 'multiplayer' as kind, s.status,
    (s.created_at AT TIME ZONE 'Asia/Riyadh') as at_riyadh,
    (select count(*) from players p where p.session_id = s.id) as player_count,
    (select string_agg(p.nickname, ', ') from players p where p.session_id = s.id) as players
  from sessions s
  where s.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')

  union all
  select 'شوفة', 'multiplayer', s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh'),
    (select count(*) from shofah_players p where p.session_id = s.id),
    (select string_agg(p.nickname, ', ') from shofah_players p where p.session_id = s.id)
  from shofah_sessions s
  where s.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')

  union all
  select 'مين بيتوظف', 'multiplayer', s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh'),
    (select count(*) from job_players p where p.session_id = s.id),
    (select string_agg(p.nickname, ', ') from job_players p where p.session_id = s.id)
  from job_sessions s
  where s.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')

  union all
  select 'كمل القصيدة', 'multiplayer', s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh'),
    (select count(*) from qaseeda_players p where p.session_id = s.id),
    (select string_agg(p.nickname, ', ') from qaseeda_players p where p.session_id = s.id)
  from qaseeda_sessions s
  where s.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')

  union all
  select 'كمل القصة', 'multiplayer', s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh'),
    (select count(*) from qissa_players p where p.session_id = s.id),
    (select string_agg(p.nickname, ', ') from qissa_players p where p.session_id = s.id)
  from qissa_sessions s
  where s.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')

  union all
  select 'الِّفوا أغنية', 'multiplayer', s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh'),
    (select count(*) from lifoo_players p where p.session_id = s.id),
    (select string_agg(p.nickname, ', ') from lifoo_players p where p.session_id = s.id)
  from lifoo_sessions s
  where s.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')

  union all
  select 'إنسان حيوان جماد', 'multiplayer', s.status, (s.created_at AT TIME ZONE 'Asia/Riyadh'),
    (select count(*) from ihj_players p where p.session_id = s.id),
    (select string_agg(p.nickname, ', ') from ihj_players p where p.session_id = s.id)
  from ihj_sessions s
  where s.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')
),

-- One row per 'view' event for every solo/demo/عبارات page — status is
-- derived per-visit (matched by session_key), player_count/players are
-- always null since none of these have named players.
page_view_pages as (
  select unnest(array[
    'bidal_solo', 'shofah_solo', 'lifoo_solo', 'wadak', 'ihj_solo', 'ibarat',
    'fashlah_demo', 'shofah_demo', 'job_demo', 'qaseeda_demo', 'qissa_demo'
  ]) as page
),
solo_and_demo as (
  select
    pp.page as game,
    case
      when pp.page like '%_demo' then 'demo'
      else 'solo'
    end as kind,
    case when exists (
      select 1 from page_views c
      where c.page = pp.page and c.event = 'complete'
        and c.session_key = v.session_key and v.session_key is not null
    ) then 'completed' else 'in_progress_or_left' end as status,
    (v.created_at AT TIME ZONE 'Asia/Riyadh') as at_riyadh,
    null::bigint as player_count,
    null::text as players
  from page_view_pages pp
  join page_views v on v.page = pp.page and v.event = 'view'
  where v.created_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') AT TIME ZONE 'Asia/Riyadh')
)

select * from multiplayer
union all
select * from solo_and_demo
order by at_riyadh desc;
