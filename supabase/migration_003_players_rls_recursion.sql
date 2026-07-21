-- ============================================================================
-- MIGRATION 003 — fix infinite recursion in the `players` select policy
-- ============================================================================
-- The original "players_same_session" policy queries `players` from inside
-- a policy ON `players`, which Postgres detects as infinite recursion and
-- blocks (error 42P17) instead of returning rows. Symptom: the waiting room
-- shows 0 players even right after the host successfully joined.
--
-- Fix: check membership through a SECURITY DEFINER function, which runs
-- with the function owner's privileges and so doesn't re-trigger RLS on
-- itself. This is the standard Supabase pattern for "same table" policies.
-- ============================================================================

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

drop policy if exists "players_same_session" on players;

create policy "players_same_session" on players for select using (
  is_session_member(session_id)
);
