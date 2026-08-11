"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import { usePrefs } from "@/lib/usePrefs";
import { drawLetters, pickStartingWord, SOLO_TIME_LIMIT_SECONDS } from "@/lib/bidal-letters";
import { BIDAL_AVATARS } from "@/lib/bidal-i18n";
import HomeButton from "@/components/HomeButton";

// Solo has no lobby to wait in — create the session, deal letters, and go
// straight to the game. Started here (not via /api/bidal-start) since
// there's only ever the one player's own row to write, which RLS already
// permits for that player directly — no service-role needed for solo.
export default function BidalSoloPage() {
  const { lang } = usePrefs();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [lang, router]);

  async function run() {
    setError(null);
    try {
      const userId = await ensureUser(lang);
      const startingWord = pickStartingWord();

      let session: { id: string; code: string } | null = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 5 && !session; attempt++) {
        const code = generateRoomCode();
        const { data, error } = await supabase
          .from("bidal_sessions")
          .insert({
            code, host_user_id: userId, mode: "solo", lang, status: "in_progress",
            current_word: startingWord, starting_word: startingWord, started_at: new Date().toISOString(),
            time_limit_seconds: SOLO_TIME_LIMIT_SECONDS,
          })
          .select()
          .single();
        if (error) { lastErr = error; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session.");

      const { error: playerErr } = await supabase.from("bidal_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: "أنت",
        avatar_emoji: BIDAL_AVATARS[Math.floor(Math.random() * BIDAL_AVATARS.length)],
        letters: drawLetters(15),
      });
      if (playerErr) throw playerErr;

      router.replace(`/bidal/session/${session.code}`);
    } catch (e: any) {
      // Surfaced instead of silently bouncing back to the landing page —
      // a silent redirect on failure looks identical to "the button does
      // nothing," which is exactly what made the previous version of this
      // impossible to diagnose from the outside.
      setError(e?.message || "صار خطأ غير متوقع");
    }
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--ink)", padding: 24, textAlign: "center" }}>
        <HomeButton label="الصفحة الرئيسية" href="/bidal" />
        <p className="font-display" style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>ما قدرنا نبدأ اللعبة</p>
        <p className="font-body" style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 22, maxWidth: 340, direction: "ltr" }}>{error}</p>
        <button
          onClick={() => { started.current = false; run(); }}
          className="font-display"
          style={{ padding: "14px 32px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff", background: "linear-gradient(135deg, #14B8A6, #FF5A5F)" }}
        >
          حاول مرة ثانية
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ color: "#14B8A6" }}>
        <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
      </div>
    </div>
  );
}
