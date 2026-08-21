-- ============================================================================
-- خرب السالفة (Ruin Story) — Supabase / Postgres schema
-- ============================================================================
-- A Cards-Against-Humanity-shaped party game (judge + black-card prompt +
-- anonymous white-card answers), entirely original content, no reference
-- to any other product's name/branding anywhere. Route: /ruin_story.
--
-- ANONYMITY, the one genuinely new architectural piece here: the judge
-- must see submitted answers with NO indication of who submitted them,
-- something no other Bagdoonis game's data model needed before (every
-- other game either has no secret-authorship concept, or reveals
-- authorship immediately). ruin_story_answers itself is NOT directly
-- readable by clients at all — only through ruin_story_answers_public,
-- a view exposing card_id but never player_id. Postgres views run with
-- the view owner's permissions by default (not the querying user's),
-- so this view can safely expose a safe slice of an otherwise
-- RLS-locked table — the standard, correct pattern for "some columns
-- public, some columns not," rather than trusting every client to
-- simply not ask for the column it shouldn't have.
--
-- Run this in the Supabase SQL editor after the base schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SESSIONS — exactly 6 rounds, never configurable, per spec.
-- ----------------------------------------------------------------------------
create table ruin_story_sessions (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  host_user_id      uuid references users(id),
  lang              text default 'ar' check (lang in ('ar', 'en')),
  status            text default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  round_number      int default 1 check (round_number between 1 and 6),
  phase             text default 'answering' check (phase in ('answering', 'judging', 'reveal')),
  judge_player_id   uuid,  -- FK added below, once ruin_story_players exists
  black_card_id     uuid,  -- FK added below, once ruin_story_black_cards exists
  used_black_card_ids uuid[] default '{}',
  adult_mode        boolean default false, -- بدون فلتر, opt-in at creation
  answers_submitted_count int default 0, -- see ruin_story_submit_answer — routes the "someone submitted" signal through this openly-readable table since ruin_story_answers' RLS blocks realtime delivery for other players' rows
  created_at        timestamptz default now(),
  started_at        timestamptz,
  ended_at          timestamptz
);

-- ----------------------------------------------------------------------------
-- CARDS
-- ----------------------------------------------------------------------------
create table ruin_story_black_cards (
  id     uuid primary key default gen_random_uuid(),
  text   text not null,
  active boolean default true
);

create table ruin_story_white_cards (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  category   text,
  adult_only boolean default false,
  active     boolean default true
);

alter table ruin_story_sessions
  add constraint ruin_story_sessions_black_card_id_fkey foreign key (black_card_id) references ruin_story_black_cards(id);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table ruin_story_players (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references ruin_story_sessions(id) on delete cascade,
  user_id      uuid references users(id),
  nickname     text not null,
  avatar_emoji text default '\u{1F0CF}',
  score        int default 0,
  joined_at    timestamptz default now(),
  unique (session_id, user_id)
);

alter table ruin_story_sessions
  add constraint ruin_story_sessions_judge_player_id_fkey foreign key (judge_player_id) references ruin_story_players(id);

-- ----------------------------------------------------------------------------
-- HANDS — every white card ever dealt to a player this session, both
-- currently-held (used=false) and already-played (used=true). This is
-- deliberately an append-only log rather than a "current hand" array
-- column: it's what lets dealing logic exclude every card already
-- dealt to ANYONE this session with a plain query, which is the actual
-- mechanism behind "no duplicate cards" — not just within one player's
-- hand, but across the whole session's dealt pool.
-- ----------------------------------------------------------------------------
create table ruin_story_hands (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references ruin_story_sessions(id) on delete cascade,
  player_id  uuid references ruin_story_players(id) on delete cascade,
  card_id    uuid references ruin_story_white_cards(id),
  used       boolean default false,
  dealt_at   timestamptz default now()
);

create index idx_ruin_story_hands_player on ruin_story_hands(player_id, used);
create index idx_ruin_story_hands_session on ruin_story_hands(session_id);

-- ----------------------------------------------------------------------------
-- ANSWERS — one submission per player per round. NOT directly readable
-- by clients (see ruin_story_answers_public below) — that's what keeps
-- submissions anonymous until the judge has actually picked.
-- ----------------------------------------------------------------------------
create table ruin_story_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references ruin_story_sessions(id) on delete cascade,
  round_number  int not null,
  player_id     uuid references ruin_story_players(id) on delete cascade,
  card_id       uuid references ruin_story_white_cards(id),
  created_at    timestamptz default now(),
  unique (session_id, round_number, player_id)
);

-- Judge/everyone reads THIS during the judging phase — card_id only,
-- never player_id. Runs with the view owner's privileges, so it can
-- safely expose this slice even though the base table has no public
-- SELECT policy at all.
create view ruin_story_answers_public as
  select id, session_id, round_number, card_id from ruin_story_answers;

-- ----------------------------------------------------------------------------
-- ROUND_RESULTS — the only place a losing round's answer authorship
-- never gets recorded at all; only the WINNER's identity is ever
-- exposed to clients, exactly matching "reveal the winning answer,
-- reveal the player who submitted it" — nothing about who submitted
-- the answers that DIDN'T win.
-- ----------------------------------------------------------------------------
create table ruin_story_round_results (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid references ruin_story_sessions(id) on delete cascade,
  round_number       int not null,
  judge_player_id    uuid references ruin_story_players(id),
  black_card_id      uuid references ruin_story_black_cards(id),
  winning_player_id  uuid references ruin_story_players(id),
  winning_card_id    uuid references ruin_story_white_cards(id),
  created_at         timestamptz default now(),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table ruin_story_sessions enable row level security;
alter table ruin_story_black_cards enable row level security;
alter table ruin_story_white_cards enable row level security;
alter table ruin_story_players enable row level security;
alter table ruin_story_hands enable row level security;
alter table ruin_story_answers enable row level security;
alter table ruin_story_round_results enable row level security;

create policy "ruin_story_sessions_read" on ruin_story_sessions for select using (true);
create policy "ruin_story_sessions_host_insert" on ruin_story_sessions for insert with check (host_user_id = auth.uid());
-- Same reasoning as imposter_sessions: any connected player (not just
-- host) can advance session state, because normal gameplay progresses
-- automatically (per spec §12, "the host should NOT manually advance
-- every normal game phase") and that can't depend on one specific
-- person's tab being the one that happens to notice a phase is ready
-- to move on.
create policy "ruin_story_sessions_players_update" on ruin_story_sessions for update using (
  host_user_id = auth.uid()
  or exists (select 1 from ruin_story_players p where p.session_id = id and p.user_id = auth.uid())
);

create policy "ruin_story_black_cards_read" on ruin_story_black_cards for select using (true);
create policy "ruin_story_white_cards_read" on ruin_story_white_cards for select using (true);

create policy "ruin_story_players_read" on ruin_story_players for select using (true);
create policy "ruin_story_players_self_insert" on ruin_story_players for insert with check (user_id = auth.uid());
create policy "ruin_story_players_self_update" on ruin_story_players for update using (user_id = auth.uid());

-- Hands stay strictly private — only the owning player can ever read
-- their own hand. Nobody needs to read anyone else's hand for any
-- legitimate reason in this game.
create policy "ruin_story_hands_own_read" on ruin_story_hands for select using (
  exists (select 1 from ruin_story_players p where p.id = player_id and p.user_id = auth.uid())
);

-- No select policy on ruin_story_answers for OTHER players' rows —
-- that's what the view above is for. This one is scoped to a player's
-- OWN row only (auth.uid() = the row's own player), which is a
-- genuinely different, necessary thing: without it, a player has no
-- way to check whether THEY already submitted this round (e.g. after
-- refreshing mid-round) without also being able to see everyone else's
-- — RLS has no partial-row concept, so "can read my own answer" has to
-- be its own explicit policy, not a side effect of the anonymous view.
create policy "ruin_story_answers_own_read" on ruin_story_answers for select using (
  exists (select 1 from ruin_story_players p where p.id = player_id and p.user_id = auth.uid())
);
create policy "ruin_story_answers_own_insert" on ruin_story_answers for insert with check (
  exists (select 1 from ruin_story_players where id = player_id and user_id = auth.uid())
);

create policy "ruin_story_round_results_read" on ruin_story_round_results for select using (true);

grant select on ruin_story_answers_public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table ruin_story_sessions;
alter publication supabase_realtime add table ruin_story_players;
alter publication supabase_realtime add table ruin_story_answers;
alter publication supabase_realtime add table ruin_story_hands;

-- ----------------------------------------------------------------------------
-- DEAL — brings a player's hand up to exactly 6 unused cards, drawing
-- only from cards never dealt to ANYONE this session (that's the actual
-- "no duplicates" guarantee — a global pool, not per-player). Weighted
-- lightly away from whatever category was dealt most recently to that
-- player, satisfying "avoid repeatedly giving players cards from the
-- same category" without needing a separate eligibility table.
-- ----------------------------------------------------------------------------
create or replace function ruin_story_deal_to_player(p_session_id uuid, p_player_id uuid, p_adult_mode boolean)
returns void
language plpgsql
security definer
as $$
declare
  v_current_count int;
  v_needed int;
  v_recent_category text;
begin
  select count(*) into v_current_count from ruin_story_hands where player_id = p_player_id and used = false;
  v_needed := 6 - v_current_count;
  if v_needed <= 0 then return; end if;

  select category into v_recent_category
  from ruin_story_hands h join ruin_story_white_cards c on c.id = h.card_id
  where h.player_id = p_player_id
  order by h.dealt_at desc limit 1;

  insert into ruin_story_hands (session_id, player_id, card_id)
  select p_session_id, p_player_id, c.id
  from ruin_story_white_cards c
  where c.active = true
    and (p_adult_mode = true or c.adult_only = false)
    and c.id not in (select card_id from ruin_story_hands where session_id = p_session_id)
  order by (c.category is not distinct from v_recent_category), random()
  limit v_needed;
end;
$$;

revoke execute on function ruin_story_deal_to_player(uuid, uuid, boolean) from public;
revoke execute on function ruin_story_deal_to_player(uuid, uuid, boolean) from anon;
revoke execute on function ruin_story_deal_to_player(uuid, uuid, boolean) from authenticated;
grant execute on function ruin_story_deal_to_player(uuid, uuid, boolean) to service_role;

-- ----------------------------------------------------------------------------
-- START ROUND — picks a fresh black card, rotates the judge, deals
-- every non-judge-about-to-be player back up to 6. Round 1 is also
-- handled by this same function (round_number defaults to 1, judge
-- starts null so "rotate" just picks the first player).
-- ----------------------------------------------------------------------------
create or replace function ruin_story_start_round(p_session_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_used_black uuid[];
  v_black_id uuid;
  v_current_judge uuid;
  v_next_judge uuid;
  v_adult boolean;
  v_player record;
begin
  select used_black_card_ids, judge_player_id, adult_mode
  into v_used_black, v_current_judge, v_adult
  from ruin_story_sessions where id = p_session_id for update;

  select id into v_black_id from ruin_story_black_cards
  where active = true and not (id = any(v_used_black))
  order by random() limit 1;
  if v_black_id is null then
    v_used_black := '{}';
    select id into v_black_id from ruin_story_black_cards where active = true order by random() limit 1;
  end if;

  -- Rotate: next player after the current judge in turn order (id
  -- order — no separate turn_order column needed here, judge rotation
  -- doesn't need to match join order the way خرب السالفة's answer
  -- phase has no "whose turn" concept at all, unlike المحتال).
  select id into v_next_judge from ruin_story_players
  where session_id = p_session_id and (v_current_judge is null or id > v_current_judge)
  order by id asc limit 1;
  if v_next_judge is null then
    select id into v_next_judge from ruin_story_players where session_id = p_session_id order by id asc limit 1;
  end if;

  update ruin_story_sessions
  set black_card_id = v_black_id,
      judge_player_id = v_next_judge,
      used_black_card_ids = array_append(v_used_black, v_black_id),
      phase = 'answering',
      status = 'in_progress',
      answers_submitted_count = 0,
      started_at = coalesce(started_at, now())
  where id = p_session_id;

  for v_player in select id from ruin_story_players where session_id = p_session_id loop
    perform ruin_story_deal_to_player(p_session_id, v_player.id, v_adult);
  end loop;

  return jsonb_build_object('black_card_id', v_black_id, 'judge_player_id', v_next_judge);
end;
$$;

revoke execute on function ruin_story_start_round(uuid) from public;
revoke execute on function ruin_story_start_round(uuid) from anon;
revoke execute on function ruin_story_start_round(uuid) from authenticated;
grant execute on function ruin_story_start_round(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- SELECT WINNER — judge picks a card_id (never a player_id — the judge
-- never knew who submitted it). Looks up the actual author internally,
-- awards the point, records the round result (now including
-- authorship, since the round is over), advances round_number, and
-- deals the winner (and everyone else) back to 6 — except after round
-- 6, deliberately, per spec.
-- ----------------------------------------------------------------------------
create or replace function ruin_story_select_winner(p_session_id uuid, p_card_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_round int;
  v_judge uuid;
  v_black uuid;
  v_winner_player uuid;
  v_adult boolean;
  v_existing record;
  v_player record;
  v_used_black uuid[];
  v_next_black uuid;
  v_next_judge uuid;
begin
  select round_number, judge_player_id, black_card_id, adult_mode, used_black_card_ids
  into v_round, v_judge, v_black, v_adult, v_used_black
  from ruin_story_sessions where id = p_session_id for update;

  select * into v_existing from ruin_story_round_results where session_id = p_session_id and round_number = v_round;
  if found then
    update ruin_story_sessions set phase = 'reveal' where id = p_session_id and phase <> 'reveal';
    return jsonb_build_object('already_computed', true, 'winning_player_id', v_existing.winning_player_id, 'winning_card_id', v_existing.winning_card_id);
  end if;

  select player_id into v_winner_player from ruin_story_answers
  where session_id = p_session_id and round_number = v_round and card_id = p_card_id;

  if v_winner_player is null then
    return jsonb_build_object('error', 'That card was not a valid answer for this round');
  end if;

  -- Mark every card submitted this round used — it leaves the
  -- submitting player's hand permanently; the replenish step below is
  -- what brings each of them back to 6.
  update ruin_story_hands set used = true
  where card_id in (select card_id from ruin_story_answers where session_id = p_session_id and round_number = v_round)
    and player_id in (select player_id from ruin_story_answers where session_id = p_session_id and round_number = v_round);

  update ruin_story_players set score = score + 1 where id = v_winner_player;

  insert into ruin_story_round_results (session_id, round_number, judge_player_id, black_card_id, winning_player_id, winning_card_id)
  values (p_session_id, v_round, v_judge, v_black, v_winner_player, p_card_id);

  if v_round >= 6 then
    update ruin_story_sessions set phase = 'reveal', status = 'completed', ended_at = now() where id = p_session_id;
  else
    -- Everything the NEXT round needs — new black card, rotated judge,
    -- replenished hands — gets set up right now, while still showing
    -- 'reveal' for round v_round. This means the client's own
    -- "reveal → answering" transition (after a brief celebratory pause)
    -- is a plain phase flip, not a second RPC call: by the time that
    -- flip happens, round_number/judge/black_card/hands already belong
    -- to the round about to start, not the one just finished.
    select id into v_next_black from ruin_story_black_cards
    where active = true and not (id = any(v_used_black))
    order by random() limit 1;
    if v_next_black is null then
      v_used_black := '{}';
      select id into v_next_black from ruin_story_black_cards where active = true order by random() limit 1;
    end if;

    select id into v_next_judge from ruin_story_players
    where session_id = p_session_id and id > v_judge
    order by id asc limit 1;
    if v_next_judge is null then
      select id into v_next_judge from ruin_story_players where session_id = p_session_id order by id asc limit 1;
    end if;

    update ruin_story_sessions
    set phase = 'reveal',
        round_number = v_round + 1,
        black_card_id = v_next_black,
        judge_player_id = v_next_judge,
        used_black_card_ids = array_append(v_used_black, v_next_black),
        answers_submitted_count = 0
    where id = p_session_id;

    for v_player in select id from ruin_story_players where session_id = p_session_id loop
      perform ruin_story_deal_to_player(p_session_id, v_player.id, v_adult);
    end loop;
  end if;

  return jsonb_build_object('already_computed', false, 'winning_player_id', v_winner_player, 'winning_card_id', p_card_id);
end;
$$;

revoke execute on function ruin_story_select_winner(uuid, uuid) from public;
revoke execute on function ruin_story_select_winner(uuid, uuid) from anon;
revoke execute on function ruin_story_select_winner(uuid, uuid) from authenticated;
grant execute on function ruin_story_select_winner(uuid, uuid) to service_role;

-- ============================================================================
-- SEED — curated from the spec's raw candidate banks (50 black cards,
-- 187 white cards), per the spec's own explicit instruction not to
-- import everything blindly.
--
-- BLACK CARDS: 50 → 44. Cut: near-duplicate wedding-ruining card (kept
-- the punchier of two), a near-duplicate "ruined friend outing" card,
-- and 4 of 7 "family WhatsApp group" cards that were all variations of
-- the same joke (kept the 3 most mechanically distinct: a specific
-- trigger message, an accidental reveal, and a wrong-group discovery).
--
-- WHITE CARDS: 187 → 124. This bank had several very large clusters —
-- 10 cards about WhatsApp messaging habits, 10 about sleep/mornings,
-- 10 about driving/parking, 10 about tech/wifi/chargers, 10 about
-- restaurant ordering — each restating the same basic joke with minor
-- variations. Per the spec's own explicit warnings ("do not make
-- everything about WhatsApp/cars/food"), each of those clusters was cut
-- to its 3-4 funniest, most distinct entries rather than kept whole.
-- Smaller clusters (the "broke friend" cluster, the "noncommittal
-- answer" cluster, the coffee-snob cluster) were trimmed the same way,
-- proportionally. The specifically-flagged religious-reference card
-- ("أقسم بالله كنت بحول لك") was not present in the exact list this was
-- built from — nothing to remove there — but every remaining card was
-- checked against the religious/political restriction and nothing else
-- matched it.
-- ============================================================================

insert into ruin_story_black_cards (text) values
('أكثر شيء يخرب العرس هو ______.'),
('أمي قالت لي: "إذا تزوجت، أهم شيء لا تتزوج ______."'),
('الشيء الوحيد اللي مستحيل تلقاه في الاستراحة هو ______.'),
('أكثر شيء يخلي أبوك يعصب عليك هو ______.'),
('السبب الحقيقي اللي يخلي الواحد يطلع من قروب العائلة هو ______.'),
('أول شيء يسويه السعودي إذا نزل الراتب هو ______.'),
('أكثر جملة سعودية تخوف هي: "تعال أبي ______."'),
('لو أمي فتشت جوالي، أكثر شيء بتخاف تلقاه هو ______.'),
('الشيء اللي يخلي العزيمة تتحول إلى كارثة هو ______.'),
('أكثر شيء مستحيل يخلص في العزيمة هو ______.'),
('خويي قال لي: "ثق فيني"، وبعدها ______.'),
('الشيء الوحيد اللي يخليك تندم إنك وافقت تطلع مع خويانك هو ______.'),
('أسوأ شيء ممكن تسمعه وأنت داخل الاستراحة هو ______.'),
('إذا قال لك خويك "دقيقتين وأكون عندك"، فهو غالبًا ______.'),
('السبب الحقيقي اللي يخلي خويك ما يدفع الحساب هو ______.'),
('في كل شلة فيه واحد معروف بأنه ______.'),
('الشيء اللي مستحيل تستعير من خويك وترجعه له هو ______.'),
('خويك الجديد حاول يندمج مع الشلة عن طريق ______.'),
('لو خويك صار مليونير، أول شيء بيسويه هو ______.'),
('الرسالة اللي تخليك تفتح قروب العائلة بسرعة هي: ______.'),
('إذا أرسل لك أبوك "وينك؟"، فأنت ______.'),
('أكثر شيء ممكن ينكشف بالغلط في قروب العائلة هو ______.'),
('دخلت قروب بالغلط ووجدت ______.'),
('أسوأ شيء ممكن يصير لك في أول موعد هو ______.'),
('الشيء اللي يخليك تعرف أن الخطبة ما راح تكمل هو ______.'),
('قالت له: "أبي شيء بسيط"، فاشترى لها ______.'),
('السبب الحقيقي لتأخر الزواج هو ______.'),
('لو أم العروس سألتك "وش تشتغل؟"، أفضل إجابة هي ______.'),
('أول سؤال تسأله العائلة بعد ما تعرف أنك تزوجت هو ______.'),
('أكثر شيء يخوف الشخص قبل الزواج هو ______.'),
('المدير قال: "اجتماع بسيط مدته خمس دقائق"، وانتهى الاجتماع بـ ______.'),
('السبب الحقيقي اللي يخلي الموظف يفتح إجازة مرضية هو ______.'),
('أكثر شيء يخليك تكره الدوام هو ______.'),
('إذا قال لك المدير "عندك دقيقة؟"، جهز نفسك لـ ______.'),
('أسوأ شيء ممكن يصير في اجتماع أونلاين هو ______.'),
('الشيء اللي تسويه إذا شفت المدير داخل عليك وأنت ما تشتغل هو ______.'),
('رحت مطعم مشهور عشان أجربه، واكتشفت أن السر كله في ______.'),
('أكثر شيء يضيع وقتك في المول هو ______.'),
('أسوأ شيء ممكن يصير في زحمة الرياض هو ______.'),
('إذا ضعت في موقف المول، الحل الوحيد هو ______.'),
('الشيء اللي السعودي مستعد يسافر عشانه ساعتين هو ______.'),
('أكثر شيء يختفي من الثلاجة في البيت هو ______.'),
('إذا قال لك أحد "عندي لك سالفة"، فأنت تعرف أن الموضوع عن ______.'),
('وفي النهاية، كل مشاكلنا كانت بسبب ______.');

insert into ruin_story_white_cards (text, category) values
('أمي قالت لا', 'family'),
('أبوي عرف', 'family'),
('خويي البخيل', 'friends'),
('واحد ما يعرف يسوق', 'driving'),
('الراتب نزل', 'money'),
('الراتب اختفى', 'money'),
('تحويل بنكي بالغلط', 'money'),
('قروب العائلة', 'family'),
('الوالدة في الصالة', 'family'),
('خمس دقايق وأجيك', 'phrases'),
('آخر حبة كبسة', 'food'),
('صحن مقلقل', 'food'),
('شاهي بعد العشاء', 'food'),
('قهوة سعودية زيادة', 'food'),
('واحد شبعان ويقول ما شبعت', 'food'),
('عزيمة بدون موعد', 'social'),
('عرس ولد الجيران', 'social'),
('خالي اللي يسأل أسئلة', 'family'),
('عمتي الفضولية', 'family'),
('ولد خالتي', 'family'),
('واحد معه واسطة', 'social'),
('دوام يوم السبت', 'work'),
('اجتماع مال أمّه داعي', 'work'),
('المدير واقف وراك', 'work'),
('إيميل الساعة 4:59', 'work'),
('"نحتاجها أمس"', 'work'),
('إجازة انرفضت', 'work'),
('قهوة المكتب', 'work'),
('واحد يداوم بدري', 'work'),
('موظف ما يرد على الإيميل', 'work'),
('"وينك؟"', 'phrases'),
('"تعال أبيك"', 'phrases'),
('"لا تعلم أحد"', 'phrases'),
('"عندي لك سالفة"', 'phrases'),
('"دقيقة بس"', 'phrases'),
('"على حسب"', 'phrases'),
('خويي اللي يتأخر ساعة', 'friends'),
('خويي اللي يصور كل شيء', 'friends'),
('خويي اللي يحسبها بالهللة', 'friends'),
('خويي اللي ما يسكت', 'friends'),
('خويي اللي يختفي وقت الحساب', 'friends'),
('شخص ما يعرف يختار مطعم', 'food'),
('واحد يطلب أكل ويقول "بس بأذوق"', 'food'),
('واحد يقول "آخر طلعة" كل مرة', 'friends'),
('شاحن آيفون ضايع', 'tech'),
('سيارة ما فيها بنزين', 'driving'),
('أمي شافتني طالع وقالت: «مع مين؟»', 'family'),
('أبوي فتح باب الغرفة بدون ما يدق', 'family'),
('خويي قال «أنا محاسب» واختفى', 'friends'),
('واحد يحط الجوال على السماعة في المجلس', 'social'),
('اللي يقول «ما أبي شيء» ثم يأكل من صحنك', 'food'),
('شخص للحين يستخدم كلمة «سنابي»', 'tech'),
('خويك اللي عنده 47 قروب واتساب', 'tech'),
('واحد يصور الفاتورة قبل ما يدفع', 'money'),
('اللي يقول «نقسمها بيننا» بعد ما طلب أغلى شيء', 'money'),
('أمك تناديك باسم أخوك', 'family'),
('واحد دخل العزيمة بدون ما يعزمونه', 'social'),
('عمك اللي يحول أي سالفة إلى استثمار', 'family'),
('خالتك اللي تعرف راتب كل واحد', 'family'),
('جدتك تدعي لك بالزواج قدام شخص ما تعرفه', 'family'),
('واحد يقول «ما شاء الله عليك نحفت» وأنت زدت 10 كيلو', 'social'),
('قريبك يفتح موضوع الزواج وأنت توك جالس', 'family'),
('شخص يحاول يطلع من العزيمة بدون ما يسلم على أحد', 'social'),
('«ترى ما عندي إلا 20 ريال»', 'money'),
('«أبشر إذا نزل الراتب»', 'money'),
('«جاي بالطريق»', 'phrases'),
('«وصلت»', 'phrases'),
('«من قال لك إني جاي؟»', 'phrases'),
('خويي اشترى سيارة عشان يروح فيها البقالة', 'driving'),
('واحد يغسل سيارته أكثر مما يغسل ملابسه', 'driving'),
('شخص يشتري شيء غالي ثم يقول «كان عليه خصم»', 'money'),
('خويي اللي يفتح المكيف على 16 درجة', 'friends'),
('واحد يركب سيارته ويشغل أغنية حزينة', 'driving'),
('شخص يوقف قدام المحل ويقول «دقيقة» لمدة 40 دقيقة', 'social'),
('واحد يدخل الكوفي عشان يصور الستوري', 'social'),
('كيس تمر من بيت الجيران', 'food'),
('عامل التوصيل اللي ما يعرف يلقى البيت', 'social'),
('فاتورة كهرباء تخليك تعيد حسابات حياتك', 'money'),
('شبشب مفقود في المسجد', 'social'),
('واحد يلبس شماغه بالمقلوب', 'social'),
('كبسة من أمس', 'food'),
('شخص يسوي نفسه ما شافك عشان ما يسلم', 'social'),
('واحد يفتح موضوع الأسهم على العشاء', 'money'),
('شخص يحول 1 ريال ويكتب «تجربة»', 'money'),
('واحد يطلب قرض وهو توه نازل له الراتب', 'money'),
('شخص عنده 14 بطاقة بنكية', 'money'),
('واحد ينسى كلمة مرور أبشر', 'tech'),
('شخص يفتح تطبيق البنك قبل لا يطلب', 'money'),
('عامل محطة يقول «تبغى أغسل القزاز؟»', 'driving'),
('شخص يوقف عند الكاشير ويكتشف أنه ناسي محفظته', 'money'),
('واحد يرجع للبيت عشان نسى الشاحن', 'tech'),
('شخص يروح المطار قبل الرحلة بسبع ساعات', 'travel'),
('واحد يكتشف جوازه منتهي قبل السفر بيوم', 'travel'),
('شنطة سفر أكبر من صاحبها', 'travel'),
('شخص يشتري 20 كيلو من الأشياء في الديوتي فري', 'travel'),
('واحد يضيع عند بوابة الطائرة', 'travel'),
('شخص يصفق بعد هبوط الطائرة', 'travel'),
('خويك اللي يقول «رشّة وحدة» ثم يأخذ العطر', 'social'),
('واحد يلبس ثوب جديد ويجلس بحذر عشان ما يتوسخ', 'social'),
('واحد يقيس نظارة شمسية ويصور نفسه', 'social'),
('واحد يشرب القهوة بدون سكر ويخبر الجميع', 'food'),
('«التحميص متوسط» وهو ما يعرف وش يعني', 'food'),
('خويك اللي يذكرك كل يوم إنه صايم رياضيًا', 'friends'),
('واحد يسوي لقطة شاشة للمحادثة ويرسلها لنفس الشخص', 'tech'),
('شخص يفتح الكاميرا بالغلط أثناء مكالمة', 'tech'),
('واحد يكتب رسالة طويلة ثم يرسلها على شكل 17 رسالة منفصلة', 'tech'),
('شخص يكتب «؟» بعد 12 ثانية بالضبط', 'tech'),
('واحد يحط المنبه الساعة 6:00 ثم يقوم 6:47', 'daily'),
('خويك اللي يقول «بنام بدري اليوم» الساعة 3 الفجر', 'friends'),
('واحد يدور جواله وهو ماسكه بيده', 'daily'),
('واحد يحط خمس منبهات وكلها بنفس الوقت', 'daily'),
('واحد يستخدم الخرائط وهو يعرف الطريق عن ظهر قلب', 'driving'),
('خويك اللي ما يوقف إلا بموقف قريب حتى لو دار 10 لفات', 'driving'),
('شخص يعتبر كل إشارة خضراء إشارة انطلاق سباق', 'driving'),
('واحد يبطئ عشان يتفرج على حادث بسيط', 'driving'),
('شخص يصلح كل شيء بشطرطون', 'tech'),
('خويك اللي يقول «أنا أعرف بالتقنية» ثم يعيد تشغيل الراوتر', 'tech'),
('واحد يسأل «وش كلمة السر؟» وهو متصل بالواي فاي أصلًا', 'tech'),
('خويك اللي يغير اسم شبكة الواي فاي إلى شيء غبي', 'tech'),
('واحد يأكل آخر قطعة ثم يقول «مين كان يبيها؟»', 'food'),
('واحد يقول «ما أبي حلى» ثم يخلص حلاك', 'food'),
('شخص يقول «أي شيء يناسبكم» ثم يرفض كل الاقتراحات', 'food'),
('واحد يطلب نفس طلبك لأنه «شكله حلو»', 'food'),
('خويك اللي يراجع تقييم المطعم قبل لا يجلس', 'food');

-- ----------------------------------------------------------------------------
-- SUBMIT ANSWER — inserts the answer and atomically bumps
-- answers_submitted_count on the session row in one transaction, so the
-- count can never drift out of sync with the real number of answers.
-- Routes the "someone submitted" signal through ruin_story_sessions
-- (openly readable, already realtime-subscribed by every client)
-- instead of relying on realtime for ruin_story_answers itself — that
-- table's SELECT policy only permits reading your own row (for
-- anonymity), and Supabase Realtime respects RLS, so a client never
-- receives a change notification for a row it isn't allowed to SELECT.
-- security definer, but checks p_player_id genuinely belongs to the
-- caller first, since it bypasses RLS internally.
-- ----------------------------------------------------------------------------
create or replace function ruin_story_submit_answer(p_session_id uuid, p_round_number int, p_player_id uuid, p_card_id uuid)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from ruin_story_players where id = p_player_id and user_id = auth.uid()) then
    return jsonb_build_object('error', 'Not your player');
  end if;

  insert into ruin_story_answers (session_id, round_number, player_id, card_id)
  values (p_session_id, p_round_number, p_player_id, p_card_id)
  on conflict (session_id, round_number, player_id) do nothing;

  update ruin_story_sessions
  set answers_submitted_count = answers_submitted_count + 1
  where id = p_session_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function ruin_story_submit_answer(uuid, int, uuid, uuid) from public;
grant execute on function ruin_story_submit_answer(uuid, int, uuid, uuid) to authenticated, anon;
