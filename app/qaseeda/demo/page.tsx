"use client";

import { useState } from "react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoQaseedaRoundScreen from "@/components/demo/DemoQaseedaRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { QASEEDA_DEMO_OPENING, QASEEDA_DEMO_RESPONSES } from "@/lib/demo/demoContent";

const GOLD = "#D9A441";
const NAVY = "#1B3A55";

type Verse = { line1: string; line2: string };
type PoemLine = Verse & { author: string | null };

export default function QaseedaDemoPage() {
  const [poemLines, setPoemLines] = useState<PoemLine[]>([
    { line1: QASEEDA_DEMO_OPENING.line1, line2: QASEEDA_DEMO_OPENING.line2, author: QASEEDA_DEMO_OPENING.poet },
  ]);

  const engine = useDemoRoundGame<Verse>({
    totalRounds: 5,
    responseBank: QASEEDA_DEMO_RESPONSES,
    humanNickname: "أنت",
    humanAvatar: "😎",
    onRoundWon: (_round, result) => {
      setPoemLines((prev) => [...prev, { ...result.winnerValue, author: result.winnerNickname }]);
    },
  });

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {engine.phase === "done" ? (
        <DemoEndScreen createHref="/qaseeda/create" accentFrom={GOLD} accentTo={NAVY} />
      ) : (
        <>
          <HomeButton label="الصفحة الرئيسية" />
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
            <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.08em", marginTop: 40, textTransform: "uppercase" }}>
              وضع التجربة
            </p>
            <DemoQaseedaRoundScreen engine={engine} poemLines={poemLines} />
          </div>
        </>
      )}
    </div>
  );
}
