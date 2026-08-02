"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { FashlahArt, ShofahArt, JobArt, QaseedaArt, QissaArt } from "@/components/art/GameArt";

/**
 * The end-of-game block. Used to be three competing calls to action (share
 * with friends / check our other games / back home) — deliberately cut
 * down to two things, in priority order: one specific next game to try
 * (not a menu of options), and underneath it a link to share your actual
 * result, not a generic "I played this" message. Getting back to the site
 * home is the top-right HomeButton's job now, not this component's.
 *
 * Emoji are written as \u{...} escapes rather than literal characters —
 * costs nothing visually, but keeps this file pure ASCII outside the
 * Arabic copy, which matters here specifically because these strings get
 * assembled into a share message that's URL-encoded and handed to an
 * external app (WhatsApp) — one less step that could mangle a multi-byte
 * character into a broken glyph.
 */
const PARSLEY = "\u{1F33F}";   // 🌿
const RING = "\u{1F48D}";      // 💍
const BRIEFCASE = "\u{1F4BC}"; // 💼
const QUILL = "\u{1FAB6}";     // 🪶
const BOOK = "\u{1F4D6}";      // 📖
const SEND = "\u{1F4E4}";      // 📤

export type EndGameKey = "fashlah" | "shofah" | "job" | "qaseeda" | "qissa";

const GAME_META: Record<
  EndGameKey,
  { emoji: string; nameAr: string; nameEn: string; href: string; Art: (p: { size?: number }) => JSX.Element; accent: string }
> = {
  fashlah: { emoji: PARSLEY, nameAr: "فشلة", nameEn: "Fashlah", href: "/fashlah", Art: FashlahArt, accent: "linear-gradient(135deg, #FF2E93, #7C3AED)" },
  shofah: { emoji: RING, nameAr: "ابي اتزوج", nameEn: "Marry Me!", href: "/shofah", Art: ShofahArt, accent: "linear-gradient(135deg, #E63946, #C2185B)" },
  job: { emoji: BRIEFCASE, nameAr: "مين بيتوظف", nameEn: "Job Interview!", href: "/job", Art: JobArt, accent: "linear-gradient(135deg, #3B82F6, #1E40AF)" },
  qaseeda: { emoji: QUILL, nameAr: "كمل القصيدة", nameEn: "Complete the Poem", href: "/qaseeda", Art: QaseedaArt, accent: "linear-gradient(135deg, #D9A441, #1B3A55)" },
  qissa: { emoji: BOOK, nameAr: "كمل القصة", nameEn: "Complete the Story", href: "/qissa", Art: QissaArt, accent: "linear-gradient(135deg, #FF8A3D, #E0409A)" },
};

function buildShareText(lang: Lang, game: EndGameKey, resultLine: string): string {
  const meta = GAME_META[game];
  const url = typeof window !== "undefined" ? window.location.origin : "https://bagdoonis.app";
  const divider = "\u25AC".repeat(10); // ▬▬▬▬▬▬▬▬▬▬
  const headline =
    lang === "ar" ? `${meta.emoji} نتيجتي في ${meta.nameAr} ${meta.emoji}` : `${meta.emoji} My ${meta.nameEn} result ${meta.emoji}`;
  const cta = lang === "ar" ? "جربوها مع شلتكم \u{1F447}" : "Try it with your friends \u{1F447}"; // 👇
  return [headline, divider, resultLine, divider, cta, url].join("\n");
}

export default function EndGameShare({
  game, lang, nextGame, resultLine,
}: {
  /** The game this result came from — used for the share headline/branding. */
  game: EndGameKey;
  lang: Lang;
  /** The ONE specific game to recommend next. */
  nextGame: EndGameKey;
  /**
   * A single pre-composed, already-localized line describing this
   * player's actual result (e.g. "\u{1F451} حصلت على لقب: الرئيس التنفيذي").
   * Omit entirely for games (قصيدة) that already have their own dedicated
   * share flow elsewhere — no "share your results" link renders without it.
   */
  resultLine?: string;
}) {
  const next = GAME_META[nextGame];
  const [shared, setShared] = useState(false);

  async function shareResult() {
    if (!resultLine) return;
    const text = buildShareText(lang, game, resultLine);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        setShared(true);
        return;
      } catch {
        return; // user dismissed the sheet — not an error worth surfacing
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setShared(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxWidth: 300, margin: "0 auto" }}>
      <Link
        href={next.href}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          padding: "10px 24px 10px 10px", borderRadius: 999, width: "100%",
          background: next.accent, color: "#fff", textDecoration: "none",
          fontWeight: 800, fontSize: 15,
          boxShadow: "0 10px 26px rgba(0,0,0,0.2)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 44, height: 44, borderRadius: 999, overflow: "hidden", flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.55)",
          }}
        >
          <next.Art size={88} />
        </span>
        <span>{lang === "ar" ? `العب ${next.nameAr}` : `Play ${next.nameEn}`}</span>
      </Link>

      {resultLine && (
        <button
          onClick={shareResult}
          className="font-body"
          style={{
            background: "none", border: "none", cursor: "pointer",
            textDecoration: "underline", fontWeight: 700, fontSize: 13,
            color: "inherit", opacity: 0.85,
          }}
        >
          {SEND} {shared ? (lang === "ar" ? "تم! شارك مرة ثانية؟" : "Done! Share again?") : (lang === "ar" ? "شارك نتيجتك" : "Share your results")}
        </button>
      )}
    </div>
  );
}
