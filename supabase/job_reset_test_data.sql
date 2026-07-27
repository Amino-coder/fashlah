-- ============================================================================
-- JOB INTERVIEW — wipe all test data (sessions, players, answers, votes,
-- round prompts, round results, warm-up votes/prompts). Does NOT touch
-- job_prompts or job_prewarm_prompts (the question banks) or the shared
-- users table. Safe to run anytime you want a clean slate for testing.
-- ============================================================================

delete from job_round_results;
delete from job_votes;
delete from job_answers;
delete from job_round_prompts;
delete from job_prewarm_votes;
delete from job_prewarm_round_prompts;
delete from job_players;
delete from job_sessions;
