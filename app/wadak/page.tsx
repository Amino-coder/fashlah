"use client";

import { useEffect, useMemo, useState } from "react";
import { Share2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import SaveResult from "@/components/auth/SaveResult";
import RadarChart from "@/components/wadak/RadarChart";
import { shareResultCard } from "@/components/wadak/exportResultCard";
import { trackPageView, trackPageComplete, trackPageEvent, newSessionKey } from "@/lib/trackPageView";
import {
  ROUND1_POOL, ROUND2_QUESTIONS, ROUND3_POOL, ROUND4_POOL,
  REACTION_AFTER_QUESTION, DIMENSION_LABELS, type Question,
} from "@/lib/wadak-content";
import { scoreAnswers, shuffle, type ScoreResult } from "@/lib/wadak-engine";

const TEAL = "#14B8A6";
const INDIGO = "#4C1D95";
const TOTAL_QUESTIONS = 4 + 4 + 3 + 4; // 15

type Stage = "intro" | "round1" | "round2" | "round3" | "round4" | "reaction" | "story";
type Selection = { questionId: string; optionId: string };

export default function WadakPage() {
  const [sessionKey] = useState(() => newSessionKey());
  useEffect(() => { trackPageView("wadak", sessionKey); }, [sessionKey]);
  const [stage, setStage] = useState<Stage>("intro");
  const [nickname, setNickname] = useState("");
  const [qInRound, setQInRound] = useState(0);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [reactionText, setReactionText] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [nextStageAfterReaction, setNextStageAfterReaction] = useState<Stage>("round1");

  // Shuffled once per playthrough, picked when the game starts.
  const round1 = useMemo(() => shuffle(ROUND1_POOL).slice(0, 4), []);
  const round3 = useMemo(() => shuffle(ROUND3_POOL).slice(0, 3), []);
  const round4 = useMemo(() => shuffle(ROUND4_POOL).slice(0, 4), []);
  const allAsked: Question[] = useMemo(() => [...round1, ...ROUND2_QUESTIONS, ...round3, ...round4], [round1, round3, round4]);

  function currentRoundQuestions(): Question[] {
    if (stage === "round1") return round1;
    if (stage === "round2") return ROUND2_QUESTIONS;
    if (stage === "round3") return round3;
    if (stage === "round4") return round4;
    return [];
  }

  function absoluteQuestionNumber(): number {
    if (stage === "round1") return qInRound + 1;
    if (stage === "round2") return 4 + qInRound + 1;
    if (stage === "round3") return 8 + qInRound + 1;
    if (stage === "round4") return 11 + qInRound + 1;
    return 0;
  }

  function pickOption(question: Question, optionId: string) {
    const nextSelections = [...selections, { questionId: question.id, optionId }];
    setSelections(nextSelections);

    const questionNumber = absoluteQuestionNumber();
    const isLastOverall = questionNumber >= TOTAL_QUESTIONS;
    const roundQs = currentRoundQuestions();
    const isLastOfRound = qInRound + 1 >= roundQs.length;

    let upcoming: Stage;
    if (isLastOverall) {
      const finalResult = scoreAnswers(allAsked, nextSelections);
      setResult(finalResult);
      trackPageComplete("wadak", sessionKey);
      upcoming = "story";
    } else if (isLastOfRound) {
      upcoming = stage === "round1" ? "round2" : stage === "round2" ? "round3" : "round4";
    } else {
      upcoming = stage;
    }

    const reactions = REACTION_AFTER_QUESTION[questionNumber];
    if (reactions && !isLastOverall) {
      setReactionText(reactions[Math.floor(Math.random() * reactions.length)]);
      setNextStageAfterReaction(upcoming);
      setStage("reaction");
      setTimeout(() => {
        setQInRound(isLastOfRound ? 0 : qInRound + 1);
        setStage(upcoming);
        setReactionText(null);
      }, 1300);
    } else {
      setQInRound(isLastOfRound ? 0 : qInRound + 1);
      setStage(upcoming);
    }
  }

  function restart() {
    setSelections([]);
    setQInRound(0);
    setResult(null);
    setStage("intro");
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      {stage !== "story" && <Blobs />}
      {stage !== "story" && <HomeButton label="الصفحة الرئيسية" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: stage === "story" ? 0 : "24px", position: "relative", zIndex: 1 }}>
        {stage === "intro" && <IntroScreen nickname={nickname} onNicknameChange={setNickname} onStart={() => setStage("round1")} />}

        {(stage === "round1" || stage === "round2" || stage === "round3" || stage === "round4") && (
          <RoundScreen
            key={`${stage}-${qInRound}`}
            stage={stage}
            question={currentRoundQuestions()[qInRound]}
            questionNumber={absoluteQuestionNumber()}
            onPick={(optionId) => pickOption(currentRoundQuestions()[qInRound], optionId)}
          />
        )}

        {stage === "reaction" && reactionText && <ReactionScreen text={reactionText} />}
      </div>

      {stage === "story" && result && (
        <StoryResults result={result} nickname={nickname} sessionKey={sessionKey} />
      )}
    </div>
  );
}

function IntroScreen({ nickname, onNicknameChange, onStart }: { nickname: string; onNicknameChange: (v: string) => void; onStart: () => void }) {
  return (
    <div className="screen-enter" style={{ textAlign: "center", marginTop: 70 }}>
      <div
        aria-hidden="true"
        className="pop"
        style={{
          width: 110, height: 110, borderRadius: 999, margin: "0 auto 20px",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52,
          background: `linear-gradient(135deg, ${TEAL}, ${INDIGO})`, boxShadow: `0 12px 30px ${INDIGO}55`,
        }}
      >
        👀
      </div>
      <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: "0 0 10px" }}>وش شخصيتك</h1>
      <p className="font-body" style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.7, margin: "0 0 4px" }}>
        جاوب على كم سؤال ونقول لك وش شخصيتك الحقيقية 😂
      </p>
      <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", opacity: 0.8, lineHeight: 1.7, margin: "0 0 28px" }}>
        لا تفكر كثير… جاوب زي ما بتتصرف فعلاً.
      </p>

      <input
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value.slice(0, 20))}
        placeholder="اسمك أو لقبك (اختياري)"
        dir="rtl"
        className="font-body"
        style={{
          width: "100%", padding: "14px 18px", borderRadius: 999, border: "2px solid var(--ring)",
          background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, textAlign: "center",
          marginBottom: 24, outline: "none",
        }}
      />

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
      <p className="font-body" style={{ fontSize: 12, color: "var(--ink-soft)", opacity: 0.6, marginTop: 16 }}>
        {TOTAL_QUESTIONS} سؤال بس، أربع جولات، تاخذ أقل من ٣ دقايق
      </p>
    </div>
  );
}

const ROUND_TITLES: Record<string, string> = {
  round1: "الجولة ١ — عنك",
  round2: "الجولة ٢ — مواقف",
  round3: "الجولة ٣ — آراء جريئة",
  round4: "الجولة ٤ — وش تختار؟",
};

function RoundScreen({ stage, question, questionNumber, onPick }: { stage: string; question: Question; questionNumber: number; onPick: (optionId: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  if (!question) return null;

  function handlePick(optionId: string) {
    if (picked) return;
    setPicked(optionId);
    setTimeout(() => onPick(optionId), 260);
  }

  const isHotTake = stage === "round3";
  const isWYR = stage === "round4";
  const isTraitQuiz = stage === "round1";

  return (
    <div className="screen-enter" style={{ marginTop: 20 }}>
      <p className="font-body" style={{ fontSize: 12.5, fontWeight: 700, color: TEAL, marginBottom: 4 }}>{ROUND_TITLES[stage]}</p>
      <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
        سؤال {questionNumber} من {TOTAL_QUESTIONS}
      </p>
      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${((questionNumber - 1) / TOTAL_QUESTIONS) * 100}%`, background: `linear-gradient(90deg, ${TEAL}, ${INDIGO})` }} />
      </div>

      <div className="card pop" style={{ padding: 26, marginBottom: 20, textAlign: "center" }}>
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.6, margin: 0 }}>
          {question.prompt}
        </h2>
      </div>

      {isTraitQuiz && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {question.options.map((opt) => (
            <button
              key={opt.id} onClick={() => handlePick(opt.id)} disabled={!!picked}
              style={{
                padding: "18px 8px", borderRadius: 18, border: "2px solid var(--ring)",
                background: picked === opt.id ? `linear-gradient(135deg, ${TEAL}, ${INDIGO})` : "var(--card)",
                color: picked === opt.id ? "#fff" : "var(--ink)",
                display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
                opacity: picked && picked !== opt.id ? 0.5 : 1,
              }}
            >
              {opt.emoji && <span style={{ fontSize: 26 }}>{opt.emoji}</span>}
              <span className="font-body" style={{ fontWeight: 700, fontSize: 12.5 }}>{opt.text}</span>
            </button>
          ))}
        </div>
      )}

      {isHotTake && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {question.options.map((opt) => (
            <button
              key={opt.id} onClick={() => handlePick(opt.id)} disabled={!!picked}
              className="font-display"
              style={{
                padding: "18px 8px", borderRadius: 18, border: "2px solid var(--ring)",
                background: picked === opt.id ? (opt.id === "agree" ? "linear-gradient(135deg, #2EE6A6, #7C3AED)" : `linear-gradient(135deg, ${TEAL}, ${INDIGO})`) : "var(--card)",
                color: picked === opt.id ? "#fff" : "var(--ink)", fontWeight: 800,
                opacity: picked && picked !== opt.id ? 0.5 : 1,
              }}
            >
              {opt.id === "agree" ? "👍 " : "👎 "}{opt.text}
            </button>
          ))}
        </div>
      )}

      {isWYR && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {question.options.map((opt) => (
            <button
              key={opt.id} onClick={() => handlePick(opt.id)} disabled={!!picked}
              style={{
                padding: "22px 8px", borderRadius: 18, border: "2px solid var(--ring)",
                background: picked === opt.id ? `linear-gradient(135deg, ${TEAL}, ${INDIGO})` : "var(--card)",
                color: picked === opt.id ? "#fff" : "var(--ink)",
                display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
                opacity: picked && picked !== opt.id ? 0.5 : 1,
              }}
            >
              {opt.emoji && <span style={{ fontSize: 30 }}>{opt.emoji}</span>}
              <span className="font-body" style={{ fontWeight: 700, fontSize: 13 }}>{opt.text}</span>
            </button>
          ))}
        </div>
      )}

      {stage === "round2" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {question.options.map((opt) => (
            <button
              key={opt.id} onClick={() => handlePick(opt.id)} disabled={!!picked}
              className="font-body"
              style={{
                padding: "16px 20px", borderRadius: 18, border: "2px solid var(--ring)", textAlign: "start",
                background: picked === opt.id ? `linear-gradient(135deg, ${TEAL}, ${INDIGO})` : "var(--card)",
                color: picked === opt.id ? "#fff" : "var(--ink)",
                fontSize: 14.5, fontWeight: 600, lineHeight: 1.6,
                opacity: picked && picked !== opt.id ? 0.45 : 1,
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReactionScreen({ text }: { text: string }) {
  return (
    <div className="screen-enter" style={{ marginTop: 200, textAlign: "center" }}>
      <p className="font-display pop" style={{ fontSize: 24, fontWeight: 800, color: TEAL }}>{text}</p>
    </div>
  );
}

/* ─────────────────────────── Story-style results ─────────────────────────── */

const BG_COLORS = [TEAL, "#7C3AED", "#FF8A3D", INDIGO];

function StoryResults({ result, nickname, sessionKey }: { result: ScoreResult; nickname: string; sessionKey: string }) {
  const { archetype, ranked } = result;
  const [slide, setSlide] = useState(0);
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");

  async function handleShare() {
    setShareState("working");
    const res = await shareResultCard(archetype, result, nickname);
    if (res === "shared" || res === "downloaded") trackPageEvent("wadak", `share_result_${res}`, sessionKey);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  const slides = [
    {
      key: "intro",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 15, fontWeight: 700, opacity: 0.85 }}>وش شخصيتك</p>
          <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: "10px 0" }}>
            {nickname.trim() ? `طيب يا ${nickname.trim()}...` : "طيب..."} جاهزين نطلع لك شخصيتك؟ 👀
          </h2>
        </>
      ),
    },
    {
      key: "reveal",
      render: () => (
        <>
          <span style={{ fontSize: 90, display: "block", marginBottom: 14 }}>{archetype.emoji}</span>
          <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>{archetype.name}</h2>
          <p className="font-body" style={{ fontSize: 16, fontWeight: 700, opacity: 0.9 }}>{archetype.cardLine}</p>
        </>
      ),
    },
    {
      key: "radar",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 10 }}>الإحصائيات</p>
          <RadarChart percentages={result.percentages} size={320} />
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, marginTop: 14 }}>
            أعلى صفة: {DIMENSION_LABELS[ranked[0].dimension]} ({ranked[0].percentage}%)
          </p>
        </>
      ),
    },
    {
      key: "description",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginBottom: 14 }}>عنك بالضبط</p>
          <p className="font-body" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.9 }}>{archetype.description}</p>
        </>
      ),
    },
    {
      key: "strengths",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>💪 نقاط قوتك</p>
          {archetype.strengths.map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 14, marginBottom: 12, width: "100%" }}>
              <p className="font-body" style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>{s}</p>
            </div>
          ))}
        </>
      ),
    },
    {
      key: "flaw",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>💀 أكبر عيب في شخصيتك</p>
          <p className="font-body" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.8 }}>{archetype.flaw}</p>
        </>
      ),
    },
    {
      key: "truth",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>👀 الحقيقة اللي ما تبي تسمعها</p>
          <p className="font-body" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.8 }}>{archetype.truth}</p>
        </>
      ),
    },
    {
      key: "share",
      render: () => (
        <div style={{ width: "100%", position: "relative", zIndex: 3 }} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: 50, display: "block", marginBottom: 12 }}>🌿</span>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>خلصنا! شارك وضعك</h2>

          {/* Line 1 — شارك النتيجة, primary */}
          <button
            onClick={handleShare}
            disabled={shareState === "working"}
            className="font-display"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: INDIGO, background: CREAM_HEX, marginBottom: 14,
            }}
          >
            {shareState === "shared" || shareState === "downloaded" ? <Check size={18} /> : <Share2 size={18} />}
            {shareState === "working" ? "جاري التجهيز..." : shareState === "shared" ? "تم!" : shareState === "downloaded" ? "انحفظت الصورة!" : "شارك النتيجة"}
          </button>

          {/* Line 2 — العب مرة ثانية + العب فشلة, equal pair. Both real
              <a> tags, not next/link's <Link> — العب مرة ثانية's target
              is this exact page, and Next's client router doesn't remount
              a page navigating to its own current route, so nothing would
              actually restart or re-count as a new play with Link/router
              here; a real anchor forces a genuine browser navigation,
              guaranteed correct. فشلة uses the same tag for the same
              reliability guarantee, even though a different-route Link
              would likely already work. */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <a
              href="/wadak"
              className="font-body"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "11px 8px", borderRadius: 999, textDecoration: "none",
                border: "2px solid rgba(255,255,255,0.4)", color: "#fff", background: "transparent",
                fontWeight: 800, fontSize: 12.5, textAlign: "center",
              }}
            >
              🔁 العب مرة ثانية
            </a>
            <a
              href="/fashlah"
              className="font-body"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "11px 8px", borderRadius: 999, textDecoration: "none",
                border: "none", color: "#fff", background: "linear-gradient(135deg, #FF2E93, #7C3AED)",
                fontWeight: 800, fontSize: 12.5, textAlign: "center",
              }}
            >
              🌿 العب فشلة
            </a>
          </div>

          <p className="font-body" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.7, margin: "0 0 14px", opacity: 0.75, textAlign: "center" }}>
            تبي تقيم اصحابك؟ العب فشلة معاهم واكتشف شخصياتهم 😂
          </p>

          {/* Line 3 — احفظ النتيجة, quiet */}
          <SaveResult
            game="wadak"
            lang="ar"
            resultSummary={`${archetype.emoji} شخصيتي: ${archetype.name}`}
          />
        </div>
      ),
    },
  ];

  const total = slides.length;
  const bg = BG_COLORS[slide % BG_COLORS.length];

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed", inset: 0, background: bg, transition: "background .5s ease",
        zIndex: 10, display: "flex", flexDirection: "column", color: "white",
        maxWidth: 480, margin: "0 auto", overflow: "hidden",
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <HomeButton label="الصفحة الرئيسية" />
      </div>

      <div style={{ display: "flex", gap: 6, padding: "16px 16px 0" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="story-seg">
            <div className="story-seg-fill" style={{ width: i <= slide ? "100%" : "0%", transition: "width .3s" }} />
          </div>
        ))}
      </div>

      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const isBack = clickX < rect.width * 0.35;
          setSlide((s) => (isBack ? Math.max(0, s - 1) : Math.min(total - 1, s + 1)));
        }}
        style={{ position: "absolute", inset: 0, top: 30, cursor: "pointer", zIndex: 1 }}
      />

      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 16px", pointerEvents: "none", zIndex: 2 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setSlide((s) => Math.max(0, s - 1)); }}
          disabled={slide === 0}
          style={{ pointerEvents: "auto", width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.2)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", opacity: slide === 0 ? 0.3 : 1 }}
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setSlide((s) => Math.min(total - 1, s + 1)); }}
          disabled={slide === total - 1}
          style={{ pointerEvents: "auto", width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.2)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", opacity: slide === total - 1 ? 0.3 : 1 }}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div
        key={slide}
        className="pop"
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}
      >
        {slides[slide].render()}
      </div>
    </div>
  );
}

const CREAM_HEX = "#FFF9F0";
