-- ============================================================================
-- إنسان حيوان جماد — category word-race game.
--
-- Two things need to be server-authoritative here, same reasoning as every
-- other game's SECURITY DEFINER functions in this app: (1) Arabic answer
-- normalization has to be applied identically and can't be trusted from
-- the client, since scoring depends entirely on which answers count as
-- "the same," and (2) the actual point calculation (comparing every
-- player's answer per category) has to happen once, atomically, not be
-- computed by whichever client happens to be watching.
-- ============================================================================

create table if not exists ihj_sessions (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,
  host_user_id       uuid not null,
  status             text not null default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  total_rounds       int not null default 5 check (total_rounds in (3, 5, 7, 10)),
  current_round      int not null default 0,
  current_letter     text,
  used_letters       jsonb not null default '[]'::jsonb,
  round_phase        text not null default 'answering' check (round_phase in ('answering', 'reveal', 'round_score')),
  phase_started_at   timestamptz,
  time_limit_seconds int not null default 60,
  lang               text not null default 'ar',
  started_at         timestamptz,
  ended_at           timestamptz,
  created_at         timestamptz default now()
);

create table if not exists ihj_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references ihj_sessions(id) on delete cascade,
  user_id       uuid not null,
  nickname      text not null,
  avatar_emoji  text not null default '😎',
  total_score   int not null default 0,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

create table if not exists ihj_answers (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references ihj_sessions(id) on delete cascade,
  round_number       int not null,
  player_id          uuid not null references ihj_players(id) on delete cascade,
  category           text not null check (category in ('human', 'animal', 'object', 'plant', 'country')),
  answer_text        text not null default '',
  normalized_answer  text not null default '',
  points             int,
  submitted_at       timestamptz default now(),
  -- A player can only ever have one answer per category per round — this
  -- is what stops "submit twice" or "change answer after submitting":
  -- a second insert attempt simply fails on this constraint rather than
  -- silently overwriting the first.
  unique (session_id, round_number, player_id, category)
);

create index if not exists ihj_answers_round_idx on ihj_answers(session_id, round_number);

alter table ihj_sessions enable row level security;
alter table ihj_players enable row level security;
alter table ihj_answers enable row level security;

create policy "ihj_sessions_read" on ihj_sessions for select using (true);
create policy "ihj_players_read" on ihj_players for select using (true);
create policy "ihj_answers_read" on ihj_answers for select using (true);

create policy "ihj_sessions_insert" on ihj_sessions for insert with check (true);
create policy "ihj_players_insert" on ihj_players for insert with check (true);
-- Answers are inserted directly by each player's own client (same pattern
-- as every other game's write-phase answers) — the unique constraint
-- above is what actually enforces "can't resubmit," not this policy.
create policy "ihj_answers_insert" on ihj_answers for insert with check (true);

create policy "ihj_sessions_host_update" on ihj_sessions for update using (host_user_id = auth.uid());

-- ============================================================================
-- Normalization — deliberately minimal, matching the spec's explicit
-- "don't make this overly intelligent" instruction. Only handles: alef
-- variants, tashkeel/diacritics, tatweel, stray punctuation/emoji, and
-- whitespace. Does NOT attempt spelling correction or semantic matching —
-- الرياض and مدينة الرياض must stay different answers.
-- ============================================================================
create or replace function ihj_normalize(input text) returns text
language plpgsql
immutable
as $$
declare
  result text;
begin
  if input is null then return ''; end if;
  result := trim(input);
  -- tashkeel / diacritics / quranic annotation marks
  result := regexp_replace(result, '[\u064B-\u065F\u0670\u06D6-\u06ED]', '', 'g');
  -- alef variants -> ا
  result := regexp_replace(result, '[أإآٱ]', 'ا', 'g');
  -- tatweel (kashida)
  result := replace(result, 'ـ', '');
  -- strip anything that isn't an Arabic letter, Latin letter, digit, or space
  -- (punctuation, emoji, symbols all fall away here)
  result := regexp_replace(result, '[^ابتثجحخدذرزسشصضطظعغفقكلمنهوىيءئؤةa-zA-Z0-9 ]', '', 'g');
  result := regexp_replace(result, '\s+', ' ', 'g');
  return trim(result);
end;
$$;

-- ============================================================================
-- Scoring — runs once per round, guarded against double-scoring by only
-- proceeding while round_phase is still 'answering'. For each of the 5
-- categories: normalizes every submitted answer, treats blank or
-- wrong-starting-letter answers as invalid (0), then groups the remaining
-- valid answers by normalized text — a group of 1 scores 10, a group of
-- 2+ scores 5 each. A player who never submitted simply has no rows for
-- the round, which naturally nets 0 without any special-casing.
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
