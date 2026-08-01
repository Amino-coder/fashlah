"use client";

import { Heart } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoRoundScreen from "@/components/demo/DemoRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { SHOFAH_DEMO_PROMPTS, SHOFAH_DEMO_RESPONSES } from "@/lib/demo/demoContent";

const ROSE = "#E63946";
const WINE = "#C2185B";

/**
 * A fake session that only ever exists in this browser tab. No session
 * row, no code, no realtime channel, no writes of any kind — the entire
 * game state lives in useDemoRoundGame's local React state and disappears
 * the moment this page unmounts. Doesn't import anything from
 * components/shofah/ or app/shofah/session/, so there is zero risk of
 * this feature touching the real multiplayer flow.
 */
export default function ShofahDemoPage() {
  const engine = useDemoRoundGame<string>({
    totalRounds: 3,
    responseBank: SHOFAH_DEMO_RESPONSES,
    humanNickname: "أنت",
    humanAvatar: "😎",
  });

  const prompt = SHOFAH_DEMO_PROMPTS[(engine.round - 1) % SHOFAH_DEMO_PROMPTS.length];

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
