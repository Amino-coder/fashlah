"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getRealUser, needsProfileSetup, readPendingResult, clearPendingResult, saveResult } from "@/lib/auth";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import ProfileSetupModal from "@/components/auth/ProfileSetupModal";

type Stage = "waiting" | "needsSetup" | "finishing" | "error";

/**
 * Where every magic link points (see emailRedirectTo in lib/auth.ts's
 * sendMagicLink). supabase-js parses the auth token out of the URL
 * automatically on load (detectSessionInUrl, on by default) and fires
 * SIGNED_IN — this page just waits for that, then:
 *   1. First-time account (no name/phone yet)? Show the one-time setup
 *      modal before anything else.
 *   2. Was there a result stashed before they left to check email
 *      (SaveResult's "not signed in" path)? Save it now, under whichever
 *      account just signed in — new or existing, doesn't matter, this
 *      is the same finishing step either way.
 *   3. Back to the home page.
 */
export default function AuthCallbackPage() {
  const { lang, dark, ready } = usePrefs();
  const ar = (lang || "ar") === "ar";
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("waiting");
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState("");

  useEffect(() => {
    setDebugUrl(window.location.href);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let settled = false; // true once we have a definitive success or failure — stops the timeout below from overriding it

    async function proceed() {
      const profile = await getRealUser();
      if (cancelled || settled) return;

      if (!profile) {
        // No real (non-anonymous) session yet — either the link is still
        // being exchanged, or something went wrong. Give it a moment.
        return;
      }

      settled = true;
      if (needsProfileSetup(profile)) {
        setStage("needsSetup");
        return;
      }

      await finishUp();
    }

    async function finishUp() {
      setStage("finishing");
      const pending = readPendingResult();
      if (pending) {
        try {
          await saveResult(pending);
        } catch {
          // Not fatal — the account itself is still signed in correctly.
          // Losing a save on a transient error beats blocking sign-in.
        }
        clearPendingResult();
      }
      if (!cancelled) router.replace("/");
    }

    // The magic link lands here as ?code=... (PKCE — the supabase-js
    // client's default flow, not something set explicitly in
    // lib/supabase.ts). Unlike the older hash-fragment (#access_token=...)
    // implicit flow, supabase-js does NOT auto-exchange a ?code= param —
    // detectSessionInUrl only handles the hash-fragment case. Without this
    // explicit exchange, no SIGNED_IN event ever fires and proceed() below
    // waits forever for a session that's never coming, which is exactly
    // the "الرابط غير صالح" timeout this used to hit on every single
    // magic-link click.
    async function exchangeCodeIfPresent() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      // Supabase itself can reject a link (already used, expired, etc.)
      // and redirect here with its OWN error params instead of a code —
      // in which case there's nothing for us to exchange, and without
      // this check we'd silently do nothing for 8 seconds and then show
      // a generic timeout message that hides the real reason.
      const supabaseError = params.get("error_description") || hashParams.get("error_description")
        || params.get("error") || hashParams.get("error");
      if (supabaseError && !cancelled && !settled) {
        settled = true;
        setError((ar ? "رفض الرابط: " : "Link rejected: ") + decodeURIComponent(supabaseError));
        setStage("error");
        return;
      }

      const code = params.get("code");
      if (!code) return; // nothing to exchange — fall through to the listener below
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError && !cancelled && !settled) {
        settled = true;
        // Showing the raw message (not just the generic one below) while
        // we're actively debugging why every link fails — nothing
        // sensitive in a Supabase auth error string.
        setError(
          (ar ? "فشل الدخول: " : "Sign-in failed: ") + exchangeError.message
          + (ar ? " — حاول تسجيل الدخول مرة ثانية" : " — try logging in again")
        );
        setStage("error");
        return;
      }
      if (!cancelled) proceed();
    }

    exchangeCodeIfPresent();
    proceed(); // covers the (older/rare) hash-fragment flow, which supabase-js does auto-detect
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") proceed();
    });

    // If nothing happens within a few seconds, the link likely expired
    // or was already used — don't leave the person staring at a spinner.
    const timeout = setTimeout(() => {
      if (!cancelled && !settled) {
        settled = true;
        setError(ar ? "الرابط غير صالح أو انتهت صلاحيته، حاول تسجيل الدخول مرة ثانية" : "This link is invalid or expired — try logging in again");
        setStage("error");
      }
    }, 8000);

    return () => { cancelled = true; sub.subscription.unsubscribe(); clearTimeout(timeout); };
  }, [router, ar]);

  if (!ready) return null;

  return (
    <div dir={ar ? "rtl" : "ltr"} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <div style={{ maxWidth: 420, margin: "0 auto", padding: 24, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
        {stage === "error" ? (
          <>
            <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "#E63946", marginBottom: 12 }}>{error}</p>
            <p className="font-body" style={{ fontSize: 10, color: "var(--ink-soft)", wordBreak: "break-all", marginBottom: 16, opacity: 0.7 }}>
              {debugUrl}
            </p>
            <a href="/" className="font-display" style={{ padding: "12px 28px", borderRadius: 999, background: "var(--card)", border: "2px solid var(--ring)", color: "var(--ink)", textDecoration: "none", fontSize: 14 }}>
              {ar ? "الصفحة الرئيسية" : "Home"}
            </a>
          </>
        ) : (
          <div style={{ color: "#FF5A5F" }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}

        {stage === "needsSetup" && (
          <ProfileSetupModal
            lang={ar ? "ar" : "en"}
            onDone={async () => {
              setStage("finishing");
              const pending = readPendingResult();
              if (pending) {
                try { await saveResult(pending); } catch { /* see finishUp's identical note above */ }
                clearPendingResult();
              }
              router.replace("/");
            }}
          />
        )}
      </div>
    </div>
  );
}
