"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { STR } from "@/lib/i18n";
import { SHOFAH_STR } from "@/lib/shofah-i18n";
import { JOB_STR } from "@/lib/job-i18n";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import { FashlahArt, ShofahArt, JobArt, IbaratArt } from "@/components/art/GameArt";

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

  const entries = [
    { href: "/fashlah", title: t.gameName, sub: ar ? "الشخصية والأسرار" : "Secrets & personality", Art: FashlahArt },
    { href: "/shofah", title: SHOFAH_STR[lang].gameNameArabic, sub: ar ? "الزواج الجماعية" : "The marriage game", Art: ShofahArt },
    { href: "/job", title: JOB_STR[lang].gameNameArabic, sub: ar ? "مقابلة العمل" : "The interview game", Art: JobArt },
    { href: "/ibarat", title: "عبارات", sub: ar ? "بطاقة إلهام يومية" : "A daily card", Art: IbaratArt },
  ];

  return (
    <div
      dir={t.dir}
      className={dark ? "dark" : ""}
      style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}
    >
      <Blobs />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "22px 20px 48px", position: "relative", zIndex: 1 }}>
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

        <div style={{ textAlign: "center", marginTop: 26 }}>
          <span
            className="font-display"
            style={{
              display: "inline-block", background: "var(--purple)", color: "#fff",
              fontSize: 12, fontWeight: 800, padding: "6px 16px", borderRadius: 999,
              transform: "rotate(-4deg)", marginBottom: 14,
              boxShadow: "3px 3px 0 var(--ink)",
            }}
          >
            {ar ? "\u{1F389} يلا نلعب!" : "\u{1F389} Let's play!"}
          </span>
          <h1
            className="font-display"
            style={{
              fontSize: 56, fontWeight: 800, margin: 0, lineHeight: 1,
              color: "var(--pink)",
              textShadow: "3px 3px 0 var(--purple), 6px 6px 0 var(--mint)",
            }}
          >
            {t.appName}
          </h1>
          <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "14px auto 0", maxWidth: 285, lineHeight: 1.8, fontWeight: 500 }}>
            {ar ? "اكتشفوا أسرار قروبكم — ألعاب جماعية وتجارب لكل تجمّع" : "Party games and daily experiences for your group"}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 34 }}>
          {entries.map(({ href, title, sub, Art }) => (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: "none", color: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              {/* The artwork IS the tile — full bleed, no card around it. */}
              <div
                style={{
                  width: "100%", aspectRatio: "1 / 1", borderRadius: 30, overflow: "hidden",
                  border: "3px solid var(--ink)", boxShadow: "5px 5px 0 var(--ink)",
                }}
              >
                <Art size={400} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15 }}>{title}</div>
                <div className="font-body" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", marginTop: 2 }}>{sub}</div>
              </div>
            </Link>
          ))}
        </div>

        <p className="font-body" style={{ textAlign: "center", fontSize: 10.5, letterSpacing: ".18em", color: "var(--ink-soft)", fontWeight: 700, marginTop: 16 }}>
          BAGDOONIS.APP
        </p>
      </div>
    </div>
  );
}
