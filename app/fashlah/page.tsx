"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import Mascot from "@/components/Mascot";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { STR } from "@/lib/i18n";
import { usePrefs } from "@/lib/usePrefs";

// Same derived magenta as the home page — midpoint of the Bagdoonis
// wordmark gradient (#FF2E93 -> #7C3AED).
const MAGENTA = "#BE34C0";

export default function BagdoonisHome() {
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

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 18 }}>
          <Mascot size={110} mood="excited" className="bounce" />
          <div>
            <h1
              className="font-display"
              style={{ fontSize: 44, fontWeight: 800, margin: 0 }}
            >
              <span style={{ color: "var(--mint)" }}>{t.gameNamePart1}</span>
              {t.gameNamePart2 && <span style={{ color: MAGENTA, fontStyle: "italic" }}> {t.gameNamePart2}</span>}
              {" 🌿"}
            </h1>
            <p className="font-body" style={{ fontSize: 17, color: "var(--ink-soft)", marginTop: 8, fontWeight: 600 }}>
              {t.gameTagline}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Link href="/fashlah/create" className="btn-primary font-display" style={{ padding: 18, fontSize: 18, textAlign: "center", display: "block" }}>
            {t.startSession}
          </Link>
          <Link href="/fashlah/join" className="btn-ghost font-display" style={{ padding: 18, fontSize: 18, textAlign: "center", display: "block" }}>
            {t.joinSession}
          </Link>
        </div>
      </div>
    </div>
  );
}
