"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, Check, RotateCcw } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { usePrefs } from "@/lib/usePrefs";
import { QUESTIONS, REACTION_AFTER_QUESTION, DIMENSION_LABELS } from "@/lib/wadak-content";
import { scoreAnswers, type ScoreResult } from "@/lib/wadak-engine";
import { shareResultCard } from "@/components/wadak/exportResultCard";

const TEAL = "#14B8A6";
const INDIGO = "#4C1D95";

type Stage = "intro" | "question" | "reaction" | "result";
type Selection = { questionId: string; optionId: string };

export default function WadakPage() {
  const { lang } = usePrefs();
  const [stage, setStage] = useState<Stage>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [reactionText, setReactionText] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  function pickOption(optionId: string) {
    const question = QUESTIONS[qIndex];
    const nextSelections = [...selections, { questionId: question.id, optionId }];
    setSelections(nextSelections);

    const questionNumber = qIndex + 1;
    const reactions = REACTION_AFTER_QUESTION[questionNumber];

    if (questionNumber >= QUESTIONS.length) {
      setResult(scoreAnswers(nextSelections));
      setStage("result");
      return;
    }

    if (reactions) {
      setReactionText(reactions[Math.floor(Math.random() * reactions.length)]);
      setStage("reaction");
      setTimeout(() => {
        setQIndex((i) => i + 1);
        setStage("question");
        setReactionText(null);
      }, 1400);
    } else {
      setQIndex((i) => i + 1);
    }
  }

  function restart() {
    setSelections([]);
    setQIndex(0);
    setResult(null);
    setStage("intro");
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={lang === "ar" ? "الصفحة الرئيسية" : "Home"} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {stage === "intro" && <IntroScreen onStart={() => setStage("question")} />}
        {stage === "question" && (
          <QuestionScreen
            index={qIndex}
            total={QUESTIONS.length}
            onPick={pickOption}
          />
        )}
        {stage === "reaction" && reactionText && <ReactionScreen text={reactionText} />}
        {stage === "result" && result && <ResultScreen result={result} onRestart={restart} />}
      </div>
    </div>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen-enter" style={{ textAlign: "center", marginTop: 90 }}>
      <div
        aria-hidden="true"
        className="pop"
        style={{
          width: 120, height: 120, borderRadius: 999, margin: "0 auto 24px",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 58,
          background: `linear-gradient(135deg, ${TEAL}, ${INDIGO})`, boxShadow: `0 12px 30px ${INDIGO}55`,
        }}
      >
        👀
      </div>
      <h1 className="font-display" style={{ fontSize: 34, fontWeight: 800, margin: "0 0 12px" }}>
        وش وضعك؟
      </h1>
      <p className="font-body" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.7, margin: "0 0 6px" }}>
        جاوب على كم سؤال ونقول لك وش شخصيتك الحقيقية 😂
      </p>
      <p className="font-body" style={{ fontSize: 14, color: "var(--ink-soft)", opacity: 0.8, lineHeight: 1.7, margin: "0 0 40px" }}>
        لا تفكر كثير… جاوب زي ما بتتصرف فعلاً.
      </p>
      <button
        onClick={onStart}
        className="font-display"
        style={{
          padding: "18px 48px", fontSize: 17, borderRadius: 999, border: "none", color: "#fff",
          background: `linear-gradient(135deg, ${TEAL}, ${INDIGO})`, boxShadow: `0 10px 24px ${INDIGO}44`,
        }}
      >
        يلا ابدأ
      </button>
      <p className="font-body" style={{ fontSize: 12, color: "var(--ink-soft)", opacity: 0.6, marginTop: 18 }}>
        {QUESTIONS.length} أسئلة بس، تاخذ أقل من دقيقتين
      </p>
    </div>
  );
}

function QuestionScreen({ index, total, onPick }: { index: number; total: number; onPick: (optionId: string) => void }) {
  const question = QUESTIONS[index];
  const [picked, setPicked] = useState<string | null>(null);

  function handlePick(optionId: string) {
    if (picked) return;
    setPicked(optionId);
    setTimeout(() => onPick(optionId), 260);
  }

  return (
    <div key={question.id} className="screen-enter" style={{ marginTop: 30 }}>
      <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
        سؤال {index + 1} من {total}
      </p>
      <div className="progress-track" style={{ marginBottom: 28 }}>
        <div className="progress-fill" style={{ width: `${(index / total) * 100}%`, background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})` }} />
      </div>

      <div className="card pop" style={{ padding: 28, marginBottom: 22 }}>
        <h2 className="font-display" style={{ fontSize: 21, fontWeight: 800, textAlign: "center", lineHeight: 1.6, margin: 0 }}>
          {question.prompt}
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {question.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handlePick(opt.id)}
            disabled={!!picked}
            className="font-body"
            style={{
              padding: "16px 20px", borderRadius: 18, border: "2px solid var(--ring)", textAlign: "start",
              background: picked === opt.id ? `linear-gradient(135deg, ${TEAL}, ${INDIGO})` : "var(--card)",
              color: picked === opt.id ? "#fff" : "var(--ink)",
              fontSize: 14.5, fontWeight: 600, lineHeight: 1.6,
              opacity: picked && picked !== opt.id ? 0.45 : 1,
              transition: "opacity .2s, background .2s",
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReactionScreen({ text }: { text: string }) {
  return (
    <div className="screen-enter" style={{ marginTop: 200, textAlign: "center" }}>
      <p className="font-display pop" style={{ fontSize: 24, fontWeight: 800, color: TEAL }}>
        {text}
      </p>
    </div>
  );
}

function ResultScreen({ result, onRestart }: { result: ScoreResult; onRestart: () => void }) {
  const { archetype, ranked } = result;
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");

  async function handleShare() {
    setShareState("working");
    const res = await shareResultCard(archetype, result);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  return (
    <div className="screen-enter" style={{ paddingBottom: 40 }}>
      <p className="font-body" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginTop: 20 }}>
        وش وضعك؟
      </p>

      <div
        className="card pop"
        style={{
          marginTop: 14, padding: "36px 24px", textAlign: "center", borderRadius: 32,
          background: `linear-gradient(135deg, ${TEAL}, ${INDIGO})`, color: "#fff",
        }}
      >
        <span style={{ fontSize: 72, display: "block", marginBottom: 8 }}>{archetype.emoji}</span>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 6px" }}>
          {archetype.name}
        </h1>
        <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, margin: 0 }}>
          {archetype.cardLine}
        </p>
      </div>

      <div className="card pop" style={{ marginTop: 18, padding: 22 }}>
        <p className="font-body" style={{ fontSize: 11, fontWeight: 800, color: TEAL, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
          الإحصائيات
        </p>
        {ranked.map((stat) => (
          <div key={stat.dimension} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="font-body" style={{ fontSize: 13, fontWeight: 700 }}>{DIMENSION_LABELS[stat.dimension]}</span>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: INDIGO }}>{stat.percentage}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stat.percentage}%`, background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card pop" style={{ marginTop: 18, padding: 22 }}>
        <p className="font-body" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.8, margin: 0 }}>
          {archetype.description}
        </p>
      </div>

      <div className="card pop" style={{ marginTop: 18, padding: 22 }}>
        <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: TEAL, marginBottom: 10 }}>
          💪 نقاط قوتك
        </p>
        {archetype.strengths.map((s, i) => (
          <p key={i} className="font-body" style={{ fontSize: 13.5, fontWeight: 600, margin: "0 0 6px", lineHeight: 1.7 }}>
            • {s}
          </p>
        ))}
      </div>

      <div className="card pop" style={{ marginTop: 18, padding: 22 }}>
        <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "#E63946", marginBottom: 8 }}>
          💀 أكبر عيب في شخصيتك
        </p>
        <p className="font-body" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
          {archetype.flaw}
        </p>
      </div>

      <div className="card pop" style={{ marginTop: 18, padding: 22 }}>
        <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: INDIGO, marginBottom: 8 }}>
          👀 الحقيقة اللي ما تبي تسمعها
        </p>
        <p className="font-body" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
          {archetype.truth}
        </p>
      </div>

      <button
        onClick={handleShare}
        disabled={shareState === "working"}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 22,
          padding: 17, fontSize: 15.5, borderRadius: 999, border: "none", color: "#fff",
          background: `linear-gradient(135deg, ${TEAL}, ${INDIGO})`,
        }}
      >
        {shareState === "shared" || shareState === "downloaded" ? <Check size={18} /> : <Share2 size={18} />}
        {shareState === "working" ? "جاري التجهيز..." : shareState === "shared" ? "تم!" : shareState === "downloaded" ? "انحفظت الصورة!" : "شارك نتيجتك"}
      </button>

      <button
        onClick={onRestart}
        className="font-body"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10,
          padding: 13, fontSize: 13, borderRadius: 999, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink-soft)", fontWeight: 700,
        }}
      >
        <RotateCcw size={14} />
        جرب مرة ثانية
      </button>

      {/* Bridge to multiplayer */}
      <div className="card pop" style={{ marginTop: 28, padding: 24, textAlign: "center" }}>
        <p className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>
          طيب… هل أصحابك يشوفونك بنفس الطريقة؟ 👀
        </p>
        <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", fontWeight: 600, lineHeight: 1.7, margin: "0 0 18px" }}>
          تبي تقيم اصحابك؟ العب معاهم فشلة واكتشف شخصياتهم، مين الرئيس، مين الدافور، ومين الفشلة الرسمية 😂
        </p>
        <Link
          href="/fashlah"
          className="font-display"
          style={{
            display: "inline-block", padding: "15px 36px", fontSize: 15, borderRadius: 999, border: "none",
            color: "#fff", background: "linear-gradient(135deg, #FF2E93, #7C3AED)",
          }}
        >
          العب مع أصحابك
        </Link>
      </div>
    </div>
  );
}
