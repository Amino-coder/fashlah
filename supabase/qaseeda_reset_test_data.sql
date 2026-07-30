-- ============================================================================
-- قصيدة — wipe all test data (sessions, players, answers, votes, round
-- results). Does NOT touch qaseeda_openings (the curated opening bank) or
-- the shared users table. Safe to run anytime you want a clean slate for
-- testing.
-- ============================================================================

delete from qaseeda_round_results;
delete from qaseeda_votes;
delete from qaseeda_answers;
delete from qaseeda_players;
delete from qaseeda_sessions;
