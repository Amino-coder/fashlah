"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { FashlahArt, ShofahArt, JobArt, QaseedaArt, QissaArt, LifooArt, BidalArt, WadakArt, IhjArt, MareedArt, ImposterArt } from "@/components/art/GameArt";
import SaveResult from "@/components/auth/SaveResult";
import { trackPageEvent } from "@/lib/trackPageView";

/**
 * THE unified end-of-game block — every game's results screen mounts
 * this and nothing else for its actions. Four, always in this order:
 *   1. شارك النتيجة — primary
 *   2. 🔁 العب مرة ثانية  |  العب "Game Name" — equal secondary pair
 *   3. احفظ نتيجتك — quiet (SaveResult — email+code inline, or a
 *      straight save button if already logged in)
 *
 * Getting back to the site home is the top-right HomeButton's job, not
 * this component's — every results screen needs that mounted separately.
 *
 * PLAY AGAIN IS A REAL <a>, NOT next/link's <Link> — this is the actual
 * fix for "Play Again didn't register as a new play." Play Again's
 * target is, by definition, the SAME route the player is already on
 * (their own solo page, or this game's /create page reached from its
 * own multiplayer results screen). Next's client-side router does not
 * remount a page for a navigation to its own current route — no
 * mount-time effects re-fire, no fresh session/sessionKey gets created,
 * which is exactly why a previous version of this looked like clicking
 * Play Again simply didn't count as a new play: the page never actually
 * restarted, it just sat there. A plain <a href> forces a real browser
 * navigation — full remount, guaranteed — which is the same mechanism
 * already used every time someone reaches this URL normally (a fresh
 * tab, a shared link, tapping the game tile from home). Recommended-game
 * uses a real <a> too, for the same guarantee, even though a different-
 * route Link would likely also remount correctly on its own — this way
 * both buttons share one guaranteed-correct mechanism instead of two
 * different ones with different edge cases.
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
const DEVIL = "\u{1F608}";     // 😈
const SEND = "\u{1F4E4}";      // 📤
const REPLAY = "\u{1F501}";    // 🔁

export type EndGameKey = "fashlah" | "shofah" | "job" | "qaseeda" | "qissa" | "lifoo" | "bidal" | "wadak" | "ihj" | "mareed" | "imposter";

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
  imposter: { emoji: DEVIL, nameAr: "المحتال", nameEn: "Imposter", href: "/imposter", Art: ImposterArt, accent: "linear-gradient(135deg, #D6006E, #FF2E93)" },
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
  game, lang, nextGame, playAgainHref, resultLine, sessionCode,
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
   * Where "🔁 العب مرة ثانية" navigates — always this exact game's own
   * fresh-start URL (its /solo page if this result came from solo, or
   * its /create page if this came from a multiplayer session), never
   * derived automatically from `game` here: the same game key is used
   * from both a solo results screen AND a multiplayer one for several
   * games (شوفة، إنسان حيوان جماد، لفوا، مريض نفسي), so only the actual
   * call site knows which restart URL is correct for what's currently
   * on screen.
   */
  playAgainHref: string;
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
  const ar = lang === "ar";

  async function shareResult() {
    if (!resultLine) return;
    const text = buildShareText(lang, game, resultLine);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        setShared(true);
        trackPageEvent(game, "share_result_native");
        return;
      } catch {
        return; // user dismissed the sheet — not an error worth surfacing, and not tracked as a share
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setShared(true);
    trackPageEvent(game, "share_result_whatsapp");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxWidth: 340, margin: "0 auto" }}>
      {/* Line 1 — شارك النتيجة, the primary action */}
      {resultLine && (
        <button
          onClick={shareResult}
          className="font-display"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
            padding: "14px 20px", borderRadius: 999, border: "none", cursor: "pointer",
            background: next.accent, color: "#fff", fontWeight: 800, fontSize: 15,
            boxShadow: "0 10px 26px rgba(0,0,0,0.2)",
          }}
        >
          {SEND} {shared ? (ar ? "تم! شارك مرة ثانية؟" : "Done! Share again?") : (ar ? "شارك النتيجة" : "Share your results")}
        </button>
      )}

      {/* Line 2 — العب مرة ثانية + العب "Game Name", equal secondary pair */}
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <a
          href={playAgainHref}
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "11px 10px", borderRadius: 999, textDecoration: "none",
            border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)",
            fontWeight: 800, fontSize: 13, textAlign: "center",
          }}
        >
          {REPLAY} {ar ? "العب مرة ثانية" : "Play Again"}
        </a>
        <a
          href={next.href}
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "11px 10px", borderRadius: 999, textDecoration: "none",
            border: "2px solid transparent", color: "#fff", background: next.accent,
            fontWeight: 800, fontSize: 13, textAlign: "center",
          }}
        >
          {next.emoji} {ar ? next.nameAr : next.nameEn}
        </a>
      </div>

      {/* Line 3 — احفظ النتيجة / التسجيل, quiet */}
      {resultLine && (
        <SaveResult
          game={game}
          lang={lang}
          resultSummary={resultLine}
          sessionCode={sessionCode}
        />
      )}
    </div>
  );
}
