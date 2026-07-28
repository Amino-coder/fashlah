"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";

/**
 * The "we're done, go tell your friends" block shown at the end of a game.
 * Fashlah already had a version of this baked into its results carousel;
 * this pulls the same idea out into something Shofah and Job Interview can
 * both use too, plus a "more games" link none of the three had before.
 *
 * Emoji are written as \u{...} escapes rather than literal characters. That
 * costs nothing (renders identically) but means this file stays pure ASCII
 * outside of the Arabic copy, which is worth doing anywhere emoji get
 * assembled into a share string that then gets URL-encoded and handed to an
 * external app (WhatsApp) — one less place a copy/paste or transport step
 * could mangle a multi-byte character into a broken glyph.
 */
const PARSLEY = "\u{1F33F}";   // 🌿
const RING = "\u{1F48D}";      // 💍
const BRIEFCASE = "\u{1F4BC}"; // 💼
const SEND = "\u{1F4E4}";      // 📤
const CHAT = "\u{1F4AC}";      // 💬
const GAMES = "\u{1F3AE}";     // 🎮

export type EndGameKey = "fashlah" | "shofah" | "job";

const GAME_META: Record<EndGameKey, { emoji: string; nameAr: string; nameEn: string }> = {
  fashlah: { emoji: PARSLEY, nameAr: "بقدونس", nameEn: "Fashlah" },
  shofah: { emoji: RING, nameAr: "ابي اتزوج", nameEn: "Marry Me!" },
  job: { emoji: BRIEFCASE, nameAr: "مين بيتوظف", nameEn: "Job Interview!" },
};

export default function EndGameShare({
  game, lang, accent,
}: {
  game: EndGameKey;
  lang: Lang;
  /** CSS gradient/solid for the primary share button. */
  accent: string;
}) {
  const meta = GAME_META[game];
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const appUrl = origin || "";
  const shareText =
    lang === "ar"
      ? `${meta.emoji} خلصت ألعب ${meta.nameAr} مع أصحابي! جربوها: ${appUrl}`
      : `${meta.emoji} Just played ${meta.nameEn} with my friends! Try it: ${appUrl}`;

  async function nativeShare() {
    try {
      await navigator.share({
        title: lang === "ar" ? meta.nameAr : meta.nameEn,
        text: shareText,
        url: appUrl,
      });
    } catch {
      /* user dismissed the sheet — not an error worth surfacing */
    }
  }

  const btnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "14px 26px", borderRadius: 999, fontWeight: 800, fontSize: 15,
    border: "none", width: "100%", textDecoration: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300, margin: "0 auto" }}>
      {canNativeShare ? (
        <button onClick={nativeShare} className="font-display" style={{ ...btnStyle, background: accent, color: "#fff" }}>
          {SEND} {lang === "ar" ? "شارك مع الأصحاب" : "Share with friends"}
        </button>
      ) : (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display"
          style={{ ...btnStyle, background: "#25D366", color: "#fff" }}
        >
          {CHAT} {lang === "ar" ? "شارك على واتساب" : "Share on WhatsApp"}
        </a>
      )}

      <Link href="/" className="font-display" style={{ ...btnStyle, background: "var(--card)", color: "var(--ink)", boxShadow: "0 4px 14px var(--ring)" }}>
        {GAMES} {lang === "ar" ? "شوف ألعابنا الثانية" : "Check our other games"}
      </Link>
    </div>
  );
}
