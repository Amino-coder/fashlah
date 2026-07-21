-- ============================================================================
-- MIGRATION 002 — missing RLS policies on `groups`
-- ============================================================================
-- `groups` had row-level security turned on in schema.sql but never got any
-- actual policies, so every operation (including a host's own insert) was
-- silently denied. This fixes it: run once in the Supabase SQL editor.
-- ============================================================================

-- Anyone can read groups (name/emoji only, nothing sensitive) — needed so a
-- session's group info can be displayed, and so game_history's existing
-- policy (which subqueries groups) resolves correctly.
create policy "groups_read" on groups for select using (true);

-- Only the creator can create a group, tagged as themselves.
create policy "groups_self_insert" on groups for insert with check (created_by = auth.uid());

-- Only the creator can rename/update their own group later (e.g. from a
-- future "groups" screen for recurring friend groups).
create policy "groups_self_update" on groups for update using (created_by = auth.uid());
