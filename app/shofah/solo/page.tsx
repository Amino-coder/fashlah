"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Share2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import NiqabGirl from "@/components/shofah/NiqabGirl";
import ShemaghGuy from "@/components/shofah/ShemaghGuy";
import { ROUND1_POOL } from "@/lib/wadak-content";
import { shareShofahSoloCard } from "@/components/shofah-solo/exportSoloCard";
import type { ShofahCharacter } from "@/lib/shofah-types";

const ROSE = "#E63946";
const WINE = "#C2185B";
const TOTAL_ROUNDS = 5; // same as the real game

type PromptRow = { text_ar: string; category: string };
type WarmupAnswer = { questionId: string; optionId: string };

// The real warm-up prompts ("مين آخر شخص ممكن يتزوج", "مين بيكون اكبر
// سيمب") are all GROUP-comparison questions with no one to compare
// against in solo mode. Reusing وش شخصيتك's real Round 1 pool instead —
// same content already proven to work standing alone. One option per
// question reads as the "put-together / ready" answer; the marriage
// verdict is the count of those picks, same threshold logic as before,
// just driven by richer questions now.
const LUCKY_OPTION_BY_QUESTION: Record<string, string> = {
  r1_mood: "c",        // مرتاح
  r1_mornings: "a",     // أصحى بدري
  r1_groupchats: "a",   // أرد فوراً
  r1_exams: "a",        // أذاكر من أسابيع
  r1_room: "a",         // نظيفة ومرتبة
  r1_weekend: "a",      // جدول مليان
};
const MAX_LUCKY = Object.keys(LUCKY_OPTION_BY_QUESTION).length;
const MARRIED_THRESHOLD = 4;

type Stage = "loading" | "warmup" | "writing" | "conversation" | "drumroll" | "verdict";

export default function ShofahSoloPage() {
  return (
    <Suspense fallback={null}>
      <ShofahSolo />
    </Suspense>
  );
}

function ShofahSolo() {
  const { lang, dark, ready } = usePrefs();
  const searchParams = useSearchParams();
  const character = (searchParams.get("character") as ShofahCharacter) || "guy";

  const [stage, setStage] = useState<Stage>("loading");
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Warm-up (وش شخصيتك Round 1 questions)
  const [warmupQuestions] = useState(() => [...ROUND1_POOL].sort(() => Math.random() - 0.5));
  const [wIdx, setWIdx] = useState(0);
  const [warmupAnswers, setWarmupAnswers] = useState<WarmupAnswer[]>([]);

  // Real rounds
  const [round, setRound] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("shofah_prompts")
          .select("text_ar, category")
          .eq("active", true)
          .or(`audience.is.null,audience.eq.${character}`);
        if (err || !data || data.length < TOTAL_ROUNDS) throw err || new Error("not enough prompts");
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
        setPrompts(shuffled);
      } catch {
        setError(lang === "ar" ? "ما قدرنا نجهز الأسئلة، حاول مرة ثانية" : "Couldn't load questions, try again");
      } finally {
        setStage("warmup");
      }
    })();
  }, [ready, character, lang]);

  function answerWarmup(optionId: string) {
    setWarmupAnswers((a) => [...a, { questionId: warmupQuestions[wIdx].id, optionId }]);
    if (wIdx + 1 < warmupQuestions.length) setWIdx((i) => i + 1);
    else setStage("writing");
  }

  function submitAnswer() {
    setAnswers((a) => [...a, draft.trim()]);
    setDraft("");
    if (round + 1 < TOTAL_ROUNDS) setRound((r) => r + 1);
    else setStage("conversation");
  }

  const luckyCount = warmupAnswers.filter((a) => LUCKY_OPTION_BY_QUESTION[a.questionId] === a.optionId).length;
  const married = luckyCount >= MARRIED_THRESHOLD;

  if (!ready) return null;
  const Character = character === "girl" ? NiqabGirl : ShemaghGuy;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      {stage !== "conversation" && stage !== "drumroll" && <Blobs />}
      {stage !== "conversation" && stage !== "drumroll" && <HomeButton label={lang === "ar" ? "الصفحة الرئيسية" : "Home"} href="/shofah" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: stage === "conversation" || stage === "drumroll" ? 0 : "24px", position: "relative", zIndex: 1 }}>
        {error && (
          <p className="font-body" style={{ color: "#E63946", fontWeight: 700, textAlign: "center", marginTop: 100 }}>{error}</p>
        )}

        {!error && stage === "loading" && (
          <div style={{ textAlign: "center", marginTop: 120, color: ROSE }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}

        {!error && stage === "warmup" && warmupQuestions[wIdx] && (
          <div className="screen-enter" style={{ marginTop: 30, textAlign: "center" }}>
            <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>
              {lang === "ar" ? "🔥 جولة تسخين" : "🔥 Warm-up"}
            </p>
            <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 20 }}>
              {wIdx + 1} / {warmupQuestions.length}
            </p>
            <div className="card pop" key={wIdx} style={{ padding: 26, marginBottom: 20 }}>
              <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{warmupQuestions[wIdx].prompt}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {warmupQuestions[wIdx].options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => answerWarmup(opt.id)}
                  style={{
                    padding: "18px 8px", borderRadius: 18, border: "2px solid var(--ring)", background: "var(--card)",
                    display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
                  }}
                >
                  {opt.emoji && <span style={{ fontSize: 26 }}>{opt.emoji}</span>}
                  <span className="font-body" style={{ fontWeight: 700, fontSize: 12.5 }}>{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!error && stage === "writing" && prompts[round] && (
          <div className="screen-enter" style={{ marginTop: 30 }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <Character size={90} />
            </div>
            <p className="font-body" style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
              {round + 1} / {TOTAL_ROUNDS}
            </p>
            <div className="progress-track" style={{ marginBottom: 20 }}>
              <div className="progress-fill" style={{ width: `${(round / TOTAL_ROUNDS) * 100}%`, background: `linear-gradient(90deg, ${ROSE}, ${WINE})` }} />
            </div>
            <div className="card pop" key={round} style={{ padding: 26, textAlign: "center", marginBottom: 20 }}>
              <h2 className="font-display" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.6, margin: 0 }}>{prompts[round].text_ar}</h2>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 140))}
              placeholder={lang === "ar" ? "اكتب جوابك..." : "Write your answer..."}
              dir="rtl"
              rows={3}
              autoFocus
              className="font-quote"
              style={{
                width: "100%", padding: 14, borderRadius: 16, border: "2px solid var(--ring)",
                background: "var(--card)", color: "var(--ink)", fontSize: 16, outline: "none", resize: "none",
                textAlign: "center", fontFamily: "inherit", marginBottom: 16,
              }}
            />
            <button
              onClick={submitAnswer}
              disabled={!draft.trim()}
              className="font-display"
              style={{
                display: "block", width: "100%", padding: 17, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${ROSE}, ${WINE})`, opacity: draft.trim() ? 1 : 0.5,
              }}
            >
              {lang === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        )}

        {!error && stage === "conversation" && (
          <ConversationReveal
            character={character} answers={answers} prompts={prompts} lang={lang}
            onDone={() => setStage("drumroll")}
          />
        )}

        {!error && stage === "drumroll" && (
          <DrumrollVerdict married={married} character={character} lang={lang} onDone={() => setStage("verdict")} />
        )}

        {!error && stage === "verdict" && (
          <SoloVerdict character={character} answers={answers} prompts={prompts} luckyCount={luckyCount} married={married} lang={lang} />
        )}
      </div>
    </div>
  );
}

/** Mirrors FinalConversation.tsx's visual language — character avatar +
 *  chat bubbles — but replaying the SOLO player's own 5 answers as a
 *  conversation with themselves, one prompt/answer pair at a time, since
 *  there's no round "winner" to reveal without other players. */
function ConversationReveal({
  character, answers, prompts, lang, onDone,
}: {
  character: ShofahCharacter; answers: string[]; prompts: PromptRow[]; lang: string; onDone: () => void;
}) {
  const ar = lang === "ar";
  const Character = character === "girl" ? NiqabGirl : ShemaghGuy;
  const totalMessages = prompts.length * 2; // prompt + answer, per round
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= totalMessages) {
      const id = setTimeout(onDone, 1400);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setVisibleCount((v) => v + 1), 1100);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount, totalMessages]);

  function revealNext() {
    setVisibleCount((v) => Math.min(v + 1, totalMessages));
  }

  const beats: { fromMe: boolean; text: string }[] = [];
  prompts.forEach((p, i) => {
    beats.push({ fromMe: false, text: p.text_ar });
    beats.push({ fromMe: true, text: answers[i] || (ar ? "(فاضي)" : "(blank)") });
  });

  return (
    <div onClick={revealNext} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20, cursor: "pointer", minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ textAlign: "center" }}>
        <Character size={70} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {beats.slice(0, visibleCount).map((b, i) => (
          <div key={i} className="pop" style={{ display: "flex", justifyContent: b.fromMe ? "flex-end" : "flex-start" }}>
            <div
              className="font-body"
              style={{
                maxWidth: "78%", padding: "10px 16px", borderRadius: 18, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                background: b.fromMe ? `linear-gradient(135deg, ${ROSE}, ${WINE})` : "var(--card)",
                color: b.fromMe ? "#fff" : "var(--ink)",
                borderBottomLeftRadius: b.fromMe ? 18 : 4,
                borderBottomRightRadius: b.fromMe ? 4 : 18,
              }}
            >
              {b.text}
            </div>
          </div>
        ))}
      </div>
      {visibleCount < totalMessages && (
        <p className="font-body" style={{ textAlign: "center", fontSize: 11, color: "var(--ink-soft)", opacity: 0.6, marginTop: 10 }}>
          {ar ? "اضغط اي مكان عشان تكمل" : "Tap anywhere to continue"}
        </p>
      )}
    </div>
  );
}

/** Mirrors FinalReveal.tsx's staged drumroll beats and timing exactly:
 *  emoji pulse → "بعد التفكير..." → "الحكم..." → big reveal. */
function DrumrollVerdict({
  married, character, lang, onDone,
}: {
  married: boolean; character: ShofahCharacter; lang: string; onDone: () => void;
}) {
  const ar = lang === "ar";
  const Character = character === "girl" ? NiqabGirl : ShemaghGuy;
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1400),
      setTimeout(() => setStage(2), 3000),
      setTimeout(() => setStage(3), 4600),
      setTimeout(onDone, 7600),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, textAlign: "center", padding: 24 }}>
      <div className="pop" style={{ fontSize: 70 }}>💖</div>
      {stage >= 1 && (
        <p className="font-display pop" style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-soft)" }}>
          {ar ? "بعد التفكير..." : "After giving it some thought..."}
        </p>
      )}
      {stage >= 2 && (
        <p className="font-display pop" style={{ fontSize: 20, fontWeight: 800, color: ROSE }}>
          {ar ? "الحكم..." : "The verdict..."}
        </p>
      )}
      {stage >= 3 && (
        <>
          <div className="pop" style={{ fontSize: 50 }}>🎆</div>
          <div className="pop"><Character size={90} /></div>
          <p className="font-display pop" style={{ fontSize: 30, fontWeight: 800, color: "#FFD400" }}>
            {married ? (ar ? "💍 مبروك!" : "💍 Congrats!") : (ar ? "😅 ما انكتب نصيب" : "😅 Not this time")}
          </p>
        </>
      )}
      {stage < 2 && (
        <div style={{ color: "var(--ink-soft)" }}>
          <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
        </div>
      )}
    </div>
  );
}

function SoloVerdict({
  character, answers, prompts, luckyCount, married, lang,
}: {
  character: ShofahCharacter; answers: string[]; prompts: PromptRow[]; luckyCount: number; married: boolean; lang: string;
}) {
  const ar = lang === "ar";
  const Character = character === "girl" ? NiqabGirl : ShemaghGuy;
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");

  async function handleShare() {
    setShareState("working");
    const res = await shareShofahSoloCard(married, luckyCount, MAX_LUCKY);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  return (
    <div className="screen-enter" style={{ marginTop: 30, textAlign: "center", paddingBottom: 30 }}>
      <span className="pop" style={{ fontSize: 60, display: "block", marginBottom: 8 }}>{married ? "💍" : "😅"}</span>
      <div style={{ marginBottom: 10 }}><Character size={100} /></div>
      <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        {married ? (ar ? "مبروك! انكتب لك نصيب 🎉" : "Congrats! It's written 🎉") : (ar ? "ما انكتب نصيب... بعدها 😅" : "Not this time... 😅")}
      </h1>
      <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 28 }}>
        {ar ? `الحظ وقف معك بـ ${luckyCount}/${MAX_LUCKY} من علامات اليوم` : `Luck was with you in ${luckyCount}/${MAX_LUCKY} of today's signs`}
      </p>

      <div className="card pop" style={{ padding: 20, marginBottom: 24, textAlign: "start" }}>
        <p className="font-body" style={{ fontSize: 11, fontWeight: 800, color: ROSE, marginBottom: 12, textTransform: "uppercase" }}>
          {ar ? "إجاباتك" : "Your Answers"}
        </p>
        {answers.map((a, i) => (
          <div key={i} style={{ marginBottom: i < answers.length - 1 ? 12 : 0 }}>
            <p className="font-body" style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700, margin: "0 0 2px" }}>{prompts[i]?.text_ar}</p>
            <p className="font-display" style={{ fontSize: 14.5, fontWeight: 800, margin: 0 }}>{a || (ar ? "(فاضي)" : "(blank)")}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleShare}
        disabled={shareState === "working"}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 10,
          padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
          background: `linear-gradient(135deg, ${ROSE}, ${WINE})`,
        }}
      >
        {shareState === "shared" || shareState === "downloaded" ? <Check size={18} /> : <Share2 size={18} />}
        {shareState === "working" ? "..." : shareState === "shared" ? "تم!" : shareState === "downloaded" ? "انحفظت الصورة!" : (ar ? "شارك نتيجتك" : "Share Results")}
      </button>

      <Link
        href={`/shofah/solo?character=${character}`}
        className="font-body"
        style={{
          display: "block", width: "100%", padding: 14, fontSize: 13, fontWeight: 700, borderRadius: 999,
          border: "2px solid var(--ring)", color: "var(--ink)", textDecoration: "none", marginBottom: 10,
        }}
      >
        {ar ? "جرب مرة ثانية 🔄" : "Try Again 🔄"}
      </Link>
      <Link
        href="/shofah/create"
        className="font-body"
        style={{
          display: "block", width: "100%", padding: 14, fontSize: 13, fontWeight: 700, borderRadius: 999,
          border: "2px solid var(--ring)", color: "var(--ink)", textDecoration: "none",
        }}
      >
        {ar ? "العب مع أصحابك 👥" : "Play with Friends 👥"}
      </Link>
    </div>
  );
}
