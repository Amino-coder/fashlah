-- ============================================================================
-- RETROACTIVE CORRECTION — one-time fix for sessions that were provably
-- played to the end (full round data exists) but never got marked
-- 'completed', because of the timing-gap bug fixed in this same pass
-- (components/*/FinalReveal.tsx + app/ihj/session/[code]/page.tsx).
--
-- Each UPDATE only touches rows meeting the exact same "definitely
-- finished" bar as the diagnostic that found شوفة's 20: every round has
-- a real scored/authored result. This does NOT guess at borderline
-- cases — a session with 4 of 5 rounds scored stays exactly as it is,
-- since that's genuinely ambiguous (could be someone who left early).
--
-- Run once. Safe to re-run — every WHERE clause already excludes rows
-- that are status = 'completed', so a second run just finds nothing left
-- to touch.
-- ============================================================================

-- شوفة — the confirmed 20 from the diagnostic
update shofah_sessions s
set status = 'completed', ended_at = coalesce(ended_at, now())
where s.status <> 'completed'
  and (select count(*) from shofah_round_results rr where rr.session_id = s.id) >= 5;

-- مين بيتوظف — same pattern, same 5-round structure
update job_sessions s
set status = 'completed', ended_at = coalesce(ended_at, now())
where s.status <> 'completed'
  and (select count(*) from job_round_results rr where rr.session_id = s.id) >= 5;

-- كمل القصيدة — 5 rounds, one poem line each; "finished" means every
-- round has a winning line recorded
update qaseeda_sessions s
set status = 'completed', ended_at = coalesce(ended_at, now())
where s.status <> 'completed'
  and (select count(*) from qaseeda_round_results rr where rr.session_id = s.id) >= 5;

-- الِّفوا أغنية — 4 rounds (not 5 — see supabase/lifoo_schema.sql)
update lifoo_sessions s
set status = 'completed', ended_at = coalesce(ended_at, now())
where s.status <> 'completed'
  and (select count(*) from lifoo_round_results rr where rr.session_id = s.id) >= 4;

-- كمل القصة — no dedicated "stories" table; stories are assembled from
-- qissa_answers (one sentence per player per round). Per
-- supabase/qissa_schema.sql: rounds 1-3 are writing, round 4 is the
-- final reveal — so "definitely finished" means a real answer exists for
-- round_number = 3, the last writing round.
update qissa_sessions s
set status = 'completed', ended_at = coalesce(ended_at, now())
where s.status <> 'completed'
  and exists (select 1 from qissa_answers a where a.session_id = s.id and a.round_number = 3);

-- إنسان حيوان جماد — never had a service-role completion path at all
-- until this pass, so this one's the least likely to have false
-- negatives already self-corrected some other way — "finished" means
-- the round counter reached the session's own configured total_rounds.
update ihj_sessions s
set status = 'completed', ended_at = coalesce(ended_at, now())
where s.status <> 'completed'
  and s.current_round >= s.total_rounds
  and s.round_phase = 'reveal';

-- ----------------------------------------------------------------------------
-- Verify — re-run supabase/all_games_summary.sql afterward and compare
-- شوفة's total_completions against this query's own count, to confirm
-- the correction landed correctly.
-- ----------------------------------------------------------------------------
select 'شوفة' as game, count(*) as now_completed from shofah_sessions where status = 'completed'
union all
select 'مين بيتوظف', count(*) from job_sessions where status = 'completed'
union all
select 'كمل القصيدة', count(*) from qaseeda_sessions where status = 'completed'
union all
select 'الِّفوا أغنية', count(*) from lifoo_sessions where status = 'completed'
union all
select 'كمل القصة', count(*) from qissa_sessions where status = 'completed'
union all
select 'إنسان حيوان جماد', count(*) from ihj_sessions where status = 'completed';
