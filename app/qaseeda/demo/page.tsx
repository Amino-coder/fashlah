"use client";

import { useState } from "react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import ShatrLine from "@/components/qaseeda/ShatrLine";
import DemoQaseedaRoundScreen from "@/components/demo/DemoQaseedaRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoRoundGame } from "@/lib/demo/useDemoRoundGame";
import { QASEEDA_DEMO_OPENING, QASEEDA_DEMO_RESPONSES, pickTwoDistinct } from "@/lib/demo/demoContent";

const GOLD = "#D9A441";
const NAVY = "#1B3A55";
const TOTAL_ROUNDS = 5; // same as the real game

type Verse = { line1: string; line2: string };
type PoemLine = Verse & { author: string | null };

export default function QaseedaDemoPage() {
  const [poemLines, setPoemLines] = useState<PoemLine[]>([
    { line1: QASEEDA_DEMO_OPENING.line1, line2: QASEEDA_DEMO_OPENING.line2, author: QASEEDA_DEMO_OPENING.poet },
  ]);
  const [showResults, setShowResults] = useState(false);

  const engine = useDemoRoundGame<Verse>({
    totalRounds: TOTAL_ROUNDS,
    getBotAnswers: () => pickTwoDistinct(QASEEDA_DEMO_RESPONSES),
    humanNickname: "أنت",
    humanAvatar: "😎",
    onRoundWon: (_round, result) => {
      setPoemLines((prev) => [...prev, { ...result.winnerValue, author: result.winnerNickname }]);
    },
  });

  if (engine.phase === "done" && !showResults) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
        <Blobs />
        <HomeButton label="الصفحة الرئيسية" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
          <p className="font-display pop" style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginTop: 50, marginBottom: 8 }}>
            صح لسانكم 🪶
          </p>
          <p className="font-quote" style={{ textAlign: "center", fontSize: 16, color: GOLD, fontWeight: 700, marginBottom: 24 }}>
            القصيدة
          </p>
          <div className="card pop" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {poemLines.map((line, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <ShatrLine line1={line.line1} line2={line.line2} fontSize={i === 0 ? 17 : 16} />
                {line.author && (
                  <p className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", margin: "4px 0 0", fontWeight: 700 }}>
                    {i === 0 ? `الشاعر: ${line.author}` : `✍️ ${line.author}`}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowResults(true)}
            className="font-display"
            style={{ display: "block", width: "100%", marginTop: 24, padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff", background: `linear-gradient(135deg, ${GOLD}, ${NAVY})` }}
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
