"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { seededShuffle } from "@/lib/seededShuffle";
import type { Lang } from "@/lib/i18n";
import type { PlayerRow, QuestionRow, SessionRow } from "@/lib/types";

export default function Round4({
  session,
  player,
  lang,
  onAdvance,
}: {
  session: SessionRow;
  player: PlayerRow;
  lang: Lang;
  onAdvance: () => void;
}) {
  const title = lang === "ar" ? "الجولة ٤: مفاجآت" : "Round 4: Wildcard";

  const [questions, setQuestions] = useState<QuestionRow[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [submittingText, setSubmittingText] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("pack_id", session.pack_id)
        .eq("round", 4)
        .eq("enabled", true);

      if (qErr || !qData || qData.length === 0) {
        if (!cancelled) {
          setError(lang === "ar" ? "ما لقينا أسئلة لهالجولة" : "Couldn't load this round's questions");
          setLoading(false);
        }
        return;
      }

      const ordered = seededShuffle(qData as QuestionRow[], `${session.id}-round4`).slice(0, 8);
      if (cancelled) return;
      setQuestions(ordered);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id, session.pack_id, lang]);

  async function finishRound() {
    await supabase.from("players").update({ current_round: 5 }).eq("id", player.id);
    onAdvance();
  }

  function goNext() {
    setTimeout(() => {
      if (!questions) return;
      if (idx + 1 < questions.length) {
        setIdx((i) => i + 1);
        setSelected(null);
        setTextValue("");
      } else {
        finishRound();
      }
    }, 420);
  }

  async function pickOption(optionId: string) {
    if (!questions || selected) return;
    setSelected(optionId);
    const question = questions[idx];
    await supabase.from("answers").upsert(
      { session_id: session.id, player_id: player.id, question_id: question.id, selected_option_id: optionId },
      { onConflict: "player_id,question_id" }
    );
    goNext();
  }

  async function submitText() {
    if (!questions || !textValue.trim() || submittingText) return;
    setSubmittingText(true);
    const question = questions[idx];
    await supabase.from("text_responses").upsert(
      { session_id: session.id, player_id: player.id, question_id: question.id, response_text: textValue.trim().slice(0, 200) },
      { onConflict: "player_id,question_id" }
    );
    setSubmittingText(false);
    setSelected("submitted");
    goNext();
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>
          {lang === "ar" ? "جاري التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (error || !questions) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ color: "#FF2E93", fontWeight: 700 }}>{error}</p>
      </div>
    );
  }

  const q = questions[idx];
  const progressPct = Math.round(((idx + (selected ? 1 : 0)) / questions.length) * 100);
  const isOpenText = q.question_type === "open_text";
  const promptEmoji = Array.isArray(q.options) && q.options.length > 0 ? q.options[0].emoji : undefined;

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px" }}>
      <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
        {title}
      </p>

      <div className="progress-track" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          className="card"
          style={{ padding: 26, textAlign: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 6 }}>
            {idx > 0 && (
              <button
                onClick={() => {
                  setIdx((i) => i - 1);
                  setSelected(null);
                  setTextValue("");
                }}
                className="font-body"
                style={{
                  position: "absolute", insetInlineStart: 0, background: "none", border: "none",
                  color: "var(--ink-soft)", fontSize: 12, fontWeight: 700, padding: "4px 8px",
                }}
              >
                {lang === "ar" ? "‹ السابق" : "‹ Previous"}
              </button>
            )}
            <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13 }}>
              {idx + 1} / {questions.length}
            </p>
          </div>

          {isOpenText ? (
            <>
              {promptEmoji && <span style={{ fontSize: 34, display: "block", marginBottom: 8 }}>{promptEmoji}</span>}
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 20px", lineHeight: 1.5 }}>
                {lang === "ar" ? q.text_ar : q.text_en}
              </h3>
              <input
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                disabled={!!selected}
                placeholder={lang === "ar" ? "اكتب جوابك..." : "Type your answer..."}
                maxLength={200}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 14, border: "2px solid var(--ring)",
                  background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none", marginBottom: 14,
                }}
              />
              <button
                onClick={submitText}
                disabled={!textValue.trim() || !!selected}
                className="btn-primary font-display"
                style={{ width: "100%", padding: 14, fontSize: 15, opacity: !textValue.trim() ? 0.5 : 1 }}
              >
                {lang === "ar" ? "إرسال" : "Submit"}
              </button>
            </>
          ) : (
            <>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 24px" }}>
                {lang === "ar" ? q.text_ar : q.text_en}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {q.options.map((o) => {
                  const isSelected = selected === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => pickOption(o.id)}
                      disabled={!!selected}
                      className="wiggle"
                      style={{
                        padding: "18px 14px",
                        borderRadius: 18,
                        border: "2px solid var(--ring)",
                        background: isSelected ? "linear-gradient(135deg, #FF2E93, #7C3AED)" : "var(--card)",
                        color: isSelected ? "white" : "var(--ink)",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        boxShadow: "0 6px 16px var(--ring)",
                        opacity: selected && !isSelected ? 0.5 : 1,
                        transition: "opacity .2s ease, background .2s ease, color .2s ease",
                      }}
                    >
                      {o.emoji && <span style={{ fontSize: 26 }}>{o.emoji}</span>}
                      <span className="font-body" style={{ fontWeight: 700, fontSize: 14, textAlign: "start" }}>
                        {lang === "ar" ? o.text_ar : o.text_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
