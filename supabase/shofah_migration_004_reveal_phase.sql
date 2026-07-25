-- ============================================================================
-- SHOFAH migration 004 — reveal phase
-- Adds 'reveal' as a valid round_phase, used for the winner-card/confetti
-- screen shown after voting closes and scores are computed.
-- ============================================================================

alter table shofah_sessions drop constraint shofah_sessions_round_phase_check;
alter table shofah_sessions add constraint shofah_sessions_round_phase_check
  check (round_phase in ('countdown', 'answering', 'voting', 'reveal'));
