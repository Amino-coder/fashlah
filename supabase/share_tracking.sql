-- ============================================================================
-- SHARE TRACKING — how many people actually shared (1) their results and
-- (2) a multiplayer room code, per game. Requires the app deploy this
-- came with — nothing was tracked before that at all; this query can't
-- show data older than your deploy date.
--
-- Every row here only counts a REAL completion, never an attempt or a
-- cancelled share sheet:
--   share_result_native / share_result_shared  → the OS share sheet
--     was actually completed (not dismissed)
--   share_result_whatsapp                       → WhatsApp fallback used
--     (browsers without navigator.share)
--   share_result_downloaded                      → image saved to device
--     instead of shared directly (still counts — they got the result
--     out of the app one way or another)
--   share_code_native / share_code_whatsapp / share_code_copy → same
--     three paths, for inviting people to a multiplayer room instead of
--     sharing a finished result
--
-- Solo/single-page games (bidal_solo, shofah_solo, mareed_solo,
-- lifoo_solo, ihj_solo, wadak, ibarat) only ever have "results" shares —
-- there's no room code to invite anyone to. Multiplayer games can have
-- both: a code shared early in the game (getting people to join) and a
-- result shared at the end.
-- ============================================================================

select
  page as game,
  count(*) filter (where event like 'share_result%') as results_shared,
  count(*) filter (where event like 'share_code%')   as code_shared,
  count(*) filter (where event = 'share_result_native')     as result_native_share,
  count(*) filter (where event = 'share_result_shared')     as result_native_share_alt,
  count(*) filter (where event = 'share_result_whatsapp')   as result_whatsapp,
  count(*) filter (where event = 'share_result_downloaded') as result_downloaded,
  count(*) filter (where event = 'share_code_native')       as code_native_share,
  count(*) filter (where event = 'share_code_whatsapp')     as code_whatsapp,
  count(*) filter (where event = 'share_code_copy')         as code_copied,
  max(created_at AT TIME ZONE 'Asia/Riyadh') as last_share_riyadh
from page_views
where event like 'share_result%' or event like 'share_code%'
group by page
order by (count(*) filter (where event like 'share_result%')) + (count(*) filter (where event like 'share_code%')) desc;
