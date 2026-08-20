-- ============================================================================
-- SHARE LOG — one row per share event: game, date, user, and type.
--
-- "user" is session_key, not a real identity — page_views only ever
-- logs an anonymous per-visit key (see lib/trackPageView.ts), never a
-- signed-in account. It's genuinely useful for "how many distinct
-- visits shared something" or spotting the same visit sharing multiple
-- times, but it is NOT a name/email — there's no link from page_views
-- back to a real account at all right now. Getting an actual identified
-- "who" would mean adding a user_id column and populating it only for
-- signed-in visits (a code change, not something this query can do).
--
-- "type" collapses the underlying event strings into the 4 categories
-- asked for:
--   copy          → share_code_copy       (room code copied)
--   general share → share_code_native     (room code, OS share sheet)
--   whatsapp      → share_code_whatsapp   (room code, WhatsApp)
--   share results → share_result_*        (any results share, any
--                   method lumped together — native/whatsapp/downloaded
--                   aren't split out here, unlike room-code shares)
--
-- Run in the Supabase SQL editor.
-- ============================================================================

select
  page as game,
  (created_at AT TIME ZONE 'Asia/Riyadh') as shared_at_riyadh,
  session_key as user_session,
  case
    when event = 'share_code_copy'     then 'copy'
    when event = 'share_code_native'   then 'general share'
    when event = 'share_code_whatsapp' then 'whatsapp'
    when event like 'share_result_%'   then 'share results'
  end as share_type
from page_views
where event like 'share_result_%' or event like 'share_code_%'
order by created_at desc;
