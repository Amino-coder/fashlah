"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

/**
 * The room-code + invite block shown in both games' waiting rooms.
 *
 * Previously each game had its own near-identical copy offering exactly two
 * options: copy the bare 6-character code, or open WhatsApp. That left out
 * everyone inviting over iMessage, Telegram, Snapchat or Discord, and the
 * "copy" action gave you a code with no link attached — so the person
 * receiving it had to be told where to type it in.
 *
 * Now: the OS share sheet when the browser supports it (which covers every
 * app on the phone at once), a copy that puts the actual join *link* on the
 * clipboard, WhatsApp kept as a one-tap shortcut, and the raw code still
 * displayed large for anyone typing it in manually across the room.
 */
export default function ShareInvite({
  code, joinPath, lang, accent, label,
}: {
  code: string;
  /** e.g. "/fashlah/join" or "/shofah/join" */
  joinPath: string;
  lang: Lang;
  /** Gradient/solid colour for the primary share button. */
  accent: string;
  /** Localised "Room Code" heading. */
  label: string;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [origin, setOrigin] = useState("");

  // Feature-detected after mount, never during render — otherwise the
  // server and client markup disagree and React logs a hydration mismatch.
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const joinUrl = origin ? `${origin}${joinPath}?code=${code}` : "";
  const message =
    lang === "ar"
      ? `🌿 انضم لجلستي!\n${joinUrl}`
      : `🌿 Join my game!\n${joinUrl}`;

  async function copy(kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(kind === "code" ? code : joinUrl);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked (insecure context / permissions) — silently skip */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: lang === "ar" ? "انضم لجلستي" : "Join my game",
        text: lang === "ar" ? "🌿 انضم لجلستي!" : "🌿 Join my game!",
        url: joinUrl,
      });
    } catch {
      /* user dismissed the sheet — not an error worth surfacing */
    }
  }

  const t = {
    copyCode: lang === "ar" ? "نسخ الكود" : "Copy code",
    copyLink: lang === "ar" ? "نسخ الرابط" : "Copy link",
    copied: lang === "ar" ? "انتسخ!" : "Copied!",
    share: lang === "ar" ? "شارك الدعوة" : "Share invite",
    whatsapp: lang === "ar" ? "واتساب" : "WhatsApp",
  };

  return (
    <div className="card" style={{ padding: 18, marginBottom: 16, textAlign: "center" }}>
      <p className="font-body" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700, margin: 0 }}>
        {label}
      </p>

      {/* Selectable so it can be long-pressed and copied directly, and
          tappable as a shortcut for copying the code. */}
      <button
        onClick={() => copy("code")}
        aria-label={`${t.copyCode}: ${code.split("").join(" ")}`}
        className="font-mono"
        style={{
          fontSize: 32, fontWeight: 700, letterSpacing: "0.2em",
          background: "none", border: "none", color: "var(--ink)",
          padding: "2px 0 6px", userSelect: "text",
        }}
      >
        {code}
      </button>

      {canNativeShare && (
        <button
          onClick={nativeShare}
          className="font-display"
          style={{
            width: "100%", padding: 13, fontSize: 15, borderRadius: 999,
            border: "none", color: "#fff", background: accent, marginBottom: 10,
          }}
        >
          📤 {t.share}
        </button>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => copy(canNativeShare ? "code" : "link")}
          className="btn-ghost font-body"
          style={{ flex: 1, padding: "10px", fontSize: 13 }}
        >
          {copied
            ? `✅ ${t.copied}`
            : `📋 ${canNativeShare ? t.copyCode : t.copyLink}`}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body"
          style={{
            flex: 1, padding: "10px", fontSize: 13, borderRadius: 999, fontWeight: 700,
            background: "#25D366", color: "white", textAlign: "center", textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          💬 {t.whatsapp}
        </a>
      </div>
    </div>
  );
}
