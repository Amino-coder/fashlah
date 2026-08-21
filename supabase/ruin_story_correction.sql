-- ============================================================================
-- خرب السالفة — CORRECTION / VERIFICATION SCRIPT
-- ============================================================================
-- Safe to run regardless of what you've already run for this game —
-- whether that's nothing, ruin_story_schema.sql only, ruin_story_schema.sql
-- + the migration, or something that partially failed partway through.
-- Every statement here is written to be idempotent: columns are added
-- only IF NOT EXISTS, functions are CREATE OR REPLACE (safe to redefine
-- any number of times), policies are dropped first then recreated (since
-- plain CREATE POLICY errors if one already exists under that name), and
-- grants are simply re-applied (harmless if already granted).
--
-- REQUIRES: the base tables from ruin_story_schema.sql already exist
-- (ruin_story_sessions, ruin_story_players, ruin_story_black_cards,
-- ruin_story_white_cards, ruin_story_hands, ruin_story_answers,
-- ruin_story_round_results). If you haven't run that file at all yet,
-- run it FIRST — this script only corrects/re-verifies what comes after
-- that, it doesn't create the tables themselves.
--
-- Run this in the Supabase SQL editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. The counter column — the actual fix for "0/2 answered never updates
--    live." If this was never added, nothing past this point will work
--    right, since ruin_story_submit_answer (below) writes to it.
-- ----------------------------------------------------------------------------
alter table ruin_story_sessions add column if not exists answers_submitted_count int default 0;

-- ----------------------------------------------------------------------------
-- 2. The anonymous view — re-created either way, harmless if it already
--    existed correctly.
-- ----------------------------------------------------------------------------
create or replace view ruin_story_answers_public as
  select id, session_id, round_number, card_id from ruin_story_answers;

grant select on ruin_story_answers_public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Every RLS policy this game depends on, dropped and recreated so the
--    final state is guaranteed correct regardless of what's there now.
-- ----------------------------------------------------------------------------
alter table ruin_story_sessions enable row level security;
alter table ruin_story_black_cards enable row level security;
alter table ruin_story_white_cards enable row level security;
alter table ruin_story_players enable row level security;
alter table ruin_story_hands enable row level security;
alter table ruin_story_answers enable row level security;
alter table ruin_story_round_results enable row level security;

drop policy if exists "ruin_story_sessions_read" on ruin_story_sessions;
create policy "ruin_story_sessions_read" on ruin_story_sessions for select using (true);

drop policy if exists "ruin_story_sessions_host_insert" on ruin_story_sessions;
create policy "ruin_story_sessions_host_insert" on ruin_story_sessions for insert with check (host_user_id = auth.uid());

drop policy if exists "ruin_story_sessions_players_update" on ruin_story_sessions;
create policy "ruin_story_sessions_players_update" on ruin_story_sessions for update using (
  host_user_id = auth.uid()
  or exists (select 1 from ruin_story_players p where p.session_id = id and p.user_id = auth.uid())
);

drop policy if exists "ruin_story_black_cards_read" on ruin_story_black_cards;
create policy "ruin_story_black_cards_read" on ruin_story_black_cards for select using (true);

drop policy if exists "ruin_story_white_cards_read" on ruin_story_white_cards;
create policy "ruin_story_white_cards_read" on ruin_story_white_cards for select using (true);

drop policy if exists "ruin_story_players_read" on ruin_story_players;
create policy "ruin_story_players_read" on ruin_story_players for select using (true);

drop policy if exists "ruin_story_players_self_insert" on ruin_story_players;
create policy "ruin_story_players_self_insert" on ruin_story_players for insert with check (user_id = auth.uid());

drop policy if exists "ruin_story_players_self_update" on ruin_story_players;
create policy "ruin_story_players_self_update" on ruin_story_players for update using (user_id = auth.uid());

drop policy if exists "ruin_story_hands_own_read" on ruin_story_hands;
create policy "ruin_story_hands_own_read" on ruin_story_hands for select using (
  exists (select 1 from ruin_story_players p where p.id = player_id and p.user_id = auth.uid())
);

-- No general select policy on ruin_story_answers — deliberately. Only
-- your own row (below) and the anonymous view above.
drop policy if exists "ruin_story_answers_own_read" on ruin_story_answers;
create policy "ruin_story_answers_own_read" on ruin_story_answers for select using (
  exists (select 1 from ruin_story_players p where p.id = player_id and p.user_id = auth.uid())
);

drop policy if exists "ruin_story_answers_own_insert" on ruin_story_answers;
create policy "ruin_story_answers_own_insert" on ruin_story_answers for insert with check (
  exists (select 1 from ruin_story_players where id = player_id and user_id = auth.uid())
);

drop policy if exists "ruin_story_round_results_read" on ruin_story_round_results;
create policy "ruin_story_round_results_read" on ruin_story_round_results for select using (true);

-- ----------------------------------------------------------------------------
-- 4. Realtime — safe to "add" a table to the publication repeatedly only
--    if it's not already in it; guarded with a check so this doesn't
--    error if it's already added.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ruin_story_sessions'
  ) then
    alter publication supabase_realtime add table ruin_story_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ruin_story_players'
  ) then
    alter publication supabase_realtime add table ruin_story_players;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ruin_story_answers'
  ) then
    alter publication supabase_realtime add table ruin_story_answers;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ruin_story_hands'
  ) then
    alter publication supabase_realtime add table ruin_story_hands;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 5. All four functions — CREATE OR REPLACE, so re-running this any
--    number of times always leaves you with the latest correct version.
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

revoke execute on function ruin_story_deal_to_player(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function ruin_story_deal_to_player(uuid, uuid, boolean) to service_role;

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

revoke execute on function ruin_story_start_round(uuid) from public, anon, authenticated;
grant execute on function ruin_story_start_round(uuid) to service_role;

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

  update ruin_story_hands set used = true
  where card_id in (select card_id from ruin_story_answers where session_id = p_session_id and round_number = v_round)
    and player_id in (select player_id from ruin_story_answers where session_id = p_session_id and round_number = v_round);

  update ruin_story_players set score = score + 1 where id = v_winner_player;

  insert into ruin_story_round_results (session_id, round_number, judge_player_id, black_card_id, winning_player_id, winning_card_id)
  values (p_session_id, v_round, v_judge, v_black, v_winner_player, p_card_id);

  if v_round >= 6 then
    update ruin_story_sessions set phase = 'reveal', status = 'completed', ended_at = now() where id = p_session_id;
  else
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

revoke execute on function ruin_story_select_winner(uuid, uuid) from public, anon, authenticated;
grant execute on function ruin_story_select_winner(uuid, uuid) to service_role;

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

-- Unlike the other three, this one IS callable directly by players
-- (submitting your own answer isn't sensitive) — the JS client calls it
-- via supabase.rpc(), not a server API route.
revoke execute on function ruin_story_submit_answer(uuid, int, uuid, uuid) from public;
grant execute on function ruin_story_submit_answer(uuid, int, uuid, uuid) to authenticated, anon;

-- ============================================================================
-- Quick self-check — run this after the above to confirm the important
-- pieces are actually in place. Every row should show ok/true.
-- ============================================================================
select
  exists (select 1 from information_schema.columns where table_name = 'ruin_story_sessions' and column_name = 'answers_submitted_count') as has_counter_column,
  exists (select 1 from pg_proc where proname = 'ruin_story_submit_answer') as has_submit_function,
  exists (select 1 from pg_proc where proname = 'ruin_story_start_round') as has_start_function,
  exists (select 1 from pg_proc where proname = 'ruin_story_select_winner') as has_select_winner_function,
  exists (select 1 from pg_views where viewname = 'ruin_story_answers_public') as has_public_view,
  exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ruin_story_sessions') as sessions_realtime_on;
