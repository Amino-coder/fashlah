-- ============================================================================
-- JOB INTERVIEW (مين بيتوظف!) — complete Supabase / Postgres setup
-- ============================================================================
-- Run this ONCE in the Supabase SQL editor, after the base schema.sql.
--
-- This is a single consolidated file rather than a migration chain, because
-- the game is brand new — there's no existing deployment to migrate, so all
-- the tables, policies, realtime wiring, the scoring function and the seed
-- content are created together here.
--
-- Structurally a sibling of the Shofah game: same round flow (warm-up ->
-- 5 answer/vote rounds -> recap -> reveal), same scoring, same RLS shape.
-- Two deliberate differences:
--   * No `character` column on sessions and no `audience` column on prompts.
--     Shofah lets the group pick who they're impressing (Mazna or Mar'i) and
--     filters prompts to match; here there's a single interviewer, so every
--     prompt is always eligible and there's no selection step.
--   * Nothing is shared with shofah_* or Fashlah's tables. The ONLY shared
--     table is `users` (device-bound anonymous identity) from schema.sql,
--     which this file assumes already exists and does not recreate.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SESSIONS
-- ----------------------------------------------------------------------------
create table job_sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  host_user_id  uuid references users(id),
  lang          text default 'ar' check (lang in ('ar', 'en')),
  status        text default 'waiting' check (status in ('waiting', 'in_progress', 'completed')),
  -- 0 = lobby + warm-up round, 1-5 = answer/vote rounds,
  -- 6 = final interview recap, 7 = hiring decision
  current_round int default 0,
  round_phase   text default 'answering' check (round_phase in (
                  'countdown', 'prewarm', 'prewarm_teaser', 'answering', 'voting', 'reveal'
                )),
  phase_started_at timestamptz,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table job_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references job_sessions(id) on delete cascade,
  user_id       uuid references users(id),
  nickname      text not null,
  avatar_emoji  text default '😎',
  total_score   int default 0,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

-- ----------------------------------------------------------------------------
-- PROMPTS  (master interview-question bank, bilingual, reused every session)
-- ----------------------------------------------------------------------------
create table job_prompts (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in (
                'opening', 'experience', 'weakness', 'salary',
                'awkward', 'teamwork', 'wildcard'
              )),
  text_ar     text not null,
  text_en     text not null,
  active      boolean default true
);

-- ----------------------------------------------------------------------------
-- ROUND_PROMPTS  (the 5 questions drawn for one session, in order — persisted
-- so a refresh/reconnect doesn't reshuffle mid-interview)
-- ----------------------------------------------------------------------------
create table job_round_prompts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references job_sessions(id) on delete cascade,
  round_number  int not null check (round_number between 1 and 5),
  prompt_id     uuid references job_prompts(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- ANSWERS
-- ----------------------------------------------------------------------------
create table job_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references job_sessions(id) on delete cascade,
  round_number  int not null,
  player_id     uuid references job_players(id) on delete cascade,
  text          text not null check (char_length(text) <= 80),
  submitted_at  timestamptz default now(),
  unique (session_id, round_number, player_id)
);

-- ----------------------------------------------------------------------------
-- VOTES
-- ----------------------------------------------------------------------------
create table job_votes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references job_sessions(id) on delete cascade,
  round_number      int not null,
  voter_player_id   uuid references job_players(id) on delete cascade,
  answer_id         uuid references job_answers(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- ROUND_RESULTS  (winner pointer per round — makes the final recap a simple
-- ordered lookup)
-- ----------------------------------------------------------------------------
create table job_round_results (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references job_sessions(id) on delete cascade,
  round_number        int not null,
  winner_answer_id    uuid references job_answers(id),
  winner_player_id    uuid references job_players(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- PREWARM ROUND  (the "who's most likely to..." warm-up before question 1 —
-- players vote on each other, purely for momentum, never affects scoring)
-- ----------------------------------------------------------------------------
create table job_prewarm_prompts (
  id          uuid primary key default gen_random_uuid(),
  text_ar     text not null,
  text_en     text not null,
  active      boolean default true
);

create table job_prewarm_round_prompts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references job_sessions(id) on delete cascade,
  round_number  int not null check (round_number between 1 and 5),
  prompt_id     uuid references job_prewarm_prompts(id),
  unique (session_id, round_number)
);

create table job_prewarm_votes (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references job_sessions(id) on delete cascade,
  round_number        int not null,
  voter_player_id     uuid references job_players(id) on delete cascade,
  voted_for_player_id uuid references job_players(id) on delete cascade,
  created_at          timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_job_players_session on job_players(session_id);
create index idx_job_answers_session_round on job_answers(session_id, round_number);
create index idx_job_votes_session_round on job_votes(session_id, round_number);
create index idx_job_round_prompts_session on job_round_prompts(session_id);
create index idx_job_prewarm_round_prompts_session on job_prewarm_round_prompts(session_id);
create index idx_job_prewarm_votes_session_round on job_prewarm_votes(session_id, round_number);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table job_sessions enable row level security;
alter table job_players enable row level security;
alter table job_prompts enable row level security;
alter table job_round_prompts enable row level security;
alter table job_answers enable row level security;
alter table job_votes enable row level security;
alter table job_round_results enable row level security;
alter table job_prewarm_prompts enable row level security;
alter table job_prewarm_round_prompts enable row level security;
alter table job_prewarm_votes enable row level security;

-- Sessions: public read (code lookup has to work before joining), host-only write.
create policy "job_sessions_read" on job_sessions for select using (true);
create policy "job_sessions_host_insert" on job_sessions for insert with check (host_user_id = auth.uid());
create policy "job_sessions_host_update" on job_sessions for update using (host_user_id = auth.uid());

-- Players: public read (lobby + round screens show everyone), own row only for writes.
create policy "job_players_read" on job_players for select using (true);
create policy "job_players_self_insert" on job_players for insert with check (user_id = auth.uid());
create policy "job_players_self_update" on job_players for update using (user_id = auth.uid());

-- Prompt banks: public read-only reference data.
create policy "job_prompts_read" on job_prompts for select using (true);
create policy "job_prewarm_prompts_read" on job_prewarm_prompts for select using (true);

-- Round prompts: public read; host draws them at game start.
create policy "job_round_prompts_read" on job_round_prompts for select using (true);
create policy "job_round_prompts_host_insert" on job_round_prompts for insert with check (
  exists (select 1 from job_sessions where id = session_id and host_user_id = auth.uid())
);
create policy "job_prewarm_round_prompts_read" on job_prewarm_round_prompts for select using (true);
create policy "job_prewarm_round_prompts_host_insert" on job_prewarm_round_prompts for insert with check (
  exists (select 1 from job_sessions where id = session_id and host_user_id = auth.uid())
);

-- Answers: public read (voting needs to see them all), own player_id to insert.
create policy "job_answers_read" on job_answers for select using (true);
create policy "job_answers_own_insert" on job_answers for insert with check (
  exists (select 1 from job_players where id = player_id and user_id = auth.uid())
);

-- Votes: public read (live counts), own voter_player_id to insert.
create policy "job_votes_read" on job_votes for select using (true);
create policy "job_votes_own_insert" on job_votes for insert with check (
  exists (select 1 from job_players where id = voter_player_id and user_id = auth.uid())
);
create policy "job_prewarm_votes_read" on job_prewarm_votes for select using (true);
create policy "job_prewarm_votes_own_insert" on job_prewarm_votes for insert with check (
  exists (select 1 from job_players where id = voter_player_id and user_id = auth.uid())
);

-- Round results: public read; written server-side with the service role key.
create policy "job_round_results_read" on job_round_results for select using (true);

-- ----------------------------------------------------------------------------
-- REALTIME
-- Without this, INSERT/UPDATE events never broadcast to subscribed clients,
-- so the lobby player list and phase transitions only update on a manual
-- page refresh.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table job_sessions;
alter publication supabase_realtime add table job_players;
alter publication supabase_realtime add table job_answers;
alter publication supabase_realtime add table job_votes;
alter publication supabase_realtime add table job_prewarm_votes;

-- ----------------------------------------------------------------------------
-- SCORING  (one call does the whole tally -> points -> winner -> phase flip,
-- so the API route makes a single database round-trip instead of ~4)
-- ----------------------------------------------------------------------------
create or replace function job_compute_round_result(p_session_id uuid, p_round_number int)
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
  from job_round_results rr
  join job_answers a on a.id = rr.winner_answer_id
  join job_players p on p.id = rr.winner_player_id
  where rr.session_id = p_session_id and rr.round_number = p_round_number;

  if found then
    update job_sessions
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

  -- Rank this round's answers by vote count, hand out 5/3/2/1 points.
  for v_row in
    select a.id as answer_id, a.player_id, a.text,
           count(v.id) as votes
    from job_answers a
    left join job_votes v on v.answer_id = a.id
    where a.session_id = p_session_id and a.round_number = p_round_number
    group by a.id, a.player_id, a.text
    order by count(v.id) desc, a.submitted_at asc
  loop
    v_rank := v_rank + 1;
    v_points := case v_rank when 1 then 5 when 2 then 3 when 3 then 2 else 1 end;

    update job_players
    set total_score = total_score + v_points
    where id = v_row.player_id;

    if v_rank = 1 then
      v_winner_answer_id := v_row.answer_id;
      v_winner_player_id := v_row.player_id;
      v_winner_text := v_row.text;
    end if;
  end loop;

  if v_winner_answer_id is null then
    return jsonb_build_object('error', 'No answers found for this round');
  end if;

  insert into job_round_results (session_id, round_number, winner_answer_id, winner_player_id)
  values (p_session_id, p_round_number, v_winner_answer_id, v_winner_player_id)
  on conflict (session_id, round_number) do nothing;

  select nickname, avatar_emoji into v_winner_nickname, v_winner_avatar
  from job_players where id = v_winner_player_id;

  update job_sessions
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
revoke execute on function job_compute_round_result(uuid, int) from public;
revoke execute on function job_compute_round_result(uuid, int) from anon;
revoke execute on function job_compute_round_result(uuid, int) from authenticated;
grant execute on function job_compute_round_result(uuid, int) to service_role;

-- ============================================================================
-- SEED — interview questions
-- ============================================================================
insert into job_prompts (category, text_ar, text_en) values
  ('opening', 'سوّق لنفسك كأنك سيارة مستعملة. 🛻', 'Sell yourself like you''re a used car. 🛻'),
  ('experience', 'ليش انطردت من شغلك اللي راح؟ 🚨', 'Why did you get fired from your last job? 🚨'),
  ('experience', 'وش المهارة بسيرتك الذاتية اللي اكيييد مو كذبه 😉', 'Which skill on your CV is definitely not a lie? 😉'),
  ('weakness', 'وش أكبر نقطة ضعف فيك؟ (قولها بطريقة تخليها شي إيجابي 🏃🏻‍♂️)', 'What''s your biggest weakness? (Spin it into a strength 🏃🏻‍♂️)'),
  ('weakness', 'وش العادة الخايسة اللي بتخليك تنطرد من اول اسبوع؟', 'What''s the bad habit that''ll get you fired in your first week?'),
  ('weakness', 'وش بيقول عنك مديرك السابق لو اتصلنا فيه؟ 💀', 'What would your last boss say if we called them? 💀'),
  ('salary', 'كم الراتب اللي تتوقعه؟ واذا نقدر نعطيك شي ثاني بدل الراتب وش بتاخذ؟', 'What salary do you expect? And if we paid you in something other than money, what would you take?'),
  ('salary', 'اقنعني تستاهل زيادة براتبك وانت باقي ما بديت.', 'Convince me you deserve a raise before you''ve even started.'),
  ('salary', 'وش أغبى شي بتشتريه من أول راتب؟', 'What''s the dumbest thing you''ll buy with your first paycheck?'),
  ('awkward', 'لو شفت مديرك يبوووق الشركة وش بتسوي؟ وكم بتسرق معاه 😂', 'You catch your boss stealing from the company. What do you do — and what''s your cut? 😂'),
  ('awkward', 'المدير طلب منك تشتغل الويكند، وش بتقول؟', 'Your boss asks you to work the weekend. What do you say?'),
  ('awkward', 'وصلت متأخر ساعتين… عطنا عذر يستحق جائزة أوسكار', 'You''re two hours late. Give us an Oscar-worthy excuse.'),
  ('teamwork', 'واحد اخذ الكريدت على شغلك، كيف بتنتقم؟ 🪓', 'Someone took credit for your work. How do you get revenge? 🪓'),
  ('teamwork', 'وش بتسوي عشان تسرق وظيفة مديرك؟', 'What would you do to steal your boss''s job?'),
  ('wildcard', 'وين تشوف نفسك بعد ٥ سنين؟ (أجوبة خاطئة فقط)', 'Where do you see yourself in 5 years? (wrong answers only)'),
  ('wildcard', 'اقنعني أوظفك بدون لا تستخدم حرف الألف "ا".', 'Convince me to hire you without using the letter "A".'),
  ('wildcard', 'قول شي يخليني أرفضك على طول.', 'Say something that''ll make me reject you instantly.'),
  ('wildcard', 'اسألني انت سؤال. مو لازم عن الوظيفة 😅', 'Now you ask me a question. Doesn''t have to be about the job 😅'),
  ('wildcard', 'اقنعني أخليك تشتغل من البيت للأبد.', 'Convince me to let you work from home forever.'),
  ('wildcard', 'الشركة صارت لك ليوم واحد — وش أول قرار؟', 'The company is yours for one day. What''s your first decision?');

-- ============================================================================
-- SEED — warm-up round ("who's most likely to...")
-- ============================================================================
insert into job_prewarm_prompts (text_ar, text_en) values
  ('مين أول واحد بينطرد من الشغل', 'Who gets fired first'),
  ('مين بيتأخر عن الدوام كل يوم', 'Who''s late every single day'),
  ('مين بيصير مدير خلال سنة', 'Who becomes the boss within a year'),
  ('مين بينام في كل اجتماع', 'Who falls asleep in every meeting'),
  ('مين بياخذ الكريدت على شغل غيره', 'Who takes credit for someone else''s work'),
  ('مين يرد على الإيميلات الساعة ٣ الفجر', 'Who replies to emails at 3 AM'),
  ('مين بيستقيل من أول أسبوع', 'Who quits in the first week'),
  ('مين بيشتغل من البيت وما يفتح اللابتوب', 'Who works from home and never opens the laptop');
