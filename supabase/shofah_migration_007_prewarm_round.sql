-- ============================================================================
-- SHOFAH migration 007 — prewarm round (player-voting warm-up before round 1)
-- ============================================================================
-- A new round that runs once, after the countdown and before question round
-- 1, similar in spirit to Fashlah's Round 2 ("Vote for Friends"): 5 randomly
-- drawn prompts, players vote on EACH OTHER (not text answers), and after
-- everyone's done, a single shared teaser is shown to the whole group based
-- on the combined vote tallies across all 5 questions.
--
-- Deliberately fully separate from the scored 1-5 rounds:
--   - Its own prompt bank (shofah_prewarm_prompts) and vote table
--     (shofah_prewarm_votes) — nothing touches shofah_answers,
--     shofah_votes, or shofah_round_results, so it can never affect scoring.
--   - Uses current_round = 0 (currently only ever the pre-start lobby
--     placeholder, and never rendered by RoundScreen) combined with two new
--     round_phase values, so the existing 1-7 current_round numbering
--     contract elsewhere in the app (TOTAL_ROUNDS + 1 = final conversation,
--     TOTAL_ROUNDS + 2 = final reveal) doesn't need to shift at all.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PREWARM PROMPTS (master question bank — bilingual would be nice, but the
-- brief for this round was Arabic-only, so text_en falls back to text_ar
-- until/if English copy is written)
-- ----------------------------------------------------------------------------
create table shofah_prewarm_prompts (
  id          uuid primary key default gen_random_uuid(),
  text_ar     text not null,
  text_en     text not null,
  active      boolean default true
);

-- ----------------------------------------------------------------------------
-- PREWARM ROUND PROMPTS (the 5 prompts drawn for one specific session, in
-- order — persisted for the same reload/reconnect-safety reason as
-- shofah_round_prompts)
-- ----------------------------------------------------------------------------
create table shofah_prewarm_round_prompts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references shofah_sessions(id) on delete cascade,
  round_number  int not null check (round_number between 1 and 5),
  prompt_id     uuid references shofah_prewarm_prompts(id),
  unique (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- PREWARM VOTES (voter -> target player, per prewarm question)
-- ----------------------------------------------------------------------------
create table shofah_prewarm_votes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references shofah_sessions(id) on delete cascade,
  round_number      int not null,
  voter_player_id   uuid references shofah_players(id) on delete cascade,
  voted_for_player_id uuid references shofah_players(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (session_id, round_number, voter_player_id)
);

create index idx_shofah_prewarm_round_prompts_session on shofah_prewarm_round_prompts(session_id);
create index idx_shofah_prewarm_votes_session_round on shofah_prewarm_votes(session_id, round_number);

alter table shofah_prewarm_prompts enable row level security;
alter table shofah_prewarm_round_prompts enable row level security;
alter table shofah_prewarm_votes enable row level security;

-- Prompts: public read-only reference data.
create policy "shofah_prewarm_prompts_read" on shofah_prewarm_prompts for select using (true);

-- Round prompts: public read; only the session host writes (drawn once when
-- starting the game, same moment the real shofah_round_prompts are drawn).
create policy "shofah_prewarm_round_prompts_read" on shofah_prewarm_round_prompts for select using (true);
create policy "shofah_prewarm_round_prompts_host_insert" on shofah_prewarm_round_prompts for insert with check (
  exists (select 1 from shofah_sessions where id = session_id and host_user_id = auth.uid())
);

-- Votes: public read (needed client-side to compute the shared teaser once
-- everyone's done — this never touches scoring, so a public read policy
-- here carries none of the risk it would on the real shofah_votes table),
-- a player may only insert a vote tied to their own voter_player_id.
create policy "shofah_prewarm_votes_read" on shofah_prewarm_votes for select using (true);
create policy "shofah_prewarm_votes_own_insert" on shofah_prewarm_votes for insert with check (
  exists (select 1 from shofah_players where id = voter_player_id and user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- Widen round_phase to add the two prewarm phases. current_round stays 0
-- for the entire duration of this round (voting AND the shared teaser) —
-- it only becomes 1 when the real round 1 begins.
-- ----------------------------------------------------------------------------
alter table shofah_sessions drop constraint shofah_sessions_round_phase_check;
alter table shofah_sessions add constraint shofah_sessions_round_phase_check
  check (round_phase in ('countdown', 'prewarm', 'prewarm_teaser', 'answering', 'voting', 'reveal'));

-- ----------------------------------------------------------------------------
-- SEED — the 8 prompts from the brief
-- ----------------------------------------------------------------------------
insert into shofah_prewarm_prompts (text_ar, text_en) values
  ('مين آخر شخص ممكن يتزوج', 'مين آخر شخص ممكن يتزوج'),
  ('مين اول شخص بيتزوج', 'مين اول شخص بيتزوج'),
  ('مين بينطرد من الشوفة من اول دقيقة', 'مين بينطرد من الشوفة من اول دقيقة'),
  ('مين بيكون اكبر سيمب (خروف)', 'مين بيكون اكبر سيمب (خروف)'),
  ('مين اكثر واحد يشفع له وجهه', 'مين اكثر واحد يشفع له وجهه'),
  ('مين بيجيب ١٥ طفل من اول شهر', 'مين بيجيب ١٥ طفل من اول شهر'),
  ('مين بيتزوج اول شخص يشوفه', 'مين بيتزوج اول شخص يشوفه'),
  ('مين بيكون عنده اعلى مهر', 'مين بيكون عنده اعلى مهر');
