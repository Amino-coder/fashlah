"use client";

import Link from "next/link";
import { Moon, Sun, Users2 } from "lucide-react";
import Mascot from "@/components/Mascot";
import Blobs from "@/components/Blobs";
import { STR } from "@/lib/i18n";
import { SHOFAH_STR } from "@/lib/shofah-i18n";
import { JOB_STR } from "@/lib/job-i18n";
import { usePrefs } from "@/lib/usePrefs";

// Midpoint blend of the Bagdoonis wordmark gradient (#FF2E93 -> #7C3AED) —
// a true magenta drawn directly from the brand gradient itself.
const MAGENTA = "#BE34C0";

// One distinct tint per remaining blurred slot so each placeholder reads
// as "a specific unrevealed game" rather than a uniform gray block.
const LIBRARY_COLORS = ["#7C3AED", "#2EE6A6", "#FFD400"];

const SHOFAH_ROSE = "#E63946";
const SHOFAH_WINE = "#C2185B";
const JOB_BLUE = "#3B82F6";
const JOB_NAVY = "#1E40AF";
const IBARAT_INK = "#1F2A44";
const IBARAT_DEEP = "#0C1220";
const IBARAT_EMOJI = "\u{1F4C7}"; // 📇


export default function Home() {
  const { lang, setLang, dark, setDark, ready } = usePrefs();
  const t = STR[lang];

  if (!ready) return null;

  return (
    <div
      dir={t.dir}
      className={dark ? "dark" : ""}
      style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}
    >
      <Blobs />
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px 24px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="chip"
            aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            style={{ padding: "6px 14px", fontSize: 13 }}
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>
          <button
            onClick={() => setDark(!dark)}
            aria-label={dark ? (lang === "ar" ? "الوضع الفاتح" : "Light mode") : (lang === "ar" ? "الوضع الداكن" : "Dark mode")}
            style={{ width: 36, height: 36, borderRadius: 999, background: "var(--card)", border: "none", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--ring)" }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Platform brand header */}
        <div style={{ textAlign: "center", padding: "18px 0 8px" }}>
          <h1
            className="font-display"
            style={{
              fontSize: 34, fontWeight: 800, margin: 0,
              background: "linear-gradient(135deg, #FF2E93, #7C3AED)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            {t.appName} 🌿
          </h1>
          <p className="font-body" style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4, fontWeight: 600 }}>
            {t.platformTagline}
          </p>
        </div>

        {/* Main game card — Fashlah */}
        <Link
          href="/fashlah"
          className="card pop"
          style={{
            display: "block", padding: 26, marginTop: 18, textAlign: "center",
            textDecoration: "none", color: "var(--ink)", position: "relative", overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute", inset: 0, opacity: 0.08,
              background: "linear-gradient(135deg, #FF2E93, #7C3AED)",
            }}
          />
          <div style={{ position: "relative", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Mascot size={78} mood="excited" className="bounce" />
            </div>
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 4px" }}>
              <span style={{ color: "var(--mint)" }}>{t.gameNamePart1}</span>
              {t.gameNamePart2 && <span style={{ color: MAGENTA, fontStyle: "italic" }}> {t.gameNamePart2}</span>}
            </h2>
            <p className="font-body" style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 600, marginBottom: 16 }}>
              {t.gameTagline}
            </p>
            <span
              className="btn-primary font-display"
              style={{ display: "inline-block", padding: "12px 32px", fontSize: 15 }}
            >
              {t.playNow}
            </span>
          </div>
        </Link>

        {/* Game library */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-soft)", letterSpacing: "0.02em", margin: 0 }}>
              {t.gameLibrary}
            </h3>
            <span className="chip" style={{ fontSize: 11, padding: "5px 12px", pointerEvents: "none" }}>
              {t.comingSoonBadge}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Link
              href="/shofah"
              className="card pop"
              style={{
                aspectRatio: "1 / 1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
                textDecoration: "none", color: "var(--ink)", position: "relative", overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute", inset: 0, opacity: 0.1,
                  background: `linear-gradient(135deg, ${SHOFAH_ROSE}, ${SHOFAH_WINE})`,
                }}
              />
              <span style={{ fontSize: 26, position: "relative" }}>💍</span>
              <span
                className="font-display"
                style={{ fontSize: 11, fontWeight: 800, position: "relative", textAlign: "center", lineHeight: 1.2 }}
              >
                {SHOFAH_STR[lang].gameNameArabic}
              </span>
            </Link>

            <Link
              href="/job"
              className="card pop"
              style={{
                aspectRatio: "1 / 1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
                textDecoration: "none", color: "var(--ink)", position: "relative", overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute", inset: 0, opacity: 0.1,
                  background: `linear-gradient(135deg, ${JOB_BLUE}, ${JOB_NAVY})`,
                }}
              />
              <span style={{ fontSize: 26, position: "relative" }}>💼</span>
              <span
                className="font-display"
                style={{ fontSize: 11, fontWeight: 800, position: "relative", textAlign: "center", lineHeight: 1.2 }}
              >
                {JOB_STR[lang].gameNameArabic}
              </span>
            </Link>

            {/* عبارات — an experience rather than a game, but it lives in
                the same library so it's discoverable alongside them. */}
            <Link
              href="/ibarat"
              className="card pop"
              style={{
                aspectRatio: "1 / 1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
                textDecoration: "none", color: "var(--ink)", position: "relative", overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute", inset: 0, opacity: 0.12,
                  background: `linear-gradient(135deg, ${IBARAT_INK}, ${IBARAT_DEEP})`,
                }}
              />
              <span style={{ fontSize: 24, position: "relative", lineHeight: 1 }}>{IBARAT_EMOJI}</span>
              <span
                style={{
                  fontFamily: "'El Messiri', serif", fontSize: 13, fontWeight: 700,
                  position: "relative", textAlign: "center", lineHeight: 1.2,
                }}
              >
                عبارات
              </span>
            </Link>

            {LIBRARY_COLORS.map((color, i) => (
              <div
                key={i}
                className="card"
                style={{
                  aspectRatio: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  filter: "blur(1.5px)",
                  opacity: 0.5,
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 12,
                  background: color, opacity: 0.55,
                }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24, opacity: 0.4 }}>
          <Users2 size={13} />
          <span className="font-body" style={{ fontSize: 12, fontWeight: 600 }}>{t.appName}</span>
        </div>
      </div>
    </div>
  );
}
