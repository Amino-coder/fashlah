"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, ensureUser } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import ShareInvite from "@/components/ShareInvite";
import SaveResult from "@/components/auth/SaveResult";
import { shareTriviaResultCard, shareTriviaSoloResultCard } from "@/components/trivia/exportResultCard";
import { trackPageEvent } from "@/lib/trackPageView";
import { TRIVIA_STR, TRIVIA_CATEGORY_LABELS_EN, TriviaLang } from "@/lib/trivia-i18n";
import { TRIVIA_QUESTIONS, TriviaOption } from "@/lib/trivia-questions";
import { shuffleTriviaOptions } from "@/lib/trivia-engine";
import { usePrefs } from "@/lib/usePrefs";
import type { TriviaSessionRow, TriviaPlayerRow, TriviaAnswerRow } from "@/lib/trivia-types";

const INDIGO = "#3B82F6";
const NAVY = "#1E40AF";
const GREEN = "#22C55E";
const RED = "#E63946";
const GOLD = "#FFD400";

/**
 * سؤال وجواب — one shared session page for both solo and multiplayer,
 * per the spec's own explicit "reuse the existing session system"
 * instruction rather than building a parallel solo implementation.
 * Solo sessions skip the waiting room entirely (status is already
 * in_progress by the time this page loads — see app/trivia/page.tsx),
 * everything else — the question loop, reveal, results — is identical
 * code for both.
 *
 * Server-authoritative by design (see the four /api/trivia-* routes):
 * correctness, speed-bonus scoring, question selection, and host point
 * adjustment are never trusted from the client, and phase transitions
 * poll the server for verification rather than relying purely on a
 * client-side timer — the same "belt and suspenders" pattern that
 * fixed real, reproducible bugs in earlier games in this app (a single
 * client-side-only timer trigger proved unreliable more than once).
 */
export default function TriviaSessionPage() {
  const params = useParams();
  const code = String(params.code).toUpperCase();
  const { lang, dark, ready } = usePrefs();
  const t = TRIVIA_STR[lang as TriviaLang];
  const ar = lang === "ar";

  const [session, setSession] = useState<TriviaSessionRow | null>(null);
  const [players, setPlayers] = useState<TriviaPlayerRow[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<TriviaAnswerRow[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [showIntro, setShowIntro] = useState(false);
  const introShownRef = useRef(false);
  const [shuffledOptions, setShuffledOptions] = useState<TriviaOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [mySubmittedId, setMySubmittedId] = useState<string | null>(null);
  const [adjustingPlayer, setAdjustingPlayer] = useState<string | null>(null);

  const myPlayer = players.find((p) => p.user_id === myUserId) || null;
  const isHost = !!session && !!myUserId && session.host_user_id === myUserId;
  const isSolo = players.length <= 1;

  const currentQuestionId = session?.question_ids?.[session.current_question_index];
  const currentQuestion = currentQuestionId ? TRIVIA_QUESTIONS.find((q) => q.id === currentQuestionId) : null;

  const loadAll = useCallback(async () => {
    const { data: s } = await supabase.from("trivia_sessions").select("*").eq("code", code).maybeSingle();
    if (!s) { setError(t.errorGeneric); return; }
    setSession(s);

    const { data: p } = await supabase.from("trivia_players").select("*").eq("session_id", s.id);
    setPlayers(p || []);

    if (s.status === "in_progress" || s.status === "completed") {
      const { data: a } = await supabase
        .from("trivia_answers")
        .select("*")
        .eq("session_id", s.id).eq("question_index", s.current_question_index);
      setCurrentAnswers(a || []);
    }
  }, [code, t.errorGeneric]);

  useEffect(() => {
    (async () => {
      const userId = await ensureUser(lang);
      setMyUserId(userId);
      await loadAll();
    })();
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`trivia-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trivia_sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "trivia_players" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "trivia_answers" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [code, session?.id, loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer tick, only while a question is actually live.
  useEffect(() => {
    if (session?.status !== "in_progress" || session?.phase !== "answering") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session?.status, session?.phase]);

  const remaining = session?.phase_started_at
    ? Math.max(0, Math.ceil(session.question_time_limit_seconds - (now - new Date(session.phase_started_at).getTime()) / 1000))
    : session?.question_time_limit_seconds ?? 15;

  // Pre-game intro — shown once, the first time question 1 actually
  // begins. Same trigger shape as المحتال/إنسان حيوان جماد's own
  // intros: a narrow, verifiable signal (index 0, phase answering, in
  // progress) rather than anything that could re-trigger on a stray
  // mid-game refresh.
  useEffect(() => {
    if (session?.status === "in_progress" && session?.phase === "answering" && session?.current_question_index === 0 && !introShownRef.current) {
      introShownRef.current = true;
      setShowIntro(true);
    }
  }, [session?.status, session?.phase, session?.current_question_index]);

  // New question → fresh shuffled option order + reset local answer
  // state. Shuffling happens per-viewer, client-side, purely for
  // display — correctAnswerId never moves, so this has zero effect on
  // actual scoring regardless of what order any given player sees the
  // four choices in.
  useEffect(() => {
    if (currentQuestion) {
      setShuffledOptions(shuffleTriviaOptions(currentQuestion.options));
      setSelectedOptionId(null);
      setMySubmittedId(null);
    }
  }, [currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Belt-and-suspenders polling, same reasoning as every other game's
  // phase-transition fix in this app: a repeating server-verified check
  // is far more robust than trusting a single client-side timer to
  // reliably fire the transition.
  useEffect(() => {
    if (session?.status !== "in_progress") return;
    const id = setInterval(() => {
      fetch("/api/trivia-advance-phase", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
      }).catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [session?.status, session?.id]);

  async function handleStart() {
    if (!session) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/trivia-start-game", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || t.errorGeneric); }
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit() {
    if (!session || !myPlayer || !selectedOptionId || mySubmittedId) return;
    setMySubmittedId(selectedOptionId); // optimistic
    try {
      const res = await fetch("/api/trivia-submit-answer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, playerId: myPlayer.id, selectedOptionId }),
      });
      if (!res.ok) setMySubmittedId(null);
      else {
        // Any client can check whether everyone's answered now —
        // matches the any-player-can-advance reasoning used everywhere
        // else in this app.
        fetch("/api/trivia-advance-phase", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
        }).catch(() => {});
      }
    } catch {
      setMySubmittedId(null);
    }
  }

  // If the player selected an option but never actually clicked
  // submit, and the timer runs out, record that selection rather than
  // nothing — matches how the rest of the game treats "ran out of
  // time" as still meaningful (the scoring endpoint itself computes
  // whatever speed bonus is left, which by definition is ~0 this
  // close to the limit, but correctness still counts).
  useEffect(() => {
    if (session?.status === "in_progress" && session?.phase === "answering" && remaining <= 0 && selectedOptionId && !mySubmittedId) {
      handleSubmit();
    }
  }, [remaining, session?.status, session?.phase, selectedOptionId, mySubmittedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleHostNextQuestion() {
    if (!session) return;
    await fetch("/api/trivia-advance-phase", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, isManualClick: true }),
    }).catch(() => {});
  }

  async function handleAdjustPoints(playerId: string, delta: 1 | -1) {
    if (!session || !myUserId) return;
    setAdjustingPlayer(playerId);
    await fetch("/api/trivia-adjust-points", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, playerId, delta, requestingUserId: myUserId }),
    }).catch(() => {});
    setAdjustingPlayer(null);
  }

  async function handlePlayAgainSameRoom() {
    if (!session) return;
    introShownRef.current = false;
    await supabase.from("trivia_players").update({ score: 0 }).eq("session_id", session.id);
    // Clear every answer row from the previous game before resetting —
    // "play again" reuses this same session_id and resets
    // current_question_index back to 0, and without this, the OLD
    // question-0 answer rows are still sitting there. That silently
    // breaks two things at once: the unique constraint rejects new
    // submissions for question 0 as "already answered," and the
    // auto-advance check (which counts existing answer rows for the
    // current question_index) sees those stale rows and immediately
    // thinks everyone's already answered — skipping the entire
    // answering phase before anyone gets a real chance to answer.
    await supabase.from("trivia_answers").delete().eq("session_id", session.id);
    await supabase
      .from("trivia_sessions")
      .update({ status: "waiting", current_question_index: 0, phase: "answering", question_ids: [], ended_at: null })
      .eq("id", session.id);
    if (isSolo) {
      await fetch("/api/trivia-start-game", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
      }).catch(() => {});
    }
  }

  if (!ready || !session) {
    return (
      <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
        <Blobs />
        {error && <p style={{ textAlign: "center", paddingTop: 100, color: RED }}>{error}</p>}
      </div>
    );
  }

  const sortedByScore = [...players].sort((a, b) => b.score - a.score);
  const myAnswerRow = currentAnswers.find((a) => a.player_id === myPlayer?.id);

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {showIntro && <TriviaPreGameIntro ar={ar} onDone={() => setShowIntro(false)} />}
      {(session.status === "waiting" || session.status === "completed") && <HomeButton label={t.backHome} href="/trivia" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {session.status === "in_progress" && <LeaveGameButton lang={lang} />}

        {/* ---------------- WAITING ROOM (multiplayer only — solo never sees this) ---------------- */}
        {session.status === "waiting" && (
          <div className="screen-enter" style={{ marginTop: 50 }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 20 }}>{t.gameName}</h1>
            <ShareInvite code={session.code} joinPath="/trivia/join" lang={lang} accent={`linear-gradient(135deg, ${INDIGO}, ${NAVY})`} label={t.roomCode} emoji={"\u{1F9E0}"} />
            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 10 }}>
                {players.length} {ar ? "لاعبين" : "players"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {players.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "var(--ring)" }}>
                    <span>{p.avatar_emoji}</span>
                    <span className="font-body" style={{ fontSize: 13, fontWeight: 700 }}>{p.nickname}</span>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="font-body" style={{ color: RED, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>}
            {isHost ? (
              <button
                onClick={handleStart}
                disabled={starting}
                className="font-display"
                style={{
                  display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                  background: `linear-gradient(135deg, ${INDIGO}, ${NAVY})`, opacity: starting ? 0.6 : 1,
                }}
              >
                {starting ? t.loading : t.startGame}
              </button>
            ) : (
              <p className="font-body" style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--ink-soft)" }}>{t.waitingHost}</p>
            )}
          </div>
        )}

        {/* ---------------- ANSWERING ---------------- */}
        {session.status === "in_progress" && session.phase === "answering" && currentQuestion && (
          <div className="screen-enter" style={{ marginTop: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span className="font-display" style={{ fontSize: 40, fontWeight: 800, color: remaining <= 5 ? RED : INDIGO, lineHeight: 1 }}>
                {remaining}
              </span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
                {t.questionOf} {session.current_question_index + 1} {t.of} {session.question_ids.length}
              </span>
            </div>

            <div className="card pop" style={{ padding: "18px 20px", marginBottom: 16, background: `linear-gradient(135deg, ${INDIGO}, ${NAVY})` }}>
              <p className="font-body" style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: "0 0 6px" }}>
                {ar ? currentQuestion.category : TRIVIA_CATEGORY_LABELS_EN[currentQuestion.category] || currentQuestion.category}
              </p>
              <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.5 }}>{currentQuestion.question}</p>
            </div>

            {mySubmittedId ? (
              <div className="card pop" style={{ padding: 22, textAlign: "center" }}>
                <p className="font-display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{t.submitted}</p>
                <p className="font-body" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
                  {isSolo ? t.movingOn : t.waitingOthers}
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {shuffledOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className="card"
                      style={{
                        padding: 15, textAlign: "start", border: selectedOptionId === opt.id ? `3px solid ${INDIGO}` : "2px solid var(--ring)",
                        background: selectedOptionId === opt.id ? `${INDIGO}18` : "var(--card)",
                      }}
                    >
                      <span className="font-body" style={{ fontSize: 14.5, fontWeight: 700 }}>{opt.text}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedOptionId}
                  className="font-display"
                  style={{
                    display: "block", width: "100%", padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                    background: `linear-gradient(135deg, ${INDIGO}, ${NAVY})`, opacity: selectedOptionId ? 1 : 0.5,
                  }}
                >
                  {t.submitAnswer}
                </button>
              </>
            )}
          </div>
        )}

        {/* ---------------- REVEAL ---------------- */}
        {session.status === "in_progress" && session.phase === "reveal" && currentQuestion && (
          <RevealScreen
            key={session.current_question_index}
            session={session}
            players={sortedByScore}
            question={currentQuestion}
            answers={currentAnswers}
            myAnswerRow={myAnswerRow}
            isHost={isHost}
            isSolo={isSolo}
            adjustingPlayer={adjustingPlayer}
            onAdjustPoints={handleAdjustPoints}
            onNextQuestion={handleHostNextQuestion}
            t={t}
            ar={ar}
          />
        )}

        {/* ---------------- RESULTS ---------------- */}
        {session.status === "completed" && (
          <ResultsScreen
            session={session}
            players={sortedByScore}
            isSolo={isSolo}
            myPlayer={myPlayer}
            onPlayAgainSameRoom={handlePlayAgainSameRoom}
            t={t}
            ar={ar}
          />
        )}
      </div>
    </div>
  );
}

function RevealScreen({
  session, players, question, answers, myAnswerRow, isHost, isSolo, adjustingPlayer, onAdjustPoints, onNextQuestion, t, ar,
}: {
  session: TriviaSessionRow;
  players: TriviaPlayerRow[];
  question: (typeof TRIVIA_QUESTIONS)[number];
  answers: TriviaAnswerRow[];
  myAnswerRow?: TriviaAnswerRow;
  isHost: boolean;
  isSolo: boolean;
  adjustingPlayer: string | null;
  onAdjustPoints: (playerId: string, delta: 1 | -1) => void;
  onNextQuestion: () => void;
  t: Record<string, string>;
  ar: boolean;
}) {
  const correctOption = question.options.find((o) => o.id === question.correctAnswerId)!;
  const isLastQuestion = session.current_question_index >= session.question_ids.length - 1;
  // Guards against exactly the bug a double-click on this button caused:
  // the endpoint honors a manual click immediately regardless of which
  // phase it currently sees, so a second click landing right after the
  // first one's transition (reveal → next question's answering) would
  // force ANOTHER transition on top of it — skipping that new
  // question's entire answering phase before anyone could even see it.
  // A plain client-side disable-after-first-click is what actually
  // stops a human from physically triggering that.
  const [clickPending, setClickPending] = useState(false);

  return (
    <div className="screen-enter" style={{ marginTop: 10 }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {t.questionOf} {session.current_question_index + 1} {t.of} {session.question_ids.length}
        </span>
      </div>

      <div className="card" style={{ padding: "16px 18px", marginBottom: 12 }}>
        <p className="font-body" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-soft)", margin: "0 0 6px" }}>
          {ar ? question.category : TRIVIA_CATEGORY_LABELS_EN[question.category] || question.category}
        </p>
        <p className="font-display" style={{ fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.5 }}>{question.question}</p>
      </div>

      <div className="card pop" style={{ padding: "16px 18px", marginBottom: 12, background: `linear-gradient(135deg, ${GREEN}, #14B8A6)` }}>
        <p className="font-body" style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 4px" }}>{t.correctAnswerIs}</p>
        <p className="font-display" style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>{correctOption.text}</p>
        <p className="font-body" style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: 1.6 }}>{question.explanation}</p>
      </div>

      {myAnswerRow && (
        <div
          className="card"
          style={{
            padding: "10px 16px", marginBottom: 16, textAlign: "center",
            border: myAnswerRow.is_correct ? `2px solid ${GREEN}` : `2px solid ${RED}`,
            background: myAnswerRow.is_correct ? `${GREEN}18` : `${RED}18`,
          }}
        >
          <span className="font-body" style={{ fontSize: 13, fontWeight: 800, color: myAnswerRow.is_correct ? GREEN : RED }}>
            {myAnswerRow.is_correct ? `\u2705 ${t.correct} (+${myAnswerRow.points_awarded})` : `\u274C ${t.incorrect}`}
          </span>
        </div>
      )}

      {/* Scoreboard — with the host's manual +/- controls right on each
          row, per the spec's explicit "give/take points, host-only,
          during the results/answer stage" requirement. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {players.map((p) => {
          const ans = answers.find((a) => a.player_id === p.id);
          return (
            <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{p.avatar_emoji}</span>
                <span className="font-body" style={{ fontSize: 13, fontWeight: 700 }}>{p.nickname}</span>
                {ans && <span style={{ fontSize: 13 }}>{ans.is_correct ? "\u2705" : "\u274C"}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="font-display" style={{ fontSize: 14, fontWeight: 800, color: INDIGO }}>{p.score}</span>
                {isHost && !isSolo && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => onAdjustPoints(p.id, -1)}
                      disabled={adjustingPlayer === p.id}
                      aria-label="-1"
                      style={{ width: 24, height: 24, borderRadius: 999, border: "1.5px solid var(--ring)", background: "var(--card)", color: RED, fontSize: 13, fontWeight: 800 }}
                    >
                      −
                    </button>
                    <button
                      onClick={() => onAdjustPoints(p.id, 1)}
                      disabled={adjustingPlayer === p.id}
                      aria-label="+1"
                      style={{ width: 24, height: 24, borderRadius: 999, border: "1.5px solid var(--ring)", background: "var(--card)", color: GREEN, fontSize: 13, fontWeight: 800 }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual override — same reasoning as المحتال's clue-phase host
          button: a visible, deliberate fallback for exactly the case
          where automatic progression doesn't happen fast enough on its
          own. Host-only in the UI; the endpoint itself doesn't need
          server-side host verification the way point-adjustment does,
          since advancing early is a much lower-stakes mistake than
          arbitrary score manipulation. */}
      {isHost && (
        <button
          onClick={async () => {
            if (clickPending) return;
            setClickPending(true);
            await onNextQuestion();
          }}
          disabled={clickPending}
          className="font-body"
          style={{
            display: "block", width: "100%", padding: 13, fontSize: 13, fontWeight: 800,
            borderRadius: 999, border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)",
            opacity: clickPending ? 0.6 : 1, cursor: clickPending ? "default" : "pointer",
          }}
        >
          {clickPending ? t.loading : isLastQuestion ? (ar ? "\u{1F3C1} إنهاء اللعبة" : "\u{1F3C1} Finish Game") : `\u2192 ${t.nextQuestion}`}
        </button>
      )}
    </div>
  );
}

function ResultsScreen({
  session, players, isSolo, myPlayer, onPlayAgainSameRoom, t, ar,
}: {
  session: TriviaSessionRow;
  players: TriviaPlayerRow[];
  isSolo: boolean;
  myPlayer: TriviaPlayerRow | null;
  onPlayAgainSameRoom: () => void;
  t: Record<string, string>;
  ar: boolean;
}) {
  const [correctCount, setCorrectCount] = useState<number | null>(null);
  const [correctByQuestion, setCorrectByQuestion] = useState<boolean[] | null>(null);
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");

  useEffect(() => {
    if (!isSolo || !myPlayer) return;
    supabase.from("trivia_answers").select("question_index, is_correct").eq("session_id", session.id).eq("player_id", myPlayer.id)
      .then(({ data }) => {
        const rows = data || [];
        setCorrectCount(rows.filter((a) => a.is_correct).length);
        // Build the full per-question array in order — a question the
        // player never got to answer (e.g. ran out of time on the very
        // last one) counts as incorrect, same as it does for scoring.
        const total = session.question_ids.length;
        const byIndex = new Array(total).fill(false);
        for (const row of rows) { if (row.is_correct) byIndex[row.question_index] = true; }
        setCorrectByQuestion(byIndex);
      });
  }, [isSolo, myPlayer, session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = session.question_ids.length;
  const topScore = players[0]?.score ?? 0;
  const coWinners = players.filter((p) => p.score === topScore);

  const resultLine = isSolo
    ? (ar ? `\u{1F9E0} تريفيا — النتيجة: ${correctCount ?? "?"}/${total}` : `\u{1F9E0} Trivia — Score: ${correctCount ?? "?"}/${total}`)
    : coWinners.length > 1
    ? (ar ? `تعادل! ${coWinners.map((p) => p.nickname).join(" و ")} بـ ${topScore} نقطة` : `Tie! ${coWinners.map((p) => p.nickname).join(" & ")} with ${topScore} points`)
    : (ar ? `\u{1F3C6} ${coWinners[0]?.nickname} فاز بـ ${topScore} نقطة!` : `\u{1F3C6} ${coWinners[0]?.nickname} won with ${topScore} points!`);

  async function handleShareCard() {
    setShareState("working");
    try {
      const result = isSolo && correctByQuestion
        ? await shareTriviaSoloResultCard({ correctCount: correctCount ?? 0, totalQuestions: total, score: myPlayer?.score ?? 0, correctByQuestion })
        : await shareTriviaResultCard(players);
      if (result === "shared") { trackPageEvent("trivia", "share_result_native"); setShareState("shared"); }
      else if (result === "downloaded") { trackPageEvent("trivia", "share_result_downloaded"); setShareState("downloaded"); }
      else if (result === "cancelled") setShareState("idle");
      else setShareState("failed");
    } catch {
      setShareState("failed");
    }
    setTimeout(() => setShareState("idle"), 2500);
  }

  return (
    <div className="screen-enter" style={{ marginTop: 20, textAlign: "center", paddingBottom: 30 }}>
      <p className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{t.finalResults}</p>

      {isSolo ? (
        <div className="card pop" style={{ padding: 26, marginBottom: 20, background: `linear-gradient(135deg, ${INDIGO}, ${NAVY})` }}>
          <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>{t.score}</p>
          <p className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>{correctCount ?? "?"}/{total}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <span className="font-body" style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>{"\u2705"} {t.correct}: {correctCount ?? "?"}</span>
            <span className="font-body" style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>{"\u274C"} {t.incorrect}: {correctCount !== null ? total - correctCount : "?"}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="card pop" style={{ padding: 26, marginBottom: 20, background: `linear-gradient(135deg, ${INDIGO}, ${NAVY})` }}>
            <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>{t.winner}</p>
            <p className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>
              {coWinners.length > 1 ? (ar ? "تعادل!" : "Tie!") : `${coWinners[0]?.avatar_emoji} ${coWinners[0]?.nickname}`}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {players.map((p, i) => (
              <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <span className="font-body" style={{ fontSize: 14, fontWeight: 800 }}>{i + 1}. {p.avatar_emoji} {p.nickname}</span>
                <span className="font-display" style={{ fontSize: 15, fontWeight: 800, color: INDIGO }}>{p.score} {ar ? "نقطة" : "pts"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        onClick={handleShareCard}
        disabled={shareState === "working"}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          padding: "14px 20px", borderRadius: 999, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${INDIGO}, ${NAVY})`, color: "#fff", fontWeight: 800, fontSize: 15,
          boxShadow: "0 10px 26px rgba(0,0,0,0.2)", marginBottom: 12, opacity: shareState === "working" ? 0.7 : 1,
        }}
      >
        {"\u{1F4E4}"} {
          shareState === "working" ? "..." :
          shareState === "shared" ? (ar ? "تم!" : "Shared!") :
          shareState === "downloaded" ? (ar ? "انحفظت الصورة!" : "Image saved!") :
          shareState === "failed" ? (ar ? "صار خطأ" : "Something went wrong") :
          (ar ? "شارك نتيجتك" : "Share Results")
        }
      </button>

      <SaveResult game="trivia" lang={ar ? "ar" : "en"} resultSummary={resultLine} sessionCode={session.code} />

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={onPlayAgainSameRoom}
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px 10px", borderRadius: 999, border: "none", cursor: "pointer",
            color: "#fff", background: `linear-gradient(135deg, ${INDIGO}, ${NAVY})`, fontWeight: 800, fontSize: 13,
          }}
        >
          {t.playAgainRoom}
        </button>
        <a
          href="/wadak"
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px 10px", borderRadius: 999, textDecoration: "none",
            border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)", fontWeight: 800, fontSize: 13, textAlign: "center",
          }}
        >
          {"\u{1F3AD}"} {ar ? "لعبة ثانية" : "Another game"}
        </a>
      </div>
    </div>
  );
}

/**
 * كيف تلعب؟ (using the spec's own exact instructional text, verbatim —
 * this is the same copy already registered in HowToPlay.tsx's trivia
 * entry, kept in sync rather than diverging) → جاهزين → 3 → 2 → 1 →
 * يلا!, then dismisses itself. Same pattern as every other game's own
 * pre-game intro in this app.
 */
function TriviaPreGameIntro({ ar, onDone }: { ar: boolean; onDone: () => void }) {
  const STAGES = [
    { text: ar ? "كيف تلعب؟" : "How to play?", ms: 1400 },
    { text: ar ? "اختر الإجابة الصحيحة من بين 4 خيارات" : "Pick the correct answer out of 4 choices", ms: 2000 },
    { text: ar ? "كل سؤال له إجابة صحيحة واحدة" : "Every question has exactly one correct answer", ms: 1800 },
    { text: ar ? "حاول تجاوب قبل انتهاء الوقت" : "Try to answer before time runs out", ms: 1800 },
    { text: ar ? "جاهزين" : "Ready", ms: 800 },
    { text: "3", ms: 600 },
    { text: "2", ms: 600 },
    { text: "1", ms: 600 },
    { text: ar ? "يلا!" : "Go!", ms: 700 },
  ];
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stageIndex >= STAGES.length) { onDone(); return; }
    const id = setTimeout(() => setStageIndex((i) => i + 1), STAGES[stageIndex].ms);
    return () => clearTimeout(id);
  }, [stageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (stageIndex >= STAGES.length) return null;
  const stage = STAGES[stageIndex];
  const isCountdown = ["3", "2", "1"].includes(stage.text) || stage.text === (ar ? "يلا!" : "Go!");

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        position: "fixed", inset: 0, zIndex: 80, background: `linear-gradient(135deg, #17122B, ${INDIGO})`,
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
