"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun, BookOpen } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { HelpButton } from "@/components/HowToPlay";
import { QissaArt } from "@/components/art/GameArt";
import { QISSA_STR, qissaSubtitles, QissaLang } from "@/lib/qissa-i18n";
import { usePrefs } from "@/lib/usePrefs";

const ORANGE = "#FF8A3D";
const DEEP = "#E0409A";

export default function QissaLanding() {
  const { lang, setLang, dark, setDark, ready } = usePrefs();
  const t = QISSA_STR[lang as QissaLang];
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (!ready) return;
    const options = qissaSubtitles(lang as QissaLang);
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
          <HelpButton game="qissa" lang={lang} />
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
          <div style={{ width: 168, height: 168, borderRadius: 30, overflow: "hidden", border: "3px solid var(--outline)", boxShadow: "5px 5px 0 var(--outline)", margin: "0 auto" }}>
            <QissaArt size={168} />
          </div>
          <h1
            className="font-quote"
            style={{ fontSize: 44, fontWeight: 700, margin: 0, color: ORANGE, textShadow: `2px 2px 0 ${DEEP}` }}
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
          href="/qissa/create"
          className="font-display btn-bag"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            textAlign: "center", padding: 18, fontSize: 18,
            borderRadius: 999, color: "#fff", textDecoration: "none",
            background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`,
            boxShadow: `0 10px 30px ${DEEP}55`,
          }}
        >
          <BookOpen size={18} />
          {t.startGame}
        </Link>

        <Link
          href="/qissa/join"
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
