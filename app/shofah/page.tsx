"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { SHOFAH_STR, shofahSubtitles, ShofahLang } from "@/lib/shofah-i18n";
import { usePrefs } from "@/lib/usePrefs";

// Shofah gets its own accent identity — warm rose/wine, distinct from
// Fashlah's pink/purple — so the two games feel visually separate even
// though they share the same platform chrome.
const ROSE = "#E63946";
const WINE = "#C2185B";

export default function ShofahLanding() {
  const { lang, setLang, dark, setDark, ready } = usePrefs();
  const t = SHOFAH_STR[lang as ShofahLang];
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (!ready) return;
    const options = shofahSubtitles(lang as ShofahLang);
    setSubtitle(options[Math.floor(Math.random() * options.length)]);
  }, [ready, lang]);

  if (!ready) return null;

  return (
    <div
      dir={t.dir}
      className={dark ? "dark" : ""}
      style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}
    >
      <Blobs />
      <HomeButton label={t.backHome} />
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px 24px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="chip" style={{ padding: "6px 14px", fontSize: 13 }}>
            {lang === "ar" ? "EN" : "AR"}
          </button>
          <button
            onClick={() => setDark(!dark)}
            style={{ width: 36, height: 36, borderRadius: 999, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--ring)" }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
          <div style={{ fontSize: 64 }}>💍</div>
          <h1
            className="font-display"
            style={{
              fontSize: 48, fontWeight: 800, margin: 0,
              background: `linear-gradient(135deg, ${ROSE}, ${WINE})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            {t.gameNameArabic}
          </h1>
          <p className="font-body" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink-soft)", textTransform: "uppercase", marginTop: -8 }}>
            {t.gameNameLatin}
          </p>
          <p className="font-body" style={{ fontSize: 17, color: "var(--ink-soft)", fontWeight: 600, maxWidth: 320 }}>
            {subtitle}
          </p>
        </div>

        <Link
          href="/shofah/select"
          className="font-display"
          style={{
            display: "block", textAlign: "center", padding: 18, fontSize: 18,
            borderRadius: 999, color: "#fff", textDecoration: "none",
            background: `linear-gradient(135deg, ${ROSE}, ${WINE})`,
            boxShadow: `0 10px 30px ${ROSE}55`,
          }}
        >
          {t.startGame}
        </Link>
      </div>
    </div>
  );
}
