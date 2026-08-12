"use client";

import { useEffect, useState } from "react";
import { trackPageView } from "@/lib/trackPageView";
import { Feather } from "lucide-react";
import HomeButton from "@/components/HomeButton";
import Blobs from "@/components/Blobs";
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
  useEffect(() => { trackPageView("qaseeda_demo"); }, []);
  const [poemLines, setPoemLines] = useState<PoemLine[]>([
    { line1: QASEEDA_DEMO_OPENING.line1, line2: QASEEDA_DEMO_OPENING.line2, author: QASEEDA_DEMO_OPENING.poet },
  ]);

  const engine = useDemoRoundGame<Verse>({
    totalRounds: TOTAL_ROUNDS,
    getBotAnswers: () => pickTwoDistinct(QASEEDA_DEMO_RESPONSES),
    humanNickname: "أنت",
    humanAvatar: "😎",
    onRoundWon: (_round, result) => {
      setPoemLines((prev) => [...prev, { ...result.winnerValue, author: result.winnerNickname }]);
    },
  });

  if (engine.phase === "done") {
    return <QaseedaDemoReveal poemLines={poemLines} />;
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label="الصفحة الرئيسية" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.08em", marginTop: 40, textTransform: "uppercase" }}>
          وضع التجربة
        </p>
        <DemoQaseedaRoundScreen engine={engine} poemLines={poemLines} />
      </div>
    </div>
  );
}

/**
 * Mirrors قصيدة's real FinalReveal.tsx stage-for-stage: same fixed
 * full-screen overlay, same gradient background, same timer marks
 * (500/2300/3500ms), same "صح لسانكم" cheer, same tap-to-reveal-next-line
 * pacing (1700ms auto-advance). The one simplification: the real reveal's
 * final stage renders an exportable PNG share card
 * (components/qaseeda/PoemShareCard.tsx + exportPoemCard.ts) — that's a
 * feature of the real game's own sharing flow, not something a one-off
 * local demo game needs, so it's replaced with the standard DemoEndScreen
 * once the poem has fully revealed.
 */
function QaseedaDemoReveal({ poemLines }: { poemLines: PoemLine[] }) {
  const [stage, setStage] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const totalLines = poemLines.length;

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 2300),
      setTimeout(() => setStage(3), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage !== 3 || revealedCount >= totalLines) return;
    const id = setTimeout(() => setRevealedCount((v) => Math.min(v + 1, totalLines)), 1700);
    return () => clearTimeout(id);
  }, [stage, revealedCount, totalLines]);

  useEffect(() => {
    if (stage !== 3 || totalLines === 0 || revealedCount < totalLines) return;
    const id = setTimeout(() => setStage(4), 1500);
    return () => clearTimeout(id);
  }, [stage, revealedCount, totalLines]);

  function revealNext() {
    if (stage !== 3) return;
    setRevealedCount((v) => Math.min(v + 1, totalLines));
  }

  return (
    <div
      onClick={stage === 3 ? revealNext : undefined}
      className="screen-enter"
      style={{
        position: "fixed", inset: 0, zIndex: 40, overflowY: "auto",
        background: `linear-gradient(160deg, ${NAVY} 0%, #0F1E30 45%, #0A1526 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "64px 20px 40px", cursor: stage === 3 ? "pointer" : "default",
        color: "#FBF6E9",
      }}
    >
      {stage >= 4 && <HomeButton label="الصفحة الرئيسية" />}

      {stage < 2 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          {stage >= 1 ? (
            <p className="font-display pop" style={{ fontSize: 30, fontWeight: 800, margin: 0, textAlign: "center" }}>
              صح لسانكم 👏
            </p>
          ) : (
            <div style={{ color: GOLD }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
        </div>
      )}

      {stage >= 2 && stage < 4 && (
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          <div className="pop" style={{ textAlign: "center" }}>
            <Feather size={26} color={GOLD} style={{ marginBottom: 8 }} />
            <p className="font-quote" style={{ fontSize: 30, fontWeight: 700, margin: 0, color: GOLD }}>
              القصيدة
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            {poemLines.slice(0, revealedCount).map((line, i) => (
              <div key={i} className="pop" style={{ textAlign: "center" }}>
                <ShatrLine line1={line.line1} line2={line.line2} fontSize={i === 0 ? 18 : 17} color="#FBF6E9" />
                {line.author && (
                  <p className="font-body" style={{ fontSize: 12, opacity: 0.75, margin: "6px 0 0", fontWeight: 600 }}>
                    {i === 0 ? `الشاعر: ${line.author}` : `✍️ ${line.author}`}
                  </p>
                )}
              </div>
            ))}
          </div>

          {revealedCount < totalLines && (
            <p className="font-body" style={{ fontSize: 11, opacity: 0.55, textAlign: "center" }}>
              اضغط اي مكان عشان تكمل
            </p>
          )}
        </div>
      )}

      {stage >= 4 && (
        <div className="screen-enter" style={{ width: "100%", maxWidth: 420, marginTop: 20 }} onClick={(e) => e.stopPropagation()}>
          <DemoEndScreen createHref="/qaseeda/create" accentFrom={GOLD} accentTo={NAVY} />
        </div>
      )}
    </div>
  );
}
