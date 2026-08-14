-- ============================================================================
-- DIAGNOSTIC — why Supabase Authentication shows more users than
-- signed_up_users.sql does.
--
-- auth.users gets a row the MOMENT someone requests a code (Supabase
-- creates it right away so it has something to send a confirmation for),
-- regardless of whether they ever come back and actually enter that code.
-- public.users only gets a row once verifyLoginCode() succeeds (see
-- lib/auth.ts) — that's a genuine completed sign-in, not just a
-- requested one. This shows exactly which auth.users rows never made it
-- that far.
-- ============================================================================

select
  au.email,
  au.email_confirmed_at is not null as verified_code,
  pu.id is not null as has_profile_row,
  (au.created_at AT TIME ZONE 'Asia/Riyadh') as requested_at_riyadh
from auth.users au
left join public.users pu on pu.id = au.id
where au.is_anonymous = false
order by au.created_at desc;
