-- ============================================================================
-- كمل القصيدة (Complete the Poem) — complete Supabase / Postgres setup
-- ============================================================================
-- Run this ONCE in the Supabase SQL editor, after the base schema.sql.
--
-- Single consolidated file rather than a migration chain, same as
-- job_schema.sql — the game is brand new, so tables, RLS, realtime wiring,
-- the scoring function and the seed content are all created together.
--
-- Reuses the same session/player/answer/vote/round-result shape as Shofah
-- and Job Interview (same round engine, same realtime + reconnect handling,
-- same 5/3/2/1 scoring), with the mechanic itself swapped out:
--   * No per-round prompt bank. Round N's "prompt" IS the poem so far — the
--     opening بيت plus every previous round's winning line — so there's no
--     qaseeda_round_prompts table; the client assembles it by joining
--     qaseeda_round_results -> qaseeda_answers -> qaseeda_players.
--   * A one-time "opening_select" phase before round 1, where the host picks
--     one of four famous أبيات (qaseeda_openings) or writes a custom one.
--     The chosen line is denormalized straight onto the session row (it's
--     picked once and never changes, and a custom one never lived in the
--     bank table to begin with).
--   * No prewarm round — nothing here to warm up with, it's one continuous
--     collaborative write.
--
-- Nothing here is shared with fashlah_/shofah_/job_'s tables. The ONLY
-- shared table is `users` (device-bound anonymous identity) from
-- schema.sql, which this file assumes already exists.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- OPENINGS  (curated bank of famous opening أبيات — small and fixed, not
-- drawn at random: the five cards on the opening-select screen are always
-- the same well-known set, ordered by sort_order)
-- ----------------------------------------------------------------------------
create table qaseeda_openings (
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
create table qaseeda_sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  host_user_id  uuid references users(id),
  lang          text default 'ar' check (lang in ('ar', 'en')),
  status        text default 'waiting' check (status in ('waiting', 'in_progress', 'completed')),
  -- 0 = lobby + opening selection, 1-5 = writing/voting rounds,
  -- 6 = cinematic final reveal
  current_round int default 0,
  round_phase   text default 'opening_select' check (round_phase in (
                  'opening_select', 'countdown', 'answering', 'voting', 'reveal'
                )),
  phase_started_at timestamptz,
  -- The seed بيت the whole poem grows from.
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
create table qaseeda_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references qaseeda_sessions(id) on delete cascade,
  user_id       uuid references users(id),
  nickname      text not null,
  avatar_emoji  text default '🖋️',
  total_score   int default 0,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

-- opening_author_player_id references qaseeda_players, which can't exist
-- until after qaseeda_sessions is created (and qaseeda_players references
-- qaseeda_sessions right back) — added here to break the circular
-- dependency. Only ever set when opening_is_custom = true, crediting
-- whoever (the host) typed the custom opening line in.
alter table qaseeda_sessions
  add column opening_author_player_id uuid references qaseeda_players(id);

-- ----------------------------------------------------------------------------
-- ANSWERS  (each round's submitted next-line)
-- ----------------------------------------------------------------------------
create table qaseeda_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references qaseeda_sessions(id) on delete cascade,
  round_number  int not null,
  player_id     uuid references qaseeda_players(id) on delete cascade,
  text          text not null check (char_length(text) <= 120),
  submitted_at  timestamptz default now(),
  unique (session_id, round_number, player_id)
);

-- ----------------------------------------------------------------------------
-- VOTES
-- ----------------------------------------------------------------------------
-- Self-voting is blocked in the UI (a player's own submission is shown but
-- not selectable during voting), same pattern as the other games.
create table qaseeda_votes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references qaseeda_sessions(id) on delete cascade,
  round_number      int not null,
  voter_player_id   uuid references qaseeda_players(id) on delete cascade,
  answer_id         uuid references qaseeda_answers(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- ROUND_RESULTS  (winner pointer per round — the winning answer becomes the
-- next official line of the poem; also what makes the final reveal a simple
-- ordered lookup)
-- ----------------------------------------------------------------------------
create table qaseeda_round_results (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references qaseeda_sessions(id) on delete cascade,
  round_number        int not null,
  winner_answer_id    uuid references qaseeda_answers(id),
  winner_player_id    uuid references qaseeda_players(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_qaseeda_players_session on qaseeda_players(session_id);
create index idx_qaseeda_answers_session_round on qaseeda_answers(session_id, round_number);
create index idx_qaseeda_votes_session_round on qaseeda_votes(session_id, round_number);
create index idx_qaseeda_round_results_session on qaseeda_round_results(session_id);
create index idx_qaseeda_openings_active_sort on qaseeda_openings(active, sort_order);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table qaseeda_sessions enable row level security;
alter table qaseeda_players enable row level security;
alter table qaseeda_openings enable row level security;
alter table qaseeda_answers enable row level security;
alter table qaseeda_votes enable row level security;
alter table qaseeda_round_results enable row level security;

-- Sessions: public read (code lookup has to work before joining),
-- host-only write (this covers the opening-select writes too — those are
-- just session updates from the host's client).
create policy "qaseeda_sessions_read" on qaseeda_sessions for select using (true);
create policy "qaseeda_sessions_host_insert" on qaseeda_sessions for insert with check (host_user_id = auth.uid());
create policy "qaseeda_sessions_host_update" on qaseeda_sessions for update using (host_user_id = auth.uid());

-- Players: public read (lobby + round screens show everyone), own row only for writes.
create policy "qaseeda_players_read" on qaseeda_players for select using (true);
create policy "qaseeda_players_self_insert" on qaseeda_players for insert with check (user_id = auth.uid());
create policy "qaseeda_players_self_update" on qaseeda_players for update using (user_id = auth.uid());

-- Openings: public read-only reference data.
create policy "qaseeda_openings_read" on qaseeda_openings for select using (true);

-- Answers: public read (voting needs to see them all), own player_id to insert.
create policy "qaseeda_answers_read" on qaseeda_answers for select using (true);
create policy "qaseeda_answers_own_insert" on qaseeda_answers for insert with check (
  exists (select 1 from qaseeda_players where id = player_id and user_id = auth.uid())
);

-- Votes: public read (live vote counts), own voter_player_id to insert.
create policy "qaseeda_votes_read" on qaseeda_votes for select using (true);
create policy "qaseeda_votes_own_insert" on qaseeda_votes for insert with check (
  exists (select 1 from qaseeda_players where id = voter_player_id and user_id = auth.uid())
);

-- Round results: public read; written server-side with the service role key.
create policy "qaseeda_round_results_read" on qaseeda_round_results for select using (true);

-- ----------------------------------------------------------------------------
-- REALTIME
-- Without this, INSERT/UPDATE events never broadcast to subscribed clients,
-- so the lobby player list and phase transitions only update on a manual
-- page refresh.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table qaseeda_sessions;
alter publication supabase_realtime add table qaseeda_players;
alter publication supabase_realtime add table qaseeda_answers;
alter publication supabase_realtime add table qaseeda_votes;

-- ----------------------------------------------------------------------------
-- SCORING  (one call does the whole tally -> points -> winner -> phase flip,
-- so the API route makes a single database round-trip instead of ~4. The
-- winning answer becomes the next official line of the poem — the client
-- reads it back out of qaseeda_round_results the same way Shofah reads its
-- round winners.)
-- ----------------------------------------------------------------------------
create or replace function qaseeda_compute_round_result(p_session_id uuid, p_round_number int)
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
  -- Idempotency: if this round was already scored (two clients can both
  -- detect "voting done" at once), return the existing result.
  select rr.winner_player_id, a.text as answer_text, p.nickname, p.avatar_emoji
  into v_existing
  from qaseeda_round_results rr
  join qaseeda_answers a on a.id = rr.winner_answer_id
  join qaseeda_players p on p.id = rr.winner_player_id
  where rr.session_id = p_session_id and rr.round_number = p_round_number;

  if found then
    update qaseeda_sessions
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

  -- Rank this round's lines by vote count, hand out 5/3/2/1 points.
  for v_row in
    select a.id as answer_id, a.player_id, a.text,
           count(v.id) as votes
    from qaseeda_answers a
    left join qaseeda_votes v on v.answer_id = a.id
    where a.session_id = p_session_id and a.round_number = p_round_number
    group by a.id, a.player_id, a.text
    order by count(v.id) desc, a.submitted_at asc
  loop
    v_rank := v_rank + 1;
    v_points := case v_rank when 1 then 5 when 2 then 3 when 3 then 2 else 1 end;

    update qaseeda_players
    set total_score = total_score + v_points
    where id = v_row.player_id;

    if v_rank = 1 then
      v_winner_answer_id := v_row.answer_id;
      v_winner_player_id := v_row.player_id;
      v_winner_text := v_row.text;
    end if;
  end loop;

  if v_winner_answer_id is null then
    return jsonb_build_object('error', 'No lines submitted for this round');
  end if;

  insert into qaseeda_round_results (session_id, round_number, winner_answer_id, winner_player_id)
  values (p_session_id, p_round_number, v_winner_answer_id, v_winner_player_id)
  on conflict (session_id, round_number) do nothing;

  select nickname, avatar_emoji into v_winner_nickname, v_winner_avatar
  from qaseeda_players where id = v_winner_player_id;

  update qaseeda_sessions
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

-- Service role only — a player's browser client should never be able to
-- trigger arbitrary scoring for any session.
revoke execute on function qaseeda_compute_round_result(uuid, int) from public;
revoke execute on function qaseeda_compute_round_result(uuid, int) from anon;
revoke execute on function qaseeda_compute_round_result(uuid, int) from authenticated;
grant execute on function qaseeda_compute_round_result(uuid, int) to service_role;

-- ============================================================================
-- SEED — the four curated opening أبيات
-- ============================================================================
insert into qaseeda_openings (category, sort_order, line1, line2, poet) values
  ('شعر حكمة', 1,
   'ألا ليت الشباب يعود يوماً', 'فأخبره بما فعل المشيب',
   'أبو العتاهية'),
  ('شعر غزل', 2,
   'قفا نبك من ذكرى حبيبٍ ومنزلِ', 'بسقط اللوى بين الدخول فحوملِ',
   'امرؤ القيس'),
  ('شعر سعودي عامي', 3,
   'يا وجودي وجد من فقد نور عينه', 'يوم قفّى مع الدربين محدٍ درى به',
   'الأمير خالد الفيصل'),
  ('شعر هجاء', 4,
   'إذا أتتك مذمتي من ناقصٍ', 'فهي الشهادة لي بأني كاملُ',
   'المتنبي');
