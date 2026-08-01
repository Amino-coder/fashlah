"use client";

import { useState } from "react";
import type { useDemoQissa } from "@/lib/demo/useDemoQissa";

type Engine = ReturnType<typeof useDemoQissa>;

const ORANGE = "#FF8A3D";
const DEEP = "#E0409A";

const PLACEHOLDERS_START = ["ابدأ قصتك من أي مكان…", "اكتب أول جملة تجيك في بالك.", "اكتب جملة وحدة بس."];
const PLACEHOLDERS_CONTINUE = ["وش صار بعدين؟", "حط مفاجأة.", "غيّر مسار القصة.", "وش صار فجأة؟"];

export default function DemoQissaRoundScreen({ engine }: { engine: Engine }) {
  const { round, totalRounds, phase, remaining, previousSentence, myAnswer, wroteCount, playerCount, submitHumanSentence } = engine;
  const [draft, setDraft] = useState("");
  const isFirstRound = round === 1;
  const [placeholder] = useState(() =>
    isFirstRound ? PLACEHOLDERS_START[Math.floor(Math.random() * PLACEHOLDERS_START.length)]
      : PLACEHOLDERS_CONTINUE[Math.floor(Math.random() * PLACEHOLDERS_CONTINUE.length)]
  );
  const isLastRound = round === totalRounds;

  if (phase === "countdown") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 60 }}>
        <div aria-hidden="true" style={{ width: 90, height: 90, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`, boxShadow: `0 10px 26px ${DEEP}55` }}>
          📖
        </div>
        <div key={remaining} className="font-display pop" style={{ fontSize: 70, fontWeight: 800, color: ORANGE, lineHeight: 1 }}>
          {remaining > 0 ? remaining : "يلا!"}
        </div>
      </div>
    );
  }

  if (phase === "passing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 80 }}>
        <div aria-hidden="true" className="pop" style={{ width: 80, height: 80, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`, fontSize: 34 }}>
          🔄
        </div>
        <p className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>قاعدين نخلط القصص</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{round} / {totalRounds}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="font-display" style={{ width: 48, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", background: remaining <= 5 ? "#E63946" : `linear-gradient(135deg, ${ORANGE}, ${DEEP})` }}>
          {remaining}
        </div>
      </div>

      {!myAnswer ? (
        <>
          {isLastRound ? (
            <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: 0, color: "#E63946" }}>
              🚨 هذي آخر جولة! خلّها نهاية مضحكة 😂
            </p>
          ) : isFirstRound ? (
            <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: 0 }}>ابدأ قصة جديدة ✨</p>
          ) : (
            <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: 0 }}>كمّل القصة بجملة وحدة ✍️</p>
          )}

          {!isFirstRound && (
            <div className="card pop" dir="rtl" style={{ padding: "18px 20px", textAlign: "center", border: `1.5px solid ${ORANGE}44` }}>
              <p className="font-quote" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.7, margin: 0, color: "var(--ink)" }}>
                {previousSentence || "…"}
              </p>
            </div>
          )}

          <div className="card" style={{ padding: 16 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 120))}
              rows={3}
              dir="rtl"
              placeholder={placeholder}
              autoFocus
              className="font-quote"
              style={{ width: "100%", padding: 12, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 17, outline: "none", resize: "none", fontFamily: "inherit", textAlign: "center" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span className="font-body" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{draft.length}/120</span>
              <button
                onClick={() => draft.trim() && submitHumanSentence(draft.trim())}
                disabled={!draft.trim()}
                className="font-display"
                style={{ padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff", background: draft.trim() ? `linear-gradient(135deg, ${ORANGE}, ${DEEP})` : "var(--ring)", opacity: draft.trim() ? 1 : 0.6 }}
              >
                إرسال
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>تم الإرسال! بانتظار الباقين...</p>
        </div>
      )}
      <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>{wroteCount}/{playerCount} كتبوا</p>
    </div>
  );
}
