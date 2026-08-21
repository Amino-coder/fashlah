-- ============================================================================
-- Adds a limited hand-reshuffle: each player can discard their entire
-- current hand and get 6 fresh cards, up to 2 times per game (not per
-- round — the limit lives on the player row, not tied to round_number).
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

alter table ruin_story_players add column if not exists reshuffles_used int default 0;

-- ----------------------------------------------------------------------------
-- RESHUFFLE HAND — discards every card currently in the player's hand
-- (marks them used, same mechanism a submitted answer uses to leave the
-- hand) and deals 6 fresh ones via the existing dealing function, so it
-- inherits the exact same "never repeat a card already dealt to anyone
-- this session" guarantee. Blocked once a player has already submitted
-- this round (reshuffling an answer that's already locked in makes no
-- sense) and once they've used both of their reshuffles.
-- ----------------------------------------------------------------------------
create or replace function ruin_story_reshuffle_hand(p_player_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_session_id uuid;
  v_adult boolean;
  v_reshuffles int;
  v_round int;
  v_phase text;
  v_already_answered boolean;
begin
  if not exists (select 1 from ruin_story_players where id = p_player_id and user_id = auth.uid()) then
    return jsonb_build_object('error', 'Not your player');
  end if;

  select p.session_id, p.reshuffles_used, s.adult_mode, s.round_number, s.phase
  into v_session_id, v_reshuffles, v_adult, v_round, v_phase
  from ruin_story_players p join ruin_story_sessions s on s.id = p.session_id
  where p.id = p_player_id
  for update of p;

  if v_phase <> 'answering' then
    return jsonb_build_object('error', 'Can only reshuffle during the answering phase');
  end if;
  if v_reshuffles >= 2 then
    return jsonb_build_object('error', 'No reshuffles left');
  end if;

  select exists (
    select 1 from ruin_story_answers where session_id = v_session_id and round_number = v_round and player_id = p_player_id
  ) into v_already_answered;
  if v_already_answered then
    return jsonb_build_object('error', 'Already submitted this round');
  end if;

  update ruin_story_hands set used = true where player_id = p_player_id and used = false;
  update ruin_story_players set reshuffles_used = reshuffles_used + 1 where id = p_player_id;

  perform ruin_story_deal_to_player(v_session_id, p_player_id, v_adult);

  return jsonb_build_object('ok', true, 'reshuffles_left', 2 - (v_reshuffles + 1));
end;
$$;

revoke execute on function ruin_story_reshuffle_hand(uuid) from public;
grant execute on function ruin_story_reshuffle_hand(uuid) to authenticated, anon;
