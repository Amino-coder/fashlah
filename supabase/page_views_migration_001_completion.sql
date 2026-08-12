-- ============================================================================
-- Adds what's needed to tell "still playing" apart from "finished" for
-- وش شخصيتك and شوفة solo — the two pages that only ever logged a single
-- "view" event with nothing to distinguish an abandoned session from a
-- completed one.
--
-- event: 'view' (logged on page load) or 'complete' (logged when the
-- player actually reaches the results/verdict screen).
--
-- session_key: a random id generated once per page load (client-side,
-- crypto.randomUUID()), included on both the 'view' and its matching
-- 'complete' event, so the two can be joined back to the same
-- playthrough. page_views intentionally has no user/session table to
-- link through — this is the minimal thing that makes "did THIS specific
-- visit finish" answerable without adding real auth/session plumbing to
-- pages that were built to have none.
-- ============================================================================

alter table page_views add column if not exists event text not null default 'view';
alter table page_views add column if not exists session_key text;

create index if not exists page_views_session_key_idx on page_views(session_key);
