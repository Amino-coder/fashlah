-- ============================================================================
-- SHOFAH — wipe all test data (sessions, players, answers, votes, round
-- prompts, round results, prewarm votes/round prompts). Does NOT touch
-- shofah_prompts or shofah_prewarm_prompts (the question banks) or the
-- shared users table. Safe to run anytime you want a clean slate for
-- testing.
-- ============================================================================

delete from shofah_round_results;
delete from shofah_votes;
delete from shofah_answers;
delete from shofah_round_prompts;
delete from shofah_prewarm_votes;
delete from shofah_prewarm_round_prompts;
delete from shofah_players;
delete from shofah_sessions;
