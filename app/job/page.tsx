"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { HelpButton } from "@/components/HowToPlay";
import SuitGuy from "@/components/job/SuitGuy";
import { JobArt } from "@/components/art/GameArt";
import { JOB_STR, jobSubtitles, JobLang } from "@/lib/job-i18n";
import { usePrefs } from "@/lib/usePrefs";

// Job gets its own accent identity — corporate blues, distinct from
// Fashlah's pink/purple and Shofah's rose/wine — so the three games feel
// visually separate even though they share the same platform chrome.
const BLUE = "#2B4C9B";
const NAVY = "#1B3068";

export default function JobLanding() {
  const { lang, setLang, dark, setDark, ready } = usePrefs();
  const t = JOB_STR[lang as JobLang];
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (!ready) return;
    const options = jobSubtitles(lang as JobLang);
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
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
          <HelpButton game="job" lang={lang} />
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

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
          <JobArt size={140} />
          <h1
            className="font-display"
            style={{
              fontSize: 48, fontWeight: 800, margin: 0,
              background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`,
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
          href="/job/create"
          className="font-display"
          style={{
            display: "block", textAlign: "center", padding: 18, fontSize: 18,
            borderRadius: 999, color: "#fff", textDecoration: "none",
            background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`,
            boxShadow: `0 10px 30px ${BLUE}55`,
          }}
        >
          {t.startGame}
        </Link>

        <Link
          href="/job/join"
          className="font-body"
          style={{
            display: "block", textAlign: "center", padding: 14, fontSize: 14, fontWeight: 700,
            color: "var(--ink-soft)", textDecoration: "underline", marginTop: 12,
          }}
        >
          {t.joinSession}
        </Link>
      </div>
    </div>
  );
}
