-- ============================================================================
-- SHOFAH migration 001 — round phase tracking
-- Needed for Phase 3 (timed answer input -> timed anonymous voting).
-- Run this after shofah_schema.sql (and after shofah_seed.sql, order doesn't
-- matter between those two, but this migration must come after the schema).
-- ============================================================================

alter table shofah_sessions
  add column round_phase text default 'answering' check (round_phase in ('answering', 'voting')),
  add column phase_started_at timestamptz;
