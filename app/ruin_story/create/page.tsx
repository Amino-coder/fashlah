"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { RUIN_STORY_STR, RUIN_STORY_AVATARS, RuinStoryLang } from "@/lib/ruin-story-i18n";
import { usePrefs } from "@/lib/usePrefs";

const CRIMSON = "#9B1C2E";

export default function RuinStoryCreatePage() {
  const { lang, dark, ready } = usePrefs();
  const t = RUIN_STORY_STR[lang as RuinStoryLang];
  const ar = lang === "ar";
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() => RUIN_STORY_AVATARS[Math.floor(Math.random() * RUIN_STORY_AVATARS.length)]);
  const [adultMode, setAdultMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  // No round-count picker, deliberately — the game is always exactly 6
  // rounds, per spec, with no configuration for it at all.
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
          .from("ruin_story_sessions")
          .insert({ code, host_user_id: userId, lang, status: "waiting", adult_mode: adultMode })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session code, try again.");

      const { error: playerErr } = await supabase.from("ruin_story_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || (ar ? "اللاعب 1" : "Player 1"),
        avatar_emoji: emoji,
      });
      if (playerErr) throw playerErr;

      router.push(`/ruin_story/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/ruin_story" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ marginTop: 50 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 24 }}>
            {t.createGame}
          </h1>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            {RUIN_STORY_AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setEmoji(a)}
                style={{
                  width: 48, height: 48, borderRadius: 999, fontSize: 22, border: emoji === a ? `3px solid ${CRIMSON}` : "2px solid var(--ring)",
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
              background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, textAlign: "center", outline: "none", marginBottom: 18,
            }}
          />

          <button
            onClick={() => setAdultMode((v) => !v)}
            className="font-body"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 18px",
              borderRadius: 16, border: `2px solid ${adultMode ? CRIMSON : "var(--ring)"}`,
              background: adultMode ? `${CRIMSON}18` : "var(--card)", marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: adultMode ? CRIMSON : "var(--ink)" }}>{t.adultMode}</span>
            <span
              style={{
                width: 40, height: 24, borderRadius: 999, background: adultMode ? CRIMSON : "var(--ring)",
                position: "relative", transition: "background .15s",
              }}
            >
              <span
                style={{
                  position: "absolute", top: 3, insetInlineStart: adultMode ? 19 : 3, width: 18, height: 18, borderRadius: 999,
                  background: "#fff", transition: "inset-inline-start .15s",
                }}
              />
            </span>
          </button>

          {error && <p className="font-body" style={{ color: "#E63946", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="font-display"
            style={{
              display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)`, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? t.loading : t.startGame}
          </button>

          <Link
            href="/bidal"
            className="font-body"
            style={{ display: "block", textAlign: "center", marginTop: 16, padding: 10, fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "underline" }}
          >
            {"\u{1F3B2}"} لحالك؟ العب بدل الكلمة
          </Link>
        </div>
      </div>
    </div>
  );
}
