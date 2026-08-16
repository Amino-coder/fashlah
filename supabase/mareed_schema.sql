-- ============================================================================
-- مريض نفسي (Psych Patient) — Supabase / Postgres schema
-- ============================================================================
-- A themed fork of شوفة (supabase/shofah_schema.sql) — same tables, same
-- RLS, same scoring function shape, just mareed_-prefixed and with the
-- content replaced. This is ONE consolidated file (folding in what were
-- شوفة's 7 separate incremental migrations, since this game starts from
-- scratch rather than evolving one) rather than a stack of migrations —
-- there's no historical live database to migrate here, so there's nothing
-- gained by replaying that history.
--
-- Nothing in this file touches any شوفة table — every table here is its
-- own mareed_-prefixed table. The only shared table is `users` (device-
-- bound anonymous identity), already created by the base schema.sql.
--
-- Run this in the Supabase SQL editor after the base schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SESSIONS
-- ----------------------------------------------------------------------------
create table mareed_sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  host_user_id  uuid references users(id),
  lang          text default 'ar' check (lang in ('ar', 'en')),
  status        text default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  current_round int default 0,   -- 0 = lobby/prewarm, 1-5 = answer/vote rounds, 6 = final conversation, 7 = final reveal
  round_phase   text default 'answering' check (round_phase in ('countdown', 'prewarm', 'prewarm_teaser', 'answering', 'voting', 'reveal')),
  phase_started_at timestamptz,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table mareed_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references mareed_sessions(id) on delete cascade,
  user_id       uuid references users(id),
  nickname      text not null,
  avatar_emoji  text default '🥴',
  total_score   int default 0,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

-- ----------------------------------------------------------------------------
-- PROMPTS  (master question bank — the 16 open-text questions from the spec)
-- ----------------------------------------------------------------------------
create table mareed_prompts (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in (
                'opening', 'getting_to_know_you', 'career_money',
                'lifestyle', 'awkward', 'marriage', 'wildcard'
              )),
  text_ar     text not null,
  text_en     text not null,
  active      boolean default true,
  audience    text check (audience in ('girl', 'guy'))  -- null = universal; all 16 spec questions are universal
);

-- ----------------------------------------------------------------------------
-- ROUND_PROMPTS  (the 5 prompts drawn for one specific session, in order)
-- ----------------------------------------------------------------------------
create table mareed_round_prompts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references mareed_sessions(id) on delete cascade,
  round_number  int not null check (round_number between 1 and 5),
  prompt_id     uuid references mareed_prompts(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- ANSWERS
-- ----------------------------------------------------------------------------
create table mareed_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references mareed_sessions(id) on delete cascade,
  round_number  int not null,
  player_id     uuid references mareed_players(id) on delete cascade,
  text          text not null check (char_length(text) <= 80),
  submitted_at  timestamptz default now(),
  unique (session_id, round_number, player_id)
);

-- ----------------------------------------------------------------------------
-- VOTES
-- ----------------------------------------------------------------------------
create table mareed_votes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references mareed_sessions(id) on delete cascade,
  round_number      int not null,
  voter_player_id   uuid references mareed_players(id) on delete cascade,
  answer_id         uuid references mareed_answers(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- ROUND_RESULTS
-- ----------------------------------------------------------------------------
create table mareed_round_results (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references mareed_sessions(id) on delete cascade,
  round_number        int not null,
  winner_answer_id    uuid references mareed_answers(id),
  winner_player_id    uuid references mareed_players(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- PREWARM — the 16 "مين أكثر واحد ممكن..." voting questions from the spec.
-- Fully separate from the scored 1-5 rounds, same as شوفة's own prewarm:
-- its own prompt bank and vote table, never touches mareed_answers/
-- mareed_votes/mareed_round_results, so it can never affect scoring.
-- ----------------------------------------------------------------------------
create table mareed_prewarm_prompts (
  id          uuid primary key default gen_random_uuid(),
  text_ar     text not null,
  text_en     text not null,
  active      boolean default true
);

create table mareed_prewarm_round_prompts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references mareed_sessions(id) on delete cascade,
  round_number  int not null check (round_number between 1 and 5),
  prompt_id     uuid references mareed_prewarm_prompts(id),
  unique (session_id, round_number)
);

create table mareed_prewarm_votes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references mareed_sessions(id) on delete cascade,
  round_number      int not null,
  voter_player_id   uuid references mareed_players(id) on delete cascade,
  voted_for_player_id uuid references mareed_players(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_mareed_players_session on mareed_players(session_id);
create index idx_mareed_answers_session_round on mareed_answers(session_id, round_number);
create index idx_mareed_votes_session_round on mareed_votes(session_id, round_number);
create index idx_mareed_round_prompts_session on mareed_round_prompts(session_id);
create index idx_mareed_prewarm_round_prompts_session on mareed_prewarm_round_prompts(session_id);
create index idx_mareed_prewarm_votes_session_round on mareed_prewarm_votes(session_id, round_number);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table mareed_sessions enable row level security;
alter table mareed_players enable row level security;
alter table mareed_prompts enable row level security;
alter table mareed_round_prompts enable row level security;
alter table mareed_answers enable row level security;
alter table mareed_votes enable row level security;
alter table mareed_round_results enable row level security;
alter table mareed_prewarm_prompts enable row level security;
alter table mareed_prewarm_round_prompts enable row level security;
alter table mareed_prewarm_votes enable row level security;

create policy "mareed_sessions_read" on mareed_sessions for select using (true);
create policy "mareed_sessions_host_insert" on mareed_sessions for insert with check (host_user_id = auth.uid());
create policy "mareed_sessions_host_update" on mareed_sessions for update using (host_user_id = auth.uid());

create policy "mareed_players_read" on mareed_players for select using (true);
create policy "mareed_players_self_insert" on mareed_players for insert with check (user_id = auth.uid());
create policy "mareed_players_self_update" on mareed_players for update using (user_id = auth.uid());

create policy "mareed_prompts_read" on mareed_prompts for select using (true);

create policy "mareed_round_prompts_read" on mareed_round_prompts for select using (true);
create policy "mareed_round_prompts_host_insert" on mareed_round_prompts for insert with check (
  exists (select 1 from mareed_sessions where id = session_id and host_user_id = auth.uid())
);

create policy "mareed_answers_read" on mareed_answers for select using (true);
create policy "mareed_answers_own_insert" on mareed_answers for insert with check (
  exists (select 1 from mareed_players where id = player_id and user_id = auth.uid())
);

create policy "mareed_votes_read" on mareed_votes for select using (true);
create policy "mareed_votes_own_insert" on mareed_votes for insert with check (
  exists (select 1 from mareed_players where id = voter_player_id and user_id = auth.uid())
);

create policy "mareed_round_results_read" on mareed_round_results for select using (true);

create policy "mareed_prewarm_prompts_read" on mareed_prewarm_prompts for select using (true);
create policy "mareed_prewarm_round_prompts_read" on mareed_prewarm_round_prompts for select using (true);
create policy "mareed_prewarm_round_prompts_host_insert" on mareed_prewarm_round_prompts for insert with check (
  exists (select 1 from mareed_sessions where id = session_id and host_user_id = auth.uid())
);
create policy "mareed_prewarm_votes_read" on mareed_prewarm_votes for select using (true);
create policy "mareed_prewarm_votes_own_insert" on mareed_prewarm_votes for insert with check (
  exists (select 1 from mareed_players where id = voter_player_id and user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table mareed_sessions;
alter publication supabase_realtime add table mareed_players;
alter publication supabase_realtime add table mareed_answers;
alter publication supabase_realtime add table mareed_votes;

-- ----------------------------------------------------------------------------
-- SCORING — one Postgres call per round (tally votes, assign 5/3/2/1
-- points, update scores, record the winner, flip to reveal), called via
-- the service-role /api/mareed-round-result route. Idempotent — safe to
-- call twice for the same round.
-- ----------------------------------------------------------------------------
create or replace function mareed_compute_round_result(p_session_id uuid, p_round_number int)
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
  select rr.winner_player_id, a.text as answer_text, p.nickname, p.avatar_emoji
  into v_existing
  from mareed_round_results rr
  join mareed_answers a on a.id = rr.winner_answer_id
  join mareed_players p on p.id = rr.winner_player_id
  where rr.session_id = p_session_id and rr.round_number = p_round_number;

  if found then
    update mareed_sessions
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

  for v_row in
    select a.id as answer_id, a.player_id, a.text,
           count(v.id) as votes
    from mareed_answers a
    left join mareed_votes v on v.answer_id = a.id
    where a.session_id = p_session_id and a.round_number = p_round_number
    group by a.id, a.player_id, a.text
    order by count(v.id) desc, a.submitted_at asc
  loop
    v_rank := v_rank + 1;
    v_points := case v_rank when 1 then 5 when 2 then 3 when 3 then 2 else 1 end;

    update mareed_players
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

  insert into mareed_round_results (session_id, round_number, winner_answer_id, winner_player_id)
  values (p_session_id, p_round_number, v_winner_answer_id, v_winner_player_id)
  on conflict (session_id, round_number) do nothing;

  select nickname, avatar_emoji into v_winner_nickname, v_winner_avatar
  from mareed_players where id = v_winner_player_id;

  update mareed_sessions
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

revoke execute on function mareed_compute_round_result(uuid, int) from public;
revoke execute on function mareed_compute_round_result(uuid, int) from anon;
revoke execute on function mareed_compute_round_result(uuid, int) from authenticated;
grant execute on function mareed_compute_round_result(uuid, int) to service_role;

-- ============================================================================
-- SEED — the 16 main open-text questions from the spec, used exactly as
-- written, all universal (audience = null). Category is 'wildcard'
-- uniformly — these don't map cleanly onto شوفة's original opening/
-- career/lifestyle/etc. categories, and category isn't surfaced to
-- players anywhere in the UI, so a single consistent label is simplest
-- and avoids touching the category CHECK constraint at all.
-- ============================================================================
insert into mareed_prompts (category, text_ar, text_en, audience) values
('wildcard', 'إذا صحيت ولقيت نفسك في مكان ما تعرفه، وش أول شيء بتسويه؟', 'If you woke up somewhere you don''t recognize, what''s the first thing you''d do?', null),
('wildcard', 'إذا سمعت صوت يناديك من تحت السرير، وش بتقول له؟', 'If you heard a voice calling you from under your bed, what would you say to it?', null),
('wildcard', 'إذا فتحت جوالك ولقيت رسالة من نفسك تقول: «لا تثق في احد»، وش بتسوي؟', 'If you opened your phone and found a message from yourself saying "trust no one," what would you do?', null),
('wildcard', 'إذا صحيت ولقيت باب غرفتك مفتوح وأنت متأكد إنك قفلته، وش أول تفسير؟', 'If you woke up and found your door open when you''re sure you locked it, what''s your first theory?', null),
('wildcard', 'إذا رديت على اتصال وسمعت صوتك يقول: «لا تطلع من البيت اليوم»، وش بتسوي؟', 'If you answered a call and heard your own voice say "don''t leave the house today," what would you do?', null),
('wildcard', 'إذا شفت نفسك في انعكاس المراية تسوي حركة أنت ما سويتها، وش أول شيء بتسويه؟', 'If your reflection in the mirror made a move you didn''t make, what''s the first thing you''d do?', null),
('wildcard', 'إذا صحيت ولقيت ورقة مكتوب فيها بخطك: «إذا قريت هذا، اهرب»، وش بتسوي؟', 'If you woke up and found a note in your own handwriting saying "if you''re reading this, run," what would you do?', null),
('wildcard', 'إذا شخص غريب سلم عليك وقال: «واضح إن الدواء بدأ يشتغل»، وش بترد؟', 'If a stranger greeted you and said "clearly the medication is kicking in," how would you respond?', null),
('wildcard', 'إذا صحيت ولقيت 30 مكالمة فائتة من نفسك، وش بتسوي؟', 'If you woke up to 30 missed calls from yourself, what would you do?', null),
('wildcard', 'إذا أحد دق عليك وقال: «أنا أنت بعد خمس سنوات»، وش أول سؤال بتسأله؟', 'If someone called you and said "I''m you, five years from now," what''s the first question you''d ask?', null),
('wildcard', 'إذا اكتشفت إنك طول اليوم كنت تتكلم مع شخص محد كان يشوفه، وش بتسوي؟', 'If you found out you''d spent the whole day talking to someone nobody else could see, what would you do?', null),
('wildcard', 'لو عقلك عنده سجل بحث، وش أكثر شيء تخاف أحد يشوفه؟', 'If your mind had a search history, what''s the thing you''d be most afraid someone would see?', null),
('wildcard', 'لو فيه شخص يعيش داخل راسك ويعلق على كل شيء تسويه، وش بتسميه؟', 'If someone lived inside your head narrating everything you do, what would you name them?', null),
('wildcard', 'إذا صحيت من النوم واكتشفت ان كل حياتك كانت حلم والحين عمرك ٦ سنوات. وش بتسوي؟', 'If you woke up and discovered your whole life was a dream and you''re actually 6 years old, what would you do?', null),
('wildcard', 'لو ساكن لحالك ولقيت طبخة جاهزة مو انت مسويها. وش بتسوي؟', 'If you live alone and found a home-cooked meal ready that you didn''t make, what would you do?', null),
('wildcard', 'إذا رحت عند اهلك ولقيت نسخة ثانية منك قاعدة معهم. كيف بتقنعهم ان انت الحقيقي؟', 'If you went to your family''s house and found a second version of yourself sitting there, how would you convince them you''re the real one?', null);

-- ============================================================================
-- SEED — the 16 prewarm voting questions from the spec, used exactly as
-- written. text_en falls back to the Arabic (same convention شوفة's own
-- prewarm bank uses) until/if English copy is written.
-- ============================================================================
insert into mareed_prewarm_prompts (text_ar, text_en) values
('مين أكثر واحد ممكن يقتنع إن فيه كاميرا مخفية في بيته؟', 'مين أكثر واحد ممكن يقتنع إن فيه كاميرا مخفية في بيته؟'),
('مين أكثر واحد ممكن يشك إن حياته كلها تجربة؟', 'مين أكثر واحد ممكن يشك إن حياته كلها تجربة؟'),
('مين أكثر واحد ممكن يصدق إن عنده قدرة خارقة وما يدري؟', 'مين أكثر واحد ممكن يصدق إن عنده قدرة خارقة وما يدري؟'),
('مين أكثر واحد ممكن يقتنع إن أحد يرسل له رسائل مشفرة؟', 'مين أكثر واحد ممكن يقتنع إن أحد يرسل له رسائل مشفرة؟'),
('مين أكثر واحد ممكن يقتنع إن أحد يقرأ أفكاره؟', 'مين أكثر واحد ممكن يقتنع إن أحد يقرأ أفكاره؟'),
('مين أكثر واحد ممكن يصدق إن حلمه كان رسالة تحذيرية؟', 'مين أكثر واحد ممكن يصدق إن حلمه كان رسالة تحذيرية؟'),
('مين أكثر واحد ممكن يغير روتينه بالكامل بسبب إحساس غريب؟', 'مين أكثر واحد ممكن يغير روتينه بالكامل بسبب إحساس غريب؟'),
('مين أكثر واحد ممكن يشك إن العالم اللي حوله مو حقيقي؟', 'مين أكثر واحد ممكن يشك إن العالم اللي حوله مو حقيقي؟'),
('مين أكثر واحد ممكن يتخيل سيناريو في راسه ويصدقه؟', 'مين أكثر واحد ممكن يتخيل سيناريو في راسه ويصدقه؟'),
('مين أكثر واحد ممكن يكلم نفسه بصوت عالي؟', 'مين أكثر واحد ممكن يكلم نفسه بصوت عالي؟'),
('مين أكثر واحد ممكن يصدق نظرية مؤامرة اخترعها بنفسه؟', 'مين أكثر واحد ممكن يصدق نظرية مؤامرة اخترعها بنفسه؟'),
('مين أكثر واحد ممكن يرجع يتأكد من شيء وهو متأكد إنه تأكد منه؟', 'مين أكثر واحد ممكن يرجع يتأكد من شيء وهو متأكد إنه تأكد منه؟'),
('مين أكثر واحد ممكن يجهز رد على سؤال محد سأله؟', 'مين أكثر واحد ممكن يجهز رد على سؤال محد سأله؟'),
('مين أكثر واحد ممكن يشك إن جواله يسمعه؟', 'مين أكثر واحد ممكن يشك إن جواله يسمعه؟'),
('مين أكثر واحد ممكن يبحث عن عرض بسيط ويطلع لنفسه 17 مرض؟', 'مين أكثر واحد ممكن يبحث عن عرض بسيط ويطلع لنفسه 17 مرض؟'),
('مين أكثر واحد ممكن يبني نظرية كاملة من موقف بسيط؟', 'مين أكثر واحد ممكن يبني نظرية كاملة من موقف بسيط؟');
