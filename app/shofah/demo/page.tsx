"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoRoundScreen from "@/components/demo/DemoRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { SHOFAH_DEMO_PROMPTS, SHOFAH_DEMO_RESPONSES } from "@/lib/demo/demoContent";

const ROSE = "#E63946";
const WINE = "#C2185B";
const TOTAL_ROUNDS = 5; // same as the real game

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
 * the demo genuinely plays out the same questions as an actual game,
 * instead of a hand-picked local sample. Nothing is written back —
 * falls back to a small local prompt list if the fetch fails for any
 * reason (offline, RLS misconfigured, etc.) so the demo still works.
 */
export default function ShofahDemoPage() {
  const [prompts, setPrompts] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("shofah_prompts")
          .select("text_ar")
          .eq("active", true)
          .is("audience", null);
        if (error || !data || data.length < TOTAL_ROUNDS) throw error || new Error("not enough prompts");
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS).map((p) => p.text_ar);
        if (!cancelled) setPrompts(shuffled);
      } catch {
        if (!cancelled) {
          const shuffled = [...SHOFAH_DEMO_PROMPTS].sort(() => Math.random() - 0.5);
          setPrompts(Array.from({ length: TOTAL_ROUNDS }, (_, i) => shuffled[i % shuffled.length]));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return prompts ? <ShofahDemoGame prompts={prompts} /> : null;
}

function ShofahDemoGame({ prompts }: { prompts: string[] }) {
  const engine = useDemoRoundGame<string>({
    totalRounds: TOTAL_ROUNDS,
    responseBank: SHOFAH_DEMO_RESPONSES,
    humanNickname: "أنت",
    humanAvatar: "😎",
  });

  const prompt = prompts[(engine.round - 1) % prompts.length];

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
