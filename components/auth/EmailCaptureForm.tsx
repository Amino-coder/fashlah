"use client";

import { useState } from "react";
import { sendMagicLink } from "@/lib/auth";

const CORAL = "#FF5A5F";

/**
 * Just the input + button + "check your email" states — no modal chrome
 * of its own, so it can be dropped inline (SaveResult, right on the
 * results screen per the spec's suggested layout) or wrapped in a modal
 * shell (LoginButton) without duplicating the actual send-link logic.
 */
export default function EmailCaptureForm({
  buttonLabel, sentLabel, lang, onSent, compact = false,
}: {
  buttonLabel: string;
  sentLabel: string;
  lang: "ar" | "en";
  onSent: (email: string) => void;
  compact?: boolean;
}) {
  const ar = lang === "ar";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const valid = /\S+@\S+\.\S+/.test(email.trim());

  async function handleSend() {
    if (!valid || status === "sending") return;
    setStatus("sending");
    setError(null);
    try {
      await sendMagicLink(email.trim());
      setStatus("sent");
      onSent(email.trim());
    } catch (e: any) {
      setStatus("error");
      setError(e.message || (ar ? "صار خطأ، حاول مرة ثانية" : "Something went wrong, try again"));
    }
  }

  if (status === "sent") {
    return (
      <p className="font-body" style={{ fontSize: compact ? 12.5 : 14, fontWeight: 700, color: "var(--ink-soft)", textAlign: "center", margin: 0 }}>
        {sentLabel}
      </p>
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
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder={ar ? "إيميلك" : "Your email"}
          dir="ltr"
          style={{
            flex: 1, minWidth: 0, padding: compact ? "10px 14px" : "12px 14px",
            borderRadius: 999, border: "2px solid var(--ring)", background: "transparent",
            color: "var(--ink)", fontSize: compact ? 13 : 15, outline: "none", textAlign: "center",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!valid || status === "sending"}
          className="font-display"
          style={{
            padding: compact ? "10px 18px" : "12px 22px", fontSize: compact ? 13 : 15, borderRadius: 999,
            border: "none", color: "#fff", whiteSpace: "nowrap",
            background: CORAL, opacity: valid && status !== "sending" ? 1 : 0.5,
          }}
        >
          {status === "sending" ? (ar ? "..." : "...") : buttonLabel}
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
