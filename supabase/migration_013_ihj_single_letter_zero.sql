-- ============================================================================
-- Fixes ihj_score_round so a single-letter answer never scores — right
-- now, e.g. answering the "human" category for the letter ب with just
-- "ب" itself passes every existing check (non-empty, starts with the
-- round's letter) and scores exactly like a real word would. Adds a
-- length check after normalization: char_length(normalized_answer) > 1.
--
-- ihj_normalize() (see supabase/ihj_schema.sql) only strips/substitutes
-- characters — diacritics, alef variants, punctuation — it never
-- collapses multiple letters into fewer, so checking length AFTER
-- normalization is a safe, accurate proxy for "how many actual letters
-- did they type," not something that could misfire on a legitimately
-- normalized real word.
--
-- Run once in the Supabase SQL editor. Safe to re-run — CREATE OR
-- REPLACE FUNCTION.
-- ============================================================================

create or replace function ihj_score_round(p_session_id uuid, p_round_number int) returns jsonb
language plpgsql
security definer
as $$
declare
  v_letter text;
  v_phase text;
  v_norm_letter text;
  cat text;
  categories text[] := array['human', 'animal', 'object', 'plant', 'country'];
  rec record;
begin
  select current_letter, round_phase into v_letter, v_phase from ihj_sessions where id = p_session_id for update;
  if v_letter is null then return jsonb_build_object('success', false, 'reason', 'not_found'); end if;
  if v_phase <> 'answering' then return jsonb_build_object('success', false, 'reason', 'already_scored'); end if;

  v_norm_letter := ihj_normalize(v_letter);

  foreach cat in array categories loop
    update ihj_answers
      set normalized_answer = ihj_normalize(answer_text), points = 0
      where session_id = p_session_id and round_number = p_round_number and category = cat;

    for rec in
      select normalized_answer, count(*) as cnt
      from ihj_answers
      where session_id = p_session_id and round_number = p_round_number and category = cat
        and normalized_answer <> '' and left(normalized_answer, 1) = v_norm_letter
        and char_length(normalized_answer) > 1
      group by normalized_answer
    loop
      update ihj_answers
        set points = case when rec.cnt = 1 then 10 else 5 end
        where session_id = p_session_id and round_number = p_round_number and category = cat
          and normalized_answer = rec.normalized_answer;
    end loop;
  end loop;

  update ihj_players p
    set total_score = total_score + coalesce((
      select sum(points) from ihj_answers a
      where a.session_id = p_session_id and a.round_number = p_round_number and a.player_id = p.id
    ), 0)
    where p.session_id = p_session_id;

  update ihj_sessions set round_phase = 'reveal' where id = p_session_id;

  return jsonb_build_object('success', true);
end;
$$;
