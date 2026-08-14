-- ============================================================================
-- SIGNED-UP ACCOUNTS — name, email, phone for anyone who's created a
-- real Bagdoonis account (via تسجيل الدخول or احفظ نتيجتك), for sending
-- updates/announcements. No new setup needed — this reads straight from
-- `users`, which supabase/accounts_schema.sql already added email/phone
-- to.
--
-- `users` also has a row for every ANONYMOUS play session (created the
-- moment anyone opens any game, no signup involved) — those all have
-- email = null, so the filter below excludes them automatically. Only
-- real accounts have an email at all.
-- ============================================================================

select
  display_name as name,
  email,
  phone,
  (created_at AT TIME ZONE 'Asia/Riyadh') as signed_up_at_riyadh
from users
where email is not null
order by created_at desc;

-- ----------------------------------------------------------------------------
-- Same list, but only accounts that finished first-time setup (have both
-- a name and phone on file) — in case a few people verified a code but
-- never completed "خل تجربتك في بقدونس أحلى", and you'd rather leave
-- those out of an outreach list until they have a name to address them by.
-- ----------------------------------------------------------------------------
select
  display_name as name,
  email,
  phone,
  (created_at AT TIME ZONE 'Asia/Riyadh') as signed_up_at_riyadh
from users
where email is not null and display_name is not null and phone is not null
order by created_at desc;
