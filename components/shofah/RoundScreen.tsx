"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SHOFAH_STR, ShofahLang } from "@/lib/shofah-i18n";
import NiqabGirl from "./NiqabGirl";
import ShemaghGuy from "./ShemaghGuy";
import type {
  ShofahSessionRow, ShofahPlayerRow, ShofahPromptRow,
  ShofahAnswerRow, ShofahVoteRow,
} from "@/lib/shofah-types";

const ROSE = "#E63946";
const WINE = "#C2185B";
const ANSWER_SECONDS = 30;
const VOTE_SECONDS = 20;
const COUNTDOWN_SECONDS = 5;
const REVEAL_SECONDS = 5;
const MAX_CHARS = 80;
const TOTAL_ROUNDS = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RoundScreen({
  session, players, myPlayerId, isHost, lang,
}: {
  session: ShofahSessionRow;
  players: ShofahPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: ShofahLang;
}) {
  const t = SHOFAH_STR[lang];
  const [prompt, setPrompt] = useState<ShofahPromptRow | null>(null);
  const [answers, setAnswers] = useState<ShofahAnswerRow[]>([]);
  const [votes, setVotes] = useState<ShofahVoteRow[]>([]);
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [winner, setWinner] = useState<{ nickname: string; avatar: string; text: string } | null>(null);
  const [winnerFetched, setWinnerFetched] = useState(false);
  const shuffledRef = useRef<ShofahAnswerRow[] | null>(null);
  const transitionedRef = useRef(false);
  const scoringRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const answeringDeadlineRef = useRef<number | null>(null);

  // Filtered by round_number, not just "whatever's currently in state" —
  // this is what actually makes the round transition safe. React doesn't
  // guarantee one effect's setState is visible to another effect in the
  // same batch, so clearing `answers` in a separate "reset" effect isn't
  // enough on its own: the transition-check effect below can still run
  // in that same batch using the pre-clear, stale answers.length from the
  // previous round. Filtering by the row's own round_number field instead
  // means stale leftover rows are simply never counted, no matter what
  // order anything happens to run in.
  const currentAnswers = useMemo(
    () => answers.filter((a) => a.round_number === session.current_round),
    [answers, session.current_round]
  );
  const currentVotes = useMemo(
    () => votes.filter((v) => v.round_number === session.current_round),
    [votes, session.current_round]
  );

  const myAnswer = currentAnswers.find((a) => a.player_id === myPlayerId);
  const myVote = currentVotes.find((v) => v.voter_player_id === myPlayerId);

  // Reset per-round local state whenever the round number changes. Clearing
  // answers/votes SYNCHRONOUSLY here (not waiting on the async refetch
  // below) matters: otherwise there's a render where current_round/round_
  // phase have already moved to the new round but `answers` still holds
  // the PREVIOUS round's data, and the "everyone answered" check would
  // fire using that stale count.
  useEffect(() => {
    shuffledRef.current = null;
    transitionedRef.current = false;
    scoringRef.current = false;
    autoSubmitRef.current = false;
    answeringDeadlineRef.current = null;
    setDraft("");
    setWinner(null);
    setWinnerFetched(false);
    setAnswers([]);
    setVotes([]);
  }, [session.current_round]);

  // Fetch this round's prompt
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shofah_round_prompts")
        .select("prompt_id, shofah_prompts(*)")
        .eq("session_id", session.id)
        .eq("round_number", session.current_round)
        .single();
      const p = (data as any)?.shofah_prompts as ShofahPromptRow | undefined;
      setPrompt(p ?? null);
    })();
  }, [session.id, session.current_round]);

  // Fetch + subscribe to answers and votes for this round
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const { data: ans } = await supabase
        .from("shofah_answers").select("*")
        .eq("session_id", session.id).eq("round_number", session.current_round);
      const { data: vt } = await supabase
        .from("shofah_votes").select("*")
        .eq("session_id", session.id).eq("round_number", session.current_round);
      if (cancelled) return;
      setAnswers((ans as ShofahAnswerRow[]) || []);
      setVotes((vt as ShofahVoteRow[]) || []);
    }
    loadAll();

    const channel = supabase
      .channel(`shofah-round-${session.id}-${session.current_round}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shofah_answers", filter: `session_id=eq.${session.id}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "shofah_votes", filter: `session_id=eq.${session.id}` }, loadAll)
      .subscribe();

    // Polling fallback, same reasoning as the lobby: don't let a missed
    // realtime broadcast strand everyone on "2/2 answered" with a dead timer.
    const pollId = setInterval(loadAll, 2500);

    return () => { cancelled = true; supabase.removeChannel(channel); clearInterval(pollId); };
  }, [session.id, session.current_round]);

  // A plain ticking clock — remaining time is derived from this fresh on
  // every render (see below), rather than tracked as its own lagging state.
  // That matters: if `remaining` were state updated by a separate effect,
  // there's a render right after a phase change where the new round_phase
  // has arrived but the old `remaining` value (e.g. 0, left over from the
  // previous phase ending) hasn't been recomputed yet — and an effect that
  // reads `remaining` in that render sees the stale value. Deriving it
  // directly from session.round_phase + session.phase_started_at instead
  // means it's always correct for whatever phase is current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const duration = session.round_phase === "answering" ? ANSWER_SECONDS
    : session.round_phase === "voting" ? VOTE_SECONDS
    : session.round_phase === "reveal" ? REVEAL_SECONDS
    : COUNTDOWN_SECONDS;
  const remaining = session.phase_started_at
    ? Math.max(0, Math.ceil(duration - (now - new Date(session.phase_started_at).getTime()) / 1000))
    : duration;

  // Host-only: countdown -> answering once the 5-4-3-2-1 finishes
  const countdownTransitionedRef = useRef(false);
  const [countdownError, setCountdownError] = useState<string | null>(null);

  async function advancePastCountdown() {
    if (countdownTransitionedRef.current) return;
    countdownTransitionedRef.current = true;
    const { error } = await supabase.from("shofah_sessions")
      .update({ round_phase: "answering", phase_started_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) {
      countdownTransitionedRef.current = false; // allow retry
      setCountdownError(error.message);
    }
  }

  useEffect(() => {
    if (!isHost || session.round_phase !== "countdown" || countdownTransitionedRef.current) return;
    if (remaining <= 0) advancePastCountdown();
  }, [isHost, session.round_phase, remaining, session.id]);

  // Host-only: advance answering -> voting once time's up or everyone submitted
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  async function advancePastAnswering() {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    const { error } = await supabase.from("shofah_sessions")
      .update({ round_phase: "voting", phase_started_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) {
      transitionedRef.current = false;
      setAdvanceError(error.message);
    }
  }

  useEffect(() => {
    if (!isHost || session.round_phase !== "answering" || transitionedRef.current) return;
    const everyoneAnswered = players.length > 0 && currentAnswers.length >= players.length;
    if (remaining <= 0 || everyoneAnswered) advancePastAnswering();
  }, [isHost, session.round_phase, remaining, currentAnswers.length, players.length, session.id]);

  // Host-only: once voting closes, ask the server to tally votes, apply
  // scores, and flip the session into the reveal phase. This has to go
  // through an API route (not a direct client write) because it needs to
  // update OTHER players' total_score, which the public RLS policies
  // deliberately don't allow from the browser.
  const [scoringError, setScoringError] = useState<string | null>(null);

  async function computeRoundResult() {
    if (scoringRef.current) return;
    scoringRef.current = true;
    try {
      const res = await fetch("/api/shofah-round-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, roundNumber: session.current_round }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
    } catch (e: any) {
      scoringRef.current = false; // allow retry
      setScoringError(e.message);
    }
  }

  useEffect(() => {
    if (!isHost || session.round_phase !== "voting" || scoringRef.current) return;
    const everyoneVoted = players.length > 0 && currentVotes.length >= players.length;
    if (remaining <= 0 || everyoneVoted) {
      if (currentAnswers.length === 0) {
        // Nobody answered this round at all — nothing to score or vote on.
        // Skip straight to reveal instead of calling an API that can only
        // fail (and would otherwise retry every tick).
        scoringRef.current = true;
        supabase.from("shofah_sessions")
          .update({ round_phase: "reveal", phase_started_at: new Date().toISOString() })
          .eq("id", session.id);
      } else {
        computeRoundResult();
      }
    }
  }, [isHost, session.round_phase, remaining, currentVotes.length, currentAnswers.length, players.length, session.id]);

  // Every client (not just the host) fetches the winner's info once the
  // session enters the reveal phase, so this doesn't depend on whoever
  // happened to trigger the scoring call.
  useEffect(() => {
    if (session.round_phase !== "reveal") return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("shofah_round_results")
        .select("winner_player_id, shofah_answers(text), shofah_players(nickname, avatar_emoji)")
        .eq("session_id", session.id)
        .eq("round_number", session.current_round)
        .single();
      if (cancelled) return;
      if (data) {
        const p = (data as any).shofah_players;
        const a = (data as any).shofah_answers;
        setWinner({ nickname: p?.nickname ?? "?", avatar: p?.avatar_emoji ?? "🏆", text: a?.text ?? "" });
      }
      setWinnerFetched(true);
    })();
    return () => { cancelled = true; };
  }, [session.round_phase, session.id, session.current_round]);

  // Host-only: after the reveal pause, move to the next round (or, past
  // round 5, hand off to the final-conversation phase — Phase 5).
  const advancedPastRevealRef = useRef(false);

  async function advancePastReveal() {
    if (advancedPastRevealRef.current) return;
    advancedPastRevealRef.current = true;
    if (session.current_round >= TOTAL_ROUNDS) {
      await supabase.from("shofah_sessions")
        .update({ current_round: TOTAL_ROUNDS + 1 })
        .eq("id", session.id);
    } else {
      await supabase.from("shofah_sessions")
        .update({ current_round: session.current_round + 1, round_phase: "answering", phase_started_at: new Date().toISOString() })
        .eq("id", session.id);
    }
  }

  useEffect(() => {
    advancedPastRevealRef.current = false;
  }, [session.current_round]);

  useEffect(() => {
    if (!isHost || session.round_phase !== "reveal" || advancedPastRevealRef.current) return;
    if (remaining <= 0) advancePastReveal();
  }, [isHost, session.round_phase, remaining, session.id, session.current_round]);

  const shuffledAnswers = useMemo(() => {
    if (session.round_phase !== "voting") return [];
    if (!shuffledRef.current) shuffledRef.current = shuffle(currentAnswers);
    return shuffledRef.current;
  }, [session.round_phase, currentAnswers]);

  // Auto-submit whatever's typed when the answering timer runs out — every
  // client does this for itself (not host-only), matching "auto submit
  // when timer ends" from the brief. If nothing was typed, nothing is
  // submitted; that player just has no answer in the voting round.
  //
  // This deliberately does NOT check "is round_phase still answering" —
  // that was the bug. The host's "advance to voting" write and this
  // player's own auto-submit both trigger off the same remaining<=0
  // instant; if the phase-change update reaches this browser first, the
  // old check would see round_phase already flipped to "voting" and skip
  // submitting entirely, silently dropping the draft. Instead, track the
  // wall-clock deadline for THIS round's answering phase directly, so the
  // submit still fires even if the displayed phase has already moved on.

  useEffect(() => {
    if (session.round_phase === "answering" && session.phase_started_at) {
      answeringDeadlineRef.current = new Date(session.phase_started_at).getTime() + ANSWER_SECONDS * 1000;
    }
  }, [session.round_phase, session.phase_started_at]);

  useEffect(() => {
    if (autoSubmitRef.current || myAnswer || !draft.trim()) return;
    if (!answeringDeadlineRef.current) return;
    if (now >= answeringDeadlineRef.current) {
      autoSubmitRef.current = true;
      submitAnswer();
    }
  }, [now, myAnswer, draft]);

  async function submitAnswer() {
    if (!myPlayerId || !draft.trim() || myAnswer) return;
    await supabase.from("shofah_answers").insert({
      session_id: session.id, round_number: session.current_round,
      player_id: myPlayerId, text: draft.trim().slice(0, MAX_CHARS),
    });
  }

  async function castVote(answerId: string, answerPlayerId: string) {
    if (!myPlayerId || myVote || answerPlayerId === myPlayerId) return;
    await supabase.from("shofah_votes").insert({
      session_id: session.id, round_number: session.current_round,
      voter_player_id: myPlayerId, answer_id: answerId,
    });
  }

  const Character = session.character === "girl" ? NiqabGirl : ShemaghGuy;
  const promptText = prompt ? (lang === "ar" ? prompt.text_ar : prompt.text_en) : "";

  // Past round 5 — the final conversation reveal is Phase 5, not built yet.
  if (session.current_round > TOTAL_ROUNDS) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 60, textAlign: "center" }}>
        <Character size={110} />
        <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t.gameOverSoon}</p>
      </div>
    );
  }

  if (session.round_phase === "countdown") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 60 }}>
        <Character size={130} />
        <div
          key={remaining}
          className="font-display pop"
          style={{ fontSize: 80, fontWeight: 800, color: ROSE, lineHeight: 1 }}
        >
          {remaining > 0 ? remaining : (lang === "ar" ? "يلا!" : "Go!")}
        </div>
        {remaining <= 0 && (
          <div style={{ color: ROSE, height: 6 }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}
        {remaining <= 0 && isHost && (
          <button
            onClick={advancePastCountdown}
            className="font-body"
            style={{ fontSize: 13, color: "var(--ink-soft)", background: "none", border: "none", textDecoration: "underline" }}
          >
            {lang === "ar" ? "متعلقين؟ اضغط للمتابعة" : "Stuck? Tap to continue"}
          </button>
        )}
        {countdownError && (
          <p className="font-body" style={{ fontSize: 12, color: ROSE, textAlign: "center", maxWidth: 260 }}>
            {countdownError}
          </p>
        )}
      </div>
    );
  }

  if (session.round_phase === "reveal") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40, textAlign: "center" }}>
        <div style={{ fontSize: 60 }} className="pop">🎉</div>
        <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: ROSE, margin: 0 }}>
          🏆 {t.winnerHeader}
        </p>
        {winner ? (
          <div className="card pop" style={{ padding: 20, textAlign: "center", maxWidth: 340 }}>
            <div style={{ fontSize: 40 }}>{winner.avatar}</div>
            <p className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: "6px 0" }}>{winner.nickname}</p>
            <p className="font-body" style={{ fontSize: 15, fontStyle: "italic", opacity: 0.85 }}>"{winner.text}"</p>
          </div>
        ) : winnerFetched ? (
          <p className="font-body" style={{ color: "var(--ink-soft)" }}>
            {lang === "ar" ? "محد جاوب هالجولة 😅" : "Nobody answered this round 😅"}
          </p>
        ) : (
          <div style={{ color: "var(--ink-soft)", height: 20, display: "flex", alignItems: "center" }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}
        {(winner || winnerFetched) && (
          <div style={{ color: "var(--ink-soft)", height: 6 }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}
        {scoringError && (
          <p className="font-body" style={{ fontSize: 12, color: ROSE, textAlign: "center" }}>{scoringError}</p>
        )}
        {remaining <= 0 && isHost && (
          <button
            onClick={advancePastReveal}
            className="font-display"
            style={{
              padding: "12px 28px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${ROSE}, ${WINE})`,
            }}
          >
            {session.current_round >= TOTAL_ROUNDS ? t.continueBtn : t.nextRoundBtn}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20 }}>
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {session.current_round} / {TOTAL_ROUNDS}
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <Character size={100} />
      </div>

      {promptText && (
        <div className="card pop" style={{ padding: 18, textAlign: "center", position: "relative" }}>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{promptText}</p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="font-display"
          style={{
            width: 48, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#fff",
            background: remaining <= 5 ? ROSE : `linear-gradient(135deg, ${ROSE}, ${WINE})`,
          }}
        >
          {remaining}
        </div>
      </div>

      {session.round_phase === "answering" && (
        <>
          {!myAnswer ? (
            <div className="card" style={{ padding: 16 }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                rows={3}
                style={{
                  width: "100%", padding: 12, borderRadius: 14, border: "2px solid var(--ring)",
                  background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none", resize: "none",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span className="font-body" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{draft.length}/{MAX_CHARS}</span>
                <button
                  onClick={submitAnswer}
                  disabled={!draft.trim()}
                  className="font-display"
                  style={{
                    padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff",
                    background: draft.trim() ? `linear-gradient(135deg, ${ROSE}, ${WINE})` : "var(--ring)",
                    opacity: draft.trim() ? 1 : 0.6,
                  }}
                >
                  {lang === "ar" ? "إرسال" : "Submit"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 16, textAlign: "center" }}>
              <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, marginBottom: 8 }}>
                {lang === "ar" ? "تم الإرسال! بانتظار الباقين..." : "Submitted! Waiting for the others..."}
              </p>
              <p className="font-body" style={{ fontSize: 13, fontStyle: "italic", opacity: 0.8 }}>
                "{myAnswer.text}"
              </p>
            </div>
          )}
          <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
            {currentAnswers.length}/{players.length} {lang === "ar" ? "جاوبوا" : "answered"}
          </p>
          {remaining <= 0 && isHost && (
            <button
              onClick={advancePastAnswering}
              className="font-body"
              style={{ display: "block", margin: "0 auto", fontSize: 13, color: "var(--ink-soft)", background: "none", border: "none", textDecoration: "underline" }}
            >
              {lang === "ar" ? "متعلقين؟ اضغط للمتابعة" : "Stuck? Tap to continue"}
            </button>
          )}
          {advanceError && (
            <p className="font-body" style={{ fontSize: 12, color: ROSE, textAlign: "center" }}>{advanceError}</p>
          )}
        </>
      )}

      {session.round_phase === "voting" && (
        <>
          <p className="font-display" style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: ROSE, margin: 0 }}>
            {t.voteHeader}
          </p>
          {shuffledAnswers.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--ink-soft)" }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shuffledAnswers.map((a) => {
              const isMine = a.player_id === myPlayerId;
              const isSelected = myVote?.answer_id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => castVote(a.id, a.player_id)}
                  disabled={!!myVote || isMine}
                  className="card"
                  style={{
                    padding: 16, textAlign: lang === "ar" ? "right" : "left", fontSize: 15,
                    border: isSelected ? `3px solid ${ROSE}` : "3px solid transparent",
                    opacity: isMine ? 0.45 : 1,
                    cursor: !myVote && !isMine ? "pointer" : "default",
                  }}
                >
                  {a.text}
                  {isMine && (
                    <span className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", display: "block", marginTop: 4 }}>
                      {lang === "ar" ? "✍️ إجابتك" : "✍️ your answer"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
            {currentVotes.length}/{players.length} {lang === "ar" ? "صوّتوا" : "voted"}
          </p>
          {scoringError && (
            <p className="font-body" style={{ fontSize: 12, color: ROSE, textAlign: "center" }}>{scoringError}</p>
          )}
        </>
      )}
    </div>
  );
}
