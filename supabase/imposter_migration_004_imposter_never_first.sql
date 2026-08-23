-- ============================================================================
-- The imposter never gets the first clue-turn of a round anymore —
-- going first is genuinely harder for them (no word to work from), so
-- this quietly biases the turn order in their favor without changing
-- anything else about how turn order looks or feels. Deliberately not
-- surfaced anywhere in the UI or the pre-game rules intro — this is a
-- game-balance decision, not a rule players are meant to know about.
--
-- Approach: shuffle everyone into random order as before, then if the
-- imposter happens to land in the first slot, swap them with a random
-- other player. Every other player's turn stays wherever the random
-- shuffle put them — only the imposter's specific case (landing first)
-- gets corrected.
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
  v_imposter_turn_order int;
  v_swap_id uuid;
  v_swap_order int;
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

  for v_player in select id from imposter_players where session_id = p_session_id order by random() loop
    update imposter_players set turn_order = v_i where id = v_player.id;
    v_i := v_i + 1;
  end loop;

  -- If the imposter landed first, swap them with a random other
  -- player's slot so someone who actually knows the word always
  -- speaks first instead.
  select turn_order into v_imposter_turn_order from imposter_players where id = v_imposter_id;
  if v_imposter_turn_order = 0 and v_i > 1 then
    select id, turn_order into v_swap_id, v_swap_order
    from imposter_players
    where session_id = p_session_id and id <> v_imposter_id
    order by random() limit 1;

    update imposter_players set turn_order = 0 where id = v_swap_id;
    update imposter_players set turn_order = v_swap_order where id = v_imposter_id;
  end if;

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
      turns_taken = 0,
      used_word_ids = array_append(v_used_words, v_word_id),
      phase = 'reveal_word',
      status = 'in_progress',
      round_number = v_round + 1,
      started_at = coalesce(started_at, now())
  where id = p_session_id;

  return jsonb_build_object('word_id', v_word_id, 'imposter_player_id', v_imposter_id, 'first_player_id', v_first_player_id);
end;
$$;
