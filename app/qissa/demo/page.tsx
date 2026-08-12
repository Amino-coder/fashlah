"use client";

import { useEffect, useState } from "react";
import { trackPageView } from "@/lib/trackPageView";
import { BookOpen, ChevronLeft } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoQissaRoundScreen from "@/components/demo/DemoQissaRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoQissa } from "@/lib/demo/useDemoQissa";

const ORANGE = "#FF8A3D";
const DEEP = "#E0409A";

export default function QissaDemoPage() {
  useEffect(() => { trackPageView("qissa_demo"); }, []);
  const engine = useDemoQissa("أنت", "😎");

  if (engine.phase === "done") {
    return <QissaDemoReveal stories={engine.stories} />;
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label="الصفحة الرئيسية" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", marginTop: 40, textTransform: "uppercase" }}>
          وضع التجربة
        </p>
        <DemoQissaRoundScreen engine={engine} />
      </div>
    </div>
  );
}

type Story = { storyIndex: number; lines: { sentence: string; author: string }[] };

/**
 * Mirrors قصة's real FinalReveal.tsx stage-for-stage: same fixed
 * full-screen overlay, same gradient background, same "خلصنا! شوفوا وش
 * صار" cheer, same story-seg swipeable progress bar, same per-sentence
 * auto-pace-with-tap-to-skip reveal, same "written by" per-line captions,
 * same "Next Story" button gated behind authors being shown.
 */
function QissaDemoReveal({ stories }: { stories: Story[] }) {
  const [stage, setStage] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [authorsShown, setAuthorsShown] = useState(false);

  const totalStories = stories.length;
  const currentStory = stories[storyIdx];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage !== 2 || !currentStory) return;
    if (revealedCount < currentStory.lines.length) {
      const id = setTimeout(() => setRevealedCount((v) => v + 1), 1600);
      return () => clearTimeout(id);
    }
    if (!authorsShown) {
      const id = setTimeout(() => setAuthorsShown(true), 1200);
      return () => clearTimeout(id);
    }
  }, [stage, currentStory, revealedCount, authorsShown]);

  function advance() {
    if (stage !== 2 || !currentStory) return;
    if (revealedCount < currentStory.lines.length) { setRevealedCount((v) => v + 1); return; }
    if (!authorsShown) { setAuthorsShown(true); return; }
    goNextStory();
  }

  function goNextStory() {
    if (storyIdx + 1 >= totalStories) { setStage(3); return; }
    setStoryIdx((i) => i + 1);
    setRevealedCount(0);
    setAuthorsShown(false);
  }

  return (
    <div
      onClick={stage === 2 ? advance : undefined}
      className="screen-enter"
      style={{
        position: "fixed", inset: 0, zIndex: 40, overflowY: "auto",
        background: `linear-gradient(160deg, ${DEEP} 0%, #7C2D6B 55%, #2B0F26 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "64px 20px 40px", cursor: stage === 2 ? "pointer" : "default",
        color: "#FFF6EE",
      }}
    >
      {stage >= 3 && <HomeButton label="الصفحة الرئيسية" />}

      {stage < 2 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          {stage >= 1 ? (
            <p className="font-display pop" style={{ fontSize: 26, fontWeight: 800, margin: 0, textAlign: "center", maxWidth: 300 }}>
              خلصنا! شوفوا وش صار 📖
            </p>
          ) : (
            <div style={{ color: ORANGE }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
        </div>
      )}

      {stage === 2 && currentStory && (
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {stories.map((_, i) => (
              <div key={i} className="story-seg">
                <div className="story-seg-fill" style={{ width: i <= storyIdx ? "100%" : "0%", transition: "width .3s" }} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div key={storyIdx} className="pop" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={20} color={ORANGE} />
              <p className="font-quote" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: ORANGE }}>
                القصة {toArabicOrdinal(storyIdx + 1)}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
              {currentStory.lines.slice(0, revealedCount).map((line, i) => (
                <div key={i} className="pop">
                  <p className="font-quote" dir="rtl" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.75, margin: 0, textAlign: "center" }}>
                    {line.sentence || "( … )"}
                  </p>
                  {authorsShown && line.author && (
                    <p className="font-body pop" style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.55, margin: "4px 0 0", textAlign: "center" }}>
                      كتبها: {line.author}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {authorsShown && (
              <button
                onClick={(e) => { e.stopPropagation(); goNextStory(); }}
                className="font-display pop"
                style={{
                  display: "flex", alignItems: "center", gap: 6, marginTop: 10,
                  padding: "10px 22px", fontSize: 13, fontWeight: 800, borderRadius: 999, border: "none",
                  color: DEEP, background: ORANGE,
                }}
              >
                {storyIdx + 1 >= totalStories ? "خلصنا كل القصص!" : "القصة التالية"}
                <ChevronLeft size={15} />
              </button>
            )}

            {!(revealedCount >= currentStory.lines.length && authorsShown) && (
              <p className="font-body" style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>اضغط اي مكان عشان تكمل</p>
            )}
          </div>
        </div>
      )}

      {stage >= 3 && (
        <div className="screen-enter" style={{ width: "100%", maxWidth: 420, marginTop: 20 }} onClick={(e) => e.stopPropagation()}>
          <DemoEndScreen createHref="/qissa/create" accentFrom={ORANGE} accentTo={DEEP} />
        </div>
      )}
    </div>
  );
}

function toArabicOrdinal(n: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).split("").map((d) => digits[Number(d)]).join("");
}
