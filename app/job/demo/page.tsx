"use client";

import { Briefcase } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoRoundScreen from "@/components/demo/DemoRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { JOB_DEMO_PROMPTS, JOB_DEMO_RESPONSES } from "@/lib/demo/demoContent";

const BLUE = "#3B82F6";
const NAVY = "#1E40AF";

export default function JobDemoPage() {
  const engine = useDemoRoundGame<string>({
    totalRounds: 3,
    responseBank: JOB_DEMO_RESPONSES,
    humanNickname: "أنت",
    humanAvatar: "😎",
  });

  const prompt = JOB_DEMO_PROMPTS[(engine.round - 1) % JOB_DEMO_PROMPTS.length];

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
