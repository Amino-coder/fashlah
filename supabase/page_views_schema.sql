-- ============================================================================
-- page_views — minimal access tracking for the solo/demo experiences that
-- otherwise write nothing to the database at all (شوفة solo, وش شخصيتك,
-- and every game's /demo mode). Deliberately as small as this can be: one
-- table, one column that matters (`page`), no user/session linkage, no
-- foreign keys to anything — so it can never be the thing that breaks a
-- game, and never adds meaningful latency or complexity to pages that
-- were specifically built to be fast and isolated.
-- ============================================================================

create table if not exists page_views (
  id         uuid primary key default gen_random_uuid(),
  page       text not null,
  created_at timestamptz default now()
);

create index if not exists page_views_page_idx on page_views(page, created_at desc);

alter table page_views enable row level security;

-- Public read/insert, same as every other table in this app — nothing
-- sensitive is ever stored here (just a page name and a timestamp).
create policy "page_views_read" on page_views for select using (true);
create policy "page_views_insert" on page_views for insert with check (true);
