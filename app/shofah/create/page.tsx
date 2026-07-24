"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { SHOFAH_STR, SHOFAH_AVATARS, ShofahLang } from "@/lib/shofah-i18n";
import { usePrefs } from "@/lib/usePrefs";
import type { ShofahCharacter } from "@/lib/shofah-types";

const ROSE = "#E63946";
const WINE = "#C2185B";

export default function ShofahCreatePage() {
  return (
    <Suspense fallback={null}>
      <ShofahCreate />
    </Suspense>
  );
}

function ShofahCreate() {
  const { lang, dark, ready } = usePrefs();
  const t = SHOFAH_STR[lang as ShofahLang];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [character, setCharacter] = useState<ShofahCharacter | null>(null);
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(SHOFAH_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = searchParams.get("character");
    if (c === "girl" || c === "guy") {
      setCharacter(c);
    } else {
      // No character chosen — send them back to pick one rather than
      // creating a session with an undefined character.
      router.replace("/shofah/select");
    }
  }, [searchParams, router]);

  if (!ready || !character) return null;

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
          .from("shofah_sessions")
          .insert({ code, host_user_id: userId, character, lang, status: "waiting" })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session code, try again.");

      const { error: playerErr } = await supabase.from("shofah_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || t.gameNameArabic,
        avatar_emoji: emoji,
      });
      if (playerErr) throw playerErr;

      router.push(`/shofah/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/shofah" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, marginTop: 40 }}>{t.createBtn}</h1>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="font-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.nickname}</label>
          <input
            value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t.nicknamePh}
            style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {SHOFAH_AVATARS.map((em) => (
            <button
              key={em} onClick={() => setEmoji(em)}
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
      </div>
    </div>
  );
}
