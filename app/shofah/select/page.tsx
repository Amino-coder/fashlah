"use client";

import { useState } from "react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import NiqabGirl from "@/components/shofah/NiqabGirl";
import ShemaghGuy from "@/components/shofah/ShemaghGuy";
import { SHOFAH_STR, ShofahLang } from "@/lib/shofah-i18n";
import { usePrefs } from "@/lib/usePrefs";

const ROSE = "#E63946";
const WINE = "#C2185B";

type Choice = "girl" | "guy" | null;

export default function ShofahSelect() {
  const { lang, dark, ready } = usePrefs();
  const t = SHOFAH_STR[lang as ShofahLang];
  const [choice, setChoice] = useState<Choice>(null);
  const [showNotice, setShowNotice] = useState(false);

  if (!ready) return null;

  const cardStyle = (active: boolean) => ({
    flex: 1,
    padding: "24px 12px",
    borderRadius: 28,
    background: "var(--card)",
    border: active ? `3px solid ${ROSE}` : "3px solid transparent",
    boxShadow: active ? `0 12px 30px ${ROSE}33` : "0 10px 30px var(--ring)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    transition: "transform 0.15s ease",
    transform: active ? "translateY(-4px)" : "none",
  });

  return (
    <div
      dir={t.dir}
      className={dark ? "dark" : ""}
      style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}
    >
      <Blobs />
      <HomeButton label={t.backHome} />
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px 24px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", margin: 0 }}>
            {t.charSelectTitle}
          </h1>

          <div style={{ display: "flex", gap: 14 }}>
            <button style={cardStyle(choice === "girl")} onClick={() => setChoice("girl")}>
              <NiqabGirl size={110} />
              <span className="font-display" style={{ fontSize: 17, fontWeight: 800 }}>👰 {t.girlLabel}</span>
            </button>
            <button style={cardStyle(choice === "guy")} onClick={() => setChoice("guy")}>
              <ShemaghGuy size={110} />
              <span className="font-display" style={{ fontSize: 17, fontWeight: 800 }}>👳 {t.guyLabel}</span>
            </button>
          </div>
        </div>

        <button
          disabled={!choice}
          onClick={() => setShowNotice(true)}
          className="font-display"
          style={{
            padding: 18, fontSize: 18, borderRadius: 999, border: "none",
            color: "#fff", cursor: choice ? "pointer" : "not-allowed",
            background: choice ? `linear-gradient(135deg, ${ROSE}, ${WINE})` : "var(--ring)",
            opacity: choice ? 1 : 0.6,
            boxShadow: choice ? `0 10px 30px ${ROSE}55` : "none",
          }}
        >
          {t.continueBtn}
        </button>

        {showNotice && (
          <p className="font-body" style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", marginTop: 12 }}>
            {t.phase2Notice}
          </p>
        )}
      </div>
    </div>
  );
}
