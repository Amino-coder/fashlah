-- ============================================================================
-- ACTIVE SESSIONS ACROSS ALL GAMES — with a "still actually live" guess
-- ============================================================================
-- IMPORTANT: `status` alone does NOT mean "happening right now". Nothing in
-- this app ever marks a session abandoned — if someone creates a room and
-- never starts it, or closes the tab mid-game, that row just sits as
-- 'waiting'/'in_progress' forever. There is no cleanup job, and even
-- players.last_seen_at (fashlah only) is set once at insert and never
-- updated again, so it can't be used as a heartbeat either.
--
-- The best available recency signal:
--   - شوفة / مين بيتوظف / كمل القصيدة: phase_started_at, which moves every
--     time a round advances (roughly every 20-90s during real play).
--   - فشلة: no per-round timestamp exists, so started_at/created_at is all
--     there is.
--
-- `live_guess` below flags anything with no activity in the last 30
-- minutes as probably abandoned. Adjust the interval to taste — real games
-- here run maybe 10-20 minutes end to end, so even 30 minutes is generous.
-- ============================================================================

with all_sessions as (
  select
    'فشلة' as game, s.code as room_code, s.status,
    s.created_at, s.started_at,
    coalesce(s.started_at, s.created_at) as last_activity,
    count(p.id) as player_count
  from sessions s
  left join players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id

  union all

  select
    'أبي أتزوج', s.code, s.status, s.created_at, s.started_at,
    coalesce(s.phase_started_at, s.started_at, s.created_at),
    count(p.id)
  from shofah_sessions s
  left join shofah_players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id

  union all

  select
    'مين بيتوظف', s.code, s.status, s.created_at, s.started_at,
    coalesce(s.phase_started_at, s.started_at, s.created_at),
    count(p.id)
  from job_sessions s
  left join job_players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id

  union all

  select
    'كمل القصيدة', s.code, s.status, s.created_at, s.started_at,
    coalesce(s.phase_started_at, s.started_at, s.created_at),
    count(p.id)
  from qaseeda_sessions s
  left join qaseeda_players p on p.session_id = s.id
  where s.status in ('waiting', 'in_progress')
  group by s.id
)
select
  game, room_code, status, created_at, started_at, player_count,
  case
    when last_activity > now() - interval '30 minutes' then '🟢 likely live now'
    else '⚪ stale / abandoned'
  end as live_guess
from all_sessions
order by last_activity desc;


-- ----------------------------------------------------------------------------
-- OPTIONAL: just the count of genuinely stale rows per game, so you can see
-- the scale of the cleanup problem at a glance.
-- ----------------------------------------------------------------------------
-- select game, count(*) as stale_sessions
-- from (<paste the query above, minus the final order by>) t
-- where live_guess = '⚪ stale / abandoned'
-- group by game
-- order by stale_sessions desc;


-- ----------------------------------------------------------------------------
-- OPTIONAL: an actual fix, not just a diagnostic — bulk-mark old
-- waiting/in_progress sessions as abandoned so `status` stops lying.
-- Run per game (there's no shared sessions table to do this in one shot).
-- Review with the SELECT above first; this UPDATE is not reversible.
-- ----------------------------------------------------------------------------
-- update qaseeda_sessions
-- set status = 'completed', ended_at = now()
-- where status in ('waiting', 'in_progress')
--   and coalesce(phase_started_at, started_at, created_at) < now() - interval '6 hours';
