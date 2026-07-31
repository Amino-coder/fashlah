-- ============================================================================
-- قصة — wipe all test data (sessions, players, answers). Safe to run
-- anytime you want a clean slate for testing.
-- ============================================================================

delete from qissa_answers;
delete from qissa_players;
delete from qissa_sessions;
