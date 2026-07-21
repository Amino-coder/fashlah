-- ============================================================================
-- MIGRATION 004 — votes update policy + get_vote_tallies RPC
-- ============================================================================
-- `votes` intentionally has no SELECT policy at all (using (false)) — not
-- even the voter can read their own vote back. That's correct per the brief
-- ("votes must never be readable per-voter from the client"), but it means:
--
-- 1. .upsert() on votes would hit the same RLS/ON CONFLICT chicken-and-egg
--    problem fixed for `players` in migration 003 (an upsert needs to check
--    for a conflicting row, which needs SELECT — which is always denied).
--    Fix: the app does insert() first, and falls back to update() on a
--    unique-constraint error. That update needs its own policy, added here.
--
-- 2. Nothing can ever read vote tallies for Results/Awards later — not even
--    aggregated. get_vote_tallies() is a SECURITY DEFINER RPC that returns
--    only aggregate counts per (question, voted-for player), gated so only
--    members of that session can call it — the one sanctioned way to read
--    vote data, per the brief.
-- ============================================================================

create policy "votes_self_update" on votes for update using (
  voter_player_id in (select id from players where user_id = auth.uid())
);

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
