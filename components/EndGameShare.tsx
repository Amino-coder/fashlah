"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { FashlahArt, ShofahArt, JobArt, QaseedaArt, QissaArt, LifooArt, BidalArt, WadakArt, IhjArt, MareedArt } from "@/components/art/GameArt";
import SaveResult from "@/components/auth/SaveResult";

/**
 * THE unified end-of-game block — every game's results screen mounts
 * this and nothing else for its actions. Exactly three, always in this
 * order:
 *   1. احفظ نتيجتك (SaveResult — email+code inline, or a straight save
 *      button if already logged in)
 *   2. Share your result
 *   3. One specific next game to try (never a menu of options)
 *
 * Getting back to the site home is the top-right HomeButton's job, not
 * this component's — every results screen needs that mounted separately.
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
const NOTE = "\u{1F3B6}";      // 🎶
const LETTERS = "\u{1F524}";   // 🔤
const MASK = "\u{1F3AD}";      // 🎭
const BRAIN = "\u{1F9E9}";     // 🧩
const HEAD = "\u{1F92F}";      // 🤯
const SEND = "\u{1F4E4}";      // 📤

export type EndGameKey = "fashlah" | "shofah" | "job" | "qaseeda" | "qissa" | "lifoo" | "bidal" | "wadak" | "ihj" | "mareed";

const GAME_META: Record<
  EndGameKey,
  { emoji: string; nameAr: string; nameEn: string; href: string; Art: (p: { size?: number }) => JSX.Element; accent: string }
> = {
  fashlah: { emoji: PARSLEY, nameAr: "فشلة", nameEn: "Fashlah", href: "/fashlah", Art: FashlahArt, accent: "linear-gradient(135deg, #FF2E93, #7C3AED)" },
  shofah: { emoji: RING, nameAr: "ابي اتزوج", nameEn: "Marry Me!", href: "/shofah", Art: ShofahArt, accent: "linear-gradient(135deg, #E63946, #C2185B)" },
  job: { emoji: BRIEFCASE, nameAr: "مين بيتوظف", nameEn: "Job Interview!", href: "/job", Art: JobArt, accent: "linear-gradient(135deg, #3B82F6, #1E40AF)" },
  qaseeda: { emoji: QUILL, nameAr: "كمل القصيدة", nameEn: "Complete the Poem", href: "/qaseeda", Art: QaseedaArt, accent: "linear-gradient(135deg, #D9A441, #1B3A55)" },
  qissa: { emoji: BOOK, nameAr: "كمل القصة", nameEn: "Complete the Story", href: "/qissa", Art: QissaArt, accent: "linear-gradient(135deg, #FF8A3D, #E0409A)" },
  lifoo: { emoji: NOTE, nameAr: "الِّفوا أغنية", nameEn: "Build a Song", href: "/lifoo", Art: LifooArt, accent: "linear-gradient(135deg, #FF5A5F, #1B1030)" },
  bidal: { emoji: LETTERS, nameAr: "بدل الكلمة", nameEn: "Word Swap", href: "/bidal", Art: BidalArt, accent: "linear-gradient(135deg, #14B8A6, #FF5A5F)" },
  wadak: { emoji: MASK, nameAr: "وش شخصيتك", nameEn: "What's Your Personality", href: "/wadak", Art: WadakArt, accent: "linear-gradient(135deg, #7C3AED, #FF2E93)" },
  ihj: { emoji: BRAIN, nameAr: "إنسان حيوان جماد", nameEn: "Categories", href: "/ihj", Art: IhjArt, accent: "linear-gradient(135deg, #7C3AED, #FF2E93)" },
  mareed: { emoji: HEAD, nameAr: "مريض نفسي", nameEn: "Psych Patient", href: "/mareed", Art: MareedArt, accent: "linear-gradient(135deg, #FF2E93, #7C3AED)" },
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
  game, lang, nextGame, resultLine, sessionCode,
}: {
  /** The game this result came from — used for the share headline/branding
   *  AND as the `game` key saved via SaveResult. */
  game: EndGameKey;
  lang: Lang;
  /** The ONE specific game to recommend next. Site-wide default is بدل
   *  الكلمة or وش شخصيتك (both are fast, frictionless solo games — the
   *  natural "one more round" suggestion regardless of what was just
   *  played) — EXCEPT from those two games' own results screens, where
   *  suggesting themselves makes no sense: بدل الكلمة points to شوفة,
   *  وش شخصيتك points to فشلة (a real multiplayer game, since وش شخصيتك
   *  is solo-only and the natural next step is "now play one with your
   *  friends"). See each game's FinalReveal/results screen for exactly
   *  which of these two solo games it points to.
   */
  nextGame: EndGameKey;
  /**
   * A single pre-composed, already-localized line describing this
   * player's actual result (e.g. "\u{1F451} حصلت على لقب: الرئيس التنفيذي").
   * Used for BOTH the share text and as SaveResult's result_summary — one
   * true description of the result, not two separately-maintained strings.
   * Omit entirely only for a game with no meaningful single-line result to
   * capture — no "save"/"share" section renders without it, since there'd
   * be nothing truthful to save or share.
   */
  resultLine?: string;
  /** Multiplayer room code, if this came from a session — stored alongside
   *  the saved result. Omit for solo games. */
  sessionCode?: string;
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: "100%", maxWidth: 300, margin: "0 auto" }}>
      {resultLine && (
        <SaveResult
          game={game}
          lang={lang}
          resultSummary={resultLine}
          sessionCode={sessionCode}
        />
      )}

      {resultLine && (
        <button
          onClick={shareResult}
          className="font-body"
          style={{
            background: "none", border: "none", cursor: "pointer",
            textDecoration: "underline", fontWeight: 700, fontSize: 13,
            color: "inherit", opacity: 0.85, padding: 0,
          }}
        >
          {SEND} {shared ? (lang === "ar" ? "تم! شارك مرة ثانية؟" : "Done! Share again?") : (lang === "ar" ? "شارك نتيجتك" : "Share your results")}
        </button>
      )}

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
    </div>
  );
}
