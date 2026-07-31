-- ============================================================================
-- كمل القصة (Complete the Story) — complete Supabase / Postgres setup
-- ============================================================================
-- Run this ONCE in the Supabase SQL editor, after the base schema.sql.
--
-- Single consolidated file, same convention as job_schema.sql /
-- qaseeda_schema.sql: tables, indexes, RLS, realtime wiring all created
-- together.
--
-- The mechanic (a "telephone" game — each player writes one sentence,
-- then every story rotates to the next player) needs none of the voting/
-- scoring machinery the other games have:
--   * No votes, no round_results, no scoring function. Every round, every
--     player writes exactly one sentence for whichever story they've been
--     handed — there's nothing to vote on.
--   * No separate "story assignment" table. Which story a player writes in
--     a given round is a pure function of (their turn_order, the round
--     number, the player count) — see lib/qissa-story.ts. Nothing about
--     "where a story currently is" needs to be persisted.
--   * qissa_players.turn_order is the one new idea versus the other
--     games: a stable circular order assigned once at game start (by join
--     order), which is what the passing math above is built on.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Safe to re-run: drops any previous (possibly partial) version of this
-- game's tables first.
-- ----------------------------------------------------------------------------
drop table if exists qissa_answers cascade;
drop table if exists qissa_players cascade;
drop table if exists qissa_sessions cascade;

-- ----------------------------------------------------------------------------
-- SESSIONS
-- ----------------------------------------------------------------------------
create table qissa_sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  host_user_id  uuid references users(id),
  lang          text default 'ar' check (lang in ('ar', 'en')),
  status        text default 'waiting' check (status in ('waiting', 'in_progress', 'completed')),
  -- 0 = lobby, 1-3 = writing rounds, 4 = final reveal
  current_round int default 0,
  round_phase   text default 'countdown' check (round_phase in ('countdown', 'writing', 'passing')),
  phase_started_at timestamptz,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table qissa_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references qissa_sessions(id) on delete cascade,
  user_id       uuid references users(id),
  nickname      text not null,
  avatar_emoji  text default '📖',
  -- Assigned once when the host starts the game (sequential by join
  -- order, 0..N-1). Drives every round's story assignment — see
  -- lib/qissa-story.ts. Null while still in the lobby.
  turn_order    int,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

-- ----------------------------------------------------------------------------
-- ANSWERS  (one sentence per story per round)
-- ----------------------------------------------------------------------------
-- `sentence` allows an empty string on purpose: if a player's client never
-- submits (timeout with nothing typed, or a truly unresponsive client),
-- the round-advance API backfills an empty sentence for them so every
-- story always ends up with exactly 3 rows — the game must never get
-- stuck waiting on one missing player.
create table qissa_answers (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references qissa_sessions(id) on delete cascade,
  round_number      int not null,
  story_index       int not null,
  author_player_id  uuid references qissa_players(id) on delete cascade,
  sentence          text not null default '' check (char_length(sentence) <= 120),
  submitted_at      timestamptz default now(),
  unique (session_id, round_number, story_index),
  unique (session_id, round_number, author_player_id)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_qissa_players_session on qissa_players(session_id);
create index idx_qissa_answers_session_round on qissa_answers(session_id, round_number);
create index idx_qissa_answers_session_story on qissa_answers(session_id, story_index);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table qissa_sessions enable row level security;
alter table qissa_players enable row level security;
alter table qissa_answers enable row level security;

create policy "qissa_sessions_read" on qissa_sessions for select using (true);
create policy "qissa_sessions_host_insert" on qissa_sessions for insert with check (host_user_id = auth.uid());
create policy "qissa_sessions_host_update" on qissa_sessions for update using (host_user_id = auth.uid());

create policy "qissa_players_read" on qissa_players for select using (true);
create policy "qissa_players_self_insert" on qissa_players for insert with check (user_id = auth.uid());
create policy "qissa_players_self_update" on qissa_players for update using (user_id = auth.uid());

-- Public read (needed so a writer can be shown their one previous
-- sentence, and so the final reveal can reconstruct every story), own
-- player_id only for normal client-side inserts. The empty-sentence
-- backfill for unresponsive players goes through the service-role API
-- route instead, which bypasses RLS legitimately (see
-- app/api/qissa-round-advance/route.ts).
create policy "qissa_answers_read" on qissa_answers for select using (true);
create policy "qissa_answers_own_insert" on qissa_answers for insert with check (
  exists (select 1 from qissa_players where id = author_player_id and user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table qissa_sessions;
alter publication supabase_realtime add table qissa_players;
alter publication supabase_realtime add table qissa_answers;
