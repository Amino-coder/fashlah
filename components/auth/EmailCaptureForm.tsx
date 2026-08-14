"use client";

import { useState } from "react";
import { sendLoginCode, verifyLoginCode } from "@/lib/auth";

const CORAL = "#FF5A5F";

/**
 * Email → 6-digit code → done, all inline, no redirect. See lib/auth.ts's
 * header comment on sendLoginCode/verifyLoginCode for why this replaced
 * the clickable-link flow — every failure mode we hit in practice (email
 * scanners burning the link, cross-device/browser mismatches, client-init
 * timing races on the redirect) only exists because a link requires
 * leaving the tab. Typing a code never leaves the tab at all.
 *
 * `onVerified` fires the instant sign-in succeeds, with a flag for
 * whether this looks like a brand-new account (no name/phone yet) so the
 * caller can decide whether to show ProfileSetupModal next.
 */
export default function EmailCaptureForm({
  buttonLabel, lang, onVerified, compact = false,
}: {
  buttonLabel: string;
  lang: "ar" | "en";
  onVerified: () => void;
  compact?: boolean;
}) {
  const ar = lang === "ar";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const codeValid = code.trim().length >= 6;

  async function handleSendCode() {
    if (!emailValid || status === "working") return;
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
    if (!codeValid || status === "working") return;
    setStatus("working");
    setError(null);
    try {
      await verifyLoginCode(email.trim(), code.trim());
      onVerified();
    } catch (e: any) {
      setStatus("error");
      setError(ar ? "الرمز غير صحيح أو انتهت صلاحيته، حاول مرة ثانية" : "That code is wrong or expired, try again");
    }
  }

  if (step === "code") {
    return (
      <div>
        <p className="font-body" style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "var(--ink-soft)", textAlign: "center", margin: "0 0 10px" }}>
          {ar ? `أرسلنا رمز مكوّن من ٨ أرقام إلى ${email.trim()}` : `We sent an 8-digit code to ${email.trim()}`}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
            placeholder="00000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            dir="ltr"
            style={{
              flex: 1, minWidth: 0, padding: compact ? "10px 14px" : "12px 14px",
              borderRadius: 999, border: "2px solid var(--ring)", background: "transparent",
              color: "var(--ink)", fontSize: compact ? 16 : 18, letterSpacing: "0.3em", outline: "none", textAlign: "center",
            }}
          />
          <button
            onClick={handleVerify}
            disabled={!codeValid || status === "working"}
            className="font-display"
            style={{
              padding: compact ? "10px 18px" : "12px 22px", fontSize: compact ? 13 : 15, borderRadius: 999,
              border: "none", color: "#fff", whiteSpace: "nowrap",
              background: CORAL, opacity: codeValid && status !== "working" ? 1 : 0.5,
            }}
          >
            {status === "working" ? "..." : (ar ? "تأكيد" : "Verify")}
          </button>
        </div>
        <button
          onClick={() => { setStep("email"); setCode(""); setError(null); }}
          className="font-body"
          style={{ display: "block", margin: "8px auto 0", fontSize: 11, color: "var(--ink-soft)", background: "none", border: "none", textDecoration: "underline" }}
        >
          {ar ? "غيّر الإيميل" : "Change email"}
        </button>
        {error && (
          <p className="font-body" style={{ fontSize: 11.5, color: "#E63946", fontWeight: 700, marginTop: 6, textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
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
            flex: 1, minWidth: 0, padding: compact ? "10px 14px" : "12px 14px",
            borderRadius: 999, border: "2px solid var(--ring)", background: "transparent",
            color: "var(--ink)", fontSize: compact ? 13 : 15, outline: "none", textAlign: "center",
          }}
        />
        <button
          onClick={handleSendCode}
          disabled={!emailValid || status === "working"}
          className="font-display"
          style={{
            padding: compact ? "10px 18px" : "12px 22px", fontSize: compact ? 13 : 15, borderRadius: 999,
            border: "none", color: "#fff", whiteSpace: "nowrap",
            background: CORAL, opacity: emailValid && status !== "working" ? 1 : 0.5,
          }}
        >
          {status === "working" ? "..." : buttonLabel}
        </button>
      </div>
      {error && (
        <p className="font-body" style={{ fontSize: 11.5, color: "#E63946", fontWeight: 700, marginTop: 6, textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}
