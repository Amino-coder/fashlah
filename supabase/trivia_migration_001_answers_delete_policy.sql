-- ============================================================================
-- Adds a DELETE policy to trivia_answers — missing from the original
-- schema, which only ever needed INSERT (submitting an answer) and
-- SELECT (reading results). "Play again" (same room) needs to clear
-- every answer row from the previous game before resetting
-- current_question_index back to 0, since reusing the same session_id
-- would otherwise collide with the old game's own question-0 answers
-- under the (session_id, question_index, player_id) unique constraint —
-- without this policy, that delete call is silently blocked by RLS
-- (zero rows affected, no error), which was the actual root cause of
-- a real reported bug: after play-again, the answering phase would get
-- skipped immediately because the stale answer count made it look like
-- everyone had already answered.
--
-- Scoped the same as the existing insert policy — any player in the
-- session, not host-only, since restarting the game is a normal action
-- any connected player can already trigger for the session itself.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

create policy "trivia_answers_own_session_delete" on trivia_answers for delete using (
  exists (select 1 from trivia_players p where p.session_id = trivia_answers.session_id and p.user_id = auth.uid())
);
