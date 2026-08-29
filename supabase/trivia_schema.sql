-- ============================================================================
-- سؤال وجواب (Trivia) — Supabase / Postgres schema
-- ============================================================================
-- Route: /trivia. Unlike المحتال/خرب السالفة, this game has no anonymity
-- concern at all — every player sees the same question at the same
-- time, and answers are never secret from each other, only from being
-- REVEALED before everyone's committed. That materially simplifies the
-- RLS here versus those two games.
--
-- The 300-question bank itself is NOT a database table — it's the
-- static lib/trivia-questions.ts module, matching the spec's own
-- framing ("stored separately from game logic," not necessarily
-- "in Postgres"). It's small enough (300 rows) that server-side
-- selection/shuffling/balancing can run entirely in JS against the
-- in-memory array — no reason to stand up a queryable table for it.
-- What DOES live in the database is which question IDs a given SESSION
-- selected (question_ids, decided once at game start so every player
-- in a multiplayer room sees the identical randomized set), and the
-- ACTUAL PER-QUESTION SCORING, which has to be server-authoritative —
-- see the API routes for why (a client can't be trusted to self-report
-- "I got it right" or its own answer speed).
--
-- Run this in the Supabase SQL editor after the base schema.sql.
-- ============================================================================

create table trivia_sessions (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,
  host_user_id          uuid references users(id),
  lang                  text default 'ar' check (lang in ('ar', 'en')),
  status                text default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  question_count        int not null check (question_count in (5, 10, 15)),
  difficulty            text not null check (difficulty in ('easy', 'medium', 'hard', 'mixed')),
  categories            text[] not null,
  question_ids          text[] default '{}',  -- populated once at game start — the randomized, balanced, ordered set every player in the room sees
  current_question_index int default 0,
  phase                 text default 'answering' check (phase in ('answering', 'reveal')),
  phase_started_at      timestamptz,
  question_time_limit_seconds int default 15,
  created_at            timestamptz default now(),
  started_at            timestamptz,
  ended_at              timestamptz
);

create table trivia_players (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references trivia_sessions(id) on delete cascade,
  user_id      uuid references users(id),
  nickname     text not null,
  avatar_emoji text default '\u{1F9E0}',
  score        int default 0,
  joined_at    timestamptz default now(),
  unique (session_id, user_id)
);

-- One row per player per question. question_index (not the question's
-- own bank id) is what's unique-constrained per player, since that's
-- the actual "have they answered THIS question yet" check — matches
-- position in the session's own question_ids array.
create table trivia_answers (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid references trivia_sessions(id) on delete cascade,
  question_index     int not null,
  player_id          uuid references trivia_players(id) on delete cascade,
  selected_option_id text not null check (selected_option_id in ('a', 'b', 'c', 'd')),
  is_correct         boolean not null,
  points_awarded     int not null default 0,
  answered_at        timestamptz default now(),
  unique (session_id, question_index, player_id)
);

create index idx_trivia_answers_session_q on trivia_answers(session_id, question_index);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table trivia_sessions enable row level security;
alter table trivia_players enable row level security;
alter table trivia_answers enable row level security;

create policy "trivia_sessions_read" on trivia_sessions for select using (true);
create policy "trivia_sessions_host_insert" on trivia_sessions for insert with check (host_user_id = auth.uid());
-- Any connected player, not just host, same reasoning as every other
-- multiplayer game in this app: normal gameplay progressing (phase
-- transitions, question advancement) can't depend on one specific
-- person's device staying open and responsive.
create policy "trivia_sessions_players_update" on trivia_sessions for update using (
  host_user_id = auth.uid()
  or exists (select 1 from trivia_players p where p.session_id = id and p.user_id = auth.uid())
);

create policy "trivia_players_read" on trivia_players for select using (true);
create policy "trivia_players_self_insert" on trivia_players for insert with check (user_id = auth.uid());
-- Own-row updates (nickname/avatar) stay self-service. Score changes
-- (both automatic scoring and the host's manual +/- point buttons) are
-- deliberately NOT covered by this policy — both go through
-- service-role API routes instead (see trivia-submit-answer and
-- trivia-adjust-points), the same way every other game in this app
-- keeps its actually-authoritative writes off the client-editable path.
create policy "trivia_players_self_update" on trivia_players for update using (user_id = auth.uid());

-- Answers are fully open to read — no anonymity concern here, everyone
-- already knows what everyone answered once the reveal happens, and
-- there's no "who submitted what" secrecy requirement at any point the
-- way المحتال/خرب السالفة need. Inserts still go through the
-- service-role submit-answer route regardless (see below), since
-- scoring correctness/speed-bonus math has to be server-computed — RLS
-- here is about read access, not about who's allowed to determine
-- correctness.
create policy "trivia_answers_read" on trivia_answers for select using (true);

-- Needed for "play again" (same room) to clear every answer row from
-- the previous game before resetting current_question_index back to
-- 0 — without this, stale rows from the old game's own question 0
-- collide with the (session_id, question_index, player_id) unique
-- constraint and confuse the auto-advance "has everyone answered"
-- check for the new game. Scoped the same as insert: any player in
-- the session, not host-only.
create policy "trivia_answers_own_session_delete" on trivia_answers for delete using (
  exists (select 1 from trivia_players p where p.session_id = trivia_answers.session_id and p.user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table trivia_sessions;
alter publication supabase_realtime add table trivia_players;
alter publication supabase_realtime add table trivia_answers;
