-- ============================================================================
-- بدل الكلمة — real-time word-swap race game.
--
-- The core design problem this schema solves: multiple players can submit a
-- move "at the same time," but only one can win. Postgres row locking
-- (`select ... for update`) inside a single SECURITY DEFINER function is
-- what makes this safe — the first request to reach bidal_attempt_move for
-- a given session acquires a row lock on that session and holds it until
-- its transaction commits; every other concurrent request for the same
-- session blocks until then, and by the time it proceeds, current_word has
-- already changed, so its own staleness check correctly rejects it. This
-- is a standard, well-understood pattern for exactly this class of race —
-- no application-level locking or queueing needed.
-- ============================================================================

create table if not exists bidal_sessions (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  host_user_id      uuid not null,
  mode              text not null check (mode in ('multiplayer', 'solo')),
  status            text not null default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  current_word      text,
  move_index        int not null default 0,
  shuffle_used      boolean not null default false,
  time_limit_seconds int not null default 90, -- solo mode config; see lib/bidal-config.ts for the single source of truth on the client side
  started_at        timestamptz,
  ended_at          timestamptz,
  winner_player_id  uuid,
  lang              text not null default 'ar',
  created_at        timestamptz default now()
);

create table if not exists bidal_players (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references bidal_sessions(id) on delete cascade,
  user_id       uuid not null,
  nickname      text not null,
  avatar_emoji  text not null default '😎',
  letters       jsonb not null default '[]'::jsonb, -- array of single-character strings, e.g. ["م","س","ر"]
  finished      boolean not null default false,
  joined_at     timestamptz default now(),
  unique (session_id, user_id)
);

create table if not exists bidal_moves (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references bidal_sessions(id) on delete cascade,
  move_index    int not null,
  player_id     uuid references bidal_players(id) on delete set null, -- null for shuffle moves
  prev_word     text not null,
  new_word      text not null,
  letter_used   text,          -- null for shuffle moves
  position      int,           -- null for shuffle moves
  prev_letters  jsonb,         -- player's full letter array BEFORE this move — null for shuffle moves; this is what undo restores verbatim
  move_type     text not null default 'replace' check (move_type in ('replace', 'shuffle')),
  undone        boolean not null default false,
  created_at    timestamptz default now()
);

create index if not exists bidal_moves_session_idx on bidal_moves(session_id, move_index desc);

alter table bidal_sessions enable row level security;
alter table bidal_players enable row level security;
alter table bidal_moves enable row level security;

create policy "bidal_sessions_read" on bidal_sessions for select using (true);
create policy "bidal_players_read" on bidal_players for select using (true);
create policy "bidal_moves_read" on bidal_moves for select using (true);

-- Session creation and joining happen as plain client inserts (same pattern
-- as every other game) — only the actual gameplay writes (moves, undo,
-- shuffle, letter consumption) are funneled through the SECURITY DEFINER
-- functions below via service-role API routes, since those can affect
-- ANY player's row, not just the caller's own.
create policy "bidal_sessions_insert" on bidal_sessions for insert with check (true);
create policy "bidal_players_insert" on bidal_players for insert with check (true);

-- Host-only updates for plain session fields (starting the game, etc.).
-- The racing/undo/shuffle mutations bypass this policy entirely by running
-- inside SECURITY DEFINER functions, which is required anyway since a
-- winning move might not come from the host.
create policy "bidal_sessions_host_update" on bidal_sessions for update using (host_user_id = auth.uid());

-- ============================================================================
-- Atomic move attempt. See the file header for why the row lock here is
-- what makes concurrent racing safe.
-- ============================================================================
create or replace function bidal_attempt_move(
  p_session_id uuid,
  p_player_id uuid,
  p_expected_word text,
  p_new_word text,
  p_position int,
  p_letter text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_word text;
  v_status text;
  v_letters jsonb;
  v_idx int := null;
  v_move_index int;
  v_remaining int;
  i int;
  diff_count int := 0;
begin
  select current_word, status into v_word, v_status
    from bidal_sessions where id = p_session_id for update;

  if v_word is null then
    return jsonb_build_object('success', false, 'reason', 'not_found');
  end if;
  if v_status <> 'in_progress' then
    return jsonb_build_object('success', false, 'reason', 'not_active');
  end if;
  if v_word <> p_expected_word then
    return jsonb_build_object('success', false, 'reason', 'stale', 'current_word', v_word);
  end if;
  if length(p_new_word) <> 3 or length(v_word) <> 3 or p_position < 0 or p_position > 2 then
    return jsonb_build_object('success', false, 'reason', 'invalid_move');
  end if;

  for i in 1..3 loop
    if substr(p_new_word, i, 1) <> substr(v_word, i, 1) then
      diff_count := diff_count + 1;
    end if;
  end loop;
  if diff_count <> 1 then
    return jsonb_build_object('success', false, 'reason', 'invalid_diff');
  end if;
  if substr(p_new_word, p_position + 1, 1) <> p_letter or substr(v_word, p_position + 1, 1) = p_letter then
    return jsonb_build_object('success', false, 'reason', 'position_mismatch');
  end if;

  select letters into v_letters from bidal_players where id = p_player_id and session_id = p_session_id for update;
  if v_letters is null then
    return jsonb_build_object('success', false, 'reason', 'player_not_found');
  end if;

  for i in 0..jsonb_array_length(v_letters) - 1 loop
    if v_letters->>i = p_letter then
      v_idx := i;
      exit;
    end if;
  end loop;
  if v_idx is null then
    return jsonb_build_object('success', false, 'reason', 'letter_not_owned');
  end if;

  v_remaining := jsonb_array_length(v_letters) - 1;

  update bidal_players set letters = v_letters - v_idx, finished = (v_remaining = 0) where id = p_player_id;

  update bidal_sessions set current_word = p_new_word, move_index = move_index + 1
    where id = p_session_id returning move_index into v_move_index;

  insert into bidal_moves (session_id, move_index, player_id, prev_word, new_word, letter_used, position, prev_letters, move_type)
    values (p_session_id, v_move_index, p_player_id, v_word, p_new_word, p_letter, p_position, v_letters, 'replace');

  if v_remaining = 0 then
    update bidal_sessions set status = 'completed', winner_player_id = p_player_id, ended_at = now()
      where id = p_session_id and status = 'in_progress';
  end if;

  return jsonb_build_object('success', true, 'new_word', p_new_word, 'move_index', v_move_index, 'remaining', v_remaining);
end;
$$;

-- ============================================================================
-- One-time word shuffle — rearranges the 3 existing letters only. Does not
-- touch any player's hand and isn't itself a "move" in the letter-counting
-- sense, but is still logged to bidal_moves (as move_type='shuffle', with
-- player_id/letter_used/position/prev_letters all null) purely so undo has
-- a uniform place to look for "the last thing that changed the word."
-- ============================================================================
create or replace function bidal_shuffle_word(
  p_session_id uuid,
  p_requester_user_id uuid,
  p_is_solo boolean
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_word text;
  v_shuffle_used boolean;
  v_host uuid;
  v_status text;
  v_chars text[];
  v_new_word text;
  v_move_index int;
  i int;
begin
  select current_word, shuffle_used, host_user_id, status into v_word, v_shuffle_used, v_host, v_status
    from bidal_sessions where id = p_session_id for update;

  if v_word is null then return jsonb_build_object('success', false, 'reason', 'not_found'); end if;
  if v_status <> 'in_progress' then return jsonb_build_object('success', false, 'reason', 'not_active'); end if;
  if not p_is_solo and v_host <> p_requester_user_id then
    return jsonb_build_object('success', false, 'reason', 'not_host');
  end if;
  if v_shuffle_used then
    return jsonb_build_object('success', false, 'reason', 'already_used');
  end if;

  v_chars := array[substr(v_word, 1, 1), substr(v_word, 2, 1), substr(v_word, 3, 1)];
  v_new_word := v_word;
  for i in 1..10 loop
    select string_agg(c, '') into v_new_word from (
      select c from unnest(v_chars) as c order by random()
    ) shuffled;
    exit when v_new_word <> v_word;
  end loop;

  update bidal_sessions set current_word = v_new_word, shuffle_used = true, move_index = move_index + 1
    where id = p_session_id returning move_index into v_move_index;

  insert into bidal_moves (session_id, move_index, player_id, prev_word, new_word, move_type)
    values (p_session_id, v_move_index, null, v_word, v_new_word, 'shuffle');

  return jsonb_build_object('success', true, 'new_word', v_new_word);
end;
$$;

-- ============================================================================
-- One-step host undo. Restores whatever the most recent non-undone move
-- changed — either a player's letters + the word (replace), or just the
-- word (shuffle) — and marks that move undone so a second press reaches
-- further back, per the "one button press = one move backward" spec.
-- ============================================================================
create or replace function bidal_undo_last_move(
  p_session_id uuid,
  p_host_user_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_host uuid;
  v_last bidal_moves%rowtype;
begin
  select host_user_id into v_host from bidal_sessions where id = p_session_id for update;
  if v_host is null then return jsonb_build_object('success', false, 'reason', 'not_found'); end if;
  if v_host <> p_host_user_id then return jsonb_build_object('success', false, 'reason', 'not_host'); end if;

  select * into v_last from bidal_moves
    where session_id = p_session_id and undone = false
    order by move_index desc limit 1
    for update;

  if v_last.id is null then
    return jsonb_build_object('success', false, 'reason', 'no_moves');
  end if;

  if v_last.move_type = 'replace' then
    update bidal_players set letters = v_last.prev_letters, finished = false where id = v_last.player_id;
    update bidal_sessions
      set current_word = v_last.prev_word, status = 'in_progress', winner_player_id = null, ended_at = null
      where id = p_session_id;
  elsif v_last.move_type = 'shuffle' then
    update bidal_sessions set current_word = v_last.prev_word, shuffle_used = false where id = p_session_id;
  end if;

  update bidal_moves set undone = true where id = v_last.id;

  return jsonb_build_object('success', true, 'restored_word', v_last.prev_word, 'move_type', v_last.move_type);
end;
$$;
