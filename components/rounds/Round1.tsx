"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { seededShuffle } from "@/lib/seededShuffle";
import type { Lang } from "@/lib/i18n";
import type { AnswerRow, PlayerRow, QuestionRow, SessionRow } from "@/lib/types";

const TRAIT_LABELS: Record<string, { ar: string; en: string; emoji: string }> = {
  leadership: { ar: "القيادة", en: "Leadership", emoji: "👑" },
  humor: { ar: "الفكاهة", en: "Humor", emoji: "😂" },
  energy: { ar: "الطاقة", en: "Energy", emoji: "🔥" },
  organization: { ar: "مهارة التنظيم", en: "Organization", emoji: "📋" },
  adventure: { ar: "المغامرة", en: "Adventure", emoji: "🌎" },
  kindness: { ar: "اللطافة", en: "Kindness", emoji: "💛" },
  confidence: { ar: "الثقة", en: "Confidence", emoji: "😎" },
  responsibility: { ar: "المسؤولية", en: "Responsibility", emoji: "🎯" },
};

export default function Round1({
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
  const title = lang === "ar" ? "الجولة ١: عنك" : "Round 1: About You";

  const [questions, setQuestions] = useState<QuestionRow[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teaserTrait, setTeaserTrait] = useState<string | null>(null);
  const [traitTally, setTraitTally] = useState<Record<string, number>>({});

  // Load this round's questions + resume progress from any answers already
  // saved for this player (covers reload / reconnect mid-round).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("pack_id", session.pack_id)
        .eq("round", 1)
        .eq("enabled", true);

      if (qErr || !qData || qData.length === 0) {
        if (!cancelled) {
          setError(lang === "ar" ? "ما لقينا أسئلة لهالجولة" : "Couldn't load this round's questions");
          setLoading(false);
        }
        return;
      }

      const ordered = seededShuffle(qData as QuestionRow[], `${session.id}-round1`).slice(0, 5);

      const { data: existingAnswers } = await supabase
        .from("answers")
        .select("*")
        .eq("player_id", player.id)
        .in("question_id", ordered.map((q) => q.id));

      const answeredIds = new Set((existingAnswers as AnswerRow[] | null)?.map((a) => a.question_id));
      const resumeIdx = ordered.findIndex((q) => !answeredIds.has(q.id));

      if (cancelled) return;
      setQuestions(ordered);

      if (resumeIdx === -1) {
        // Already answered everything (e.g. reload after finishing) — move on.
        await advanceToRound2();
      } else {
        setIdx(resumeIdx);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, session.pack_id, player.id]);

  async function advanceToRound2() {
    await supabase.from("players").update({ current_round: 2 }).eq("id", player.id);
    onAdvance();
  }

  async function pick(optionId: string) {
    if (!questions || selected) return;
    setSelected(optionId);

    const question = questions[idx];
    await supabase.from("answers").upsert(
      {
        session_id: session.id,
        player_id: player.id,
        question_id: question.id,
        selected_option_id: optionId,
      },
      { onConflict: "player_id,question_id" }
    );

    // Tally trait_weights locally, just from this player's own picks — no
    // group data needed — so we can flash a quick personal teaser the
    // instant they finish, without waiting on anyone else.
    const chosenOption = question.options.find((o) => o.id === optionId);
    const nextTally = { ...traitTally };
    if (chosenOption?.trait_weights) {
      for (const [trait, weight] of Object.entries(chosenOption.trait_weights)) {
        nextTally[trait] = (nextTally[trait] || 0) + weight;
      }
    }
    setTraitTally(nextTally);

    setTimeout(async () => {
      if (idx + 1 < questions.length) {
        setIdx((i) => i + 1);
        setSelected(null);
      } else {
        let top: string | null = null;
        let topVal = -Infinity;
        for (const [trait, val] of Object.entries(nextTally)) {
          if (val > topVal) {
            topVal = val;
            top = trait;
          }
        }
        setTeaserTrait(top);
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

  if (teaserTrait) {
    const t = TRAIT_LABELS[teaserTrait];
    return (
      <div className="screen-enter pop" style={{ padding: "60px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 56, display: "block", marginBottom: 14 }}>{t?.emoji || "✨"}</span>
        <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
          {lang === "ar" ? "شكلك عندك..." : "Looks like you've got"}
        </p>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}>
          {lang === "ar" ? `${t?.ar || teaserTrait} عالية 🔥` : `High ${t?.en || teaserTrait} 🔥`}
        </h2>
        <button onClick={advanceToRound2} className="btn-primary font-display" style={{ padding: "14px 30px", fontSize: 15 }}>
          {lang === "ar" ? "يلا نكمل" : "Let's continue"}
        </button>
      </div>
    );
  }

  const q = questions[idx];
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 6 }}>
            {idx > 0 && (
              <button
                onClick={() => {
                  setIdx((i) => i - 1);
                  setSelected(null);
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
          <h3 className="font-display" style={{ fontSize: 24, fontWeight: 800, margin: "10px 0 26px" }}>
            {lang === "ar" ? q.text_ar : q.text_en}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {q.options.map((o) => {
              const isSelected = selected === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => pick(o.id)}
                  disabled={!!selected}
                  className="wiggle"
                  style={{
                    padding: "20px 10px",
                    borderRadius: 20,
                    border: "2px solid var(--ring)",
                    background: isSelected ? "linear-gradient(135deg, #FF2E93, #7C3AED)" : "var(--card)",
                    color: isSelected ? "white" : "var(--ink)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    alignItems: "center",
                    boxShadow: "0 6px 16px var(--ring)",
                    opacity: selected && !isSelected ? 0.5 : 1,
                    transition: "opacity .2s ease, background .2s ease, color .2s ease",
                  }}
                >
                  {o.emoji && <span style={{ fontSize: 30 }}>{o.emoji}</span>}
                  <span className="font-body" style={{ fontWeight: 700, fontSize: 13 }}>
                    {lang === "ar" ? o.text_ar : o.text_en}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
