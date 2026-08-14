"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getRealUser, saveResult, sendMagicLink, stashPendingResult } from "@/lib/auth";

const CORAL = "#FF5A5F";

/**
 * Drop this on any game's results screen once the final outcome is
 * known. Two branches, driven by whether a REAL (non-anonymous) account
 * is signed in — see lib/auth.ts's getRealUser():
 *
 *  - Signed in: a single حفظ button saves immediately, no email prompt
 *    (spec §8 — never re-ask someone who's already logged in).
 *  - Not signed in: an inline email field. Submitting stashes this exact
 *    result in localStorage (stashPendingResult) BEFORE sending the
 *    magic link, since the tab is about to lose its React state while
 *    they go check email — app/auth/callback/page.tsx picks the stashed
 *    result back up and saves it once auth completes, which is what
 *    actually satisfies "don't lose the result during authentication."
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
  const [status, setStatus] = useState<"idle" | "working" | "saved" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRealUser().then((u) => setSignedIn(!!u));
  }, []);

  async function handleSaveDirect() {
    if (status === "working" || status === "saved") return;
    setStatus("working");
    setError(null);
    try {
      await saveResult({ game, resultSummary, resultDetail, sessionCode });
      setStatus("saved");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || (ar ? "صار خطأ، حاول مرة ثانية" : "Something went wrong, try again"));
    }
  }

  async function handleSendLink() {
    if (!/\S+@\S+\.\S+/.test(email.trim()) || status === "working") return;
    setStatus("working");
    setError(null);
    try {
      // Stash BEFORE sending — the person is about to leave this tab to
      // check their email, and this data needs to survive that.
      stashPendingResult({ game, resultSummary, resultDetail, sessionCode });
      await sendMagicLink(email.trim());
      setStatus("sent");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || (ar ? "صار خطأ، حاول مرة ثانية" : "Something went wrong, try again"));
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
      ) : status === "sent" ? (
        <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", margin: 0 }}>
          {ar ? "أرسلنا لك رابط الدخول 📩 تحقق من بريدك" : "We sent you a login link 📩 check your email"}
        </p>
      ) : (
        <div style={{ display: "flex", gap: 6, maxWidth: 320, margin: "0 auto" }}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendLink(); }}
            placeholder={ar ? "إيميلك" : "Your email"}
            dir="ltr"
            style={{
              flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 999, border: "1.5px solid var(--ring)",
              background: "transparent", color: "var(--ink)", fontSize: 12.5, outline: "none", textAlign: "center",
            }}
          />
          <button
            onClick={handleSendLink}
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
    </div>
  );
}
