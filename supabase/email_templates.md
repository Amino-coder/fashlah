# Bagdoonis auth email templates

Go to: **Supabase Dashboard → Authentication → Emails**

There are two templates to edit — **"Confirm signup"** (fires for brand-new
emails) and **"Magic Link"** (fires for emails that already have an
account). Paste the matching HTML below into each one's body, and set the
subject as noted.

The `{{ .Token }}` variable is the 6-digit code — this MUST be in the
template for the in-app code entry (EmailCaptureForm / SaveResult) to
work at all. It is not in Supabase's default template, which only shows
the confirmation link.

The link (`{{ .ConfirmationURL }}`) is kept too, as a fallback for anyone
who prefers tapping a button over typing digits — `/auth/callback`
still handles it correctly if someone uses it instead.

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
  <div style="display: inline-block; background: #17122B; color: #FFF9F0; font-size: 32px; font-weight: 800; letter-spacing: 0.3em; padding: 16px 28px; border-radius: 16px; margin-bottom: 28px; direction: ltr;">
    {{ .Token }}
  </div>
  <p style="font-size: 12px; color: #A39CB0; margin: 0 0 20px;">
    الرمز صالح لمدة ساعة واحدة فقط.
  </p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; font-size: 12px; color: #FF5A5F; text-decoration: underline;">
    أو اضغط هنا للدخول مباشرة
  </a>
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
  <div style="display: inline-block; background: #17122B; color: #FFF9F0; font-size: 32px; font-weight: 800; letter-spacing: 0.3em; padding: 16px 28px; border-radius: 16px; margin-bottom: 28px; direction: ltr;">
    {{ .Token }}
  </div>
  <p style="font-size: 12px; color: #A39CB0; margin: 0 0 20px;">
    الرمز صالح لمدة ساعة واحدة فقط.
  </p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; font-size: 12px; color: #FF5A5F; text-decoration: underline;">
    أو اضغط هنا للدخول مباشرة
  </a>
  <p style="font-size: 11px; color: #C7C1D1; margin-top: 32px;">
    إذا ما طلبت هذا، تجاهل هذا الإيميل.
  </p>
</div>
```
