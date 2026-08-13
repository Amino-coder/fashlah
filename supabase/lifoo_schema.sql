-- ============================================================================
-- الِّفوا أغنية (Build a Song) — complete Supabase / Postgres setup
-- ============================================================================
-- Run this ONCE in the Supabase SQL editor, after the base schema.sql.
--
-- This is a rebranded, modified fork of كمل القصيدة (qaseeda_schema.sql) —
-- same round engine, same realtime + poll fallback, same 5/3/2/1 scoring,
-- same opening_select phase and "poem/song so far assembled live" idea.
-- Two real mechanical differences from قصيدة:
--   * Rounds 1-4, not 1-5 (TOTAL_ROUNDS lives in the client, same as
--     قصيدة, but the round_phase/current_round shape here is sized for 4).
--   * Each ROUND's submission is ONE line, not a two-hemistich بيت — so
--     lifoo_answers has a single `line` column instead of line1/line2.
--     The opening verse itself (lifoo_openings / the session's
--     opening_line1+opening_line2) is UNCHANGED — still two lines, since
--     all four starting-verse options are genuine two-line verses.
--
-- Nothing here touches qaseeda_/fashlah_/shofah_/job_'s tables. The only
-- shared table is `users`, which already exists.
-- ============================================================================

drop function if exists lifoo_compute_round_result(uuid, int);
drop table if exists lifoo_round_results cascade;
drop table if exists lifoo_votes cascade;
drop table if exists lifoo_answers cascade;
drop table if exists lifoo_players cascade;
drop table if exists lifoo_sessions cascade;
drop table if exists lifoo_openings cascade;

-- ----------------------------------------------------------------------------
-- OPENINGS — the curated starting verses (وردة الجزائرية / محمد عبده /
-- عبدالرحمن محمد), same "small fixed set, not random" idea as
-- qaseeda_openings. `poet` here is the singer/writer credited on the card.
-- ----------------------------------------------------------------------------
create table lifoo_openings (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  sort_order  int not null default 0,
  line1       text not null,
  line2       text not null,
  poet        text not null,
  active      boolean default true
);

-- ----------------------------------------------------------------------------
-- SESSIONS
-- ----------------------------------------------------------------------------
create table lifoo_sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  host_user_id  uuid references users(id),
  lang          text default 'ar' check (lang in ('ar', 'en')),
  status        text default 'waiting' check (status in ('waiting', 'in_progress', 'completed')),
  -- 0 = lobby + opening selection, 1-4 = writing/voting rounds,
  -- 5 = cinematic final reveal
  current_round int default 0,
  round_phase   text default 'opening_select' check (round_phase in (
                  'opening_select', 'countdown', 'answering', 'voting', 'reveal'
                )),
  phase_started_at timestamptz,
  -- The starting verse the whole song grows from.
  opening_line1            text,
  opening_line2            text,
  opening_poet             text,
  opening_category         text,
  opening_is_custom        boolean default false,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table lifoo_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references lifoo_sessions(id) on delete cascade,
  user_id       uuid references users(id),
  nickname      text not null,
  avatar_emoji  text default '🎶',
  total_score   int default 0,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

-- Breaks the same session<->player circular dependency qaseeda_schema.sql
-- has to — only ever set when opening_is_custom = true.
alter table lifoo_sessions
  add column opening_author_player_id uuid references lifoo_players(id);

-- ----------------------------------------------------------------------------
-- ANSWERS — each round's submitted next LINE. Single `line` column (not
-- line1/line2 like قصيدة) — this is the one real schema difference, since
-- الِّفوا أغنية adds one line per round, never a two-hemistich بيت.
-- ----------------------------------------------------------------------------
create table lifoo_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references lifoo_sessions(id) on delete cascade,
  round_number  int not null,
  player_id     uuid references lifoo_players(id) on delete cascade,
  line          text not null check (char_length(line) <= 120),
  submitted_at  timestamptz default now(),
  unique (session_id, round_number, player_id)
);

-- ----------------------------------------------------------------------------
-- VOTES — self-voting allowed, same reasoning as قصيدة (groups sometimes
-- play solo, and the "prize" is just which line joins the song).
-- ----------------------------------------------------------------------------
create table lifoo_votes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references lifoo_sessions(id) on delete cascade,
  round_number      int not null,
  voter_player_id   uuid references lifoo_players(id) on delete cascade,
  answer_id         uuid references lifoo_answers(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- ROUND_RESULTS
-- ----------------------------------------------------------------------------
create table lifoo_round_results (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references lifoo_sessions(id) on delete cascade,
  round_number        int not null,
  winner_answer_id    uuid references lifoo_answers(id),
  winner_player_id    uuid references lifoo_players(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_lifoo_players_session on lifoo_players(session_id);
create index idx_lifoo_answers_session_round on lifoo_answers(session_id, round_number);
create index idx_lifoo_votes_session_round on lifoo_votes(session_id, round_number);
create index idx_lifoo_round_results_session on lifoo_round_results(session_id);
create index idx_lifoo_openings_active_sort on lifoo_openings(active, sort_order);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table lifoo_sessions enable row level security;
alter table lifoo_players enable row level security;
alter table lifoo_openings enable row level security;
alter table lifoo_answers enable row level security;
alter table lifoo_votes enable row level security;
alter table lifoo_round_results enable row level security;

create policy "lifoo_sessions_read" on lifoo_sessions for select using (true);
create policy "lifoo_sessions_host_insert" on lifoo_sessions for insert with check (host_user_id = auth.uid());
create policy "lifoo_sessions_host_update" on lifoo_sessions for update using (host_user_id = auth.uid());

create policy "lifoo_players_read" on lifoo_players for select using (true);
create policy "lifoo_players_self_insert" on lifoo_players for insert with check (user_id = auth.uid());
create policy "lifoo_players_self_update" on lifoo_players for update using (user_id = auth.uid());

create policy "lifoo_openings_read" on lifoo_openings for select using (true);

create policy "lifoo_answers_read" on lifoo_answers for select using (true);
create policy "lifoo_answers_own_insert" on lifoo_answers for insert with check (
  exists (select 1 from lifoo_players where id = player_id and user_id = auth.uid())
);

create policy "lifoo_votes_read" on lifoo_votes for select using (true);
create policy "lifoo_votes_own_insert" on lifoo_votes for insert with check (
  exists (select 1 from lifoo_players where id = voter_player_id and user_id = auth.uid())
);

create policy "lifoo_round_results_read" on lifoo_round_results for select using (true);

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table lifoo_sessions;
alter publication supabase_realtime add table lifoo_players;
alter publication supabase_realtime add table lifoo_answers;
alter publication supabase_realtime add table lifoo_votes;

-- ----------------------------------------------------------------------------
-- SCORING — identical shape to qaseeda_compute_round_result, adapted for
-- the single `line` column instead of line1/line2.
-- ----------------------------------------------------------------------------
create or replace function lifoo_compute_round_result(p_session_id uuid, p_round_number int)
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
  v_winner_line text;
  v_winner_nickname text;
  v_winner_avatar text;
begin
  select rr.winner_player_id, a.line as answer_line, p.nickname, p.avatar_emoji
  into v_existing
  from lifoo_round_results rr
  join lifoo_answers a on a.id = rr.winner_answer_id
  join lifoo_players p on p.id = rr.winner_player_id
  where rr.session_id = p_session_id and rr.round_number = p_round_number;

  if found then
    update lifoo_sessions
    set round_phase = 'reveal', phase_started_at = now()
    where id = p_session_id and round_phase = 'voting';

    return jsonb_build_object(
      'already_computed', true,
      'winner_player_id', v_existing.winner_player_id,
      'winner_line', v_existing.answer_line,
      'winner_nickname', v_existing.nickname,
      'winner_avatar', v_existing.avatar_emoji
    );
  end if;

  for v_row in
    select a.id as answer_id, a.player_id, a.line,
           count(v.id) as votes
    from lifoo_answers a
    left join lifoo_votes v on v.answer_id = a.id
    where a.session_id = p_session_id and a.round_number = p_round_number
    group by a.id, a.player_id, a.line
    order by count(v.id) desc, a.submitted_at asc
  loop
    v_rank := v_rank + 1;
    v_points := case v_rank when 1 then 5 when 2 then 3 when 3 then 2 else 1 end;

    update lifoo_players
    set total_score = total_score + v_points
    where id = v_row.player_id;

    if v_rank = 1 then
      v_winner_answer_id := v_row.answer_id;
      v_winner_player_id := v_row.player_id;
      v_winner_line := v_row.line;
    end if;
  end loop;

  if v_winner_answer_id is null then
    return jsonb_build_object('error', 'No lines submitted for this round');
  end if;

  insert into lifoo_round_results (session_id, round_number, winner_answer_id, winner_player_id)
  values (p_session_id, p_round_number, v_winner_answer_id, v_winner_player_id)
  on conflict (session_id, round_number) do nothing;

  select nickname, avatar_emoji into v_winner_nickname, v_winner_avatar
  from lifoo_players where id = v_winner_player_id;

  update lifoo_sessions
  set round_phase = 'reveal', phase_started_at = now()
  where id = p_session_id;

  return jsonb_build_object(
    'already_computed', false,
    'winner_player_id', v_winner_player_id,
    'winner_line', v_winner_line,
    'winner_nickname', v_winner_nickname,
    'winner_avatar', v_winner_avatar
  );
end;
$$;

revoke execute on function lifoo_compute_round_result(uuid, int) from public;
revoke execute on function lifoo_compute_round_result(uuid, int) from anon;
revoke execute on function lifoo_compute_round_result(uuid, int) from authenticated;
grant execute on function lifoo_compute_round_result(uuid, int) to service_role;

-- ============================================================================
-- SEED — the three curated starting verses, exactly as specified.
-- ============================================================================
insert into lifoo_openings (category, sort_order, line1, line2, poet) values
  ('طرب', 1,
   'بتونس بيك وإنت معايا', 'بتونس بيك وبلاقي في قربك دنيايا',
   'وردة الجزائرية'),
  ('طرب سعودي', 2,
   'الأماكن كلها مشتاقة لك', 'والعيون اللي انرسم فيها خيالك',
   'محمد عبده'),
  ('شعر غزل', 3,
   'أصابك عشق أم رميت بأسهم', 'فما هذه إلا سجية مغرم',
   'عبدالرحمن محمد');
