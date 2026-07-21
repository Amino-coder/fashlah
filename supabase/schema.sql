-- ============================================================================
-- BAGDOONIS (بقدونس) — Supabase / Postgres schema
-- ============================================================================
-- Run this in the Supabase SQL editor on a fresh project.
-- Everything is data-driven: no question text, scoring formula, or result
-- copy lives in application code. New packs, awards, and templates are rows.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- USERS  (anonymous, device-bound — no email/password required to play)
-- ----------------------------------------------------------------------------
create table users (
  id            uuid primary key default gen_random_uuid(),
  device_id     text unique not null,          -- generated client-side, stored locally
  display_name  text,
  preferred_lang text default 'ar' check (preferred_lang in ('ar','en')),
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- ADMIN USERS  (separate auth path for the admin panel)
-- ----------------------------------------------------------------------------
create table admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  role          text default 'editor' check (role in ('owner','editor','viewer')),
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- GROUPS  (a recurring friend group that can play multiple sessions over time)
-- ----------------------------------------------------------------------------
create table groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  emoji         text default '🌿',
  created_by    uuid references users(id),
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- QUESTION PACKS  (Friends, Couples, Family, Coworkers, ... — expand freely)
-- ----------------------------------------------------------------------------
create table question_packs (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- 'friends', 'couples', 'family'
  icon          text default '🌿',
  name_ar       text not null,
  name_en       text not null,
  description_ar text,
  description_en text,
  is_active     bool default true,
  sort_order    int default 0,
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- QUESTIONS  (every question in every round, for every pack)
-- ----------------------------------------------------------------------------
create table questions (
  id            uuid primary key default gen_random_uuid(),
  pack_id       uuid references question_packs(id) on delete cascade,
  round         int not null check (round in (1,2,3)),   -- 1=self 2=friend_vote 3=bonus
  question_type text not null check (question_type in
                  ('self','friend_vote','this_or_that','emoji','ranking',
                   'scale','yes_no','multiple_choice','randomizer','guess_percentage','hot_take')),
  category      text,                           -- 'humor','ambition','chaos', etc — used by scoring engine
  difficulty    text default 'mixed' check (difficulty in ('funny','chaotic','deep','mixed')),
  text_ar       text not null,
  text_en       text not null,
  options       jsonb not null default '[]',    -- [{id,emoji,text_ar,text_en,trait_weights:{humor:0.6,...}}]
  weight        numeric default 1,               -- influence in scoring engine
  enabled       bool default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_questions_pack_round on questions(pack_id, round) where enabled = true;

-- ----------------------------------------------------------------------------
-- SESSIONS  (one live game)
-- ----------------------------------------------------------------------------
create table sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,           -- 6-char room code
  group_id      uuid references groups(id),
  host_user_id  uuid references users(id) not null,
  pack_id       uuid references question_packs(id) not null,
  difficulty    text default 'mixed' check (difficulty in ('funny','chaotic','deep','mixed')),
  max_players   int default 8,
  status        text default 'waiting' check (status in ('waiting','in_progress','completed','cancelled')),
  current_round int default 0,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

create index idx_sessions_code on sessions(code);

-- ----------------------------------------------------------------------------
-- PLAYERS  (a user's membership in one session)
-- ----------------------------------------------------------------------------
create table players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  user_id       uuid references users(id) not null,
  nickname      text not null,
  avatar_emoji  text default '🌿',
  is_host       bool default false,
  connected     bool default true,
  current_round int default 1,      -- this player's own progress (1/2/3/4=finished) —
                                     -- players move through rounds independently, so
                                     -- gameplay UI reads players.current_round, not
                                     -- sessions.current_round (see round-sync note below)
  joined_at     timestamptz default now(),
  last_seen_at  timestamptz default now(),
  unique(session_id, user_id)
);

create index idx_players_session on players(session_id);

-- ----------------------------------------------------------------------------
-- HOT TAKE RESPONSES  (Round 3 — agree/disagree, deliberately readable by
-- name/avatar per response, unlike `votes` which is never individually
-- readable. This is intentional per the brief: Results shows who agreed
-- with what.)
-- ----------------------------------------------------------------------------
create table hot_take_responses (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  player_id     uuid references players(id) on delete cascade,
  question_id   uuid references questions(id),
  stance        text not null check (stance in ('agree','disagree')),
  answered_at   timestamptz default now(),
  unique(player_id, question_id)
);

-- ----------------------------------------------------------------------------
-- ANSWERS  (Round 1 — self answers)
-- ----------------------------------------------------------------------------
create table answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  player_id     uuid references players(id) on delete cascade,
  question_id   uuid references questions(id),
  selected_option_id text,          -- references options[].id in questions.options
  raw_value     jsonb,              -- for scale/ranking types
  answered_at   timestamptz default now(),
  unique(player_id, question_id)
);

-- ----------------------------------------------------------------------------
-- VOTES  (Round 2 — anonymous peer votes. Never exposed per-voter to clients.)
-- ----------------------------------------------------------------------------
create table votes (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid references sessions(id) on delete cascade,
  question_id        uuid references questions(id),
  voter_player_id     uuid references players(id) on delete cascade,
  voted_for_player_id uuid references players(id) on delete cascade,
  created_at         timestamptz default now(),
  unique(voter_player_id, question_id)
);

-- ----------------------------------------------------------------------------
-- SCORE FORMULAS  (configurable — never hardcoded in application code)
-- ----------------------------------------------------------------------------
create table score_formulas (
  id            uuid primary key default gen_random_uuid(),
  trait_key     text unique not null,      -- 'leadership','humor','energy',...
  name_ar       text not null,
  name_en       text not null,
  -- components: [{ source: 'peer_votes'|'self_answers'|'behavioral', weight: 0.4, category: 'leadership' }]
  components    jsonb not null,
  enabled       bool default true,
  updated_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- SCORES  (computed per player, per session, per trait)
-- ----------------------------------------------------------------------------
create table scores (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  player_id     uuid references players(id) on delete cascade,
  trait_key     text references score_formulas(trait_key),
  value         numeric not null,          -- normalized 0-100
  computed_at   timestamptz default now(),
  unique(player_id, trait_key)
);

-- ----------------------------------------------------------------------------
-- AWARDS  (the badge catalogue — e.g. 👑 CEO, 😂 Chaos Generator)
-- ----------------------------------------------------------------------------
create table awards (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  emoji         text not null,
  name_ar       text not null,
  name_en       text not null,
  description_ar text,
  description_en text,
  -- rule: which traits/vote categories drive this award, e.g.
  -- { "type": "top_trait", "trait_key": "leadership" }
  -- { "type": "top_vote_category", "category": "become_rich" }
  rule          jsonb not null,
  sort_order    int default 0,
  enabled       bool default true
);

-- ----------------------------------------------------------------------------
-- AWARD RESULTS  (who won what, in which session)
-- ----------------------------------------------------------------------------
create table award_results (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  player_id     uuid references players(id) on delete cascade,
  award_id      uuid references awards(id),
  rank          int default 1,             -- 1 = winner, 2/3 = runner-up if surfaced
  awarded_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- COMPATIBILITY  (pairwise "friendship %" between every two players)
-- ----------------------------------------------------------------------------
create table compatibility (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references sessions(id) on delete cascade,
  player_a_id       uuid references players(id) on delete cascade,
  player_b_id       uuid references players(id) on delete cascade,
  score             numeric not null,       -- 0-100
  shared_interests  jsonb default '[]',
  computed_at       timestamptz default now(),
  check (player_a_id < player_b_id),
  unique(player_a_id, player_b_id)
);

-- ----------------------------------------------------------------------------
-- RESULT TEMPLATES  (the Results Engine's building blocks — no AI, no API)
-- ----------------------------------------------------------------------------
create table result_templates (
  id            uuid primary key default gen_random_uuid(),
  template_type text not null check (template_type in
                  ('summary_opener','summary_trait','summary_closer',
                   'hidden_stat','award_flavor')),
  -- conditions: [{ trait: 'energy', op: '>', value: 90 }, ...] — AND'ed together
  conditions    jsonb not null default '[]',
  text_ar       text not null,
  text_en       text not null,
  weight        numeric default 1,          -- for weighted-random selection among matches
  enabled       bool default true
);

-- ----------------------------------------------------------------------------
-- GAME HISTORY  (denormalized snapshot so a group can revisit past sessions fast)
-- ----------------------------------------------------------------------------
create table game_history (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references groups(id),
  session_id    uuid references sessions(id),
  played_at     timestamptz default now(),
  summary       jsonb not null    -- { top_award, players[], compatibility_highlights[], ... }
);

-- ----------------------------------------------------------------------------
-- SETTINGS  (app-wide feature flags / config, editable from admin panel)
-- ----------------------------------------------------------------------------
create table settings (
  key           text primary key,
  value         jsonb not null,
  updated_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- LANGUAGES
-- ----------------------------------------------------------------------------
create table languages (
  code          text primary key,   -- 'ar' | 'en'
  name          text not null,
  is_default    bool default false,
  direction     text default 'ltr' check (direction in ('ltr','rtl'))
);

insert into languages (code, name, is_default, direction) values
  ('ar', 'العربية', true, 'rtl'),
  ('en', 'English', false, 'ltr');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Bagdoonis uses Supabase anonymous auth (auth.signInAnonymously()), so every
-- device gets a real auth.uid() without an email/password. users.id should be
-- set equal to auth.uid() at account creation. Policies below assume that.

alter table users enable row level security;
alter table groups enable row level security;
alter table sessions enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
alter table votes enable row level security;
alter table hot_take_responses enable row level security;
alter table scores enable row level security;
alter table award_results enable row level security;
alter table compatibility enable row level security;
alter table game_history enable row level security;

-- Users can read/update their own row only.
create policy "users_self" on users
  for all using (id = auth.uid());

-- Groups: anyone can read (name/emoji only, nothing sensitive); only the
-- creator can insert/update their own group.
create policy "groups_read" on groups for select using (true);
create policy "groups_self_insert" on groups for insert with check (created_by = auth.uid());
create policy "groups_self_update" on groups for update using (created_by = auth.uid());

-- Anyone can read a session by code (needed to join); only the host can update it.
create policy "sessions_read" on sessions for select using (true);
create policy "sessions_host_write" on sessions for update using (host_user_id = auth.uid());
create policy "sessions_host_insert" on sessions for insert with check (host_user_id = auth.uid());

-- Players can see other players in their own session only.
-- (Uses a SECURITY DEFINER helper rather than a subquery on `players` itself
-- to avoid Postgres' "infinite recursion detected in policy" error — a
-- policy on a table can't safely subquery that same table directly.)
create or replace function public.is_session_member(_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from players
    where session_id = _session_id
      and user_id = auth.uid()
  );
$$;

create policy "players_same_session" on players for select using (
  is_session_member(session_id)
);
create policy "players_self_insert" on players for insert with check (user_id = auth.uid());
create policy "players_self_update" on players for update using (user_id = auth.uid());

-- Answers: a player can write only their own answers, and can read only
-- aggregate results (never another individual player's raw answers) —
-- aggregation should happen via a security-definer RPC function, not direct select.
create policy "answers_self_write" on answers for insert with check (
  player_id in (select id from players where user_id = auth.uid())
);
create policy "answers_self_read" on answers for select using (
  player_id in (select id from players where user_id = auth.uid())
);

-- Votes: identical pattern. voter_player_id must never be exposed client-side
-- beyond the voter themself — build a `get_vote_tallies(session_id)` RPC
-- (security definer) that returns only aggregated counts per voted_for_player_id.
create policy "votes_self_write" on votes for insert with check (
  voter_player_id in (select id from players where user_id = auth.uid())
);
create policy "votes_self_update" on votes for update using (
  voter_player_id in (select id from players where user_id = auth.uid())
);
create policy "votes_no_direct_read" on votes for select using (false);

-- Hot take responses: the opposite privacy model from votes — any member of
-- the session can read every response, names/avatars included, since
-- Results is meant to show who agreed with what.
create policy "hot_take_responses_session_read" on hot_take_responses for select using (
  is_session_member(session_id)
);
create policy "hot_take_responses_self_write" on hot_take_responses for insert with check (
  player_id in (select id from players where user_id = auth.uid())
);
create policy "hot_take_responses_self_update" on hot_take_responses for update using (
  player_id in (select id from players where user_id = auth.uid())
);

-- Scores, awards, compatibility, history: readable by any player in that session.
create policy "scores_session_read" on scores for select using (
  session_id in (select session_id from players where user_id = auth.uid())
);
create policy "award_results_session_read" on award_results for select using (
  session_id in (select session_id from players where user_id = auth.uid())
);
create policy "compatibility_session_read" on compatibility for select using (
  session_id in (select session_id from players where user_id = auth.uid())
);
create policy "game_history_session_read" on game_history for select using (
  session_id in (select session_id from players where user_id = auth.uid())
);

-- Reference data (questions, packs, awards, templates, formulas) is public
-- read, admin-only write. Admin writes should go through the service role
-- key from the admin panel backend, not client-side RLS.
alter table questions enable row level security;
alter table question_packs enable row level security;
alter table awards enable row level security;
alter table result_templates enable row level security;
alter table score_formulas enable row level security;

create policy "questions_public_read" on questions for select using (enabled = true);
create policy "packs_public_read" on question_packs for select using (is_active = true);
create policy "awards_public_read" on awards for select using (enabled = true);
create policy "templates_public_read" on result_templates for select using (enabled = true);
create policy "formulas_public_read" on score_formulas for select using (enabled = true);

-- ============================================================================
-- RPC: get_vote_tallies — the only sanctioned way to read vote data.
-- Returns aggregate counts per (question, voted-for player); never exposes
-- who voted for whom. Gated to members of the session being queried.
-- ============================================================================
create or replace function public.get_vote_tallies(_session_id uuid)
returns table(question_id uuid, voted_for_player_id uuid, vote_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select v.question_id, v.voted_for_player_id, count(*) as vote_count
  from votes v
  where v.session_id = _session_id
    and public.is_session_member(_session_id)
  group by v.question_id, v.voted_for_player_id;
$$;

-- ============================================================================
-- REALTIME
-- ============================================================================
-- Enable Supabase Realtime on the tables the Session Engine needs to watch:
--   supabase: Database > Replication > enable for `players`, `sessions`,
--   `answers`, `votes` (aggregated channel), `award_results`.
-- ============================================================================
