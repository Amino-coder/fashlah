"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SHOFAH_STR, ShofahLang } from "@/lib/shofah-i18n";
import NiqabGirl from "./NiqabGirl";
import ShemaghGuy from "./ShemaghGuy";
import type { ShofahSessionRow } from "@/lib/shofah-types";

const ROSE = "#E63946";
const WINE = "#C2185B";
const MESSAGE_INTERVAL_MS = 1500;

type Beat = {
  round: number;
  promptText: string;
  answerText: string;
  winnerNickname: string;
  winnerAvatar: string;
};

export default function FinalConversation({
  session, isHost, lang, onDone,
}: {
  session: ShofahSessionRow;
  isHost: boolean;
  lang: ShofahLang;
  onDone: () => void;
}) {
  const t = SHOFAH_STR[lang];
  const [beats, setBeats] = useState<Beat[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const advancedRef = useRef(false);

  // Pull each round's prompt + its winning answer (skipping any round
  // nobody answered — nothing to show for those) and zip them together
  // into the conversation script, in round order.
  useEffect(() => {
    (async () => {
      const { data: prompts } = await supabase
        .from("shofah_round_prompts")
        .select("round_number, shofah_prompts(text_ar, text_en)")
        .eq("session_id", session.id)
        .order("round_number");

      const { data: results } = await supabase
        .from("shofah_round_results")
        .select("round_number, shofah_answers(text), shofah_players(nickname, avatar_emoji)")
        .eq("session_id", session.id)
        .order("round_number");

      const resultsByRound = new Map<number, any>();
      for (const r of results || []) resultsByRound.set(r.round_number, r);

      const zipped: Beat[] = [];
      for (const p of prompts || []) {
        const r = resultsByRound.get(p.round_number);
        if (!r) continue; // no winner this round (nobody answered) — skip
        const promptRow = (p as any).shofah_prompts;
        const answerRow = r.shofah_answers;
        const playerRow = r.shofah_players;
        if (!promptRow || !answerRow || !playerRow) continue;
        zipped.push({
          round: p.round_number,
          promptText: lang === "ar" ? promptRow.text_ar : promptRow.text_en,
          answerText: answerRow.text,
          winnerNickname: playerRow.nickname,
          winnerAvatar: playerRow.avatar_emoji,
        });
      }
      setBeats(zipped);
    })();
  }, [session.id, lang]);

  const totalMessages = beats ? beats.length * 2 : 0;

  // Auto-advance one message at a time; tapping anywhere reveals the next
  // one immediately, matching "one message appears per tap (or every 1.5s
  // automatically)" from the brief.
  useEffect(() => {
    if (!beats || visibleCount >= totalMessages) return;
    const id = setTimeout(() => setVisibleCount((v) => Math.min(v + 1, totalMessages)), MESSAGE_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [beats, visibleCount, totalMessages]);

  function revealNext() {
    if (!beats) return;
    setVisibleCount((v) => Math.min(v + 1, totalMessages));
  }

  // Host-only: once every message has been shown, move on after a short
  // pause (or the host can tap Continue immediately).
  useEffect(() => {
    if (!isHost || !beats || visibleCount < totalMessages || advancedRef.current) return;
    const id = setTimeout(() => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      onDone();
    }, 2500);
    return () => clearTimeout(id);
  }, [isHost, beats, visibleCount, totalMessages, onDone]);

  const Character = session.character === "girl" ? NiqabGirl : ShemaghGuy;

  if (beats && beats.length === 0) {
    // Nobody answered ANY round — nothing to build a conversation from.
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 60, textAlign: "center" }}>
        <Character size={110} />
        <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>
          {lang === "ar" ? "محد جاوب طول اللعبة 😅" : "Nobody answered the whole game 😅"}
        </p>
        {isHost && (
          <button
            onClick={onDone}
            className="font-display"
            style={{ padding: "12px 28px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff", background: `linear-gradient(135deg, ${ROSE}, ${WINE})` }}
          >
            {t.continueBtn}
          </button>
        )}
      </div>
    );
  }

  return (
    <div onClick={revealNext} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20, cursor: "pointer", minHeight: 300 }}>
      <div style={{ textAlign: "center" }}>
        <Character size={70} />
      </div>

      {!beats && (
        <div style={{ textAlign: "center", color: "var(--ink-soft)" }}>
          <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {beats && beats.map((beat, i) => {
          const charMsgIndex = i * 2;
          const answerMsgIndex = i * 2 + 1;
          return (
            <div key={beat.round} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleCount > charMsgIndex && (
                <div className="pop" style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div className="card" style={{ padding: "12px 16px", maxWidth: "78%", borderBottomLeftRadius: 6 }}>
                    <p className="font-body" style={{ margin: 0, fontSize: 15 }}>{beat.promptText}</p>
                  </div>
                </div>
              )}
              {visibleCount > answerMsgIndex && (
                <div className="pop" style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    padding: "12px 16px", maxWidth: "78%", borderRadius: 18, borderBottomRightRadius: 6,
                    background: `linear-gradient(135deg, ${ROSE}, ${WINE})`, color: "#fff",
                  }}>
                    <p className="font-body" style={{ margin: 0, fontSize: 15 }}>{beat.answerText}</p>
                    <p className="font-body" style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.85, textAlign: lang === "ar" ? "left" : "right" }}>
                      {beat.winnerAvatar} {beat.winnerNickname}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {beats && visibleCount >= totalMessages && isHost && (
        <button
          onClick={(e) => { e.stopPropagation(); if (!advancedRef.current) { advancedRef.current = true; onDone(); } }}
          className="font-display"
          style={{
            padding: 14, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
            background: `linear-gradient(135deg, ${ROSE}, ${WINE})`,
          }}
        >
          {t.continueBtn}
        </button>
      )}
    </div>
  );
}
