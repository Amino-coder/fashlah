"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { JOB_STR, JobLang } from "@/lib/job-i18n";
import SuitGuy from "./SuitGuy";
import type { JobSessionRow } from "@/lib/job-types";

const BLUE = "#3B82F6";
const NAVY = "#1E40AF";
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
  session: JobSessionRow;
  isHost: boolean;
  lang: JobLang;
  onDone: () => void;
}) {
  const t = JOB_STR[lang];
  const [beats, setBeats] = useState<Beat[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const advancedRef = useRef(false);

  // Pull each round's prompt + its winning answer (skipping any round
  // nobody answered — nothing to show for those) and zip them together
  // into the conversation script, in round order.
  //
  // Scoring is now fire-and-forget (RoundScreen advances the round the
  // instant the brief "locked" beat ends, without waiting for the scoring
  // API call to finish writing to job_round_results). That's a real
  // race for the LAST round especially — this screen can mount before that
  // final write has landed. So instead of a single fetch, retry a few
  // times with a short delay until every prompt has a matching result (or
  // we genuinely give up after a few tries and show whatever's there).
  useEffect(() => {
    let cancelled = false;
    const MAX_ATTEMPTS = 6;
    const RETRY_DELAY_MS = 700;

    async function attempt(tryNumber: number) {
      const { data: prompts } = await supabase
        .from("job_round_prompts")
        .select("round_number, job_prompts(text_ar, text_en)")
        .eq("session_id", session.id)
        .order("round_number");

      const { data: results } = await supabase
        .from("job_round_results")
        .select("round_number, job_answers(text), job_players(nickname, avatar_emoji)")
        .eq("session_id", session.id)
        .order("round_number");

      if (cancelled) return;

      const resultsByRound = new Map<number, any>();
      for (const r of results || []) resultsByRound.set(r.round_number, r);

      // How many of this session's prompt rounds are still missing a
      // scored result? If some are missing and we haven't hit the retry
      // cap, wait a beat and try again rather than rendering "nobody
      // answered" prematurely.
      const missingCount = (prompts || []).length - resultsByRound.size;
      if (missingCount > 0 && tryNumber < MAX_ATTEMPTS) {
        setTimeout(() => { if (!cancelled) attempt(tryNumber + 1); }, RETRY_DELAY_MS);
        return;
      }

      const zipped: Beat[] = [];
      for (const p of prompts || []) {
        const r = resultsByRound.get(p.round_number);
        if (!r) continue; // no winner this round (nobody answered) — skip
        const promptRow = (p as any).job_prompts;
        const answerRow = r.job_answers;
        const playerRow = r.job_players;
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
    }

    attempt(0);
    return () => { cancelled = true; };
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

  // Host-only: once every message has been shown, start a visible 4-second
  // countdown before auto-continuing. See شوفة's FinalConversation.tsx for
  // the full story on why this is a ticking state rather than a single
  // setTimeout keyed on onDone's identity.
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!isHost || !beats || visibleCount < totalMessages || advancedRef.current) return;
    setCountdown(4);
  }, [isHost, beats, visibleCount, totalMessages]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (!advancedRef.current) { advancedRef.current = true; onDone(); }
      return;
    }
    const id = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);


  if (beats && beats.length === 0) {
    // Nobody answered ANY round — nothing to build a conversation from.
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 60, textAlign: "center" }}>
        <SuitGuy size={110} />
        <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>
          {lang === "ar" ? "محد جاوب طول المقابلة 😅" : "Nobody answered the whole interview 😅"}
        </p>
        {isHost && (
          <button
            onClick={onDone}
            className="font-display"
            style={{ padding: "12px 28px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff", background: `linear-gradient(135deg, ${BLUE}, ${NAVY})` }}
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
        <SuitGuy size={70} />
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
                    background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`, color: "#fff",
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

      {beats && visibleCount < totalMessages && (
        <p className="font-body" style={{ textAlign: "center", fontSize: 11, color: "var(--ink-soft)", opacity: 0.6 }}>
          {lang === "ar" ? "اضغظ اي مكان عشان تكمل" : "Tap anywhere to continue"}
        </p>
      )}

      {beats && visibleCount >= totalMessages && isHost && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); if (!advancedRef.current) { advancedRef.current = true; onDone(); } }}
            className="font-display pop"
            style={{
              padding: "16px 32px", fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`, boxShadow: `0 8px 22px ${BLUE}55`,
            }}
          >
            {t.continueBtn}
          </button>
          {countdown !== null && countdown > 0 && (
            <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)", opacity: 0.75, margin: 0 }}>
              {lang === "ar" ? `بننتقل تلقائيًا خلال ${countdown}...` : `Moving on automatically in ${countdown}...`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
