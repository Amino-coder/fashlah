"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import { unlockAudio } from "@/lib/sound-engine";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { MAREED_STR, MAREED_AVATARS, MareedLang } from "@/lib/mareed-i18n";
import { usePrefs } from "@/lib/usePrefs";

const ROSE = "#E63946";
const WINE = "#C2185B";

export default function MareedCreatePage() {
  const { lang, dark, ready } = usePrefs();
  const t = MAREED_STR[lang as MareedLang];
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() =>
    // Randomised per visit — not persisted, not synced — so two people
    // who both skip picking an avatar don't silently end up identical.
    // A repeat is still fine if it happens by chance, just not guaranteed.
    MAREED_AVATARS[Math.floor(Math.random() * MAREED_AVATARS.length)]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  async function handleCreate() {
    unlockAudio(); // a real tap — carries the unlock through client-side nav into the session page
    setLoading(true);
    setError(null);
    try {
      const userId = await ensureUser(lang);

      let session: { id: string; code: string } | null = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 5 && !session; attempt++) {
        const code = generateRoomCode();
        const { data, error: sessErr } = await supabase
          .from("mareed_sessions")
          .insert({ code, host_user_id: userId, lang, status: "waiting" })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session code, try again.");

      const { error: playerErr } = await supabase.from("mareed_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || t.gameNameArabic,
        avatar_emoji: emoji,
      });
      if (playerErr) throw playerErr;

      router.push(`/mareed/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/mareed" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, marginTop: 40 }}>{t.createBtn}</h1>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="font-body" htmlFor="mareed-create-nickname" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.nickname}</label>
          <input
            id="mareed-create-nickname"
            value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 20))} placeholder={t.nicknamePh}
            maxLength={20}
            autoFocus
            enterKeyHint="go"
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleCreate(); }}
            style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
          />
        </div>

        <p className="font-body" style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>
          {lang === "ar" ? "اختر رمزك" : "Pick your avatar"}
        </p>
        <div role="radiogroup" aria-label={lang === "ar" ? "اختر رمزك" : "Pick your avatar"} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {MAREED_AVATARS.map((em) => (
            <button
              key={em} onClick={() => setEmoji(em)}
              role="radio"
              aria-checked={emoji === em}
              aria-label={em}
              className={`chip ${emoji === em ? "active" : ""}`} style={{ fontSize: 18, padding: "8px 12px" }}
            >
              {em}
            </button>
          ))}
        </div>

        {error && <p style={{ color: ROSE, fontWeight: 700, marginBottom: 12 }}>{error}</p>}

        <button
          onClick={handleCreate} disabled={loading}
          className="font-display"
          style={{
            padding: 18, fontSize: 17, width: "100%", borderRadius: 999, border: "none", color: "#fff",
            background: `linear-gradient(135deg, ${ROSE}, ${WINE})`, boxShadow: `0 10px 30px ${ROSE}55`,
          }}
        >
          {loading ? t.loading : t.createBtn}
        </button>

        <Link
          href="/mareed/solo"
          className="font-display"
          style={{
            display: "block", textAlign: "center", width: "100%", padding: 16, fontSize: 15, fontWeight: 800,
            borderRadius: 999, border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)",
            textDecoration: "none", marginTop: 14,
          }}
        >
          {lang === "ar" ? "🎲 العب لحالك" : "🎲 Play Solo"}
        </Link>
      </div>
    </div>
  );
}
