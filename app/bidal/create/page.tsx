"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { BIDAL_STR, BIDAL_AVATARS, BidalLang } from "@/lib/bidal-i18n";
import { usePrefs } from "@/lib/usePrefs";

const TEAL = "#14B8A6";
const CORAL = "#FF5A5F";

export default function BidalCreatePage() {
  const { lang, dark, ready } = usePrefs();
  const t = BIDAL_STR[lang as BidalLang];
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() => BIDAL_AVATARS[Math.floor(Math.random() * BIDAL_AVATARS.length)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const userId = await ensureUser(lang);

      let session: { id: string; code: string } | null = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 5 && !session; attempt++) {
        const code = generateRoomCode();
        const { data, error: sessErr } = await supabase
          .from("bidal_sessions")
          .insert({ code, host_user_id: userId, mode: "multiplayer", lang, status: "waiting" })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session code, try again.");

      const { error: playerErr } = await supabase.from("bidal_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || t.gameNameArabic,
        avatar_emoji: emoji,
      });
      if (playerErr) throw playerErr;

      router.push(`/bidal/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/bidal" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ marginTop: 60 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 28 }}>
            {t.createGame}
          </h1>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
              {BIDAL_AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setEmoji(a)}
                  style={{
                    width: 48, height: 48, borderRadius: 999, fontSize: 22, border: emoji === a ? `3px solid ${TEAL}` : "2px solid var(--ring)",
                    background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder={t.namePh}
              dir="rtl"
              className="font-body"
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 999, border: "2px solid var(--ring)",
                background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, textAlign: "center", outline: "none",
              }}
            />
          </div>

          {error && <p className="font-body" style={{ color: "#E63946", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="font-display"
            style={{
              display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? t.loading : t.startGame}
          </button>
        </div>
      </div>
    </div>
  );
}
