-- ============================================================================
-- QR CODE ACCESS LOG — every scan of any /go/<slug> QR code.
-- Requires supabase/qr_scans_schema.sql to have been run, and the
-- updated app/go/[slug]/route.ts deployed (it's what actually writes
-- these rows — nothing was ever logged before that).
-- Run in the Supabase SQL editor.
--
-- HONEST LIMITS on "what game they played":
-- A QR scan has no identity attached — nobody has signed up or even
-- loaded a page yet at the moment of the redirect, so there's no user_id
-- to join against. What THIS query can tell you is which destination
-- the scan was sent to (i.e. what they were shown right after scanning —
-- a specific game's landing page, or the homepage to choose from). It
-- can't tell you what they clicked on afterward once they landed there,
-- since that's a separate, unlinked page load with its own anonymous
-- session. If you want that fuller picture later, the destination could
-- carry a query param (e.g. /bidal?src=qr_main) that the landing page
-- reads and logs alongside its own page_views row — a bigger change than
-- this query, not something SQL alone can retrofit onto scans already
-- logged without that param.
-- ============================================================================

select
  slug,
  destination as sent_to,
  user_agent,
  (scanned_at AT TIME ZONE 'Asia/Riyadh') as scanned_at_riyadh
from qr_scans
order by scanned_at desc;

-- ----------------------------------------------------------------------------
-- Summary — total scans per slug, with recent-activity windows. Useful
-- for comparing multiple printed QR codes (different events/flyers each
-- pointing at their own slug) at a glance.
-- ----------------------------------------------------------------------------
select
  slug,
  count(*) as total_scans,
  count(*) filter (where scanned_at > now() - interval '1 day')   as last_24h,
  count(*) filter (where scanned_at > now() - interval '7 days')  as last_7_days,
  count(*) filter (where scanned_at > now() - interval '30 days') as last_30_days
from qr_scans
group by slug
order by total_scans desc;
