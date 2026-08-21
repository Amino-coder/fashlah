-- ============================================================================
-- Traffic across every game — run in the Supabase SQL editor.
--
-- IMPORTANT — what this can see:
--
-- Real sessions (queries 1-2 below): every game's MULTIPLAYER sessions —
-- فشلة، شوفة، مين بيتوظف، قصيدة، قصة، الِّفوا أغنية، إنسان حيوان جماد،
-- مريض نفسي، المحتال، خرب السالفة.
--
-- بدل الكلمة is NOT in queries 1-2 anymore. It used to be — this file
-- originally documented a bidal_sessions.mode split between 'solo' and
-- 'multiplayer' rows, back when solo mode also created a session row.
-- That's no longer true: بدل الكلمة is fully local now (see
-- app/bidal/solo/page.tsx), multiplayer was removed entirely, and
-- bidal_sessions just sits permanently empty. Its traffic lives in
-- query 3 below instead, same place as every other solo-only page.
--
-- Page views (query 3 below) — شوفة solo, وش شخصيتك, بدل الكلمة solo,
-- الِّفوا أغنية solo, and every game's /demo mode all log a view to
-- page_views on load (see supabase/page_views_schema.sql and
-- lib/trackPageView.ts). These never created a real session/player row
-- and still don't — this is a separate, minimal table that exists
-- purely to answer "is anyone opening this page at all."
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Every multiplayer session, every game, one unified list (most recent first)
-- ---------------------------------------------------------------------------
with all_sessions as (
  select 'fashlah'  as game, id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from sessions
  union all
  select 'shofah',   id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from shofah_sessions
  union all
  select 'job',      id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from job_sessions
  union all
  select 'qaseeda',  id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from qaseeda_sessions
  union all
  select 'qissa',    id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from qissa_sessions
  union all
  select 'lifoo',    id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from lifoo_sessions
  union all
  select 'ihj',      id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from ihj_sessions
  union all
  select 'mareed',   id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from mareed_sessions
  union all
  select 'imposter', id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from imposter_sessions
  union all
  select 'ruin_story', id, code, status, (created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh from ruin_story_sessions
)
select * from all_sessions
order by created_at_riyadh desc;

-- ---------------------------------------------------------------------------
-- 2) Summary — total multiplayer sessions per game, with recent-activity windows
-- ---------------------------------------------------------------------------
with all_sessions as (
  select 'fashlah'  as game, created_at from sessions
  union all
  select 'shofah',   created_at from shofah_sessions
  union all
  select 'job',      created_at from job_sessions
  union all
  select 'qaseeda',  created_at from qaseeda_sessions
  union all
  select 'qissa',    created_at from qissa_sessions
  union all
  select 'lifoo',    created_at from lifoo_sessions
  union all
  select 'ihj',      created_at from ihj_sessions
  union all
  select 'mareed',   created_at from mareed_sessions
  union all
  select 'imposter', created_at from imposter_sessions
  union all
  select 'ruin_story', created_at from ruin_story_sessions
)
select
  game,
  count(*)                                                          as total_sessions,
  count(*) filter (where created_at > now() - interval '1 day')     as last_24h,
  count(*) filter (where created_at > now() - interval '7 days')    as last_7_days,
  count(*) filter (where created_at > now() - interval '30 days')   as last_30_days
from all_sessions
group by game
order by total_sessions desc;

-- ---------------------------------------------------------------------------
-- 3) Every solo/demo page tracked via page_views — includes بدل الكلمة
--    solo (bidal_solo), الِّفوا أغنية solo (lifoo_solo), and إنسان حيوان
--    جماد solo (ihj_solo) alongside وش شخصيتك and شوفة solo. "completed"
--    here means a matching 'complete' event exists for that same visit's
--    session_key — this is the one place solo-only games' actual
--    completion rate shows up, since they have no session row to carry a
--    status. Grouped generically by `page`, so any future solo page
--    shows up here automatically the moment it starts calling
--    trackPageView — nothing to add here when that happens.
-- ---------------------------------------------------------------------------
select
  page,
  count(*) filter (where event = 'view') as total_views,
  count(*) filter (where event = 'complete') as total_completions,
  count(*) filter (where event = 'view' and created_at > now() - interval '1 day')   as views_last_24h,
  count(*) filter (where event = 'view' and created_at > now() - interval '7 days')  as views_last_7_days,
  count(*) filter (where event = 'view' and created_at > now() - interval '30 days') as views_last_30_days
from page_views
group by page
order by total_views desc;
