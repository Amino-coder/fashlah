-- ============================================================================
-- Fixes two real bugs in imposter_start_round, both only visible on a
-- SECOND (or later) game in the same room via "play again":
--
-- 1. round_number was read and then written back UNCHANGED every time
--    this function ran — despite its own column comment saying
--    "increments each play again," it never actually did. Since
--    imposter_votes and imposter_round_results both use
--    (session_id, round_number, ...) as their real uniqueness
--    constraint, a second game reusing round_number=1 collided with the
--    first game's own vote/result rows the moment anyone tried to vote
--    again — that INSERT would fail on the unique constraint, votes
--    would silently never reach "everyone voted," and the game would
--    get stuck in voting forever. This is almost certainly the "voting
--    doesn't work after play again" bug.
--
-- 2. turn_order was set once at join time and never touched again, so
--    every game in a room — including every replay — used the exact
--    same speaking order. Now reshuffled at the start of every round.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

create or replace function imposter_start_round(p_session_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_used_words uuid[];
  v_word_id uuid;
  v_imposter_id uuid;
  v_first_player_id uuid;
  v_round int;
  v_player record;
  v_i int := 0;
begin
  select used_word_ids, round_number into v_used_words, v_round from imposter_sessions where id = p_session_id for update;

  select id into v_word_id from imposter_words
  where active = true and not (id = any(v_used_words))
  order by random() limit 1;

  if v_word_id is null then
    v_used_words := '{}';
    select id into v_word_id from imposter_words where active = true order by random() limit 1;
  end if;

  select id into v_imposter_id from imposter_players
  where session_id = p_session_id
  order by imposter_count asc, random()
  limit 1;

  -- Reshuffle the speaking order for this game — a fresh random
  -- turn_order every time, not just at first join, so a replay in the
  -- same room doesn't always go in the same sequence.
  for v_player in select id from imposter_players where session_id = p_session_id order by random() loop
    update imposter_players set turn_order = v_i where id = v_player.id;
    v_i := v_i + 1;
  end loop;

  select id into v_first_player_id from imposter_players
  where session_id = p_session_id
  order by turn_order asc
  limit 1;

  update imposter_players set imposter_count = imposter_count + 1 where id = v_imposter_id;

  update imposter_sessions
  set word_id = v_word_id,
      imposter_player_id = v_imposter_id,
      turn_player_id = v_first_player_id,
      turn_started_at = now(),
      used_word_ids = array_append(v_used_words, v_word_id),
      phase = 'reveal_word',
      status = 'in_progress',
      round_number = v_round + 1,
      started_at = coalesce(started_at, now())
  where id = p_session_id;

  return jsonb_build_object('word_id', v_word_id, 'imposter_player_id', v_imposter_id, 'first_player_id', v_first_player_id);
end;
$$;
