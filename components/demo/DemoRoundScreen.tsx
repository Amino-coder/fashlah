"use client";

import { useEffect, useState } from "react";
import type { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";

type Engine = ReturnType<typeof useDemoRoundGame<string>>;

/**
 * Visually mirrors the real games' round screens (same card/pop/pulse-dot
 * classes, same countdown-big-number treatment, same vote-card layout) so
 * it feels native, but is driven entirely by the local demo engine — no
 * Supabase import anywhere in this file.
 */
export default function DemoRoundScreen({
  engine, prompt, accentFrom, accentTo, icon,
}: {
  engine: Engine;
  prompt: string;
  accentFrom: string;
  accentTo: string;
  icon: React.ReactNode;
}) {
  const { players, round, totalRounds, phase, remaining, shuffledAnswers, myAnswer, myVote, submitHumanAnswer, submitHumanVote } = engine;
  const [draft, setDraft] = useState("");
  useEffect(() => { setDraft(""); }, [round]);
  const answeredCount = engine.answers.length;
  const votedCount = engine.votes.length;

  if (phase === "countdown") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 60 }}>
        <div
          aria-hidden="true"
          style={{
            width: 90, height: 90, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, boxShadow: `0 10px 26px ${accentTo}55`,
          }}
        >
          {icon}
        </div>
        <div key={remaining} className="font-display pop" style={{ fontSize: 70, fontWeight: 800, color: accentFrom, lineHeight: 1 }}>
          {remaining > 0 ? remaining : "يلا!"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {round} / {totalRounds}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="font-display"
          style={{
            width: 48, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#fff",
            background: remaining <= 5 ? "#E63946" : `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          }}
        >
          {remaining}
        </div>
      </div>

      <div className="card pop" dir="rtl" style={{ padding: "18px 20px", textAlign: "center" }}>
        <p className="font-quote" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.75, margin: 0, color: "var(--ink)" }}>
          {prompt}
        </p>
      </div>

      {phase === "writing" && (
        <>
          {!myAnswer ? (
            <div className="card" style={{ padding: 16 }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 120))}
                rows={3}
                dir="rtl"
                placeholder="اكتب جوابك..."
                autoFocus
                className="font-quote"
                style={{
                  width: "100%", padding: 12, borderRadius: 14, border: "2px solid var(--ring)",
                  background: "transparent", color: "var(--ink)", fontSize: 17, outline: "none", resize: "none",
                  fontFamily: "inherit", textAlign: "center",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={() => draft.trim() && submitHumanAnswer(draft.trim())}
                  disabled={!draft.trim()}
                  className="font-display"
                  style={{
                    padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff",
                    background: draft.trim() ? `linear-gradient(135deg, ${accentFrom}, ${accentTo})` : "var(--ring)",
                    opacity: draft.trim() ? 1 : 0.6,
                  }}
                >
                  إرسال
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>تم الإرسال! بانتظار الباقين...</p>
            </div>
          )}
          <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
            {answeredCount}/{players.length} كتبوا
          </p>
        </>
      )}

      {(phase === "voting" || phase === "reveal") && (
        <>
          <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: accentFrom, margin: 0 }}>
            {phase === "reveal" ? "🔒 قفلنا التصويت!" : "صوّت لأحلى جواب! 🗳️"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shuffledAnswers.map((a) => {
              const isMine = a.playerId === "human";
              const isCommitted = myVote?.answerPlayerId === a.playerId;
              const revealed = phase === "reveal";
              const author = revealed ? players.find((p) => p.id === a.playerId) : undefined;
              const disabled = !!myVote || revealed || isMine;
              return (
                <button
                  key={a.playerId}
                  onClick={() => !disabled && submitHumanVote(a.playerId)}
                  disabled={disabled}
                  className="card"
                  dir="rtl"
                  style={{
                    padding: 16, textAlign: "center", fontSize: 16,
                    border: isCommitted ? `3px solid ${accentFrom}` : "3px solid transparent",
                    opacity: isMine && !revealed ? 0.75 : 1,
                    cursor: !disabled ? "pointer" : "default",
                  }}
                >
                  <span className="font-quote" style={{ lineHeight: 1.7 }}>{a.value}</span>
                  {revealed && author && (
                    <span className="font-body pop" style={{ fontSize: 11, fontWeight: 700, color: accentFrom, display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "center" }}>
                      {author.avatar_emoji} {author.nickname}
                    </span>
                  )}
                  {isMine && !revealed && (
                    <span className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", display: "block", marginTop: 6 }}>✍️ جوابك</span>
                  )}
                </button>
              );
            })}
          </div>
          {phase === "voting" && (
            <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
              {votedCount}/{players.length} صوّتوا
            </p>
          )}
        </>
      )}
    </div>
  );
}
