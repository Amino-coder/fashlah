"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoRoundScreen from "@/components/demo/DemoRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { SHOFAH_ANSWER_MAP, SHOFAH_CATEGORY_FALLBACK, pickTwoDistinct } from "@/lib/demo/demoContent";

const ROSE = "#E63946";
const WINE = "#C2185B";
const TOTAL_ROUNDS = 5; // same as the real game

type PromptRow = { text_ar: string; category: string };

/**
 * A fake session that only ever exists in this browser tab. No session
 * row, no code, no realtime channel, no writes of any kind — the entire
 * game state lives in useDemoRoundGame's local React state and disappears
 * the moment this page unmounts. Doesn't import anything from
 * components/shofah/ or app/shofah/session/, so there is zero risk of
 * this feature touching the real multiplayer flow.
 *
 * The one read-only exception: on mount, this fetches 5 real prompts from
 * shofah_prompts (public SELECT, same table the real game draws from) so
 * the demo genuinely plays out the same questions as an actual game.
 * Bot answers are looked up by exact prompt text (SHOFAH_ANSWER_MAP,
 * copied verbatim from the real seed bank) so they actually respond to
 * the question asked; a category-level fallback covers anything not in
 * that map (gendered prompts, or a future bank update). Nothing is ever
 * written back to Supabase.
 */
export default function ShofahDemoPage() {
  const [prompts, setPrompts] = useState<PromptRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("shofah_prompts")
          .select("text_ar, category")
          .eq("active", true)
          .is("audience", null);
        if (error || !data || data.length < TOTAL_ROUNDS) throw error || new Error("not enough prompts");
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
        if (!cancelled) setPrompts(shuffled);
      } catch {
        if (!cancelled) {
          const fallback = Object.keys(SHOFAH_ANSWER_MAP).map((text_ar) => ({ text_ar, category: "wildcard" }));
          const shuffled = [...fallback].sort(() => Math.random() - 0.5);
          setPrompts(Array.from({ length: TOTAL_ROUNDS }, (_, i) => shuffled[i % shuffled.length]));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return prompts ? <ShofahDemoGame prompts={prompts} /> : null;
}

function ShofahDemoGame({ prompts }: { prompts: PromptRow[] }) {
  function getBotAnswers(round: number): [string, string] {
    const p = prompts[(round - 1) % prompts.length];
    return SHOFAH_ANSWER_MAP[p.text_ar] ?? SHOFAH_CATEGORY_FALLBACK[p.category] ?? pickTwoDistinct(Object.values(SHOFAH_ANSWER_MAP).flat());
  }

  const engine = useDemoRoundGame<string>({
    totalRounds: TOTAL_ROUNDS,
    getBotAnswers,
    humanNickname: "أنت",
    humanAvatar: "😎",
  });

  const [showResults, setShowResults] = useState(false);
  const prompt = prompts[(engine.round - 1) % prompts.length].text_ar;

  if (engine.phase === "done" && !showResults) {
    const ranked = [...engine.players].sort((a, b) => (engine.scores[b.id] ?? 0) - (engine.scores[a.id] ?? 0));
    const winner = engine.players.find((p) => p.id === engine.overallWinnerId);
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
        <Blobs />
        <HomeButton label="الصفحة الرئيسية" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginTop: 60, marginBottom: 24 }}>
            <span style={{ fontSize: 56 }} className="pop">💍</span>
            <p className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 4px" }}>
              {winner?.nickname === "أنت" ? "أنت اللي بتتزوج أول! 🎉" : `${winner?.nickname} اللي بيتزوج أول! 🎉`}
            </p>
          </div>
          <div className="card pop" style={{ padding: 18 }}>
            {ranked.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < ranked.length - 1 ? "1px solid var(--ring)" : "none" }}>
                <span style={{ fontSize: 22 }}>{p.avatar_emoji}</span>
                <span className="font-body" style={{ flex: 1, fontWeight: 700 }}>{p.nickname}</span>
                <span className="font-display" style={{ fontWeight: 800, color: ROSE }}>{engine.scores[p.id] ?? 0}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowResults(true)}
            className="font-display"
            style={{ display: "block", width: "100%", marginTop: 24, padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff", background: `linear-gradient(135deg, ${ROSE}, ${WINE})` }}
          >
            التالي
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {engine.phase === "done" ? (
        <DemoEndScreen createHref="/shofah/create" accentFrom={ROSE} accentTo={WINE} />
      ) : (
        <>
          <HomeButton label="الصفحة الرئيسية" />
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
            <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: ROSE, letterSpacing: "0.08em", marginTop: 40, textTransform: "uppercase" }}>
              وضع التجربة
            </p>
            <DemoRoundScreen
              engine={engine}
              prompt={prompt}
              accentFrom={ROSE}
              accentTo={WINE}
              icon={<Heart size={38} color="#fff" />}
            />
          </div>
        </>
      )}
    </div>
  );
}
