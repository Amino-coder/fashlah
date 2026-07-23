-- ============================================================================
-- MIGRATION 008 — Round 4 "Wildcard" (Would You Rather + fill-in-the-blank)
-- ============================================================================
-- Would You Rather reuses the existing `answers` table and its private
-- self-read policy — mechanically identical to Round 1's self-answer
-- questions (2 options instead of 4), just a different round number. No new
-- table needed there.
--
-- Fill-in-the-blank needs its own table: the whole point is a shared reveal
-- at Results showing each player's actual text next to their name — same
-- "readable by any session member" privacy model as hot_take_responses,
-- the opposite of votes/answers.
-- ============================================================================

alter table questions drop constraint if exists questions_round_check;
alter table questions add constraint questions_round_check check (round in (1,2,3,4));

alter table questions drop constraint if exists questions_question_type_check;
alter table questions add constraint questions_question_type_check check (question_type in
  ('self','friend_vote','this_or_that','emoji','ranking',
   'scale','yes_no','multiple_choice','randomizer','guess_percentage','hot_take','open_text'));

create table if not exists text_responses (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  player_id     uuid references players(id) on delete cascade,
  question_id   uuid references questions(id),
  response_text text not null check (char_length(response_text) between 1 and 200),
  answered_at   timestamptz default now(),
  unique(player_id, question_id)
);

alter table text_responses enable row level security;

create policy "text_responses_session_read" on text_responses for select using (
  is_session_member(session_id)
);
create policy "text_responses_self_write" on text_responses for insert with check (
  player_id in (select id from players where user_id = auth.uid())
);
create policy "text_responses_self_update" on text_responses for update using (
  player_id in (select id from players where user_id = auth.uid())
);
