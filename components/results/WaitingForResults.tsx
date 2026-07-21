"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/i18n";
import Mascot from "@/components/Mascot";
import Results from "@/components/results/Results";
import type { PlayerRow, SessionRow } from "@/lib/types";

export default function WaitingForResults({
  session,
  player,
  players,
  lang,
}: {
  session: SessionRow;
  player: PlayerRow;
  players: PlayerRow[];
  lang: Lang;
}) {
  const [summary, setSummary] = useState<any | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const everyoneDone = players.length > 0 && players.every((p) => p.current_round >= 4);

  useEffect(() => {
    if (!everyoneDone || summary || triggering) return;

    let cancelled = false;
    setTriggering(true);

    (async () => {
      try {
        // Cheap check first: results may already be computed (e.g. this
        // player reloaded after another player's client triggered it).
        const { data: existing } = await supabase
          .from("game_history")
          .select("summary")
          .eq("session_id", session.id)
          .order("played_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.summary) {
          if (!cancelled) setSummary(existing.summary);
          return;
        }

        await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: session.id }),
        });

        // The scoring API is idempotent (guarded by sessions.status), so it's
        // safe for every player's client to call it — only the first actually
        // computes. Poll briefly for the game_history row to land.
        for (let attempt = 0; attempt < 10; attempt++) {
          const { data } = await supabase
            .from("game_history")
            .select("summary")
            .eq("session_id", session.id)
            .order("played_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data?.summary) {
            if (!cancelled) setSummary(data.summary);
            return;
          }
          await new Promise((r) => setTimeout(r, 600));
        }
        if (!cancelled) setError(lang === "ar" ? "تأخرت النتائج، حاول تحدث الصفحة" : "Results are taking a while — try refreshing");
      } catch {
        if (!cancelled) setError(lang === "ar" ? "صار خطأ، حاول تحدث الصفحة" : "Something went wrong — try refreshing");
      } finally {
        if (!cancelled) setTriggering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [everyoneDone, summary, triggering, session.id, lang]);

  if (summary) {
    return <Results summary={summary} session={session} player={player} lang={lang} />;
  }

  const doneCount = players.filter((p) => p.current_round >= 4).length;

  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <Mascot mood="wink" size={70} className="bounce" />
      <p className="font-body" style={{ marginTop: 14, fontWeight: 700, color: "var(--ink-soft)" }}>
        {lang === "ar" ? "بانتظار البقية يخلصون... 🌿" : "Waiting for the rest of the group... 🌿"}
      </p>
      <p className="font-body" style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>
        {doneCount} / {players.length} {lang === "ar" ? "خلصوا" : "finished"}
      </p>
      {error && <p style={{ color: "#FF2E93", fontWeight: 700, marginTop: 16 }}>{error}</p>}
    </div>
  );
}
