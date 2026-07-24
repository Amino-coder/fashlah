-- ============================================================================
-- SHOFAH (شوفة) / "First Date" — Supabase / Postgres schema
-- ============================================================================
-- Fully decoupled from the Fashlah game: every table is shofah_-prefixed and
-- none of Fashlah's tables (sessions, players, questions, score_formulas,
-- awards, ...) are touched or referenced. The ONLY shared table is `users`
-- (device-bound anonymous identity), which already exists from schema.sql —
-- this file assumes that table is already present and does not recreate it.
--
-- Run this in the Supabase SQL editor after the base schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SESSIONS
-- ----------------------------------------------------------------------------
create table shofah_sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  host_user_id  uuid references users(id),
  character     text check (character in ('girl', 'guy')),   -- who players are trying to impress
  lang          text default 'ar' check (lang in ('ar', 'en')),
  status        text default 'waiting' check (status in ('waiting', 'in_progress', 'completed')),
  current_round int default 0,   -- 0 = lobby, 1-5 = answer/vote rounds, 6 = final conversation, 7 = final reveal
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table shofah_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references shofah_sessions(id) on delete cascade,
  user_id       uuid references users(id),
  nickname      text not null,
  avatar_emoji  text default '😎',
  total_score   int default 0,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

-- ----------------------------------------------------------------------------
-- PROMPTS  (master question bank — bilingual, reused across all sessions)
-- ----------------------------------------------------------------------------
create table shofah_prompts (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in (
                'opening', 'getting_to_know_you', 'career_money',
                'lifestyle', 'awkward', 'marriage', 'wildcard'
              )),
  text_ar     text not null,
  text_en     text not null,
  active      boolean default true
);

-- ----------------------------------------------------------------------------
-- ROUND_PROMPTS  (the 5 prompts drawn for one specific session, in order —
-- persisted so a page refresh/reconnect doesn't reshuffle mid-game)
-- ----------------------------------------------------------------------------
create table shofah_round_prompts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references shofah_sessions(id) on delete cascade,
  round_number  int not null check (round_number between 1 and 5),
  prompt_id     uuid references shofah_prompts(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- ANSWERS
-- ----------------------------------------------------------------------------
create table shofah_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references shofah_sessions(id) on delete cascade,
  round_number  int not null,
  player_id     uuid references shofah_players(id) on delete cascade,
  text          text not null check (char_length(text) <= 80),
  submitted_at  timestamptz default now(),
  unique (session_id, round_number, player_id)
);

-- ----------------------------------------------------------------------------
-- VOTES
-- ----------------------------------------------------------------------------
-- Self-voting is blocked in application code (needs a cross-table check
-- against shofah_answers.player_id, which a plain CHECK constraint can't do).
create table shofah_votes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references shofah_sessions(id) on delete cascade,
  round_number      int not null,
  voter_player_id   uuid references shofah_players(id) on delete cascade,
  answer_id         uuid references shofah_answers(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- ROUND_RESULTS  (computed once voting closes — winner pointer per round,
-- makes the Phase 5 "final conversation" a simple ordered lookup)
-- ----------------------------------------------------------------------------
create table shofah_round_results (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references shofah_sessions(id) on delete cascade,
  round_number        int not null,
  winner_answer_id    uuid references shofah_answers(id),
  winner_player_id    uuid references shofah_players(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_shofah_players_session on shofah_players(session_id);
create index idx_shofah_answers_session_round on shofah_answers(session_id, round_number);
create index idx_shofah_votes_session_round on shofah_votes(session_id, round_number);
create index idx_shofah_round_prompts_session on shofah_round_prompts(session_id);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table shofah_sessions enable row level security;
alter table shofah_players enable row level security;
alter table shofah_prompts enable row level security;
alter table shofah_round_prompts enable row level security;
alter table shofah_answers enable row level security;
alter table shofah_votes enable row level security;
alter table shofah_round_results enable row level security;

-- Sessions: public read (need the code lookup to work before joining),
-- host-only write.
create policy "shofah_sessions_read" on shofah_sessions for select using (true);
create policy "shofah_sessions_host_insert" on shofah_sessions for insert with check (host_user_id = auth.uid());
create policy "shofah_sessions_host_update" on shofah_sessions for update using (host_user_id = auth.uid());

-- Players: public read (waiting room / round screens need to see everyone),
-- players write only their own row. No self-referential subquery here, so
-- this avoids the recursion bug documented in migration_003.
create policy "shofah_players_read" on shofah_players for select using (true);
create policy "shofah_players_self_insert" on shofah_players for insert with check (user_id = auth.uid());
create policy "shofah_players_self_update" on shofah_players for update using (user_id = auth.uid());

-- Prompts: public read-only reference data.
create policy "shofah_prompts_read" on shofah_prompts for select using (true);

-- Round prompts: public read; only the session host writes (it's the host's
-- client that draws the 5 prompts when starting the game).
create policy "shofah_round_prompts_read" on shofah_round_prompts for select using (true);
create policy "shofah_round_prompts_host_insert" on shofah_round_prompts for insert with check (
  exists (select 1 from shofah_sessions where id = session_id and host_user_id = auth.uid())
);

-- Answers: public read (voting phase needs to see all answers), a player
-- may only insert an answer tied to their own player_id.
create policy "shofah_answers_read" on shofah_answers for select using (true);
create policy "shofah_answers_own_insert" on shofah_answers for insert with check (
  exists (select 1 from shofah_players where id = player_id and user_id = auth.uid())
);

-- Votes: public read (live vote counts), a player may only insert a vote
-- tied to their own voter_player_id.
create policy "shofah_votes_read" on shofah_votes for select using (true);
create policy "shofah_votes_own_insert" on shofah_votes for insert with check (
  exists (select 1 from shofah_players where id = voter_player_id and user_id = auth.uid())
);

-- Round results: public read; written server-side via the service role key
-- (scoring API route), so no public insert policy is needed.
create policy "shofah_round_results_read" on shofah_round_results for select using (true);
