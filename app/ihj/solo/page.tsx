"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Share2 } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
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
const TIME_LIMIT_SECONDS = 60; // matches ihj_sessions.time_limit_seconds' default in supabase/ihj_schema.sql

type RoundRecord = {
  letter: string;
  answers: Record<IhjCategory, { text: string; points: number }>;
};

type Stage = "setup" | "playing" | "results";

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

  function submitRound(finalDraft: Record<IhjCategory, string>) {
    const answers = {} as RoundRecord["answers"];
    for (const c of IHJ_CATEGORIES) {
      const text = (finalDraft[c.key] || "").trim();
      answers[c.key] = { text, points: scoreSoloAnswer(letter, text) };
    }
    const nextRecords = [...records, { letter, answers }];
    setRecords(nextRecords);

    if (round < totalRounds) {
      const nextLetter = pickNextLetter(usedLetters);
      setUsedLetters((u) => [...u, nextLetter]);
      setLetter(nextLetter);
      setRound((r) => r + 1);
      setDraft({ human: "", animal: "", object: "", plant: "", country: "" });
      setSubmittedLocally(false);
      setPhaseStartedAt(Date.now());
      setNow(Date.now());
    } else {
      finishGame(nextRecords);
    }
  }

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
    trackPageEvent("ihj_solo", "share", sessionKey);
    const res = await shareIhjSoloResultCard({
      score: finalScore,
      title: { emoji: title.emoji, ar: title.ar },
      totalRounds: records.length,
      rounds: records.map((r) => ({
        letter: r.letter,
        correctByCategory: IHJ_CATEGORIES.map((c) => r.answers[c.key].points > 0),
      })),
    });
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  if (!ready) return null;

  const totalPossible = records.length * IHJ_CATEGORIES.length;

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {stage !== "playing" && <HomeButton label={t.backHome} href="/ihj" />}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>

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

        {stage === "playing" && (
          <div className="screen-enter" style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
                {t.roundOf} {round}/{totalRounds}
              </span>
              <span className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: remaining <= 10 ? "#E63946" : PURPLE }}>
                {remaining}
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
