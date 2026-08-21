-- ============================================================================
-- ALL GAMES — one row per game: total views, and how many landed in each
-- of the 4 status categories (waiting / in_progress / completed /
-- cancelled — see the earlier conversation for what each means).
-- Run in the Supabase SQL editor.
--
-- STARTS FROM AUGUST 5, 2026 — everything before that was testing, not
-- real traffic, so it's excluded rather than skewing every number below.
-- To move this cutoff later, change CUTOFF_DATE in both CTEs below (search
-- for '2026-08-05' — it appears twice, once per CTE, since there's no
-- single shared FROM clause across two differently-shaped sources).
--
-- IMPORTANT — solo/demo/عبارات pages have no session row at all, so
-- they have no real waiting/in_progress concept the way multiplayer
-- games do (see lib/trackPageView.ts — they only ever log a 'view' and,
-- if finished, a 'complete'). Those two columns show NULL for these rows
-- rather than inventing numbers for categories that don't apply.
--
-- `cancelled` IS unified across both kinds of game, though — a solo/demo
-- view only counts here once it's been open 2+ hours with no matching
-- 'complete', same idle threshold the stale-session cleanup job uses to
-- mark a multiplayer session cancelled. Without that threshold, a solo
-- view from 2 minutes ago (someone still actively playing right now)
-- would get counted as "abandoned" right alongside one from 3 weeks
-- ago — this makes the column mean the same thing for every row instead
-- of just resembling it.
--
-- `active_now` is a real "is anyone here right now" number: same 1-hour
-- + no-complete-yet definition active_sessions_all_games.sql uses.
-- ============================================================================

with multiplayer as (
  select 'فشلة' as game, status, created_at from sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'شوفة', status, created_at from shofah_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'مين بيتوظف', status, created_at from job_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'كمل القصيدة', status, created_at from qaseeda_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'كمل القصة', status, created_at from qissa_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'الِّفوا أغنية', status, created_at from lifoo_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'إنسان حيوان جماد', status, created_at from ihj_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'مريض نفسي', status, created_at from mareed_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'المحتال', status, created_at from imposter_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  union all
  select 'خرب السالفة', status, created_at from ruin_story_sessions where created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
),
multiplayer_summary as (
  select
    game,
    count(*) as total_views,
    count(*) filter (where status = 'waiting')     as waiting,
    count(*) filter (where status = 'in_progress')  as in_progress,
    count(*) filter (where status = 'completed')    as completed,
    count(*) filter (where status = 'cancelled')    as cancelled,
    count(*) filter (where status in ('waiting', 'in_progress') and created_at > now() - interval '1 hour') as active_now
  from multiplayer
  group by game
),
solo_demo_summary as (
  select
    v.page as game,
    count(*) as total_views,
    null::bigint as waiting,
    null::bigint as in_progress,
    count(*) filter (where exists (
      select 1 from page_views c
      where c.page = v.page and c.event = 'complete'
        and c.session_key = v.session_key and v.session_key is not null
    )) as completed,
    -- Same idea as multiplayer's `cancelled`: only counts once it's been
    -- open 2+ hours with no completion — not just "hasn't completed yet",
    -- which would wrongly sweep in people still actively playing.
    count(*) filter (
      where v.created_at < now() - interval '2 hours'
      and not exists (
        select 1 from page_views c
        where c.page = v.page and c.event = 'complete'
          and c.session_key = v.session_key and v.session_key is not null
      )
    ) as cancelled,
    count(*) filter (
      where v.created_at > now() - interval '1 hour'
      and not exists (
        select 1 from page_views c
        where c.page = v.page and c.event = 'complete'
          and c.session_key = v.session_key and v.session_key is not null
      )
    ) as active_now
  from page_views v
  where v.event = 'view' and v.created_at >= ('2026-08-05'::date AT TIME ZONE 'Asia/Riyadh')
  group by v.page
)
select *,
  case when total_views > 0 then round(100.0 * completed / total_views, 1) else null end as completion_pct
from (
  select * from multiplayer_summary
  union all
  select * from solo_demo_summary
) all_games
order by total_views desc;
