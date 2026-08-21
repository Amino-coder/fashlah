"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { IMPOSTER_STR, IMPOSTER_AVATARS, ImposterLang } from "@/lib/imposter-i18n";
import { usePrefs } from "@/lib/usePrefs";

const MAGENTA = "#D6006E";
const PINK = "#FF2E93";

export default function ImposterCreatePage() {
  const { lang, dark, ready } = usePrefs();
  const t = IMPOSTER_STR[lang as ImposterLang];
  const ar = lang === "ar";
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() => IMPOSTER_AVATARS[Math.floor(Math.random() * IMPOSTER_AVATARS.length)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  // No round-count picker here, deliberately — unlike ihj/qaseeda/etc.,
  // Imposter has no "how many rounds" concept at all. One round is one
  // word+imposter assignment; "play again" (inside the session page)
  // starts a fresh one in the same room, any number of times.
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
          .from("imposter_sessions")
          .insert({ code, host_user_id: userId, lang, status: "waiting" })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session code, try again.");

      const { error: playerErr } = await supabase.from("imposter_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || (ar ? "اللاعب 1" : "Player 1"),
        avatar_emoji: emoji,
        turn_order: 0,
      });
      if (playerErr) throw playerErr;

      router.push(`/imposter/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/imposter" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ marginTop: 50 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 24 }}>
            {t.createGame}
          </h1>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            {IMPOSTER_AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setEmoji(a)}
                style={{
                  width: 48, height: 48, borderRadius: 999, fontSize: 22, border: emoji === a ? `3px solid ${MAGENTA}` : "2px solid var(--ring)",
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
              background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, textAlign: "center", outline: "none", marginBottom: 28,
            }}
          />

          {error && <p className="font-body" style={{ color: "#E63946", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="font-display"
            style={{
              display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${MAGENTA}, ${PINK})`, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? t.loading : t.startGame}
          </button>
        </div>
      </div>
    </div>
  );
}
