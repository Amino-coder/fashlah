"use client";

import { useState } from "react";
import ShatrLine from "@/components/qaseeda/ShatrLine";
import type { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";

type Verse = { line1: string; line2: string };
type Engine = ReturnType<typeof useDemoRoundGame<Verse>>;
type PoemLine = Verse & { author: string | null };

const GOLD = "#D9A441";
const NAVY = "#1B3A55";

export default function DemoQaseedaRoundScreen({ engine, poemLines }: { engine: Engine; poemLines: PoemLine[] }) {
  const { players, round, totalRounds, phase, remaining, shuffledAnswers, myAnswer, myVote, submitHumanAnswer, submitHumanVote } = engine;
  const [draft1, setDraft1] = useState("");
  const [draft2, setDraft2] = useState("");
  const answeredCount = engine.answers.length;
  const votedCount = engine.votes.length;

  const PoemSoFarCard = poemLines.length > 0 && (
    <div className="card" style={{ padding: "18px 20px", maxHeight: 240, overflowY: "auto", border: `1px solid ${GOLD}44` }}>
      <p className="font-body" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: GOLD, margin: "0 0 10px", textAlign: "center" }}>
        القصيدة إلى الآن
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {poemLines.map((line, i) => (
          <div key={i} className="pop" style={{ textAlign: "center" }}>
            <ShatrLine line1={line.line1} line2={line.line2} fontSize={i === 0 ? 16 : 15} />
            {line.author && (
              <p className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", margin: "4px 0 0", fontWeight: 700 }}>
                {i === 0 ? `الشاعر: ${line.author}` : `✍️ ${line.author}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (phase === "countdown") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 40 }}>
        {PoemSoFarCard}
        <div
          aria-hidden="true"
          style={{ width: 90, height: 90, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${GOLD}, ${NAVY})`, boxShadow: `0 10px 26px ${NAVY}55` }}
        >
          🖋️
        </div>
        <div key={remaining} className="font-display pop" style={{ fontSize: 70, fontWeight: 800, color: GOLD, lineHeight: 1 }}>
          {remaining > 0 ? remaining : "يلا!"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{round} / {totalRounds}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="font-display" style={{ width: 48, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", background: remaining <= 5 ? "#E63946" : `linear-gradient(135deg, ${GOLD}, ${NAVY})` }}>
          {remaining}
        </div>
      </div>

      {PoemSoFarCard}

      {phase === "writing" && (
        <>
          <p className="font-display" style={{ textAlign: "center", fontSize: 16, fontWeight: 800, margin: 0 }}>كمّل القصيدة ببيت وحد</p>
          {!myAnswer ? (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="font-body" style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>الشطر الأول</label>
                  <textarea value={draft1} onChange={(e) => setDraft1(e.target.value.slice(0, 90))} rows={3} dir="rtl" className="font-quote"
                    style={{ width: "100%", padding: 10, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none", resize: "none", textAlign: "center", fontFamily: "inherit" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="font-body" style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>الشطر الثاني</label>
                  <textarea value={draft2} onChange={(e) => setDraft2(e.target.value.slice(0, 90))} rows={3} dir="rtl" className="font-quote"
                    style={{ width: "100%", padding: 10, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none", resize: "none", textAlign: "center", fontFamily: "inherit" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={() => draft1.trim() && draft2.trim() && submitHumanAnswer({ line1: draft1.trim(), line2: draft2.trim() })}
                  disabled={!draft1.trim() || !draft2.trim()}
                  className="font-display"
                  style={{ padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff", background: (draft1.trim() && draft2.trim()) ? `linear-gradient(135deg, ${GOLD}, ${NAVY})` : "var(--ring)", opacity: (draft1.trim() && draft2.trim()) ? 1 : 0.6 }}
                >
                  إرسال
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 16, textAlign: "center" }}>
              <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>تم الإرسال! بانتظار الباقين...</p>
            </div>
          )}
          <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>{answeredCount}/{players.length} كتبوا</p>
        </>
      )}

      {(phase === "voting" || phase === "reveal") && (
        <>
          <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: GOLD, margin: 0 }}>
            {phase === "reveal" ? "🔒 قفلنا التصويت!" : "صوّت لأحلى بيت! 🗳️"}
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
                  style={{ padding: 16, textAlign: "center", border: isCommitted ? `3px solid ${GOLD}` : "3px solid transparent", opacity: isMine && !revealed ? 0.75 : 1, cursor: !disabled ? "pointer" : "default" }}
                >
                  <ShatrLine line1={a.value.line1} line2={a.value.line2} fontSize={16} />
                  {revealed && author && (
                    <span className="font-body pop" style={{ fontSize: 11, fontWeight: 700, color: GOLD, display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "center" }}>
                      {author.avatar_emoji} {author.nickname}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {phase === "voting" && (
            <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>{votedCount}/{players.length} صوّتوا</p>
          )}
        </>
      )}
    </div>
  );
}
