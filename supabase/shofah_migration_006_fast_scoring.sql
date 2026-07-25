-- ============================================================================
-- SHOFAH migration 006 — single-call round scoring
-- Moves the whole "tally votes, assign points, update scores, record the
-- winner, flip to reveal" sequence into one Postgres function, so the API
-- route makes ONE database round-trip instead of ~4 sequential ones. The
-- loop over players happens inside Postgres itself (no network hops between
-- steps), which is the main remaining latency win after parallelizing the
-- old version's per-player queries.
-- ============================================================================

create or replace function shofah_compute_round_result(p_session_id uuid, p_round_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_existing record;
  v_row record;
  v_rank int := 0;
  v_points int;
  v_winner_answer_id uuid;
  v_winner_player_id uuid;
  v_winner_text text;
  v_winner_nickname text;
  v_winner_avatar text;
begin
  -- Idempotency: if this round was already scored (e.g. two clients both
  -- detected "voting done" at once), just return the existing result.
  select rr.winner_player_id, a.text as answer_text, p.nickname, p.avatar_emoji
  into v_existing
  from shofah_round_results rr
  join shofah_answers a on a.id = rr.winner_answer_id
  join shofah_players p on p.id = rr.winner_player_id
  where rr.session_id = p_session_id and rr.round_number = p_round_number;

  if found then
    update shofah_sessions
    set round_phase = 'reveal', phase_started_at = now()
    where id = p_session_id and round_phase = 'voting';

    return jsonb_build_object(
      'already_computed', true,
      'winner_player_id', v_existing.winner_player_id,
      'winner_answer_text', v_existing.answer_text,
      'winner_nickname', v_existing.nickname,
      'winner_avatar', v_existing.avatar_emoji
    );
  end if;

  -- Rank this round's answers by vote count and hand out points 5/3/2/1...
  for v_row in
    select a.id as answer_id, a.player_id, a.text,
           count(v.id) as votes
    from shofah_answers a
    left join shofah_votes v on v.answer_id = a.id
    where a.session_id = p_session_id and a.round_number = p_round_number
    group by a.id, a.player_id, a.text
    order by count(v.id) desc, a.submitted_at asc
  loop
    v_rank := v_rank + 1;
    v_points := case v_rank when 1 then 5 when 2 then 3 when 3 then 2 else 1 end;

    update shofah_players
    set total_score = total_score + v_points
    where id = v_row.player_id;

    if v_rank = 1 then
      v_winner_answer_id := v_row.answer_id;
      v_winner_player_id := v_row.player_id;
      v_winner_text := v_row.text;
    end if;
  end loop;

  if v_winner_answer_id is null then
    return jsonb_build_object('error', 'No answers found for this round');
  end if;

  insert into shofah_round_results (session_id, round_number, winner_answer_id, winner_player_id)
  values (p_session_id, p_round_number, v_winner_answer_id, v_winner_player_id)
  on conflict (session_id, round_number) do nothing;

  select nickname, avatar_emoji into v_winner_nickname, v_winner_avatar
  from shofah_players where id = v_winner_player_id;

  update shofah_sessions
  set round_phase = 'reveal', phase_started_at = now()
  where id = p_session_id;

  return jsonb_build_object(
    'already_computed', false,
    'winner_player_id', v_winner_player_id,
    'winner_answer_text', v_winner_text,
    'winner_nickname', v_winner_nickname,
    'winner_avatar', v_winner_avatar
  );
end;
$$;

-- Lock this down to the service role only — regular players' browser
-- clients (using the anon/authenticated key) should never be able to call
-- this directly and trigger arbitrary scoring for any session.
revoke execute on function shofah_compute_round_result(uuid, int) from public;
revoke execute on function shofah_compute_round_result(uuid, int) from anon;
revoke execute on function shofah_compute_round_result(uuid, int) from authenticated;
grant execute on function shofah_compute_round_result(uuid, int) to service_role;
