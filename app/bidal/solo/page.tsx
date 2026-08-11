"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import { usePrefs } from "@/lib/usePrefs";
import { drawLetters, pickStartingWord, SOLO_TIME_LIMIT_SECONDS } from "@/lib/bidal-letters";
import { BIDAL_AVATARS } from "@/lib/bidal-i18n";

// Solo has no lobby to wait in — create the session, deal letters, and go
// straight to the game. Started here (not via /api/bidal-start) since
// there's only ever the one player's own row to write, which RLS already
// permits for that player directly — no service-role needed for solo.
export default function BidalSoloPage() {
  const { lang } = usePrefs();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
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
              current_word: startingWord, started_at: new Date().toISOString(),
              time_limit_seconds: SOLO_TIME_LIMIT_SECONDS,
            })
            .select()
            .single();
          if (error) { lastErr = error; continue; }
          session = data;
        }
        if (!session) throw lastErr || new Error("Could not start solo game.");

        const { error: playerErr } = await supabase.from("bidal_players").insert({
          session_id: session.id,
          user_id: userId,
          nickname: "أنت",
          avatar_emoji: BIDAL_AVATARS[Math.floor(Math.random() * BIDAL_AVATARS.length)],
          letters: drawLetters(15),
        });
        if (playerErr) throw playerErr;

        router.replace(`/bidal/session/${session.code}`);
      } catch {
        router.replace("/bidal");
      }
    })();
  }, [lang, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ color: "#14B8A6" }}>
        <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
      </div>
    </div>
  );
}
