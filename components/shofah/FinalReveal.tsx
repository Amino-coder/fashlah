"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SHOFAH_STR, ShofahLang } from "@/lib/shofah-i18n";
import NiqabGirl from "./NiqabGirl";
import ShemaghGuy from "./ShemaghGuy";
import type { ShofahSessionRow, ShofahPlayerRow } from "@/lib/shofah-types";
import EndGameShare from "@/components/EndGameShare";

const ROSE = "#E63946";
const WINE = "#C2185B";
const GOLD = "#FFD400";

export default function FinalReveal({
  session, players, isHost, lang,
}: {
  session: ShofahSessionRow;
  players: ShofahPlayerRow[];
  isHost: boolean;
  lang: ShofahLang;
}) {
  const t = SHOFAH_STR[lang];
  const [stage, setStage] = useState(0);
  const [winner, setWinner] = useState<ShofahPlayerRow | null>(null);
  const completedRef = useRef(false);
  const winnerComputedRef = useRef(false);

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
        .from("shofah_round_results")
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

  // Host-only: mark the session as completed once the reveal is showing.
  useEffect(() => {
    if (!isHost || stage < 3 || completedRef.current) return;
    completedRef.current = true;
    supabase.from("shofah_sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", session.id);
  }, [isHost, stage, session.id]);

  const Character = session.character === "girl" ? NiqabGirl : ShemaghGuy;
  const others = players.filter((p) => p.id !== winner?.id);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      marginTop: 30, textAlign: "center", minHeight: 400,
    }}>
      {stage < 3 && (
        <>
          <div className="pop" style={{ fontSize: 70 }}>💖</div>
          {stage >= 1 && (
            <p className="font-display pop" style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-soft)" }}>
              {lang === "ar" ? "بعد التفكير..." : "After much thought..."}
            </p>
          )}
          {stage >= 2 && (
            <p className="font-display pop" style={{ fontSize: 20, fontWeight: 800, color: ROSE }}>
              {lang === "ar" ? "الشخص اللي بيتزوج هو..." : "The one getting married is..."}
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
          <div className="pop" style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
            <Character size={90} />
            <span style={{ fontSize: 32 }}>❤️</span>
            <div style={{ fontSize: 60 }}>{winner.avatar_emoji}</div>
          </div>
          <p className="font-display pop" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{winner.nickname}</p>
          <p className="font-display pop" style={{ fontSize: 34, fontWeight: 800, color: GOLD, margin: 0, textShadow: `0 2px 12px ${ROSE}44` }}>
            💍 {lang === "ar" ? "مبروك!" : "Congratulations!"}
          </p>
        </>
      )}

      {stage >= 4 && (
        <div className="screen-enter" style={{ marginTop: 12 }}>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>
            {lang === "ar" ? "أما الباقين... لسه سنقل 😂" : "As for the rest... still single 😂"}
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

          <Link
            href="/shofah"
            className="font-display"
            style={{
              display: "inline-block", marginTop: 24, padding: "12px 28px", fontSize: 14, borderRadius: 999,
              color: "#fff", textDecoration: "none", background: `linear-gradient(135deg, ${ROSE}, ${WINE})`,
            }}
          >
            {t.backHome}
          </Link>

          <div style={{ marginTop: 20 }}>
            <EndGameShare game="shofah" lang={lang} accent={`linear-gradient(135deg, ${ROSE}, ${WINE})`} />
          </div>
        </div>
      )}
    </div>
  );
}
