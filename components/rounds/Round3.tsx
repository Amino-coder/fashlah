"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { seededShuffle } from "@/lib/seededShuffle";
import type { Lang } from "@/lib/i18n";
import type { PlayerRow, QuestionRow, SessionRow } from "@/lib/types";

export default function Round3({
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
  const title = lang === "ar" ? "الجولة ٣: آراء جريئة" : "Round 3: Hot Takes";
  const agreeLabel = lang === "ar" ? "أوافق" : "Agree";
  const disagreeLabel = lang === "ar" ? "ما أوافق" : "Disagree";

  const [questions, setQuestions] = useState<QuestionRow[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<"agree" | "disagree" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("pack_id", session.pack_id)
        .eq("round", 3)
        .eq("enabled", true);

      if (qErr || !qData || qData.length === 0) {
        if (!cancelled) {
          setError(lang === "ar" ? "ما لقينا أسئلة لهالجولة" : "Couldn't load this round's questions");
          setLoading(false);
        }
        return;
      }

      const ordered = seededShuffle(qData as QuestionRow[], `${session.id}-round3`).slice(0, 3);
      if (cancelled) return;
      setQuestions(ordered);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id, session.pack_id, lang]);

  async function finishRound() {
    await supabase.from("players").update({ current_round: 4 }).eq("id", player.id);
    onAdvance();
  }

  async function pick(stance: "agree" | "disagree") {
    if (!questions || selected) return;
    setSelected(stance);

    const question = questions[idx];
    // Unlike votes, hot_take_responses has a normal SELECT policy (any
    // session member can read it), so a plain upsert works fine here — no
    // chicken-and-egg RLS/ON CONFLICT problem like votes or players had.
    await supabase.from("hot_take_responses").upsert(
      {
        session_id: session.id,
        player_id: player.id,
        question_id: question.id,
        stance,
      },
      { onConflict: "player_id,question_id" }
    );

    setTimeout(async () => {
      if (idx + 1 < questions.length) {
        setIdx((i) => i + 1);
        setSelected(null);
      } else {
        await finishRound();
      }
    }, 420);
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
  const emoji = Array.isArray(q.options) && q.options.length > 0 ? q.options[0].emoji : undefined;
  const progressPct = Math.round(((idx + (selected ? 1 : 0)) / questions.length) * 100);

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
          <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            {idx + 1} / {questions.length}
          </p>

          {emoji && <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>{emoji}</span>}

          <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "6px 0 28px" }}>
            {lang === "ar" ? q.text_ar : q.text_en}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              onClick={() => pick("agree")}
              disabled={!!selected}
              className="wiggle font-display"
              style={{
                padding: "20px 10px",
                borderRadius: 20,
                border: "2px solid var(--ring)",
                background: selected === "agree" ? "linear-gradient(135deg, #2EE6A6, #7C3AED)" : "var(--card)",
                color: selected === "agree" ? "white" : "var(--ink)",
                fontWeight: 800,
                fontSize: 15,
                boxShadow: "0 6px 16px var(--ring)",
                opacity: selected && selected !== "agree" ? 0.5 : 1,
                transition: "opacity .2s ease, background .2s ease, color .2s ease",
              }}
            >
              👍 {agreeLabel}
            </button>
            <button
              onClick={() => pick("disagree")}
              disabled={!!selected}
              className="wiggle font-display"
              style={{
                padding: "20px 10px",
                borderRadius: 20,
                border: "2px solid var(--ring)",
                background: selected === "disagree" ? "linear-gradient(135deg, #FF2E93, #7C3AED)" : "var(--card)",
                color: selected === "disagree" ? "white" : "var(--ink)",
                fontWeight: 800,
                fontSize: 15,
                boxShadow: "0 6px 16px var(--ring)",
                opacity: selected && selected !== "disagree" ? 0.5 : 1,
                transition: "opacity .2s ease, background .2s ease, color .2s ease",
              }}
            >
              👎 {disagreeLabel}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
