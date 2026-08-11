-- ============================================================================
-- Adds what the shareable results screen needs: the session's starting
-- word (current_word gets overwritten every move, so the original has to
-- be captured separately to reconstruct the word flow قلب → قلم → ...).
-- ============================================================================

alter table bidal_sessions add column if not exists starting_word text;

-- Backfill for any session already in progress: best-effort reconstruction
-- from the earliest recorded move, or the current word if there are none.
update bidal_sessions s
set starting_word = coalesce(
  (select m.prev_word from bidal_moves m where m.session_id = s.id order by m.move_index asc limit 1),
  s.current_word
)
where starting_word is null;
