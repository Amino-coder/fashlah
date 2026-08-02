"use client";

import { useEffect, useRef, useState } from "react";
import DemoEndScreen from "./DemoEndScreen";

type Player = { id: string; nickname: string; avatar_emoji: string };

/**
 * Mirrors شوفة/مين بيتوظف's real FinalReveal.tsx stage-for-stage: same
 * four timer marks (1400/3000/4600/6600ms), same emoji-then-text-then-
 * text-then-reveal beats, same "others" grid treatment. The one
 * deliberate difference is the real game's character mascot (NiqabGirl /
 * ShemaghGuy / SuitGuy) — demo mode has no character-selection step to
 * base that on, so the winner's own avatar_emoji stands in, enlarged,
 * paired with the same connecting emoji (❤️ / 🤝) the real reveal uses.
 */
export default function DemoDrumrollResults({
  players, scores, accentFrom, accentTo, gold,
  stage0Emoji, thinkingText, winnerIsText, connectorEmoji, congratsText,
  othersText, createHref,
}: {
  players: Player[];
  scores: Record<string, number>;
  accentFrom: string;
  accentTo: string;
  gold: string;
  stage0Emoji: string;
  thinkingText: string;
  winnerIsText: string;
  connectorEmoji: string;
  congratsText: string;
  othersText: string;
  createHref: string;
}) {
  const [stage, setStage] = useState(0);
  const winnerComputedRef = useRef(false);
  const [winner, setWinner] = useState<Player | null>(null);

  useEffect(() => {
    if (winnerComputedRef.current || players.length === 0) return;
    winnerComputedRef.current = true;
    const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
    setWinner(ranked[0]);
  }, [players, scores]);

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

  const others = players.filter((p) => p.id !== winner?.id);

  if (stage >= 4) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 30, textAlign: "center" }}>
        <div className="pop" style={{ fontSize: 50 }}>🎆</div>
        <div className="pop" style={{ fontSize: 70 }}>{winner?.avatar_emoji}</div>
        <p className="font-display pop" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{winner?.nickname}</p>
        <p className="font-display pop" style={{ fontSize: 34, fontWeight: 800, color: gold, margin: 0, textShadow: `0 2px 12px ${accentFrom}44` }}>
          {congratsText}
        </p>

        <div className="screen-enter" style={{ marginTop: 12, width: "100%" }}>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>
            {othersText}
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

          <div style={{ marginTop: 28 }}>
            <DemoEndScreen createHref={createHref} accentFrom={accentFrom} accentTo={accentTo} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 30, textAlign: "center", minHeight: 400 }}>
      <div className="pop" style={{ fontSize: 70 }}>{stage0Emoji}</div>
      {stage >= 1 && (
        <p className="font-display pop" style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-soft)" }}>
          {thinkingText}
        </p>
      )}
      {stage >= 2 && (
        <p className="font-display pop" style={{ fontSize: 20, fontWeight: 800, color: accentFrom }}>
          {winnerIsText}
        </p>
      )}
      {stage >= 3 && winner && (
        <>
          <div className="pop" style={{ fontSize: 50 }}>🎆</div>
          <div className="pop" style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
            <div style={{ fontSize: 60 }}>{winner.avatar_emoji}</div>
            <span style={{ fontSize: 32 }}>{connectorEmoji}</span>
          </div>
          <p className="font-display pop" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{winner.nickname}</p>
          <p className="font-display pop" style={{ fontSize: 34, fontWeight: 800, color: gold, margin: 0, textShadow: `0 2px 12px ${accentFrom}44` }}>
            {congratsText}
          </p>
        </>
      )}
      {stage < 2 && (
        <div style={{ color: "var(--ink-soft)" }}>
          <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
        </div>
      )}
    </div>
  );
}
