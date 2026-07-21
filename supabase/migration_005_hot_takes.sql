-- ============================================================================
-- MIGRATION 005 — Hot Takes (Round 3)
-- ============================================================================
-- Hot Takes is deliberately NOT built on `votes`: the brief wants names and
-- avatars visible per answer at Results, but `votes` is designed so nobody
-- (not even the voter) can ever read individual rows. So this gets its own
-- table, `hot_take_responses`, with a normal SELECT policy scoped to "any
-- member of this session" — the opposite privacy model from votes, on
-- purpose.
-- ============================================================================

-- Allow the new question_type value.
alter table questions drop constraint if exists questions_question_type_check;
alter table questions add constraint questions_question_type_check check (question_type in
  ('self','friend_vote','this_or_that','emoji','ranking',
   'scale','yes_no','multiple_choice','randomizer','guess_percentage','hot_take'));

create table if not exists hot_take_responses (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  player_id     uuid references players(id) on delete cascade,
  question_id   uuid references questions(id),
  stance        text not null check (stance in ('agree','disagree')),
  answered_at   timestamptz default now(),
  unique(player_id, question_id)
);

alter table hot_take_responses enable row level security;

-- Any member of the session can read every response (names attached) —
-- this is the intentional opposite of votes' privacy model.
create policy "hot_take_responses_session_read" on hot_take_responses for select using (
  is_session_member(session_id)
);

create policy "hot_take_responses_self_write" on hot_take_responses for insert with check (
  player_id in (select id from players where user_id = auth.uid())
);

create policy "hot_take_responses_self_update" on hot_take_responses for update using (
  player_id in (select id from players where user_id = auth.uid())
);
