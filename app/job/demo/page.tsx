"use client";

import { useEffect, useState } from "react";
import { trackPageView } from "@/lib/trackPageView";
import { Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoRoundScreen from "@/components/demo/DemoRoundScreen";
import DemoDrumrollResults from "@/components/demo/DemoDrumrollResults";
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
 * category-matched answer for anything not in that map. Results screen
 * mirrors the real FinalReveal's drumroll stage-for-stage via the shared
 * DemoDrumrollResults component.
 */
export default function JobDemoPage() {
  useEffect(() => { trackPageView("job_demo"); }, []);
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

  const prompt = prompts[(engine.round - 1) % prompts.length].text_ar;

  if (engine.phase === "done") {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
        <Blobs />
        <HomeButton label="الصفحة الرئيسية" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
          <DemoDrumrollResults
            players={engine.players}
            scores={engine.scores}
            accentFrom={BLUE}
            accentTo={NAVY}
            gold="#FFD400"
            stage0Emoji="📄"
            thinkingText="بعد مراجعة السير الذاتية..."
            winnerIsText="الشخص اللي بيتوظف هو..."
            connectorEmoji="🤝"
            congratsText="🎉 مبروك، توظفت!"
            othersText="أما الباقين... لسه عاطلين 😂"
            createHref="/job/create"
          />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
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
    </div>
  );
}
