"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getRealUser, needsProfileSetup, saveResult, sendLoginCode, verifyLoginCode } from "@/lib/auth";
import ProfileSetupModal from "./ProfileSetupModal";

const CORAL = "#FF5A5F";

/**
 * Drop this on any game's results screen once the final outcome is
 * known. Two branches, driven by whether a REAL (non-anonymous) account
 * is signed in — see lib/auth.ts's getRealUser():
 *
 *  - Signed in: a single حفظ button saves immediately, no email prompt
 *    (spec §8 — never re-ask someone who's already logged in).
 *  - Not signed in: email → 6-digit code, both inline, right here on the
 *    results screen. No redirect, no magic-link click, no separate tab —
 *    see lib/auth.ts's header comment for why this replaced the
 *    clickable-link flow. Since verification finishes in this same
 *    render, the result can be saved the instant it succeeds — no
 *    localStorage hand-off across a redirect needed anymore.
 *
 * Deliberately styled smaller/quieter than the surrounding share/replay
 * buttons (spec §4, §11: secondary, not a registration wall) — this
 * never blocks reading or sharing the actual result above it.
 */
export default function SaveResult({
  game, resultSummary, resultDetail, sessionCode, lang,
}: {
  game: string;
  resultSummary: string;
  resultDetail?: Record<string, unknown>;
  sessionCode?: string;
  lang: "ar" | "en";
}) {
  const ar = lang === "ar";
  const [signedIn, setSignedIn] = useState<boolean | null>(null); // null = still checking
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "working" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    getRealUser().then((u) => setSignedIn(!!u));
  }, []);

  async function doSave() {
    await saveResult({ game, resultSummary, resultDetail, sessionCode });
    setStatus("saved");
  }

  async function handleSaveDirect() {
    if (status === "working" || status === "saved") return;
    setStatus("working");
    setError(null);
    try {
      await doSave();
    } catch (e: any) {
      setStatus("error");
      setError(e.message || (ar ? "صار خطأ، حاول مرة ثانية" : "Something went wrong, try again"));
    }
  }

  async function handleSendCode() {
    if (!/\S+@\S+\.\S+/.test(email.trim()) || status === "working") return;
    setStatus("working");
    setError(null);
    try {
      await sendLoginCode(email.trim());
      setStep("code");
      setStatus("idle");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || (ar ? "صار خطأ، حاول مرة ثانية" : "Something went wrong, try again"));
    }
  }

  async function handleVerify() {
    if (code.trim().length < 6 || status === "working") return;
    setStatus("working");
    setError(null);
    try {
      await verifyLoginCode(email.trim(), code.trim());
      const profile = await getRealUser();
      if (needsProfileSetup(profile)) {
        setNeedsSetup(true);
        return; // saved once profile setup finishes, see below
      }
      setSignedIn(true);
      await doSave();
    } catch (e: any) {
      setStatus("error");
      setError(ar ? "الرمز غير صحيح أو انتهت صلاحيته، حاول مرة ثانية" : "That code is wrong or expired, try again");
    }
  }

  if (signedIn === null) return null; // avoid a flash of the wrong variant

  return (
    <div style={{ marginTop: 14, marginBottom: 4, textAlign: "center" }}>
      <p className="font-body" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-soft)", margin: "0 0 8px" }}>
        {ar ? "احفظ نتيجتك" : "Save your result"}
      </p>

      {signedIn ? (
        status === "saved" ? (
          <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, margin: 0 }}>
            <Check size={14} color={CORAL} /> {ar ? "انحفظت! 🎉" : "Saved! 🎉"}
          </p>
        ) : (
          <button
            onClick={handleSaveDirect}
            disabled={status === "working"}
            className="font-body"
            style={{
              padding: "9px 22px", fontSize: 12.5, fontWeight: 700, borderRadius: 999,
              border: `1.5px solid ${CORAL}`, background: "transparent", color: CORAL,
              opacity: status === "working" ? 0.6 : 1,
            }}
          >
            {status === "working" ? "..." : (ar ? "حفظ" : "Save")}
          </button>
        )
      ) : status === "saved" ? (
        <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, margin: 0 }}>
          <Check size={14} color={CORAL} /> {ar ? "انحفظت! 🎉" : "Saved! 🎉"}
        </p>
      ) : step === "code" ? (
        <div style={{ maxWidth: 300, margin: "0 auto" }}>
          <p className="font-body" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", margin: "0 0 8px" }}>
            {ar ? `أرسلنا رمز مكوّن من ٦ أرقام إلى ${email.trim()}` : `We sent a 6-digit code to ${email.trim()}`}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              dir="ltr"
              style={{
                flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 999, border: "1.5px solid var(--ring)",
                background: "transparent", color: "var(--ink)", fontSize: 15, letterSpacing: "0.25em", outline: "none", textAlign: "center",
              }}
            />
            <button
              onClick={handleVerify}
              disabled={code.trim().length < 6 || status === "working"}
              className="font-body"
              style={{
                padding: "9px 18px", fontSize: 12.5, fontWeight: 700, borderRadius: 999, border: "none",
                color: "#fff", background: CORAL, whiteSpace: "nowrap",
                opacity: code.trim().length >= 6 && status !== "working" ? 1 : 0.5,
              }}
            >
              {status === "working" ? "..." : (ar ? "تأكيد" : "Verify")}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, maxWidth: 320, margin: "0 auto" }}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendCode(); }}
            placeholder={ar ? "إيميلك" : "Your email"}
            dir="ltr"
            style={{
              flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 999, border: "1.5px solid var(--ring)",
              background: "transparent", color: "var(--ink)", fontSize: 12.5, outline: "none", textAlign: "center",
            }}
          />
          <button
            onClick={handleSendCode}
            disabled={status === "working" || !/\S+@\S+\.\S+/.test(email.trim())}
            className="font-body"
            style={{
              padding: "9px 18px", fontSize: 12.5, fontWeight: 700, borderRadius: 999, border: "none",
              color: "#fff", background: CORAL, whiteSpace: "nowrap",
              opacity: /\S+@\S+\.\S+/.test(email.trim()) && status !== "working" ? 1 : 0.5,
            }}
          >
            {status === "working" ? "..." : (ar ? "حفظ" : "Save")}
          </button>
        </div>
      )}

      {error && (
        <p className="font-body" style={{ fontSize: 11, color: "#E63946", fontWeight: 700, marginTop: 6 }}>{error}</p>
      )}

      {needsSetup && (
        <ProfileSetupModal
          lang={lang}
          onDone={async () => {
            setNeedsSetup(false);
            setSignedIn(true);
            setStatus("working");
            try { await doSave(); } catch { setStatus("error"); setError(ar ? "صار خطأ، حاول مرة ثانية" : "Something went wrong, try again"); }
          }}
        />
      )}
    </div>
  );
}
