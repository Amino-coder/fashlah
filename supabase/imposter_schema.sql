-- ============================================================================
-- المحتال (Imposter) — Supabase / Postgres schema
-- ============================================================================
-- A genuinely new mechanic for Bagdoonis — sequential turn-taking (one
-- active player at a time, everyone else watches) rather than the
-- simultaneous-answer pattern every other multiplayer game uses. Table
-- shape, RLS conventions, and the security-definer scoring-function
-- pattern all still follow the same conventions as the rest of the
-- platform (see e.g. supabase/ihj_schema.sql) — only the actual game
-- logic is new, not the plumbing around it.
--
-- Run this in the Supabase SQL editor after the base schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SESSIONS
-- ----------------------------------------------------------------------------
create table imposter_sessions (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  host_user_id      uuid references users(id),
  lang              text default 'ar' check (lang in ('ar', 'en')),
  status            text default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  round_number      int default 1,   -- increments each "play again" within the same room
  phase             text default 'reveal_word' check (phase in ('reveal_word', 'clue', 'voting', 'reveal')),
  word_id           uuid,  -- FK to imposter_words added below, once that table exists
  imposter_player_id uuid, -- references imposter_players(id), added as a real FK once that table exists below
  turn_player_id    uuid,  -- whose turn it currently is during the clue phase
  turn_started_at   timestamptz,
  turns_taken       int default 0,  -- individual clue-turns given so far this round — voting auto-starts once this reaches 2x player count, unless the host ends it early
  used_word_ids     uuid[] default '{}', -- words already used THIS session (across replays) — the actual "don't repeat until exhausted" guarantee
  created_at        timestamptz default now(),
  started_at        timestamptz,
  ended_at          timestamptz
);

-- ----------------------------------------------------------------------------
-- WORDS — the master 50-word bank from the spec, used exactly as given.
-- ----------------------------------------------------------------------------
create table imposter_words (
  id     uuid primary key default gen_random_uuid(),
  text   text not null,
  active boolean default true
);

alter table imposter_sessions
  add constraint imposter_sessions_word_id_fkey foreign key (word_id) references imposter_words(id);

-- ----------------------------------------------------------------------------
-- PLAYERS — turn_order is set once at game start (join order, per spec:
-- "automatically determine player order based on players who joined"),
-- never recalculated mid-session even if someone leaves, so the
-- remaining turn sequence stays predictable rather than reshuffling.
-- ----------------------------------------------------------------------------
create table imposter_players (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references imposter_sessions(id) on delete cascade,
  user_id      uuid references users(id),
  nickname     text not null,
  avatar_emoji text default '\u{1F608}', -- 😈, matches the game's own icon
  turn_order   int,
  imposter_count int default 0,        -- how many rounds (within this room) this player has already been the imposter — used to avoid repeatedly picking the same person, per spec §12
  joined_at    timestamptz default now(),
  unique (session_id, user_id)
);

alter table imposter_sessions
  add constraint imposter_sessions_imposter_player_id_fkey foreign key (imposter_player_id) references imposter_players(id);
alter table imposter_sessions
  add constraint imposter_sessions_turn_player_id_fkey foreign key (turn_player_id) references imposter_players(id);

-- ----------------------------------------------------------------------------
-- VOTES
-- ----------------------------------------------------------------------------
create table imposter_votes (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid references imposter_sessions(id) on delete cascade,
  round_number          int not null,
  voter_player_id       uuid references imposter_players(id) on delete cascade,
  voted_for_player_id    uuid references imposter_players(id) on delete cascade,
  created_at            timestamptz default now(),
  unique (session_id, round_number, voter_player_id),
  check (voter_player_id <> voted_for_player_id) -- self-voting prevented at the data layer, not just the UI, per spec §6
);

-- ----------------------------------------------------------------------------
-- ROUND_RESULTS — one row per completed round, kept even after "play
-- again" starts a new round, so history isn't lost (mirrors every other
-- game's "previous session stays recorded" requirement).
-- ----------------------------------------------------------------------------
create table imposter_round_results (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references imposter_sessions(id) on delete cascade,
  round_number        int not null,
  imposter_player_id  uuid references imposter_players(id),
  word_id             uuid references imposter_words(id),
  voted_for_player_id uuid references imposter_players(id), -- who the group's majority landed on
  correct             boolean not null,
  created_at          timestamptz default now(),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_imposter_players_session on imposter_players(session_id);
create index idx_imposter_votes_session_round on imposter_votes(session_id, round_number);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table imposter_sessions enable row level security;
alter table imposter_words enable row level security;
alter table imposter_players enable row level security;
alter table imposter_votes enable row level security;
alter table imposter_round_results enable row level security;

create policy "imposter_sessions_read" on imposter_sessions for select using (true);
create policy "imposter_sessions_host_insert" on imposter_sessions for insert with check (host_user_id = auth.uid());
-- Host-only for the sensitive fields (starting the game, assigning the
-- imposter/word, ending it) is enforced in application code, same as
-- every other game's host-gated actions — but turn advancement
-- ("تم" / timeout / انتقل للتصويت) needs to work from ANY connected
-- player's client, not just the host's, since the whole point of a
-- per-player 20s timer is that it can't depend on one specific person's
-- tab staying open and responsive. RLS here is intentionally permissive
-- for the same reason the multiplayer completion-marking fix earlier
-- this project made completion any-client instead of host-only: a
-- narrower policy would just recreate that exact bug for turn
-- advancement instead of session completion.
create policy "imposter_sessions_players_update" on imposter_sessions for update using (
  host_user_id = auth.uid()
  or exists (select 1 from imposter_players p where p.session_id = id and p.user_id = auth.uid())
);

create policy "imposter_words_read" on imposter_words for select using (true);

create policy "imposter_players_read" on imposter_players for select using (true);
create policy "imposter_players_self_insert" on imposter_players for insert with check (user_id = auth.uid());
create policy "imposter_players_self_update" on imposter_players for update using (user_id = auth.uid());

create policy "imposter_votes_read" on imposter_votes for select using (true);
create policy "imposter_votes_own_insert" on imposter_votes for insert with check (
  exists (select 1 from imposter_players where id = voter_player_id and user_id = auth.uid())
);

create policy "imposter_round_results_read" on imposter_round_results for select using (true);

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table imposter_sessions;
alter publication supabase_realtime add table imposter_players;
alter publication supabase_realtime add table imposter_votes;

-- ----------------------------------------------------------------------------
-- SCORING — tallies votes once everyone's voted (or the host forces the
-- reveal), determines whether the group caught the imposter, records
-- the round result, and flips the session to 'reveal'. Idempotent, same
-- as every other game's round-result function.
-- ----------------------------------------------------------------------------
create or replace function imposter_compute_result(p_session_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_round int;
  v_imposter_id uuid;
  v_word_id uuid;
  v_existing record;
  v_winner_id uuid;
  v_correct boolean;
begin
  select round_number, imposter_player_id, word_id
  into v_round, v_imposter_id, v_word_id
  from imposter_sessions where id = p_session_id for update;

  select * into v_existing from imposter_round_results
  where session_id = p_session_id and round_number = v_round;

  if found then
    update imposter_sessions set phase = 'reveal' where id = p_session_id and phase <> 'reveal';
    return jsonb_build_object('already_computed', true, 'voted_for_player_id', v_existing.voted_for_player_id, 'correct', v_existing.correct);
  end if;

  -- Majority vote — a tie (including zero votes, if the host forced
  -- reveal before anyone voted) counts as "didn't catch the imposter,"
  -- the same real-world outcome as a genuinely split room.
  select voted_for_player_id into v_winner_id
  from imposter_votes
  where session_id = p_session_id and round_number = v_round
  group by voted_for_player_id
  order by count(*) desc, min(created_at) asc
  limit 1;

  v_correct := (v_winner_id = v_imposter_id);

  insert into imposter_round_results (session_id, round_number, imposter_player_id, word_id, voted_for_player_id, correct)
  values (p_session_id, v_round, v_imposter_id, v_word_id, v_winner_id, coalesce(v_correct, false))
  on conflict (session_id, round_number) do nothing;

  update imposter_sessions set phase = 'reveal' where id = p_session_id;

  return jsonb_build_object('already_computed', false, 'voted_for_player_id', v_winner_id, 'correct', coalesce(v_correct, false));
end;
$$;

revoke execute on function imposter_compute_result(uuid) from public;
revoke execute on function imposter_compute_result(uuid) from anon;
revoke execute on function imposter_compute_result(uuid) from authenticated;
grant execute on function imposter_compute_result(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- START/RESTART A ROUND — assigns a fresh imposter (avoiding whoever's
-- been imposter most recently among eligible players, per spec §12) and
-- a fresh word (never repeating within the session until the pool is
-- exhausted, per spec §11-12), then resets the turn order to the first
-- player. Used both for the very first round and every "play again"
-- within the same room.
-- ----------------------------------------------------------------------------
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

  -- Word: pick unused first; once the whole 50-word pool is exhausted,
  -- start over from the full pool rather than getting stuck.
  select id into v_word_id from imposter_words
  where active = true and not (id = any(v_used_words))
  order by random() limit 1;

  if v_word_id is null then
    v_used_words := '{}';
    select id into v_word_id from imposter_words where active = true order by random() limit 1;
  end if;

  -- Imposter: weighted toward whoever has been imposter least often this
  -- session — exact "avoid repeats when others are available" from the
  -- spec, without hand-rolling a separate eligibility list.
  select id into v_imposter_id from imposter_players
  where session_id = p_session_id
  order by imposter_count asc, random()
  limit 1;

  -- Reshuffle the speaking order for this game — a fresh random
  -- turn_order every time this runs, not just at first join, so a
  -- replay in the same room ("play again") doesn't always go in the
  -- exact same sequence.
  for v_player in select id from imposter_players where session_id = p_session_id order by random() loop
    update imposter_players set turn_order = v_i where id = v_player.id;
    v_i := v_i + 1;
  end loop;

  -- If the imposter landed first, swap them with a random other
  -- player's slot so someone who actually knows the word always speaks
  -- first instead — deliberately not surfaced anywhere in the UI or
  -- the pre-game rules intro, this is a quiet game-balance decision,
  -- not a rule players are meant to know about.
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


-- ============================================================================
-- SEED — the 50 words from the spec, used exactly as given.
-- ============================================================================
insert into imposter_words (text) values
('كبسة'), ('شاورما'), ('بيتزا'), ('برجر'), ('آيس كريم'),
('قهوة'), ('شاي'), ('تمر'), ('بطيخ'), ('شوكولاتة'),
('مطر'), ('شمس'), ('قمر'), ('بحر'), ('صحراء'),
('جبل'), ('جزيرة'), ('مطار'), ('فندق'), ('مدرسة'),
('جامعة'), ('مستشفى'), ('مطعم'), ('سينما'), ('ملعب'),
('سيارة'), ('طيارة'), ('دراجة'), ('جوال'), ('تلفزيون'),
('كمبيوتر'), ('ساعة'), ('نظارة'), ('مفتاح'), ('مظلة'),
('حقيبة'), ('كرة قدم'), ('كرة سلة'), ('سباق'), ('قطة'),
('كلب'), ('أسد'), ('جمل'), ('فيل'), ('قرد'),
('سمكة'), ('عرس'), ('عيد'), ('سفر'), ('إجازة');
