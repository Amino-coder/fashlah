"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { trackPageEvent } from "@/lib/trackPageView";

// Written as an escape rather than a literal character for the same reason
// as EndGameShare: this string gets assembled into a WhatsApp share link,
// and staying pure-ASCII in the source is one less place a copy/paste or
// transport step could turn a multi-byte emoji into a broken glyph.
const SEND = "\u{1F4E4}";  // 📤
const CHECK = "\u{2705}";  // ✅
const CLIPBOARD = "\u{1F4CB}"; // 📋
const CHAT = "\u{1F4AC}"; // 💬

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
  code, joinPath, lang, accent, label, emoji,
}: {
  code: string;
  /** e.g. "/fashlah/join" or "/shofah/join" or "/job/join" */
  joinPath: string;
  lang: Lang;
  /** Gradient/solid colour for the primary share button. */
  accent: string;
  /** Localised "Room Code" heading. */
  label: string;
  /** Game-specific emoji (or short emoji combo) for the invite text — e.g.
   *  😈😬😅 for Fashlah, 💍😂 for Shofah, 💼😂 for Job Interview, 🪶 for
   *  Qaseeda — defaults to a generic wave if the caller doesn't pass one. */
  emoji?: string;
}) {
  const inviteEmoji = emoji ?? "\u{1F44B}"; // 👋
  // Derived from joinPath ("/shofah/join" → "shofah") rather than adding
  // a whole new required prop that all 8 call sites would need updating
  // for — joinPath already uniquely encodes which game this is.
  const game = joinPath.split("/")[1] || "unknown";
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
      ? `${inviteEmoji} انضم لجلستي!\n${joinUrl}`
      : `${inviteEmoji} Join my game!\n${joinUrl}`;

  async function copy(kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(kind === "code" ? code : joinUrl);
      setCopied(kind);
      trackPageEvent(game, "share_code_copy");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked (insecure context / permissions) — silently skip */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: lang === "ar" ? "انضم لجلستي" : "Join my game",
        text: lang === "ar" ? `${inviteEmoji} انضم لجلستي!` : `${inviteEmoji} Join my game!`,
        url: joinUrl,
      });
      trackPageEvent(game, "share_code_native");
    } catch {
      /* user dismissed the sheet — not an error worth surfacing, and not tracked as a share */
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
          {SEND} {t.share}
        </button>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => copy(canNativeShare ? "code" : "link")}
          className="btn-ghost font-body"
          style={{ flex: 1, padding: "10px", fontSize: 13 }}
        >
          {copied
            ? `${CHECK} ${t.copied}`
            : `${CLIPBOARD} ${canNativeShare ? t.copyCode : t.copyLink}`}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackPageEvent(game, "share_code_whatsapp")}
          className="font-body"
          style={{
            flex: 1, padding: "10px", fontSize: 13, borderRadius: 999, fontWeight: 700,
            background: "#25D366", color: "white", textAlign: "center", textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {CHAT} {t.whatsapp}
        </a>
      </div>
    </div>
  );
}
