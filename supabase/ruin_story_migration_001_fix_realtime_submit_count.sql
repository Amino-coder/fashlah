-- ============================================================================
-- Fixes a real bug: ruin_story_answers' SELECT policy only permits a
-- player to read their OWN row (correct, for anonymity) — but Supabase
-- Realtime also respects RLS, so a client only receives postgres_changes
-- notifications for rows it's allowed to SELECT. That means the judge
-- (and every other player) never received a realtime signal when
-- someone else submitted an answer — "0/2 answered" just sat frozen,
-- and the answering→judging transition (which depended on that same
-- broken signal) never fired automatically either. A manual refresh
-- "worked" only because it queried the anonymous view directly instead
-- of relying on realtime — but nothing was ever pushing a live update,
-- and the transition check itself never re-ran without a refresh.
--
-- Fix: route the "someone submitted" signal through ruin_story_sessions
-- instead, which is openly readable and already realtime-subscribed by
-- every client. A new counter column there gets atomically incremented
-- (inside the same function that inserts the answer, so it can never
-- drift out of sync with the real count) every time someone submits —
-- everyone's existing session subscription picks that up immediately,
-- no new subscription needed. This keeps ruin_story_answers itself just
-- as locked down as before; nothing about the anonymity guarantee
-- changes, only how the COUNT of submissions gets communicated.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

alter table ruin_story_sessions add column if not exists answers_submitted_count int default 0;

-- ----------------------------------------------------------------------------
-- SUBMIT ANSWER — replaces the direct client insert. Inserts the answer
-- and bumps the session's counter as one atomic unit (both happen or
-- neither does), which is what actually prevents the counter drifting
-- out of sync with reality if a client insert succeeded but a separate
-- follow-up "bump the count" call failed or raced. security definer,
-- but verifies p_player_id genuinely belongs to the caller first —
-- it bypasses RLS internally, so that check is what stands in for it.
-- ----------------------------------------------------------------------------
create or replace function ruin_story_submit_answer(p_session_id uuid, p_round_number int, p_player_id uuid, p_card_id uuid)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from ruin_story_players where id = p_player_id and user_id = auth.uid()) then
    return jsonb_build_object('error', 'Not your player');
  end if;

  insert into ruin_story_answers (session_id, round_number, player_id, card_id)
  values (p_session_id, p_round_number, p_player_id, p_card_id)
  on conflict (session_id, round_number, player_id) do nothing;

  update ruin_story_sessions
  set answers_submitted_count = answers_submitted_count + 1
  where id = p_session_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function ruin_story_submit_answer(uuid, int, uuid, uuid) from public;
grant execute on function ruin_story_submit_answer(uuid, int, uuid, uuid) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- The counter has to reset to 0 at the start of every round, or it just
-- keeps climbing across rounds — both places a new round begins
-- (round 1's start_round, and select_winner setting up rounds 2-6) now
-- reset it in the same update that already sets the new round's other
-- fields, so there's no separate reset step to forget.
-- ----------------------------------------------------------------------------
create or replace function ruin_story_start_round(p_session_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_used_black uuid[];
  v_black_id uuid;
  v_current_judge uuid;
  v_next_judge uuid;
  v_adult boolean;
  v_player record;
begin
  select used_black_card_ids, judge_player_id, adult_mode
  into v_used_black, v_current_judge, v_adult
  from ruin_story_sessions where id = p_session_id for update;

  select id into v_black_id from ruin_story_black_cards
  where active = true and not (id = any(v_used_black))
  order by random() limit 1;
  if v_black_id is null then
    v_used_black := '{}';
    select id into v_black_id from ruin_story_black_cards where active = true order by random() limit 1;
  end if;

  select id into v_next_judge from ruin_story_players
  where session_id = p_session_id and (v_current_judge is null or id > v_current_judge)
  order by id asc limit 1;
  if v_next_judge is null then
    select id into v_next_judge from ruin_story_players where session_id = p_session_id order by id asc limit 1;
  end if;

  update ruin_story_sessions
  set black_card_id = v_black_id,
      judge_player_id = v_next_judge,
      used_black_card_ids = array_append(v_used_black, v_black_id),
      phase = 'answering',
      status = 'in_progress',
      answers_submitted_count = 0,
      started_at = coalesce(started_at, now())
  where id = p_session_id;

  for v_player in select id from ruin_story_players where session_id = p_session_id loop
    perform ruin_story_deal_to_player(p_session_id, v_player.id, v_adult);
  end loop;

  return jsonb_build_object('black_card_id', v_black_id, 'judge_player_id', v_next_judge);
end;
$$;

create or replace function ruin_story_select_winner(p_session_id uuid, p_card_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_round int;
  v_judge uuid;
  v_black uuid;
  v_winner_player uuid;
  v_adult boolean;
  v_existing record;
  v_player record;
  v_used_black uuid[];
  v_next_black uuid;
  v_next_judge uuid;
begin
  select round_number, judge_player_id, black_card_id, adult_mode, used_black_card_ids
  into v_round, v_judge, v_black, v_adult, v_used_black
  from ruin_story_sessions where id = p_session_id for update;

  select * into v_existing from ruin_story_round_results where session_id = p_session_id and round_number = v_round;
  if found then
    update ruin_story_sessions set phase = 'reveal' where id = p_session_id and phase <> 'reveal';
    return jsonb_build_object('already_computed', true, 'winning_player_id', v_existing.winning_player_id, 'winning_card_id', v_existing.winning_card_id);
  end if;

  select player_id into v_winner_player from ruin_story_answers
  where session_id = p_session_id and round_number = v_round and card_id = p_card_id;

  if v_winner_player is null then
    return jsonb_build_object('error', 'That card was not a valid answer for this round');
  end if;

  update ruin_story_hands set used = true
  where card_id in (select card_id from ruin_story_answers where session_id = p_session_id and round_number = v_round)
    and player_id in (select player_id from ruin_story_answers where session_id = p_session_id and round_number = v_round);

  update ruin_story_players set score = score + 1 where id = v_winner_player;

  insert into ruin_story_round_results (session_id, round_number, judge_player_id, black_card_id, winning_player_id, winning_card_id)
  values (p_session_id, v_round, v_judge, v_black, v_winner_player, p_card_id);

  if v_round >= 6 then
    update ruin_story_sessions set phase = 'reveal', status = 'completed', ended_at = now() where id = p_session_id;
  else
    select id into v_next_black from ruin_story_black_cards
    where active = true and not (id = any(v_used_black))
    order by random() limit 1;
    if v_next_black is null then
      v_used_black := '{}';
      select id into v_next_black from ruin_story_black_cards where active = true order by random() limit 1;
    end if;

    select id into v_next_judge from ruin_story_players
    where session_id = p_session_id and id > v_judge
    order by id asc limit 1;
    if v_next_judge is null then
      select id into v_next_judge from ruin_story_players where session_id = p_session_id order by id asc limit 1;
    end if;

    update ruin_story_sessions
    set phase = 'reveal',
        round_number = v_round + 1,
        black_card_id = v_next_black,
        judge_player_id = v_next_judge,
        used_black_card_ids = array_append(v_used_black, v_next_black),
        answers_submitted_count = 0
    where id = p_session_id;

    for v_player in select id from ruin_story_players where session_id = p_session_id loop
      perform ruin_story_deal_to_player(p_session_id, v_player.id, v_adult);
    end loop;
  end if;

  return jsonb_build_object('already_computed', false, 'winning_player_id', v_winner_player, 'winning_card_id', p_card_id);
end;
$$;
