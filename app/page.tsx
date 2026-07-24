"use client";

import Link from "next/link";
import { Moon, Sun, Users2 } from "lucide-react";
import Mascot from "@/components/Mascot";
import Blobs from "@/components/Blobs";
import { STR } from "@/lib/i18n";
import { usePrefs } from "@/lib/usePrefs";

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
          <div style={{ position: "relative" }}>
            <Mascot size={78} mood="excited" className="bounce" />
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 4px" }}>
              {t.gameNameDisplay}
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
          <h3 className="font-display" style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 12, letterSpacing: "0.02em" }}>
            {t.gameLibrary}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              className="card"
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                opacity: 0.55,
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 16, background: "var(--ring)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
              }}>
                🤔
              </div>
              <div style={{ flex: 1, textAlign: lang === "ar" ? "right" : "left" }}>
                <p className="font-body" style={{ fontWeight: 700, fontSize: 15 }}>{t.wouldYouRather}</p>
              </div>
              <span className="chip" style={{ fontSize: 11, padding: "5px 12px", pointerEvents: "none" }}>
                {t.comingSoonBadge}
              </span>
            </div>
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
