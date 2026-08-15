-- ============================================================================
-- DIAGNOSTIC — why does شوفة show so few 'completed' sessions relative
-- to فشلة, when both are comparable party games?
--
-- Two real, different explanations were on the table:
--   (a) Completion tracking (the /api/mark-session-completed call in
--       components/shofah/FinalReveal.tsx) was only added after some
--       games had already launched — pre-existing finished games never
--       got the flag retroactively, since there's no backfill.
--   (b) شوفة's reveal has a ~4.6 second staged drumroll before the
--       completion call fires — someone closing the tab during that
--       animation would have genuinely finished playing (all 5 rounds
--       have results) but never trigger the write.
--
-- This can't be settled by reading the code alone — it needs your
-- actual data. This finds sessions that were clearly played through
-- all 5 rounds (every round has a scored result — the strongest
-- available signal that real people played it to the end) but never
-- ended up with status = 'completed'. A meaningful number of these
-- confirms the tracking is under-counting real completions — either
-- theory (a) or (b) — rather than shofah genuinely having a lower
-- completion RATE than فشلة.
-- ============================================================================

select
  s.id,
  s.code,
  s.status,
  (s.created_at AT TIME ZONE 'Asia/Riyadh') as created_at_riyadh,
  (select count(*) from shofah_round_results rr where rr.session_id = s.id) as rounds_with_results
from shofah_sessions s
where s.status <> 'completed'
  and (select count(*) from shofah_round_results rr where rr.session_id = s.id) >= 5
order by s.created_at desc;

-- ----------------------------------------------------------------------------
-- Summary count — if this is close to (or bigger than) the 114 "missing"
-- completions (120 total minus 6 tracked), that's strong evidence
-- completion tracking is under-firing, not that people are abandoning
-- early. If it's small, the low completion count is more likely genuine
-- — most started sessions really do get abandoned before the end.
-- ----------------------------------------------------------------------------
select count(*) as fully_played_but_not_marked_completed
from shofah_sessions s
where s.status <> 'completed'
  and (select count(*) from shofah_round_results rr where rr.session_id = s.id) >= 5;
