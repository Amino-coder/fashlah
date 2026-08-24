"use client";

import Link from "next/link";
import { HowToPlay, type GameKey } from "@/components/HowToPlay";
import { Info, Instagram, Mail } from "lucide-react";
import { STR } from "@/lib/i18n";
import { SHOFAH_STR } from "@/lib/shofah-i18n";
import { MAREED_STR } from "@/lib/mareed-i18n";
import { IMPOSTER_STR } from "@/lib/imposter-i18n";
import { RUIN_STORY_STR } from "@/lib/ruin-story-i18n";
import { JOB_STR } from "@/lib/job-i18n";
import { QASEEDA_STR } from "@/lib/qaseeda-i18n";
import { QISSA_STR } from "@/lib/qissa-i18n";
import { LIFOO_STR } from "@/lib/lifoo-i18n";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import Mascot from "@/components/Mascot";
import { FashlahArt, ShofahArt, JobArt, IbaratArt, QaseedaArt, QissaArt, WadakArt, BidalArt, IhjArt, LifooArt, MareedArt, ImposterArt, RuinStoryArt } from "@/components/art/GameArt";
import InstallBagdoonisButton from "@/components/pwa/InstallBagdoonisButton";
import LoginButton from "@/components/auth/LoginButton";
import HamburgerMenu from "@/components/HamburgerMenu";
import FavoriteButton from "@/components/FavoriteButton";
import { getFavoriteGames, addFavorite, removeFavorite } from "@/lib/favorites";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

/**
 * lucide-react (used for every other icon on this page) deliberately
 * ships no brand/social glyphs, so TikTok's mark is hand-drawn here —
 * same viewBox/sizing convention as a lucide icon (currentColor fill,
 * size prop) so it drops into the same icon-button styling as Instagram.
 */
function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

/**
 * Home — the game library.
 *
 * Rebuilt around the illustration set: each game is a framed panel with
 * its own artwork rather than an emoji tile, and the page furniture
 * (hairline gold frames, diamond rules, the arch crest) carries the same
 * ornamental language as the art itself.
 */
export default function Home() {
  const { lang, setLang, dark, setDark, ready } = usePrefs();
  const t = STR[lang];
  const ar = lang === "ar";

  const entries = [
    { href: "/bidal", title: "بدل الكلمة", sub: ar ? "بدّل حرف، واصنع كلمات جديدة" : "Swap a letter, beat the rest", players: "لاعب واحد", category: "سرعة", Art: BidalArt, modes: ["solo"] },
    { href: "/shofah", title: SHOFAH_STR[lang].gameNameArabic, sub: ar ? "مين من قروبكم بيتزوج أول" : "Who gets married first?", players: "1+ لاعب", category: "ضحك", Art: ShofahArt, modes: ["group", "solo"] },
    { href: "/ihj", title: "إنسان حيوان جماد", sub: ar ? "لعبة الطيبين - مين أسرعكم بالكتابة" : "Find the answer nobody else thinks of", players: "1+ لاعب", category: "تنافس", Art: IhjArt, modes: ["group", "solo"] },
    { href: "/wadak", title: "وش شخصيتك", sub: ar ? "جاوب وشوف شخصيتك الحقيقية" : "Answer and find your real personality", players: "لاعب واحد", category: "تحليل", Art: WadakArt, modes: ["solo"] },
    { href: "/imposter", title: `${IMPOSTER_STR[lang].gameName} - imposter`, sub: ar ? "وحد فيكم محتال… من بيكتشفه؟" : "One of you is an imposter... who'll catch them?", players: "3+ لاعبين", category: "تنافس", Art: ImposterArt, modes: ["group"] },
    { href: "/ruin_story", title: RUIN_STORY_STR[lang].gameName, sub: ar ? "كم تقدر تخرب السالفة بجواب واحد؟" : "How badly can you ruin the story?", players: "3+ لاعبين", category: "ضحك", Art: RuinStoryArt, modes: ["group"] },
    { href: "/fashlah", title: t.gameName, sub: ar ? "اكتشفوا أسرار شلتكم" : "Uncover your group's secrets", players: "2+ لاعبين", category: "ضحك", Art: FashlahArt, modes: ["group"] },
    { href: "/mareed", title: MAREED_STR[lang].gameNameArabic, sub: ar ? "خلّنا نشوف مين المريض النفسي فينا" : "Who's the psych patient among us?", players: "1+ لاعب", category: "ضحك", Art: MareedArt, modes: ["group", "solo"] },
    { href: "/qissa", title: QISSA_STR[lang].gameNameArabic, sub: ar ? "قصة توها تبدأ… وتضيع بين الكل" : "A story that gets lost along the way", players: "2+ لاعبين", category: "ضحك", Art: QissaArt, modes: ["group"] },
    { href: "/job", title: JOB_STR[lang].gameNameArabic, sub: ar ? "لعبة للعاطلين 👀" : "A game for the unemployed 👀", players: "2+ لاعبين", category: "ضحك", Art: JobArt, modes: ["group"] },
    { href: "/qaseeda", title: QASEEDA_STR[lang].gameNameArabic, sub: ar ? "اكتبوا قصيدة سوا، مين الشاعر فيكم" : "Write a poem together, line by line", players: "2+ لاعبين", category: "إبداع", Art: QaseedaArt, modes: ["group"] },
    { href: "/lifoo", title: LIFOO_STR[lang].gameNameArabic, sub: ar ? "ألّفوا أغنية سوا، بعدين خلوا واحد يغنيها" : "Build a song together, line by line", players: "2+ لاعبين", category: "إبداع", Art: LifooArt, modes: ["group", "solo"] },
    { href: "/ibarat", title: "عبارات", sub: ar ? "بطاقة إلهام يومية" : "A daily card of inspiration", players: "لاعب واحد", category: "إلهام", Art: IbaratArt, modes: ["solo"] },
  ];

  // الكل is the default — a new visitor should see everything the site
  // has before being asked to narrow it down. مع أصحابك / لحالك stay
  // available as an explicit choice for anyone who already knows what
  // kind of session they want.
  const [mode, setMode] = useState<"group" | "all" | "solo">("all");

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pendingGame, setPendingGame] = useState<string | null>(null);
  const [openInfoGame, setOpenInfoGame] = useState<GameKey | null>(null);
  const [gameMeta, setGameMeta] = useState<Record<string, { hidden: boolean; display_order: number | null }>>({});

  useEffect(() => {
    getFavoriteGames().then(setFavorites);
  }, []);

  // Admin-controlled ordering/visibility (see /admin) — a plain public
  // read, same game_access table the Plus gate already reads, so this
  // needs no new RLS policy or API route, just another SELECT against
  // data that's already openly readable.
  useEffect(() => {
    supabase
      .from("game_access")
      .select("game, hidden, display_order")
      .then(({ data }) => {
        const meta: Record<string, { hidden: boolean; display_order: number | null }> = {};
        for (const row of data || []) {
          meta[row.game] = { hidden: !!row.hidden, display_order: row.display_order };
        }
        setGameMeta(meta);
      });
  }, []);

  async function refreshFavorites() {
    const fresh = await getFavoriteGames();
    setFavorites(fresh);
    return fresh;
  }

  // The one place a toggle can actually originate — pendingGame being
  // set for the game in question is what FavoriteButton disables on,
  // which is the actual guard against a rapid double-tap firing two
  // overlapping requests for the same game.
  async function handleToggle(game: string) {
    if (pendingGame) return;
    setPendingGame(game);
    const wasFavorited = favorites.has(game);
    setFavorites((prev) => {
      const next = new Set(prev);
      wasFavorited ? next.delete(game) : next.add(game);
      return next;
    });
    try {
      await (wasFavorited ? removeFavorite(game) : addFavorite(game));
    } catch {
      // Revert the optimistic update — a failed write shouldn't leave
      // the UI claiming a state the database doesn't actually have.
      setFavorites((prev) => {
        const next = new Set(prev);
        wasFavorited ? next.add(game) : next.delete(game);
        return next;
      });
    } finally {
      setPendingGame(null);
    }
  }

  // Fires once, right after someone signs in from the favorite-prompt
  // modal — re-fetches for real first (they might be an existing
  // account with existing favorites we've never loaded, not just a
  // brand-new one), then makes sure the game they originally tapped
  // ends up favorited, without ever un-favoriting something already
  // favorited from a previous session/device.
  async function handleSignedInFavorite(game: string) {
    const fresh = await refreshFavorites();
    if (fresh.has(game)) return;
    setFavorites((prev) => new Set(prev).add(game));
    try {
      await addFavorite(game);
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(game);
        return next;
      });
    }
  }

  // Filter by the active mode, then favorites first — within each of
  // those two groups, the original hand-authored order above is left
  // untouched (no secondary sort key invented that wasn't asked for).
  const visibleEntries = entries
    .filter((e) => mode === "all" || e.modes.includes(mode))
    .filter((e) => !gameMeta[e.href.slice(1)]?.hidden)
    .slice()
    .sort((a, b) => {
      const aFav = favorites.has(a.href.slice(1)) ? 0 : 1;
      const bFav = favorites.has(b.href.slice(1)) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      // Admin-controlled order (see /admin) is the tiebreaker within
      // each favorite/non-favorite group — falls back to this array's
      // own original position for any game not yet seeded in
      // game_access, so a newly-added game doesn't jump to the front
      // just because it has no explicit order set.
      const aOrder = gameMeta[a.href.slice(1)]?.display_order ?? entries.indexOf(a);
      const bOrder = gameMeta[b.href.slice(1)]?.display_order ?? entries.indexOf(b);
      return aOrder - bOrder;
    });

  if (!ready) return null;

  return (
    <div
      dir={t.dir}
      className={dark ? "dark" : ""}
      style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}
    >
      <Blobs />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "22px 20px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {/* DOM order here is deliberately [username, install, hamburger] —
              under the page's natural RTL flow, a plain (non-reversed)
              flex row places the FIRST DOM child at the physical RIGHT
              and the LAST at the physical LEFT (RTL's "start"/"end" are
              swapped from LTR's). So this order alone is what actually
              produces username-right / install-center / hamburger-left
              on screen — no forced dir="ltr" trick needed, which matters
              because forcing ltr on an ancestor would also flip the
              default text-alignment of any plain Arabic text rendered
              inside either dropdown, not just the intended layout order. */}
          <LoginButton lang={lang} />
          <InstallBagdoonisButton lang={lang} />
          <HamburgerMenu lang={lang} setLang={setLang} dark={dark} setDark={setDark} />
        </div>

        <div style={{ textAlign: "center", marginTop: 64 }}>
          {/* Mascot sits behind the badge and pokes out above it — the badge
              is painted after, so it lands in front where they overlap. */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 12, zIndex: 0, lineHeight: 0 }}>
              <Mascot size={78} mood="excited" className="bounce" />
            </div>
            <span
            className="font-display"
            style={{
              position: "relative", zIndex: 1,
              display: "inline-block", background: "var(--purple)", color: "#fff",
              fontSize: 12, fontWeight: 800, padding: "6px 16px", borderRadius: 999,
              transform: "rotate(-4deg)",
              boxShadow: "3px 3px 0 var(--icon-outline)",
            }}
          >
            {ar ? "\u{1F389} يلا نلعب!" : "\u{1F389} Let's play!"}
            </span>
          </div>
          <h1
            className="font-display title-stack"
            style={{ fontSize: 56, fontWeight: 800, margin: 0, lineHeight: 1 }}
          >
            {t.appName}
          </h1>
          <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "14px auto 0", maxWidth: 285, lineHeight: 1.8, fontWeight: 500 }}>
            {ar ? "اكتشفوا أسرار قروبكم — ألعاب جماعية وتجارب لكل تجمّع" : "Party games and daily experiences for your group"}
          </p>
        </div>

        {/* Segmented-control style, not generic tabs — same rounded-pill
            + hard drop-shadow language every button on this page already
            uses, so it reads as "part of Bagdoonis" rather than a bolted-
            on filter widget. One compact row, no extra vertical weight. */}
        <div
          role="tablist"
          aria-label={ar ? "فلترة الألعاب" : "Filter games"}
          style={{
            display: "flex", gap: 8, marginTop: 26, padding: 5,
            background: "var(--card)", borderRadius: 999,
            border: "2.5px solid var(--icon-outline)", boxShadow: "3px 3px 0 var(--icon-outline)",
          }}
        >
          {([["group", ar ? "مع أصحابك" : "With Friends"], ["all", ar ? "الكل" : "All"], ["solo", ar ? "لحالك" : "Solo"]] as const).map(([key, label]) => {
            const active = mode === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setMode(key)}
                className="font-display"
                style={{
                  flex: 1, padding: "11px 8px", borderRadius: 999, border: "none",
                  fontSize: 14, fontWeight: 800, transition: "background .15s, color .15s",
                  background: active ? "var(--purple)" : "transparent",
                  color: active ? "#fff" : "var(--ink-soft)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 26 }}>
          {visibleEntries.map(({ href, title, sub, players, category, Art, modes }, i) => {
            const game = href.slice(1);
            const favorited = favorites.has(game);
            return (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: "none", color: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              {/* Outer wrapper stays overflow-visible so the favorite
                  button can hang off the corner; the inner tile keeps
                  overflow-hidden so the artwork's corners stay clipped
                  to the rounded frame. */}
              <div style={{ position: "relative", width: "100%" }}>
                <div
                  className="tile-tap"
                  style={{
                    position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 30, overflow: "hidden",
                    border: "3px solid var(--icon-outline)", boxShadow: "5px 5px 0 var(--icon-outline)",
                  }}
                >
                  {/* Deliberately sized to slightly overflow its parent
                      (inset: -1px instead of 0) rather than exactly 100%.
                      At certain grid-cell widths this square's computed
                      pixel size doesn't land on a whole number, and an
                      SVG child sized via width/height:100% rounds
                      independently from its container — the mismatch
                      shows up as a hairline gap at one edge (usually the
                      top) where the container's own background peeks
                      through before the artwork starts. Overflowing by a
                      pixel and letting the parent's overflow:hidden clip
                      the excess means any such rounding error gets
                      trimmed away instead of exposed, regardless of
                      which exact width this card renders at. */}
                  {/* شوفة specifically (not by index — favorites/filter
                      state can reorder this grid, an index-based check
                      would go stale) is the one uploaded photo reliably
                      visible without scrolling on a typical phone —
                      everything else (both the SVG icons, which don't
                      use this prop at all, and the other uploaded photos
                      further down the grid) loads lazily as normal,
                      which is correct: eagerly fetching photos nobody's
                      scrolled to yet would waste bandwidth, the opposite
                      of what this was meant to fix. */}
                  <div style={{ position: "absolute", inset: -1 }}>
                    <Art size={400} priority={href === "/shofah"} />
                  </div>
                </div>
                <FavoriteButton
                  game={game}
                  favorited={favorited}
                  pending={pendingGame === game}
                  lang={lang}
                  onToggle={() => handleToggle(game)}
                  onSignedInFavorite={() => handleSignedInFavorite(game)}
                />
              </div>
              <div style={{ textAlign: "center", width: "100%" }}>
                <div className="font-display" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15 }}>{title}</div>
                <div className="font-body" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", marginTop: 2 }}>{sub}</div>
                {/* Third line — two small metadata pills + the info
                    button, all deliberately subtle (small text, muted
                    background) so they read as secondary to the title
                    and description above them, not competing for
                    attention. The info button stops propagation/
                    prevents default the same way FavoriteButton already
                    does, since the whole card is a <Link> — without
                    that, tapping it would also navigate into the game. */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 7 }}>
                  <span
                    className="font-body"
                    style={{ fontSize: 9.5, fontWeight: 700, color: "var(--ink-soft)", background: "var(--ring)", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}
                  >
                    {players}
                  </span>
                  <span
                    className="font-body"
                    style={{ fontSize: 9.5, fontWeight: 700, color: "var(--ink-soft)", background: "var(--ring)", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}
                  >
                    {category}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpenInfoGame(href.slice(1) as GameKey); }}
                    aria-label={ar ? "معلومات اللعبة" : "Game info"}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      width: 22, height: 22, borderRadius: 999, background: "var(--ring)", border: "none",
                      color: "var(--ink-soft)",
                    }}
                  >
                    <Info size={11} />
                  </button>
                </div>
              </div>
            </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 30 }}>
          <a
            href="https://instagram.com/bagdoonis.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram: @bagdoonis.app"
            style={{
              width: 40, height: 40, borderRadius: 999, background: "var(--card)",
              border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)",
            }}
          >
            <Instagram size={18} />
          </a>
          <a
            href="https://tiktok.com/@bagdoonis.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok: @bagdoonis.app"
            style={{
              width: 40, height: 40, borderRadius: 999, background: "var(--card)",
              border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)",
            }}
          >
            <TikTokIcon size={18} />
          </a>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
          <a
            href="mailto:bagdoonis.app@gmail.com"
            aria-label="Contact us: bagdoonis.app@gmail.com"
            title="bagdoonis.app@gmail.com"
            style={{
              width: 40, height: 40, borderRadius: 999, background: "var(--card)",
              border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)",
            }}
          >
            <Mail size={18} />
          </a>
        </div>
        <p className="font-body" style={{ textAlign: "center", fontSize: 10.5, letterSpacing: ".18em", color: "var(--ink-soft)", fontWeight: 700, marginTop: 16 }}>
          bagdoonis.app
        </p>
      </div>
      {openInfoGame && <HowToPlay game={openInfoGame} lang={lang} onClose={() => setOpenInfoGame(null)} />}
    </div>
  );
}
