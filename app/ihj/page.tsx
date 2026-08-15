"use client";

import Link from "next/link";
import { Users, Zap } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { usePrefs } from "@/lib/usePrefs";
import { IHJ_STR, IhjLang } from "@/lib/ihj-i18n";
import { IHJ_CATEGORIES } from "@/lib/ihj-categories";

const PURPLE = "#7C3AED";
const PINK = "#FF2E93";

export default function IhjLandingPage() {
  const { lang, dark, ready } = usePrefs();
  const t = IHJ_STR[lang as IhjLang];
  const ar = lang === "ar";
  if (!ready) return null;

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ textAlign: "center", marginTop: 60 }}>
          <div
            aria-hidden="true"
            className="pop"
            style={{
              width: 110, height: 110, borderRadius: 999, margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50,
              background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`, boxShadow: `0 12px 30px ${PINK}44`,
            }}
          >
            🧠
          </div>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 10px" }}>
            {t.gameName}
          </h1>
          <p className="font-body" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.7, margin: "0 0 28px" }}>
            {t.tagline}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
            {IHJ_CATEGORIES.map((c) => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, background: "var(--card)", border: "1.5px solid var(--ring)" }}>
                <span style={{ fontSize: 15 }}>{c.emoji}</span>
                <span className="font-body" style={{ fontSize: 11.5, fontWeight: 700 }}>{c.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Link
              href="/ihj/solo"
              className="font-display"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`, boxShadow: `0 10px 24px ${PINK}33`,
              }}
            >
              <Zap size={18} /> {t.playSolo}
            </Link>
            <Link
              href="/ihj/create"
              className="font-body"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: 16, fontSize: 14, fontWeight: 700, borderRadius: 999,
                border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)", textDecoration: "none",
              }}
            >
              <Users size={16} /> {t.playMultiplayer}
            </Link>
            <Link
              href="/ihj/join"
              className="font-body"
              style={{ display: "block", textAlign: "center", padding: 10, fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "underline" }}
            >
              {t.joinGame}
            </Link>
          </div>

          <div className="card pop" style={{ marginTop: 28, padding: 20, textAlign: "start" }}>
            <p className="font-body" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.9, margin: 0, whiteSpace: "pre-line" }}>
              {ar
                ? "كل جولة يطلع لكم حرف، ولازم تكتبون كلمات تبدا بالحرف هذا.\nإجابة محد كتبها غيرك = ١٠ نقاط. إجابة تكررت = ٥. فاضية أو غلط = صفر 🧠"
                : "Each round gives you a letter — write a person, animal, object, plant, and country starting with it. An answer nobody else wrote = 10 points. A repeated answer = 5. Blank or wrong = zero 🧠"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
