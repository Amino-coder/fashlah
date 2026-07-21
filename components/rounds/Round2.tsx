"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { seededShuffle } from "@/lib/seededShuffle";
import type { Lang } from "@/lib/i18n";
import type { PlayerRow, QuestionRow, SessionRow } from "@/lib/types";

export default function Round2({
  session,
  player,
  players,
  lang,
  onAdvance,
}: {
  session: SessionRow;
  player: PlayerRow;
  players: PlayerRow[];
  lang: Lang;
  onAdvance: () => void;
}) {
  const title = lang === "ar" ? "الجولة ٢: صوّتوا لأصحابكم" : "Round 2: Vote for Friends";
  const sub = lang === "ar" ? "مين الأغلب يسوي كذا؟" : "Who's most likely to...";

  const [questions, setQuestions] = useState<QuestionRow[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Votes have no read policy at all (not even for the voter's own vote —
  // see migration_004), so unlike Round 1 there's no way to resume from a
  // saved position on reload. We always start at question 1; re-voting an
  // already-answered question is harmless since (voter, question) is unique
  // and idempotent (insert-then-update-on-conflict below).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("pack_id", session.pack_id)
        .eq("round", 2)
        .eq("enabled", true);

      if (qErr || !qData || qData.length === 0) {
        if (!cancelled) {
          setError(lang === "ar" ? "ما لقينا أسئلة لهالجولة" : "Couldn't load this round's questions");
          setLoading(false);
        }
        return;
      }

      const ordered = seededShuffle(qData as QuestionRow[], `${session.id}-round2`).slice(0, 13);
      if (cancelled) return;
      setQuestions(ordered);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id, session.pack_id, lang]);

  async function advanceToRound3() {
    await supabase.from("players").update({ current_round: 3 }).eq("id", player.id);
    onAdvance();
  }

  async function pick(votedForPlayerId: string) {
    if (!questions || selected) return;
    setSelected(votedForPlayerId);

    const question = questions[idx];
    const { error: insertErr } = await supabase.from("votes").insert({
      session_id: session.id,
      question_id: question.id,
      voter_player_id: player.id,
      voted_for_player_id: votedForPlayerId,
    });

    if (insertErr && insertErr.code === "23505") {
      // Already voted on this question (e.g. reload mid-round) — change the
      // vote via a plain update instead of an upsert, since votes has no
      // SELECT policy for an upsert's conflict check to use.
      await supabase
        .from("votes")
        .update({ voted_for_player_id: votedForPlayerId })
        .eq("session_id", session.id)
        .eq("question_id", question.id)
        .eq("voter_player_id", player.id);
    }

    setTimeout(async () => {
      if (idx + 1 < questions.length) {
        setIdx((i) => i + 1);
        setSelected(null);
      } else {
        await advanceToRound3();
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
          <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13 }}>
            {idx + 1} / {questions.length}
          </p>
          <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, marginTop: 6 }}>
            {sub}
          </p>
          <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 24px" }}>
            {lang === "ar" ? q.text_ar : q.text_en}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {players.map((p) => {
              const isSelected = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  disabled={!!selected}
                  className="wiggle"
                  style={{
                    padding: "14px 6px",
                    borderRadius: 18,
                    border: "2px solid var(--ring)",
                    background: isSelected ? "linear-gradient(135deg, #FF2E93, #7C3AED)" : "var(--card)",
                    color: isSelected ? "white" : "var(--ink)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 6px 16px var(--ring)",
                    opacity: selected && !isSelected ? 0.5 : 1,
                    transition: "opacity .2s ease, background .2s ease, color .2s ease",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{p.avatar_emoji}</span>
                  <span className="font-body" style={{ fontSize: 11, fontWeight: 700 }}>
                    {p.id === player.id ? (lang === "ar" ? "أنت" : "You") : p.nickname}
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
