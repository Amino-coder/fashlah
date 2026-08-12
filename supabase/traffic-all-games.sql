-- ============================================================================
-- Traffic across every game — run in the Supabase SQL editor.
--
-- IMPORTANT — what this can see:
--
-- Real sessions (queries 1-3 below):
--   • All 7 games' MULTIPLAYER sessions (فشلة، شوفة، مين بيتوظف، قصيدة،
--     قصة، بدل الكلمة، إنسان حيوان جماد)
--   • بدل الكلمة's SOLO mode specifically (bidal_sessions.mode = 'solo')
--
-- Page views (query 4 below) — شوفة solo, وش شخصيتك, and every game's
-- /demo mode now log a view to page_views on load (see
-- supabase/page_views_schema.sql and lib/trackPageView.ts). These never
-- created a real session/player row and still don't — the games
-- themselves stay exactly as fast and isolated as before — this is a
-- separate, minimal table that exists purely to answer "is anyone
-- opening this page at all."
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Every session, every game, one unified list (most recent first)
-- ---------------------------------------------------------------------------
with all_sessions as (
  select 'fashlah'  as game, 'multiplayer' as mode, id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from sessions
  union all
  select 'shofah',   'multiplayer', id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from shofah_sessions
  union all
  select 'job',      'multiplayer', id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from job_sessions
  union all
  select 'qaseeda',  'multiplayer', id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from qaseeda_sessions
  union all
  select 'qissa',    'multiplayer', id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from qissa_sessions
  union all
  select 'bidal',    mode,          id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from bidal_sessions
  union all
  select 'ihj',      'multiplayer', id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from ihj_sessions
)
select * from all_sessions
order by created_at_riyadh desc;

-- ---------------------------------------------------------------------------
-- 2) Summary — total sessions per game/mode, with recent-activity windows
-- ---------------------------------------------------------------------------
with all_sessions as (
  select 'fashlah'  as game, 'multiplayer' as mode, created_at from sessions
  union all
  select 'shofah',   'multiplayer', created_at from shofah_sessions
  union all
  select 'job',      'multiplayer', created_at from job_sessions
  union all
  select 'qaseeda',  'multiplayer', created_at from qaseeda_sessions
  union all
  select 'qissa',    'multiplayer', created_at from qissa_sessions
  union all
  select 'bidal',    mode,          created_at from bidal_sessions
  union all
  select 'ihj',      'multiplayer', created_at from ihj_sessions
)
select
  game,
  mode,
  count(*)                                                          as total_sessions,
  count(*) filter (where created_at > now() - interval '1 day')     as last_24h,
  count(*) filter (where created_at > now() - interval '7 days')    as last_7_days,
  count(*) filter (where created_at > now() - interval '30 days')   as last_30_days
from all_sessions
group by game, mode
order by total_sessions desc;

-- ---------------------------------------------------------------------------
-- 3) بدل الكلمة solo vs multiplayer specifically, since it's the one game
--    with a real mode split worth comparing directly
-- ---------------------------------------------------------------------------
select
  mode,
  count(*) as total_sessions,
  count(*) filter (where status = 'completed') as completed,
  count(*) filter (where created_at > now() - interval '7 days') as last_7_days
from bidal_sessions
group by mode;

-- ---------------------------------------------------------------------------
-- 4) The previously-untracked solo/demo pages — now that page_views exists
--    and each of these pages logs a view on load, this is real data, not
--    an inferred zero. Run supabase/page_views_schema.sql first if you
--    haven't yet.
-- ---------------------------------------------------------------------------
select
  page,
  count(*) as total_views,
  count(*) filter (where created_at > now() - interval '1 day')   as last_24h,
  count(*) filter (where created_at > now() - interval '7 days')  as last_7_days,
  count(*) filter (where created_at > now() - interval '30 days') as last_30_days
from page_views
group by page
order by total_views desc;
