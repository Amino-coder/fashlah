"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoRoundScreen from "@/components/demo/DemoRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { JOB_ANSWER_MAP, JOB_CATEGORY_FALLBACK, pickTwoDistinct } from "@/lib/demo/demoContent";

const BLUE = "#3B82F6";
const NAVY = "#1E40AF";
const TOTAL_ROUNDS = 5; // same as the real game

type PromptRow = { text_ar: string; category: string };

/**
 * Same isolation story as شوفة's demo — see that file's comment. The one
 * read-only exception here: fetches 5 real prompts from job_prompts
 * (public SELECT, same table the real game draws from). Bot answers are
 * looked up by exact prompt text (JOB_ANSWER_MAP, copied verbatim from
 * job_update_prompts.sql — the actual seeded bank), falling back to a
 * category-matched answer for anything not in that map.
 */
export default function JobDemoPage() {
  const [prompts, setPrompts] = useState<PromptRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("job_prompts")
          .select("text_ar, category")
          .eq("active", true);
        if (error || !data || data.length < TOTAL_ROUNDS) throw error || new Error("not enough prompts");
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
        if (!cancelled) setPrompts(shuffled);
      } catch {
        if (!cancelled) {
          const fallback = Object.keys(JOB_ANSWER_MAP).map((text_ar) => ({ text_ar, category: "wildcard" }));
          const shuffled = [...fallback].sort(() => Math.random() - 0.5);
          setPrompts(Array.from({ length: TOTAL_ROUNDS }, (_, i) => shuffled[i % shuffled.length]));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return prompts ? <JobDemoGame prompts={prompts} /> : null;
}

function JobDemoGame({ prompts }: { prompts: PromptRow[] }) {
  function getBotAnswers(round: number): [string, string] {
    const p = prompts[(round - 1) % prompts.length];
    return JOB_ANSWER_MAP[p.text_ar] ?? JOB_CATEGORY_FALLBACK[p.category] ?? pickTwoDistinct(Object.values(JOB_ANSWER_MAP).flat());
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
            <span style={{ fontSize: 56 }} className="pop">💼</span>
            <p className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 4px" }}>
              {winner?.nickname === "أنت" ? "توظفت أنا! 🎉" : `${winner?.nickname} توظف! 🎉`}
            </p>
          </div>
          <div className="card pop" style={{ padding: 18 }}>
            {ranked.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < ranked.length - 1 ? "1px solid var(--ring)" : "none" }}>
                <span style={{ fontSize: 22 }}>{p.avatar_emoji}</span>
                <span className="font-body" style={{ flex: 1, fontWeight: 700 }}>{p.nickname}</span>
                <span className="font-display" style={{ fontWeight: 800, color: BLUE }}>{engine.scores[p.id] ?? 0}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowResults(true)}
            className="font-display"
            style={{ display: "block", width: "100%", marginTop: 24, padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff", background: `linear-gradient(135deg, ${BLUE}, ${NAVY})` }}
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
        <DemoEndScreen createHref="/job/create" accentFrom={BLUE} accentTo={NAVY} />
      ) : (
        <>
          <HomeButton label="الصفحة الرئيسية" />
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
            <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: BLUE, letterSpacing: "0.08em", marginTop: 40, textTransform: "uppercase" }}>
              وضع التجربة
            </p>
            <DemoRoundScreen
              engine={engine}
              prompt={prompt}
              accentFrom={BLUE}
              accentTo={NAVY}
              icon={<Briefcase size={38} color="#fff" />}
            />
          </div>
        </>
      )}
    </div>
  );
}
