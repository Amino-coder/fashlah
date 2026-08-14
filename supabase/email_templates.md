# Bagdoonis auth email templates

Go to: **Supabase Dashboard → Authentication → Emails**

Two templates — **"Confirm signup"** (fires for brand-new emails) and
**"Magic Link"** (fires for emails that already have an account). Paste
the matching HTML below into each one's body, and set the subject as
noted.

`{{ .Token }}` is the code shown in-app (EmailCaptureForm / SaveResult
ask for it directly, no link-clicking involved) — this is the whole
reason these templates needed editing in the first place, since
Supabase's default template only shows a clickable link, never the code.

**No confirmation link in these templates on purpose.** The link and the
code both consume the same single-use token — whichever gets used first
silently invalidates the other — and the link path is what caused every
one of the sign-in failures worked through earlier (redirect timing
races, email security scanners pre-fetching and burning the link before
a real click, browser/device mismatches). The code path doesn't have any
of those failure modes, since nothing ever leaves the tab. Since the app
only asks for the code now, a link in the email is pure downside: a way
to accidentally break your own login with no corresponding benefit.

---

## Confirm signup — subject: `أكمل تسجيلك في بقدونس 🎉`

```html
<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; text-align: center; background: #FFF9F0; border-radius: 24px;">
  <p style="font-size: 28px; margin: 0 0 8px;">🎉</p>
  <h1 style="font-size: 22px; font-weight: 800; color: #17122B; margin: 0 0 12px;">
    خل تجربتك في بقدونس أحلى
  </h1>
  <p style="font-size: 14px; color: #6B6478; margin: 0 0 28px; line-height: 1.6;">
    اكتب الرمز التالي في بقدونس عشان تكمل تسجيل حسابك:
  </p>
  <div style="display: inline-block; background: #17122B; color: #FFF9F0; font-size: 32px; font-weight: 800; letter-spacing: 0.3em; padding: 16px 28px; border-radius: 16px; margin-bottom: 12px; direction: ltr;">
    {{ .Token }}
  </div>
  <p style="font-size: 12px; color: #A39CB0; margin: 0 0 8px;">
    الرمز صالح لمدة ساعة واحدة فقط.
  </p>
  <p style="font-size: 11px; color: #C7C1D1; margin-top: 32px;">
    إذا ما طلبت هذا، تجاهل هذا الإيميل.
  </p>
</div>
```

---

## Magic Link — subject: `رمز الدخول لبقدونس 🔑`

```html
<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; text-align: center; background: #FFF9F0; border-radius: 24px;">
  <p style="font-size: 28px; margin: 0 0 8px;">🔑</p>
  <h1 style="font-size: 22px; font-weight: 800; color: #17122B; margin: 0 0 12px;">
    تسجيل الدخول إلى بقدونس
  </h1>
  <p style="font-size: 14px; color: #6B6478; margin: 0 0 28px; line-height: 1.6;">
    اكتب الرمز التالي في بقدونس عشان تسجل دخولك:
  </p>
  <div style="display: inline-block; background: #17122B; color: #FFF9F0; font-size: 32px; font-weight: 800; letter-spacing: 0.3em; padding: 16px 28px; border-radius: 16px; margin-bottom: 12px; direction: ltr;">
    {{ .Token }}
  </div>
  <p style="font-size: 12px; color: #A39CB0; margin: 0 0 8px;">
    الرمز صالح لمدة ساعة واحدة فقط.
  </p>
  <p style="font-size: 11px; color: #C7C1D1; margin-top: 32px;">
    إذا ما طلبت هذا، تجاهل هذا الإيميل.
  </p>
</div>
```
