"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import NiqabGirl from "@/components/shofah/NiqabGirl";
import ShemaghGuy from "@/components/shofah/ShemaghGuy";
import type { ShofahCharacter } from "@/lib/shofah-types";

const ROSE = "#E63946";
const WINE = "#C2185B";
const TOTAL_ROUNDS = 5; // same as the real game

type PromptRow = { text_ar: string; category: string };

// Five quick yes/no "fate" questions — the closest honest equivalent of
// the real warm-up round for a genuinely solo context. The real warm-up
// prompts ("مين آخر شخص ممكن يتزوج", "مين بيكون اكبر سيمب") are all
// GROUP-comparison questions with no meaningful solo translation — there's
// no one else to compare against. Rather than force-fit that content,
// this keeps the same spirit (light, fast, produces a verdict) with
// content that actually makes sense answered alone.
const FATE_QUESTIONS = [
  "قلبك مرتاح اليوم؟ 💓",
  "شفت رقم مكرر اليوم زي ١١:١١؟ 👀",
  "لبست شي جديد اليوم؟ 👕",
  "حد قال لك ماشاء الله اليوم؟ ✨",
  "تحس اليوم يومك؟ 🍀",
];

type Stage = "loading" | "warmup" | "writing" | "verdict";

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

  // Warm-up
  const [fateIdx, setFateIdx] = useState(0);
  const [luckyCount, setLuckyCount] = useState(0);

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

  function answerFate(isLucky: boolean) {
    if (isLucky) setLuckyCount((c) => c + 1);
    if (fateIdx + 1 < FATE_QUESTIONS.length) setFateIdx((i) => i + 1);
    else setStage("writing");
  }

  function submitAnswer() {
    setAnswers((a) => [...a, draft.trim()]);
    setDraft("");
    if (round + 1 < TOTAL_ROUNDS) setRound((r) => r + 1);
    else setStage("verdict");
  }

  if (!ready) return null;
  const Character = character === "girl" ? NiqabGirl : ShemaghGuy;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={lang === "ar" ? "الصفحة الرئيسية" : "Home"} href="/shofah" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {error && (
          <p className="font-body" style={{ color: "#E63946", fontWeight: 700, textAlign: "center", marginTop: 100 }}>{error}</p>
        )}

        {!error && stage === "loading" && (
          <div style={{ textAlign: "center", marginTop: 120, color: ROSE }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}

        {!error && stage === "warmup" && (
          <div className="screen-enter" style={{ marginTop: 40, textAlign: "center" }}>
            <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>
              {lang === "ar" ? "🔥 جولة تسخين" : "🔥 Warm-up"}
            </p>
            <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 20 }}>
              {fateIdx + 1} / {FATE_QUESTIONS.length}
            </p>
            <div className="card pop" key={fateIdx} style={{ padding: 28, marginBottom: 20 }}>
              <h2 className="font-display" style={{ fontSize: 21, fontWeight: 800, margin: 0 }}>{FATE_QUESTIONS[fateIdx]}</h2>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => answerFate(true)}
                className="font-display"
                style={{ flex: 1, padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff", background: "linear-gradient(135deg, #2EE6A6, #14B8A6)" }}
              >
                {lang === "ar" ? "أيوه ✅" : "Yes ✅"}
              </button>
              <button
                onClick={() => answerFate(false)}
                className="font-display"
                style={{ flex: 1, padding: 18, fontSize: 16, borderRadius: 999, border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)" }}
              >
                {lang === "ar" ? "لا ❌" : "No ❌"}
              </button>
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

        {!error && stage === "verdict" && (
          <SoloVerdict character={character} answers={answers} prompts={prompts} luckyCount={luckyCount} lang={lang} />
        )}
      </div>
    </div>
  );
}

function SoloVerdict({
  character, answers, prompts, luckyCount, lang,
}: {
  character: ShofahCharacter; answers: string[]; prompts: PromptRow[]; luckyCount: number; lang: string;
}) {
  const ar = lang === "ar";
  const married = luckyCount >= 3; // majority of the 5 fate questions
  const Character = character === "girl" ? NiqabGirl : ShemaghGuy;

  return (
    <div className="screen-enter" style={{ marginTop: 30, textAlign: "center", paddingBottom: 30 }}>
      <span className="pop" style={{ fontSize: 60, display: "block", marginBottom: 8 }}>{married ? "💍" : "😅"}</span>
      <div style={{ marginBottom: 10 }}><Character size={100} /></div>
      <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        {married ? (ar ? "مبروك! انكتب لك نصيب 🎉" : "Congrats! It's written 🎉") : (ar ? "ما انكتب نصيب... بعدها 😅" : "Not this time... 😅")}
      </h1>
      <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 28 }}>
        {ar ? `الحظ وقف معك بـ ${luckyCount}/5 من علامات اليوم` : `Luck was with you in ${luckyCount}/5 of today's signs`}
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

      <Link
        href={`/shofah/solo?character=${character}`}
        className="font-display"
        style={{
          display: "block", width: "100%", padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
          background: `linear-gradient(135deg, ${ROSE}, ${WINE})`, marginBottom: 10,
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
