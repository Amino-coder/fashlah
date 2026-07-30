-- ============================================================================
-- ACTIVE SESSIONS + WHO'S IN THEM
-- ============================================================================
-- Same idea as admin_active_sessions.sql, but also lists each session's
-- player nicknames (not just the count), and keeps the live_guess flag
-- since the cleanup job only sweeps every 30 minutes — status alone can
-- still lag behind reality by up to that long.
-- ============================================================================

with all_sessions as (
  select
    'فشلة' as game, s.code as room_code, s.status,
    s.created_at, s.started_at,
    coalesce(s.started_at, s.created_at) as last_activity,
    count(p.id) as player_count,
    string_agg(p.nickname, ', ' order by p.joined_at) as players
  from sessions s
  left join players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id

  union all

  select
    'أبي أتزوج', s.code, s.status, s.created_at, s.started_at,
    coalesce(s.phase_started_at, s.started_at, s.created_at),
    count(p.id),
    string_agg(p.nickname, ', ' order by p.joined_at)
  from shofah_sessions s
  left join shofah_players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id

  union all

  select
    'مين بيتوظف', s.code, s.status, s.created_at, s.started_at,
    coalesce(s.phase_started_at, s.started_at, s.created_at),
    count(p.id),
    string_agg(p.nickname, ', ' order by p.joined_at)
  from job_sessions s
  left join job_players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id

  union all

  select
    'كمل القصيدة', s.code, s.status, s.created_at, s.started_at,
    coalesce(s.phase_started_at, s.started_at, s.created_at),
    count(p.id),
    string_agg(p.nickname, ', ' order by p.joined_at)
  from qaseeda_sessions s
  left join qaseeda_players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id
)
select
  game, room_code, status,
  created_at as date_and_time,
  player_count,
  players,
  case
    when last_activity > now() - interval '30 minutes' then '🟢 likely live now'
    else '⚪ stale / abandoned'
  end as live_guess
from all_sessions
order by last_activity desc;


-- ----------------------------------------------------------------------------
-- OPTIONAL: one-line summary — total active sessions and total active
-- players, per game, right now.
-- ----------------------------------------------------------------------------
-- with all_sessions as ( <paste the same all_sessions CTE from above> )
-- select game, count(*) as active_sessions, sum(player_count) as active_players
-- from all_sessions
-- group by game
-- order by active_sessions desc;
