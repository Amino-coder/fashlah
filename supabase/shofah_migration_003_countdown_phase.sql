-- ============================================================================
-- SHOFAH migration 003 — countdown phase
-- Adds 'countdown' as a valid round_phase, used for the shared 5-4-3-2-1
-- intermission between the host hitting Start and round 1's prompt showing.
-- ============================================================================

alter table shofah_sessions drop constraint shofah_sessions_round_phase_check;
alter table shofah_sessions add constraint shofah_sessions_round_phase_check
  check (round_phase in ('countdown', 'answering', 'voting'));
