-- ============================================================================
-- Adds 'reveal_word' as a valid imposter_sessions.phase value, and
-- updates imposter_start_round() to begin every round there instead of
-- jumping straight to 'clue'.
--
-- reveal_word is a fixed 10-second phase, identical in shape to the
-- clue-phase timer (same turn_started_at column, just a different
-- duration read client-side) — every player's own screen shows their
-- own word (or "أنت المحتال" for the imposter) during it, before any
-- turn-taking begins. This is distinct from — and doesn't replace — the
-- word staying visible to each player for the rest of the clue phase
-- too (see app/imposter/session/[code]/page.tsx): reveal_word is the
-- upfront "everyone reads their word at the same time" beat, the
-- persistent display during 'clue' is "don't make anyone forget it
-- mid-game."
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

alter table imposter_sessions drop constraint if exists imposter_sessions_phase_check;
alter table imposter_sessions add constraint imposter_sessions_phase_check
  check (phase in ('reveal_word', 'clue', 'voting', 'reveal'));

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
      round_number = v_round,
      started_at = coalesce(started_at, now())
  where id = p_session_id;

  return jsonb_build_object('word_id', v_word_id, 'imposter_player_id', v_imposter_id, 'first_player_id', v_first_player_id);
end;
$$;
