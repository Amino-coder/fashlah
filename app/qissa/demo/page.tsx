"use client";

import { useState } from "react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoQissaRoundScreen from "@/components/demo/DemoQissaRoundScreen";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { useDemoQissa } from "@/lib/demo/useDemoQissa";

const ORANGE = "#FF8A3D";
const DEEP = "#E0409A";

export default function QissaDemoPage() {
  const engine = useDemoQissa("أنت", "😎");
  const [sawReveal, setSawReveal] = useState(false);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {engine.phase === "done" && sawReveal ? (
        <DemoEndScreen createHref="/qissa/create" accentFrom={ORANGE} accentTo={DEEP} />
      ) : engine.phase === "done" ? (
        <>
          <HomeButton label="الصفحة الرئيسية" />
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
            <p className="font-display pop" style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginTop: 50, marginBottom: 20 }}>
              خلصنا! شوفوا وش صار 📖
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {engine.stories.map((story) => (
                <div key={story.storyIndex} className="card pop" dir="rtl" style={{ padding: 18 }}>
                  <p className="font-quote" style={{ fontSize: 12, fontWeight: 800, color: ORANGE, margin: "0 0 10px", textAlign: "center" }}>
                    القصة {story.storyIndex + 1}
                  </p>
                  {story.lines.map((line, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <p className="font-quote" style={{ fontSize: 15, lineHeight: 1.7, margin: 0, textAlign: "center" }}>
                        {line.sentence || "( … )"}
                      </p>
                      <p className="font-body" style={{ fontSize: 10, opacity: 0.55, margin: "2px 0 0", textAlign: "center" }}>
                        كتبها: {line.author}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button
              onClick={() => setSawReveal(true)}
              className="font-display"
              style={{
                display: "block", width: "100%", marginTop: 24, padding: 16, fontSize: 15, borderRadius: 999, border: "none",
                color: "#fff", background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`,
              }}
            >
              التالي
            </button>
          </div>
        </>
      ) : (
        <>
          <HomeButton label="الصفحة الرئيسية" />
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
            <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", marginTop: 40, textTransform: "uppercase" }}>
              وضع التجربة
            </p>
            <DemoQissaRoundScreen engine={engine} />
          </div>
        </>
      )}
    </div>
  );
}
