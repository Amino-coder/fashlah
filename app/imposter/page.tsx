"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { ImposterArt } from "@/components/art/GameArt";
import { IMPOSTER_STR, ImposterLang } from "@/lib/imposter-i18n";
import { usePrefs } from "@/lib/usePrefs";

const MAGENTA = "#D6006E";
const PINK = "#FF2E93";

export default function ImposterLandingPage() {
  const { lang, dark, ready } = usePrefs();
  const t = IMPOSTER_STR[lang as ImposterLang];
  const ar = lang === "ar";
  if (!ready) return null;

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ textAlign: "center", marginTop: 40 }}>
          <div style={{ width: 140, height: 140, borderRadius: 30, overflow: "hidden", border: "3px solid var(--icon-outline)", boxShadow: "5px 5px 0 var(--icon-outline)", margin: "0 auto 20px" }}>
            <ImposterArt size={140} />
          </div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{t.gameName}</h1>
          <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", fontWeight: 600, marginBottom: 32 }}>{t.tagline}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Link
              href="/imposter/create"
              className="font-display"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${MAGENTA}, ${PINK})`, boxShadow: `0 10px 24px ${PINK}33`,
              }}
            >
              <Users size={18} /> {t.createGame}
            </Link>
            <Link
              href="/imposter/join"
              className="font-body"
              style={{ display: "block", textAlign: "center", padding: 14, fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "underline" }}
            >
              {t.joinGame}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
