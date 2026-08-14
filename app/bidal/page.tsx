"use client";

import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import Link from "next/link";
import { Zap } from "lucide-react";
import { usePrefs } from "@/lib/usePrefs";
import { BIDAL_STR, BidalLang } from "@/lib/bidal-i18n";
import PlusGate from "@/components/PlusGate";

const TEAL = "#14B8A6";
const CORAL = "#FF5A5F";

export default function BidalLandingPage() {
  const { lang, ready } = usePrefs();
  if (!ready) return null;
  return (
    <PlusGate game="bidal" lang={(lang as BidalLang) === "en" ? "en" : "ar"}>
      <BidalLandingContent />
    </PlusGate>
  );
}

function BidalLandingContent() {
  const { lang, dark, ready } = usePrefs();
  const t = BIDAL_STR[lang as BidalLang];
  const ar = lang === "ar";
  if (!ready) return null;

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ textAlign: "center", marginTop: 70 }}>
          <div
            aria-hidden="true"
            className="pop"
            style={{
              width: 110, height: 110, borderRadius: 999, margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50,
              background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, boxShadow: `0 12px 30px ${CORAL}44`,
            }}
          >
            🔤
          </div>
          <h1 className="font-display" style={{ fontSize: 34, fontWeight: 800, margin: "0 0 10px" }}>
            {t.gameNameArabic}
          </h1>
          <p className="font-body" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.7, margin: "0 0 36px" }}>
            {t.tagline}
          </p>

          <Link
            href="/bidal/solo"
            className="font-display"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, boxShadow: `0 10px 24px ${CORAL}33`,
            }}
          >
            <Zap size={18} /> {t.playSolo}
          </Link>

          <div className="card pop" style={{ marginTop: 32, padding: 20, textAlign: "start" }}>
            <p className="font-body" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.9, margin: 0 }}>
              {ar
                ? "بدّل حرف من الكلمة بحرف من عندك عشان تسوّي كلمة جديدة. عندك وقت محدود، وخصمك هو الساعة ⏱️. خلّص حروفك قبل ما ينتهي الوقت 🏆"
                : "Swap one letter in the 3-letter word for one of your own to make a new word. You're racing the clock ⏱️ — empty your hand before time runs out 🏆"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

