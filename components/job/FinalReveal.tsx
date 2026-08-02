"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { JobLang } from "@/lib/job-i18n";
import HomeButton from "@/components/HomeButton";
import SuitGuy from "./SuitGuy";
import type { JobSessionRow, JobPlayerRow } from "@/lib/job-types";
import EndGameShare from "@/components/EndGameShare";

const BLUE = "#3B82F6";
const NAVY = "#1E40AF";
const GOLD = "#FFD400";

export default function FinalReveal({
  session, players, myPlayerId, isHost, lang,
}: {
  session: JobSessionRow;
  players: JobPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: JobLang;
}) {
  const [stage, setStage] = useState(0);
  const [winner, setWinner] = useState<JobPlayerRow | null>(null);
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
        .from("job_round_results")
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
    supabase.from("job_sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", session.id);
  }, [isHost, stage, session.id]);

  const others = players.filter((p) => p.id !== winner?.id);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      marginTop: 30, textAlign: "center", minHeight: 400,
    }}>
      <HomeButton label={lang === "ar" ? "الصفحة الرئيسية" : "Home"} />
      {stage < 3 && (
        <>
          <div className="pop" style={{ fontSize: 70 }}>📄</div>
          {stage >= 1 && (
            <p className="font-display pop" style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-soft)" }}>
              {lang === "ar" ? "بعد مراجعة السير الذاتية..." : "After reviewing all the CVs..."}
            </p>
          )}
          {stage >= 2 && (
            <p className="font-display pop" style={{ fontSize: 20, fontWeight: 800, color: BLUE }}>
              {lang === "ar" ? "الشخص اللي بيتوظف هو..." : "The one getting the job is..."}
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
            <SuitGuy size={90} />
            <span style={{ fontSize: 32 }}>🤝</span>
            <div style={{ fontSize: 60 }}>{winner.avatar_emoji}</div>
          </div>
          <p className="font-display pop" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{winner.nickname}</p>
          <p className="font-display pop" style={{ fontSize: 34, fontWeight: 800, color: GOLD, margin: 0, textShadow: `0 2px 12px ${BLUE}44` }}>
            🎉 {lang === "ar" ? "مبروك، توظفت!" : "You're hired!"}
          </p>
        </>
      )}

      {stage >= 4 && (
        <div className="screen-enter" style={{ marginTop: 12 }}>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>
            {lang === "ar" ? "أما الباقين... لسه عاطلين 😂" : "As for the rest... still unemployed 😂"}
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
              game="job"
              lang={lang}
              nextGame="shofah"
              resultLine={
                myPlayerId && winner?.id === myPlayerId
                  ? (lang === "ar" ? "\u{1F389} توظفت أنا!" : "\u{1F389} I got hired!")
                  : (lang === "ar" ? "\u{1F605} لسه عاطل... بس قريب!" : "\u{1F605} Still unemployed... for now!")
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
