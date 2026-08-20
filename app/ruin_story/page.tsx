"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { RuinStoryArt } from "@/components/art/GameArt";
import { RUIN_STORY_STR, RuinStoryLang } from "@/lib/ruin-story-i18n";
import { usePrefs } from "@/lib/usePrefs";

const CRIMSON = "#9B1C2E";
const GOLD = "#FFD400";

export default function RuinStoryLandingPage() {
  const { lang, dark, ready } = usePrefs();
  const t = RUIN_STORY_STR[lang as RuinStoryLang];
  if (!ready) return null;

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ textAlign: "center", marginTop: 40 }}>
          <div style={{ position: "relative", width: 140, height: 140, borderRadius: 30, overflow: "hidden", border: "3px solid var(--icon-outline)", boxShadow: "5px 5px 0 var(--icon-outline)", margin: "0 auto 20px" }}>
            <RuinStoryArt size={140} />
          </div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{t.gameName}</h1>
          <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", fontWeight: 600, marginBottom: 32 }}>{t.tagline}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Link
              href="/ruin_story/create"
              className="font-display"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)`, boxShadow: `0 10px 24px ${CRIMSON}44`,
              }}
            >
              <Users size={18} /> {t.createGame}
            </Link>
            <Link
              href="/ruin_story/join"
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
