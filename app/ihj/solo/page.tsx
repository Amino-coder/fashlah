"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import SaveResult from "@/components/auth/SaveResult";
import { IHJ_STR, IhjLang } from "@/lib/ihj-i18n";
import { usePrefs } from "@/lib/usePrefs";
import { IHJ_CATEGORIES } from "@/lib/ihj-categories";
import { pickNextLetter } from "@/lib/ihj-letters";
import { ihjNormalize } from "@/lib/ihj-normalize";
import { scoreSoloAnswer } from "@/lib/ihj-solo-score";
import { pickIhjSoloTitle } from "@/lib/ihj-solo-titles";
import { readIhjSoloBest, writeIhjSoloBest, type IhjSoloBest } from "@/lib/ihj-solo-storage";
import { trackPageView, trackPageComplete, trackPageEvent, newSessionKey } from "@/lib/trackPageView";
import { shareIhjSoloResultCard } from "@/components/ihj/exportResultCard";
import type { IhjCategory } from "@/lib/ihj-types";

const PURPLE = "#7C3AED";
const PINK = "#FF2E93";
const MINT = "#2EE6A6";
const ROUND_OPTIONS = [3, 5, 7, 10];
const TIME_LIMIT_SECONDS = 25; // was 60 — matches the shorter, punchier pace requested; no longer tied to ihj_sessions.time_limit_seconds' default, solo intentionally runs faster than multiplayer now
const TRANSITION_MS = 1700;

// One picked at random between rounds — enough variety that it doesn't
// feel like the same canned message every single round.
const TRANSITION_MESSAGES_AR = [
  "تعجبنا السرعة \u26A1",
  "متأكد كلها إجابات حقيقية؟ \u{1F602}",
  "الجولة التالية",
  "يلا نشوف جولة جديدة",
  "استعد للحرف الجاي \u{1F440}",
];
const TRANSITION_MESSAGES_EN = [
  "Impressive speed \u26A1",
  "Are those all real answers? \u{1F602}",
  "Next round",
  "Let's see what's next",
  "Get ready for the next letter \u{1F440}",
];

type RoundRecord = {
  letter: string;
  answers: Record<IhjCategory, { text: string; points: number }>;
};

type Stage = "setup" | "intro" | "playing" | "results";

/**
 * إنسان حيوان جماد solo — reuses the multiplayer game's actual rule set
 * (IHJ_CATEGORIES, pickNextLetter, ihjNormalize, ROUND_OPTIONS, the
 * shared card design tokens/canvas helpers) rather than rebuilding any
 * of it. The only genuinely new logic here is solo game STATE — no
 * session, no players, no realtime, since there's nothing to
 * synchronize with just one person playing. Scoring runs locally via
 * scoreSoloAnswer (lib/ihj-solo-score.ts) instead of the SQL
 * ihj_score_round function, which exists specifically to compare
 * answers ACROSS players — solo has no other player's answer to compare
 * against, so the whole reason for that server round trip doesn't apply.
 *
 * Nothing here writes to ihj_sessions/ihj_players/ihj_answers — the
 * multiplayer tables are completely untouched by this file.
 */
export default function IhjSoloPage() {
  const { lang, dark, ready } = usePrefs();
  const t = IHJ_STR[lang as IhjLang];
  const ar = lang === "ar";

  const [stage, setStage] = useState<Stage>("setup");
  const [totalRounds, setTotalRounds] = useState(5);
  const [round, setRound] = useState(1);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [letter, setLetter] = useState("");
  const [draft, setDraft] = useState<Record<IhjCategory, string>>({ human: "", animal: "", object: "", plant: "", country: "" });
  const [records, setRecords] = useState<RoundRecord[]>([]);
  const [phaseStartedAt, setPhaseStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [submittedLocally, setSubmittedLocally] = useState(false);

  const [sessionKey, setSessionKey] = useState(() => newSessionKey());
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");

  useEffect(() => { trackPageView("ihj_solo", sessionKey); }, [sessionKey]);

  useEffect(() => {
    if (stage !== "playing") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [stage]);

  const remaining = useMemo(() => {
    if (!phaseStartedAt) return TIME_LIMIT_SECONDS;
    const elapsed = (now - phaseStartedAt) / 1000;
    return Math.max(0, Math.ceil(TIME_LIMIT_SECONDS - elapsed));
  }, [phaseStartedAt, now]);

  function startGame() {
    setStage("intro");
  }

  function beginPlaying() {
    const firstLetter = pickNextLetter([]);
    setUsedLetters([firstLetter]);
    setLetter(firstLetter);
    setRound(1);
    setRecords([]);
    setDraft({ human: "", animal: "", object: "", plant: "", country: "" });
    setSubmittedLocally(false);
    setPhaseStartedAt(Date.now());
    setNow(Date.now());
    setStage("playing");
    trackPageEvent("ihj_solo", "started", sessionKey);
  }

  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  function submitRound(finalDraft: Record<IhjCategory, string>) {
    const answers = {} as RoundRecord["answers"];
    for (const c of IHJ_CATEGORIES) {
      const text = (finalDraft[c.key] || "").trim();
      answers[c.key] = { text, points: scoreSoloAnswer(letter, text) };
    }
    const nextRecords = [...records, { letter, answers }];
    setRecords(nextRecords);

    if (round < totalRounds) {
      const pool = ar ? TRANSITION_MESSAGES_AR : TRANSITION_MESSAGES_EN;
      setTransitionMessage(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      finishGame(nextRecords);
    }
  }

  // Advances to the actual next round once the transition message has
  // had its moment on screen. phaseStartedAt is deliberately set HERE,
  // not back in submitRound — the same reasoning as the pre-game intro's
  // INTRO_BUFFER_MS fix: the 25s timer shouldn't start counting down
  // while this transition screen is still covering the letter/inputs.
  useEffect(() => {
    if (!transitionMessage) return;
    const id = setTimeout(() => {
      const nextLetter = pickNextLetter(usedLetters);
      setUsedLetters((u) => [...u, nextLetter]);
      setLetter(nextLetter);
      setRound((r) => r + 1);
      setDraft({ human: "", animal: "", object: "", plant: "", country: "" });
      setSubmittedLocally(false);
      setPhaseStartedAt(Date.now());
      setNow(Date.now());
      setTransitionMessage(null);
    }, TRANSITION_MS);
    return () => clearTimeout(id);
  }, [transitionMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stage !== "playing" || submittedLocally) return;
    if (remaining <= 0) {
      setSubmittedLocally(true);
      submitRound(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, stage, submittedLocally]);

  function handleSubmitClick() {
    if (submittedLocally) return;
    setSubmittedLocally(true);
    submitRound(draft);
  }

  const [best, setBest] = useState<IhjSoloBest | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [title, setTitle] = useState<{ emoji: string; ar: string; en: string } | null>(null);

  function finishGame(finalRecords: RoundRecord[]) {
    const score = finalRecords.reduce((sum, r) => sum + IHJ_CATEGORIES.reduce((s, c) => s + r.answers[c.key].points, 0), 0);
    const correctCount = finalRecords.reduce((sum, r) => sum + IHJ_CATEGORIES.filter((c) => r.answers[c.key].points > 0).length, 0);
    const totalPossible = finalRecords.length * IHJ_CATEGORIES.length;
    const pct = totalPossible > 0 ? correctCount / totalPossible : 0;

    const previousBest = readIhjSoloBest();
    const newRecord = !previousBest || score > previousBest.score;
    if (newRecord) {
      writeIhjSoloBest({ score, correctCount, totalPossible, totalRounds: finalRecords.length, at: new Date().toISOString() });
    }

    setBest(previousBest);
    setIsNewRecord(newRecord);
    setFinalScore(score);
    setFinalCorrect(correctCount);
    setTitle(pickIhjSoloTitle(pct));
    setStage("results");
    trackPageComplete("ihj_solo", sessionKey);
  }

  function handlePlayAgain() {
    trackPageEvent("ihj_solo", "replay", sessionKey);
    setSessionKey(newSessionKey());
    startGame();
  }

  async function handleShare() {
    if (!title) return;
    setShareState("working");
    const res = await shareIhjSoloResultCard({
      score: finalScore,
      title: { emoji: title.emoji, ar: title.ar },
      totalRounds: records.length,
      rounds: records.map((r) => ({
        letter: r.letter,
        correctByCategory: IHJ_CATEGORIES.map((c) => r.answers[c.key].points > 0),
      })),
    });
    if (res === "shared" || res === "downloaded") trackPageEvent("ihj_solo", `share_result_${res}`, sessionKey);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  if (!ready) return null;

  const totalPossible = records.length * IHJ_CATEGORIES.length;

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {stage !== "playing" && stage !== "intro" && <HomeButton label={t.backHome} href="/ihj" />}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {stage === "playing" && <LeaveGameButton lang={lang} />}

        {stage === "setup" && (
          <div className="screen-enter" style={{ marginTop: 60, textAlign: "center" }}>
            <div
              aria-hidden="true"
              className="pop"
              style={{
                width: 90, height: 90, borderRadius: 999, margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42,
                background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`, boxShadow: `0 10px 26px ${PINK}44`,
              }}
            >
              🧠
            </div>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>
              {t.soloSetupTitle}
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 28 }}>
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setTotalRounds(n)}
                  className="font-display"
                  style={{
                    padding: "12px 4px", borderRadius: 14, fontSize: 14, fontWeight: 800,
                    border: totalRounds === n ? `2.5px solid ${PURPLE}` : "2px solid var(--ring)",
                    background: totalRounds === n ? `linear-gradient(135deg, ${PURPLE}22, ${PINK}22)` : "var(--card)",
                    color: "var(--ink)",
                  }}
                >
                  {ar ? `${n} جولات` : n}
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              className="font-display"
              style={{
                display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
              }}
            >
              {t.startSolo}
            </button>
          </div>
        )}

        {stage === "intro" && <IhjPreGameIntro ar={ar} onDone={beginPlaying} />}

        {stage === "playing" && transitionMessage && (
          <div className="screen-enter" style={{ marginTop: 10, textAlign: "center" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
                {t.roundOf} {round}/{totalRounds}
              </span>
            </div>
            <div
              className="card pop"
              style={{
                padding: "40px 24px", display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: 160, background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
              }}
            >
              <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>
                {transitionMessage}
              </p>
            </div>
          </div>
        )}

        {stage === "playing" && !transitionMessage && (
          <div className="screen-enter" style={{ marginTop: 10 }}>
            {/* Timer, top and center — deliberately its own row, large
                and unmissable, rather than sharing space with the round
                counter off to the side. 25 seconds moves fast, so this
                needs to be the first thing a glance lands on. */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span className="font-display" style={{ fontSize: 40, fontWeight: 800, color: remaining <= 10 ? "#E63946" : PURPLE, lineHeight: 1 }}>
                {remaining}
              </span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
                {t.roundOf} {round}/{totalRounds}
              </span>
            </div>

            <div className="card pop" style={{ padding: "18px 20px", textAlign: "center", marginBottom: 18, background: `linear-gradient(135deg, ${PURPLE}, ${PINK})` }}>
              <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 4px" }}>{t.roundLetter}</p>
              <p className="font-display" style={{ fontSize: 52, fontWeight: 800, color: "#fff", margin: 0 }}>{letter}</p>
            </div>

            {submittedLocally ? (
              <div className="card pop" style={{ padding: 30, textAlign: "center" }}>
                <p className="font-display" style={{ fontSize: 18, fontWeight: 800 }}>{t.submitted}</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
                  {IHJ_CATEGORIES.map((c) => {
                    const value = draft[c.key];
                    const normalizedOk = !value || ihjNormalize(value)[0] === ihjNormalize(letter)[0];
                    return (
                      <div key={c.key} className="card" style={{ padding: 14 }}>
                        <p className="font-body" style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{c.emoji}</span> {c.label}
                        </p>
                        <input
                          value={value}
                          onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                          placeholder={c.prompt(letter)}
                          dir="rtl"
                          className="font-body"
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                            border: value && !normalizedOk ? "2px solid #FFB020" : "2px solid var(--ring)",
                            background: "var(--bg)", color: "var(--ink)", outline: "none",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleSubmitClick}
                  className="font-display"
                  style={{
                    display: "block", width: "100%", padding: 17, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                    background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
                  }}
                >
                  {t.submit}
                </button>
              </>
            )}
          </div>
        )}

        {stage === "results" && title && (
          <div className="screen-enter" style={{ marginTop: 40, textAlign: "center", paddingBottom: 30 }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t.gameOver}</h1>

            <div className="card pop" style={{ padding: 30, marginBottom: 18, background: `linear-gradient(135deg, ${PURPLE}, ${PINK})` }}>
              <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 4px" }}>{t.yourScore}</p>
              <p className="font-display" style={{ fontSize: 56, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>{finalScore}</p>
              <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "0 0 14px" }}>
                {finalCorrect} {t.correctOf} {totalPossible}
              </p>
              <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>
                {title.emoji} {ar ? title.ar : title.en}
              </p>
            </div>

            <div className="card" style={{ padding: 16, marginBottom: 22 }}>
              {!best ? (
                <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", margin: 0 }}>{t.firstAttempt}</p>
              ) : isNewRecord ? (
                <>
                  <p className="font-display" style={{ fontSize: 16, fontWeight: 800, color: MINT, margin: "0 0 4px" }}>{t.newRecord}</p>
                  <p className="font-body" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", margin: 0 }}>
                    +{finalScore - best.score} {t.aboveBest}
                  </p>
                </>
              ) : (
                <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", margin: 0 }}>
                  {t.personalBest}: {best.score}
                </p>
              )}
            </div>

            <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 12 }}>{t.roundBreakdown}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {records.map((r, i) => (
                <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                  <span className="font-display" style={{ fontSize: 16, fontWeight: 800, width: 24, flexShrink: 0 }}>{r.letter}</span>
                  <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "center" }}>
                    {IHJ_CATEGORIES.map((c) => (
                      <span key={c.key} title={c.label} style={{ fontSize: 15 }}>
                        {c.emoji} {r.answers[c.key].points > 0 ? "✅" : "❌"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <SaveResult
              game="ihj_solo"
              lang={ar ? "ar" : "en"}
              resultSummary={ar ? `${title.emoji} ${title.ar} — ${finalScore} نقطة` : `${title.emoji} ${title.en} — ${finalScore} pts`}
            />

            <button
              onClick={handleShare}
              disabled={shareState === "working"}
              className="font-display"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 18, marginBottom: 12,
                padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
              }}
            >
              {shareState === "shared" || shareState === "downloaded" ? <Check size={18} /> : <Share2 size={18} />}
              {shareState === "working" ? t.loading : shareState === "shared" ? "تم!" : shareState === "downloaded" ? "انحفظت الصورة!" : t.shareSolo}
            </button>

            <button
              onClick={handlePlayAgain}
              className="font-body"
              style={{
                display: "block", width: "100%", padding: 14, fontSize: 13, fontWeight: 700, borderRadius: 999,
                border: "2px solid var(--ring)", color: "var(--ink)", background: "transparent",
              }}
            >
              {t.playAgainSolo}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * حرف عشوائي → ٥ فئات → ٢٥ ثانية بس → جاهزين → 3 → 2 → 1 → يلا, then
 * calls onDone. Same structure and timing pattern as المحتال/خرب
 * السالفة's own pre-game intros — rendered as a normal stage here
 * rather than a fixed-position overlay, since solo has no underlying
 * multiplayer state that needs to stay mounted underneath it.
 */
function IhjPreGameIntro({ ar, onDone }: { ar: boolean; onDone: () => void }) {
  const STAGES = [
    { text: ar ? "كل جولة يطلع لك حرف عشوائي \u{1F3B2}" : "Each round gives you a random letter \u{1F3B2}", ms: 2600 },
    { text: ar ? "جاوب على ٥ فئات تبدأ بنفس الحرف: إنسان، حيوان، جماد، نبات، بلاد" : "Answer 5 categories starting with it: person, animal, object, plant, country", ms: 3200 },
    { text: ar ? "بس عندك ٢٥ ثانية! \u{23F1}\uFE0F" : "But you only get 25 seconds! \u{23F1}\uFE0F", ms: 2200 },
    { text: ar ? "جاهزين" : "Ready", ms: 900 },
    { text: "3", ms: 650 },
    { text: "2", ms: 650 },
    { text: "1", ms: 650 },
    { text: ar ? "يلا" : "Go!", ms: 800 },
  ];
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stageIndex >= STAGES.length) { onDone(); return; }
    const id = setTimeout(() => setStageIndex((i) => i + 1), STAGES[stageIndex].ms);
    return () => clearTimeout(id);
  }, [stageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (stageIndex >= STAGES.length) return null;
  const stage = STAGES[stageIndex];
  const isCountdown = ["3", "2", "1"].includes(stage.text) || stage.text === (ar ? "يلا" : "Go!");

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        position: "fixed", inset: 0, zIndex: 80, background: "linear-gradient(135deg, #17122B, #7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
      }}
    >
      <p
        key={stageIndex}
        className="font-display pop"
        style={{
          fontSize: isCountdown ? 64 : 22, fontWeight: 800, color: "#fff", textAlign: "center",
          lineHeight: 1.6, maxWidth: 340, margin: 0,
        }}
      >
        {stage.text}
      </p>
    </div>
  );
}
