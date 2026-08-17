"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MareedLang } from "@/lib/mareed-i18n";
import { playCelebration } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import HomeButton from "@/components/HomeButton";
import Character from "./PatientMascot";
import type { MareedSessionRow, MareedPlayerRow } from "@/lib/mareed-types";
import EndGameShare from "@/components/EndGameShare";

const ROSE = "#E63946";
const WINE = "#C2185B";
const GOLD = "#FFD400";

export default function FinalReveal({
  session, players, myPlayerId, isHost, lang,
}: {
  session: MareedSessionRow;
  players: MareedPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: MareedLang;
}) {
  const [stage, setStage] = useState(0);
  const [winner, setWinner] = useState<MareedPlayerRow | null>(null);
  const completedRef = useRef(false);
  const winnerComputedRef = useRef(false);
  const { enabled: soundOn } = useSoundPref();
  const celebrationPlayedRef = useRef(false);

  // Determine the overall winner: highest total_score, tie broken by most
  // first-place round finishes. Computed exactly once — `players` is a prop
  // that the parent refreshes every ~2.5s via polling, which would otherwise
  // recreate this object on every poll and keep restarting the stage
  // animation below before it ever finished (each restart only got as far
  // as stage 1, since stage 2 needs 3s — longer than the poll interval).
  useEffect(() => {
    if (players.length === 0 || winnerComputedRef.current) return;
    winnerComputedRef.current = true;
    (async () => {
      const { data: results } = await supabase
        .from("mareed_round_results")
        .select("winner_player_id")
        .eq("session_id", session.id);

      const firstPlaceCounts = new Map<string, number>();
      for (const r of results || []) {
        firstPlaceCounts.set(r.winner_player_id, (firstPlaceCounts.get(r.winner_player_id) || 0) + 1);
      }

      const sorted = [...players].sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        const aFirsts = firstPlaceCounts.get(a.id) || 0;
        const bFirsts = firstPlaceCounts.get(b.id) || 0;
        return bFirsts - aFirsts;
      });
      setWinner(sorted[0] ?? null);
    })();
  }, [players, session.id]);

  // Staged drumroll: heart -> "thinking..." -> "the winner is..." -> reveal.
  // Keyed off winner?.id (a stable string), not the winner object itself —
  // belt and suspenders on top of the fetch-once guard above, in case
  // `winner` ever legitimately gets recomputed for the same person.
  useEffect(() => {
    if (!winner) return;
    const timers = [
      setTimeout(() => setStage(1), 1400),
      setTimeout(() => setStage(2), 3000),
      setTimeout(() => setStage(3), 4600),
      setTimeout(() => setStage(4), 6600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [winner?.id]);

  // Fires exactly once, the moment the winner card actually appears (stage
  // 3) — not on every re-render at stage>=3, which polling props would
  // otherwise cause.
  useEffect(() => {
    if (stage < 3 || celebrationPlayedRef.current || !soundOn) return;
    celebrationPlayedRef.current = true;
    playCelebration();
  }, [stage, soundOn]);

  // Any client reaching this point marks the session completed — not
  // host-only, for the reason explained below. Fires the moment `winner`
  // is computed, NOT gated on the visual drumroll stage anymore — it
  // used to wait for stage>=3 (the "winner card appears" beat, ~4.6
  // seconds after winner is known), which meant anyone closing the tab
  // during that animation had genuinely finished the game but never
  // triggered this write. Confirmed as a real gap, not just a theory: 20
  // شوفة sessions had a full 5/5 round_results (unambiguous proof of a
  // completed game) but sat at a non-'completed' status. Keying this off
  // `winner?.id` instead removes that multi-second window entirely —
  // the completion write no longer has any dependency on someone's tab
  // staying open through an animation that has nothing to do with
  // whether the game itself is actually over.
  //
  // Not host-only: this used to be `!isHost || stage < 3`, but that meant
  // a genuinely finished game could sit at status='in_progress' forever
  // if the host's specific browser closed, refreshed, or wasn't the
  // active tab by the time the reveal wrapped up — nobody else even
  // attempted the write, since every other client was excluded by that
  // check. Eventually the stale-session cleanup job would sweep it up as
  // 'cancelled' — a genuinely completed game misreported as abandoned.
  // The update itself is a simple idempotent write by session id, so
  // multiple clients racing to set the same values is harmless; worst
  // case is a couple of redundant writes, not a correctness issue.
  useEffect(() => {
    if (!winner || completedRef.current) return;
    completedRef.current = true;
    fetch("/api/mark-session-completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "mareed_sessions", sessionId: session.id }),
    }).catch(() => {
      // Non-critical — worst case the cleanup job's own (much later,
      // much more conservative) sweep eventually reconciles this.
    });
  }, [winner?.id, session.id]);


  const others = players.filter((p) => p.id !== winner?.id);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      marginTop: 30, textAlign: "center", minHeight: 400,
    }}>
      <HomeButton label={lang === "ar" ? "الصفحة الرئيسية" : "Home"} />
      {stage < 3 && (
        <>
          <div className="pop" style={{ fontSize: 70 }}>🧠</div>
          {stage >= 1 && (
            <p className="font-display pop" style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-soft)" }}>
              {lang === "ar" ? "بعد التفكير..." : "After much thought..."}
            </p>
          )}
          {stage >= 2 && (
            <p className="font-display pop" style={{ fontSize: 20, fontWeight: 800, color: ROSE }}>
              {lang === "ar" ? "الشخص اللي عنده مرض نفسي هو..." : "The one getting diagnosed is..."}
            </p>
          )}
          {stage < 2 && (
            <div style={{ color: "var(--ink-soft)" }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
        </>
      )}

      {stage >= 3 && winner && (
        <>
          <div className="pop" style={{ fontSize: 50 }}>🎆</div>
          <p className="font-display pop" style={{ fontSize: 30, fontWeight: 800, color: GOLD, margin: 0, textShadow: `0 2px 12px ${ROSE}44` }}>
            🧠 {lang === "ar" ? "المريض النفسي" : "The Psych Patient"}
          </p>
          <div className="pop" style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
            <Character size={90} />
            <div style={{ fontSize: 60 }}>{winner.avatar_emoji}</div>
          </div>
          <p className="font-display pop" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{winner.nickname}</p>
        </>
      )}

      {stage >= 4 && (
        <div className="screen-enter" style={{ marginTop: 12 }}>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>
            {lang === "ar" ? "أما الباقين... لسه بخير 😂" : "As for the rest... still sane 😂"}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {others.map((p) => (
              <div key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--ring)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, opacity: 0.7 }}>
                  {p.avatar_emoji}
                </div>
                <span className="font-body" style={{ fontSize: 11, opacity: 0.7 }}>{p.nickname}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <EndGameShare
              game="mareed"
              lang={lang}
              nextGame="bidal"
              playAgainHref="/mareed/create"
              sessionCode={session.code}
              resultLine={
                myPlayerId && winner?.id === myPlayerId
                  ? (lang === "ar" ? "\u{1F9E0} أنا المريض النفسي رسمياً!" : "\u{1F9E0} I'm officially the psych patient!")
                  : (lang === "ar" ? "\u{1F602} لسه ما شخصوني... بس قريب!" : "\u{1F602} Not diagnosed yet... but soon!")
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
