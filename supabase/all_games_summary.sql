-- ============================================================================
-- ALL GAMES SUMMARY — same shape as traffic-all-games.sql's query 3
-- (game | total_views | total_completions | views_last_24h/7d/30d), just
-- extended to also cover the multiplayer games, which that query
-- deliberately left out (they live in page_views for solo/demo pages,
-- but multiplayer games have their own session tables instead).
--
-- For multiplayer games, "view" = a session was created (someone opened
-- the game and started hosting), "completion" = that session reached
-- status = 'completed'. Not a perfect match to "page opened" the way
-- page_views measures it for solo/demo pages, but it's the closest
-- honest equivalent multiplayer has, since there's no separate
-- page_views row for multiplayer landing pages.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

with multiplayer_totals as (
  select 'فشلة' as game, created_at, status = 'completed' as is_complete from sessions
  union all
  select 'شوفة', created_at, status = 'completed' from shofah_sessions
  union all
  select 'مين بيتوظف', created_at, status = 'completed' from job_sessions
  union all
  select 'كمل القصيدة', created_at, status = 'completed' from qaseeda_sessions
  union all
  select 'كمل القصة', created_at, status = 'completed' from qissa_sessions
  union all
  select 'الِّفوا أغنية', created_at, status = 'completed' from lifoo_sessions
  union all
  select 'إنسان حيوان جماد', created_at, status = 'completed' from ihj_sessions
  union all
  select 'مريض نفسي', created_at, status = 'completed' from mareed_sessions
  union all
  select 'المحتال', created_at, status = 'completed' from imposter_sessions
  union all
  select 'خرب السالفة', created_at, status = 'completed' from ruin_story_sessions
  union all
  select 'سؤال وجواب', created_at, status = 'completed' from trivia_sessions
),
multiplayer_summary as (
  select
    game,
    count(*) as total_views,
    count(*) filter (where is_complete) as total_completions,
    count(*) filter (where created_at > now() - interval '1 day')   as views_last_24h,
    count(*) filter (where created_at > now() - interval '7 days')  as views_last_7_days,
    count(*) filter (where created_at > now() - interval '30 days') as views_last_30_days
  from multiplayer_totals
  group by game
),
solo_demo_summary as (
  select
    page as game,
    count(*) filter (where event = 'view') as total_views,
    count(*) filter (where event = 'complete') as total_completions,
    count(*) filter (where event = 'view' and created_at > now() - interval '1 day')   as views_last_24h,
    count(*) filter (where event = 'view' and created_at > now() - interval '7 days')  as views_last_7_days,
    count(*) filter (where event = 'view' and created_at > now() - interval '30 days') as views_last_30_days
  from page_views
  group by page
)
select * from multiplayer_summary
union all
select * from solo_demo_summary
order by total_views desc;
