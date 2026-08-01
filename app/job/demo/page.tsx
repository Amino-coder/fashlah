"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoRoundScreen from "@/components/demo/DemoRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { JOB_DEMO_PROMPTS, JOB_DEMO_RESPONSES } from "@/lib/demo/demoContent";

const BLUE = "#3B82F6";
const NAVY = "#1E40AF";
const TOTAL_ROUNDS = 5; // same as the real game

/**
 * Same isolation story as شوفة's demo — see that file's comment. The one
 * read-only exception here: fetches 5 real prompts from job_prompts
 * (public SELECT, same table the real game draws from) so the demo plays
 * the same questions as an actual game. Falls back to a small local list
 * if the fetch fails for any reason.
 */
export default function JobDemoPage() {
  const [prompts, setPrompts] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("job_prompts")
          .select("text_ar")
          .eq("active", true);
        if (error || !data || data.length < TOTAL_ROUNDS) throw error || new Error("not enough prompts");
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS).map((p) => p.text_ar);
        if (!cancelled) setPrompts(shuffled);
      } catch {
        if (!cancelled) {
          const shuffled = [...JOB_DEMO_PROMPTS].sort(() => Math.random() - 0.5);
          setPrompts(Array.from({ length: TOTAL_ROUNDS }, (_, i) => shuffled[i % shuffled.length]));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return prompts ? <JobDemoGame prompts={prompts} /> : null;
}

function JobDemoGame({ prompts }: { prompts: string[] }) {
  const engine = useDemoRoundGame<string>({
    totalRounds: TOTAL_ROUNDS,
    responseBank: JOB_DEMO_RESPONSES,
    humanNickname: "أنت",
    humanAvatar: "😎",
  });

  const prompt = prompts[(engine.round - 1) % prompts.length];

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
