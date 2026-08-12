"use client";

import Link from "next/link";
import { Instagram, Mail, Moon, Sun } from "lucide-react";
import { STR } from "@/lib/i18n";
import { SHOFAH_STR } from "@/lib/shofah-i18n";
import { JOB_STR } from "@/lib/job-i18n";
import { QASEEDA_STR } from "@/lib/qaseeda-i18n";
import { QISSA_STR } from "@/lib/qissa-i18n";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import Mascot from "@/components/Mascot";
import { FashlahArt, ShofahArt, JobArt, IbaratArt, QaseedaArt, QissaArt, WadakArt, BidalArt, IhjArt } from "@/components/art/GameArt";
import InstallBagdoonisButton from "@/components/pwa/InstallBagdoonisButton";

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

  if (!ready) return null;

  const ALWAYS_FREE = "#22C55E";
  const LIMITED_FREE = "#FF7A1A";

  const entries = [
    { href: "/bidal", title: "بدل الكلمة", sub: ar ? "بدّل حرف، واصنع كلمات جديدة 🔤" : "Swap a letter, beat the rest 🔤", Art: BidalArt, badge: ar ? "مجاناً لفترة محدودة" : "Free for a limited time", badgeColor: LIMITED_FREE, soloBadge: ar ? "لعبة فردية" : "Solo game" },
    { href: "/shofah", title: SHOFAH_STR[lang].gameNameArabic, sub: ar ? "خلّنا نشوف مين بيتزوج أول" : "Who gets married first?", Art: ShofahArt, badge: ar ? "مجاناً" : "Free", badgeColor: ALWAYS_FREE },
    { href: "/ihj", title: "إنسان حيوان جماد", sub: ar ? "لعبة الطيبين - مين أسرعكم بالكتابة 🧠" : "Find the answer nobody else thinks of 🧠", Art: IhjArt, badge: ar ? "مجاناً لفترة محدودة" : "Free for a limited time", badgeColor: LIMITED_FREE },
    { href: "/wadak", title: "وش شخصيتك", sub: ar ? "جاوب وشوف شخصيتك الحقيقية 🧠" : "Answer and find your real personality 🧠", Art: WadakArt, badge: ar ? "مجاناً" : "Free", badgeColor: ALWAYS_FREE, soloBadge: ar ? "لعبة فردية" : "Solo game" },
    { href: "/fashlah", title: t.gameName, sub: ar ? "اكتشفوا أسرار شلتكم 😂" : "Uncover your group's secrets 😂", Art: FashlahArt, badge: ar ? "مجاناً" : "Free", badgeColor: ALWAYS_FREE },
    { href: "/qissa", title: QISSA_STR[lang].gameNameArabic, sub: ar ? "قصة توها تبدأ... وتضيع بين الكل 😂" : "A story that gets lost along the way 😂", Art: QissaArt, badge: ar ? "مجاناً لفترة محدودة" : "Free for a limited time", badgeColor: LIMITED_FREE },
    { href: "/job", title: JOB_STR[lang].gameNameArabic, sub: ar ? "لعبة للعاطلين 👀" : "A game for the unemployed 👀", Art: JobArt, badge: ar ? "مجاناً لفترة محدودة" : "Free for a limited time", badgeColor: LIMITED_FREE },
    { href: "/qaseeda", title: QASEEDA_STR[lang].gameNameArabic, sub: ar ? "اكتبوا قصيدة سوا، بيت بيت 🪶" : "Write a poem together, line by line 🪶", Art: QaseedaArt, badge: ar ? "مجاناً لفترة محدودة" : "Free for a limited time", badgeColor: LIMITED_FREE },
    { href: "/ibarat", title: "عبارات", sub: ar ? "بطاقة إلهام يومية" : "A daily card of inspiration", Art: IbaratArt, badge: ar ? "مجاناً" : "Free", badgeColor: ALWAYS_FREE },
  ];

  return (
    <div
      dir={t.dir}
      className={dark ? "dark" : ""}
      style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}
    >
      <Blobs />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "22px 20px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <InstallBagdoonisButton lang={lang} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={() => setLang(ar ? "en" : "ar")}
              aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
              className="font-body"
              style={{ padding: "7px 15px", borderRadius: 999, fontSize: 12, fontWeight: 800, background: "var(--card)", color: "var(--ink)", border: "1.5px solid rgba(217,164,65,.5)" }}
            >
              {ar ? "EN" : "AR"}
            </button>
            <button
              onClick={() => setDark(!dark)}
              aria-label={dark ? (ar ? "الوضع الفاتح" : "Light mode") : (ar ? "الوضع الداكن" : "Dark mode")}
              style={{ width: 36, height: 36, borderRadius: 999, background: "var(--card)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(217,164,65,.5)" }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 34 }}>
          {entries.map(({ href, title, sub, Art, badge, badgeColor, soloBadge }) => (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: "none", color: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              {/* Outer wrapper stays overflow-visible so the badge can hang
                  off the corner; the inner tile keeps overflow-hidden so
                  the artwork's corners stay clipped to the rounded frame. */}
              <div style={{ position: "relative", width: "100%" }}>
                <div
                  className="tile-tap"
                  style={{
                    width: "100%", aspectRatio: "1 / 1", borderRadius: 30, overflow: "hidden",
                    border: "3px solid var(--icon-outline)", boxShadow: "5px 5px 0 var(--icon-outline)",
                  }}
                >
                  <Art size={400} />
                </div>
                {badge && (
                  <span
                    className="font-body"
                    style={{
                      position: "absolute", top: -10, right: -8, zIndex: 2,
                      maxWidth: 92, textAlign: "center",
                      background: badgeColor, color: "#fff",
                      fontSize: 8.5, fontWeight: 800, lineHeight: 1.3,
                      padding: "5px 8px", borderRadius: 10,
                      border: "2px solid var(--icon-outline)", boxShadow: "2px 2px 0 var(--icon-outline)",
                      transform: "rotate(-8deg)",
                    }}
                  >
                    {badge}
                  </span>
                )}
                {soloBadge && (
                  <span
                    className="font-body"
                    style={{
                      position: "absolute", top: badge ? 34 : -10, right: -8, zIndex: 2,
                      maxWidth: 92, textAlign: "center",
                      background: "var(--card)", color: "var(--ink)",
                      fontSize: 8.5, fontWeight: 800, lineHeight: 1.3,
                      padding: "5px 8px", borderRadius: 10,
                      border: "2px solid var(--icon-outline)", boxShadow: "2px 2px 0 var(--icon-outline)",
                      transform: "rotate(-4deg)",
                    }}
                  >
                    {soloBadge}
                  </span>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15 }}>{title}</div>
                <div className="font-body" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", marginTop: 2 }}>{sub}</div>
              </div>
            </Link>
          ))}
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
    </div>
  );
}
