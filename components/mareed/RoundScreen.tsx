"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MAREED_STR, MareedLang } from "@/lib/mareed-i18n";
import { playCountdownTick, playCountdownGo, playUrgentTick, unlockAudio } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import LeaveGameButton from "@/components/LeaveGameButton";
import Character from "./PatientMascot";
import FinalConversation from "./FinalConversation";
import FinalReveal from "./FinalReveal";
import type {
  MareedSessionRow, MareedPlayerRow, MareedPromptRow,
  MareedAnswerRow, MareedVoteRow,
} from "@/lib/mareed-types";

const ROSE = "#E63946";
const WINE = "#C2185B";
const ANSWER_SECONDS = 30;
const VOTE_SECONDS = 20;
const COUNTDOWN_SECONDS = 5;
// Not a separate screen anymore — just a brief "vote locked, here's who
// wrote what" beat shown inline at the bottom of the voting screen before
// auto-advancing. Kept short on purpose so it doesn't kill momentum.
const REVEAL_SECONDS = 2.5;
const MAX_CHARS = 80;
const TOTAL_ROUNDS = 5;

export default function RoundScreen({
  session, players, myPlayerId, isHost, lang,
}: {
  session: MareedSessionRow;
  players: MareedPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: MareedLang;
}) {
  const t = MAREED_STR[lang];
  const [prompt, setPrompt] = useState<MareedPromptRow | null>(null);
  const [answers, setAnswers] = useState<MareedAnswerRow[]>([]);
  const [votes, setVotes] = useState<MareedVoteRow[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const shuffleKeysRef = useRef<Map<string, number>>(new Map());
  const transitionedRef = useRef(false);
  const scoringRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const answeringDeadlineRef = useRef<number | null>(null);
  const autoVoteRef = useRef(false);
  const votingDeadlineRef = useRef<number | null>(null);

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
    shuffleKeysRef.current = new Map();
    transitionedRef.current = false;
    scoringRef.current = false;
    autoSubmitRef.current = false;
    answeringDeadlineRef.current = null;
    autoVoteRef.current = false;
    votingDeadlineRef.current = null;
    setDraft("");
    setSelectedAnswerId(null);
    setAnswers([]);
    setVotes([]);
  }, [session.current_round]);

  // Reset scroll position and dismiss any open keyboard whenever the phase
  // changes (e.g. answering -> voting). Without this, if a player is still
  // focused on the answer textarea (keyboard open) right as the timer ends
  // and the phase flips, the page's scroll position from the answering
  // screen can carry over into the shorter voting screen, pushing the
  // Submit button below the fold — it's still there, just invisible until
  // manually scrolled to.
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [session.round_phase]);

  // Fetch this round's prompt
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("mareed_round_prompts")
        .select("prompt_id, mareed_prompts(*)")
        .eq("session_id", session.id)
        .eq("round_number", session.current_round)
        .single();
      const p = (data as any)?.mareed_prompts as MareedPromptRow | undefined;
      setPrompt(p ?? null);
    })();
  }, [session.id, session.current_round]);

  // Fetch + subscribe to answers and votes for this round
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const { data: ans } = await supabase
        .from("mareed_answers").select("*")
        .eq("session_id", session.id).eq("round_number", session.current_round);
      const { data: vt } = await supabase
        .from("mareed_votes").select("*")
        .eq("session_id", session.id).eq("round_number", session.current_round);
      if (cancelled) return;
      setAnswers((ans as MareedAnswerRow[]) || []);
      setVotes((vt as MareedVoteRow[]) || []);
    }
    loadAll();

    const channel = supabase
      .channel(`mareed-round-${session.id}-${session.current_round}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mareed_answers", filter: `session_id=eq.${session.id}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "mareed_votes", filter: `session_id=eq.${session.id}` }, loadAll)
      .subscribe();

    // Polling fallback, same reasoning as the lobby: don't let a missed
    // realtime broadcast strand everyone on "2/2 answered" with a dead timer.
    const pollId = setInterval(loadAll, 1200);

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

  // Sound effects: countdown ticks + "go", and an urgent tick for the final
  // 5 seconds of the answering/voting timer. `remaining` is recomputed every
  // 250ms from the ticking clock above, but a sound should fire exactly once
  // per whole second — this ref remembers the last (phase, value) pair a
  // sound was already played for, so repeated renders at the same integer
  // don't repeat the sound.
  const { enabled: soundOn, setEnabled: setSoundOn } = useSoundPref();
  const soundLastRef = useRef<{ phase: string; value: number } | null>(null);

  useEffect(() => {
    if (!soundOn) return;
    const phase = session.round_phase;
    if (soundLastRef.current?.phase === phase && soundLastRef.current?.value === remaining) return;
    soundLastRef.current = { phase, value: remaining };

    if (phase === "countdown") {
      if (remaining > 0) playCountdownTick();
      else playCountdownGo();
    } else if (phase === "answering" || phase === "voting") {
      // Matches the same <=5 threshold the timer badge below uses to turn red.
      if (remaining > 0 && remaining <= 5) playUrgentTick();
    }
  }, [session.round_phase, remaining, soundOn]);

  const muteButton = (
    <button
      onClick={() => setSoundOn(!soundOn)}
      aria-label={soundOn ? (lang === "ar" ? "كتم الصوت" : "Mute sound") : (lang === "ar" ? "تشغيل الصوت" : "Unmute sound")}
      style={{
        position: "absolute", top: 14, insetInlineEnd: 14,
        width: 34, height: 34, borderRadius: 999, border: "none",
        background: "var(--card)", color: "var(--ink-soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px var(--ring)",
      }}
    >
      {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
    </button>
  );

  // Host-only: countdown -> prewarm (the player-voting warm-up round) once
  // the 5-4-3-2-1 finishes. Round 1's answering phase doesn't start until
  // the prewarm round hands off to it (see PrewarmRound.tsx).
  const countdownTransitionedRef = useRef(false);
  const [countdownError, setCountdownError] = useState<string | null>(null);

  async function advancePastCountdown() {
    if (countdownTransitionedRef.current) return;
    countdownTransitionedRef.current = true;
    const { error } = await supabase.from("mareed_sessions")
      .update({ round_phase: "prewarm", phase_started_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) {
      countdownTransitionedRef.current = false; // allow retry
      setCountdownError(error.message);
    }
  }

  useEffect(() => {
    if (!isHost || session.current_round > TOTAL_ROUNDS || session.round_phase !== "countdown" || countdownTransitionedRef.current) return;
    if (remaining <= 0) advancePastCountdown();
  }, [isHost, session.round_phase, remaining, session.id]);

  // Host-only: advance answering -> voting once time's up or everyone submitted
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  async function advancePastAnswering() {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    // If literally nobody answered, there's nothing to vote on — skip
    // voting entirely rather than making everyone sit through a pointless
    // 20-second timer staring at an empty list, and go straight to a
    // flavorful "awkward silence" reveal.
    const nextPhase = currentAnswers.length === 0 ? "reveal" : "voting";
    const { error } = await supabase.from("mareed_sessions")
      .update({ round_phase: nextPhase, phase_started_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) {
      transitionedRef.current = false;
      setAdvanceError(error.message);
    }
  }

  useEffect(() => {
    if (!isHost || session.current_round > TOTAL_ROUNDS || session.round_phase !== "answering" || transitionedRef.current) return;
    const everyoneAnswered = players.length > 0 && currentAnswers.length >= players.length;
    if (remaining <= 0 || everyoneAnswered) advancePastAnswering();
  }, [isHost, session.round_phase, remaining, currentAnswers.length, players.length, session.id]);

  // Host-only: once voting closes (everyone voted, or the timer ran out),
  // fire the scoring call in the BACKGROUND (fire-and-forget — still goes
  // through the API route since it needs to update OTHER players'
  // total_score, which RLS blocks from the browser) and, at the same time,
  // show a brief "vote locked" + who-wrote-what beat before auto-advancing.
  // We deliberately do NOT wait for scoring to finish before moving on —
  // that round trip was what made the old reveal screen feel slow. Scoring
  // still happens every round, just invisibly; the actual winner only
  // resurfaces later, in the Final Conversation recap.
  const [scoringError, setScoringError] = useState<string | null>(null);

  async function computeRoundResult() {
    try {
      const res = await fetch("/api/mareed-round-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, roundNumber: session.current_round }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
    } catch (e: any) {
      setScoringError(e.message);
    }
  }

  useEffect(() => {
    if (!isHost || session.current_round > TOTAL_ROUNDS || session.round_phase !== "voting" || scoringRef.current) return;
    const everyoneVoted = players.length > 0 && currentVotes.length >= players.length;
    if (remaining <= 0 || everyoneVoted) {
      scoringRef.current = true;
      // Only bother calling the scoring API if there was actually something
      // to score; either way, flip to "reveal" right away — that phase is
      // now just the short locked/who-wrote-what beat, not a wait state.
      if (currentAnswers.length > 0) computeRoundResult();
      supabase.from("mareed_sessions")
        .update({ round_phase: "reveal", phase_started_at: new Date().toISOString() })
        .eq("id", session.id)
        .then(({ error }) => {
          // If this write fails (RLS hiccup, dropped connection, etc.) we
          // MUST clear the guard — otherwise the round is stuck forever,
          // since nothing else will ever re-attempt this transition.
          if (error) {
            scoringRef.current = false;
            setScoringError(error.message);
          }
        });
    }
  }, [isHost, session.round_phase, remaining, currentVotes.length, currentAnswers.length, players.length, session.id]);

  // Host-only: after the brief locked/reveal beat, move to the next round
  // (or, past round 5, hand off to the final-conversation phase).
  const advancedPastRevealRef = useRef(false);

  async function advancePastReveal() {
    if (advancedPastRevealRef.current) return;
    advancedPastRevealRef.current = true;
    const { error } = session.current_round >= TOTAL_ROUNDS
      ? await supabase.from("mareed_sessions")
          .update({ current_round: TOTAL_ROUNDS + 1 })
          .eq("id", session.id)
      : await supabase.from("mareed_sessions")
          .update({ current_round: session.current_round + 1, round_phase: "answering", phase_started_at: new Date().toISOString() })
          .eq("id", session.id);
    if (error) {
      advancedPastRevealRef.current = false; // allow retry instead of stalling forever
      setScoringError(error.message);
    }
  }

  useEffect(() => {
    advancedPastRevealRef.current = false;
  }, [session.current_round]);

  useEffect(() => {
    if (!isHost || session.current_round > TOTAL_ROUNDS || session.round_phase !== "reveal" || advancedPastRevealRef.current) return;
    if (remaining <= 0) advancePastReveal();
  }, [isHost, session.round_phase, remaining, session.id, session.current_round]);

  // Kept alive through "reveal" too (not just "voting") so the reveal beat
  // shows authors in the SAME shuffled order players just voted on, instead
  // of re-sorting the list the instant it locks — that re-sort was part of
  // what made the old transition feel jarring.
  const shuffledAnswers = useMemo(() => {
    if (session.round_phase !== "voting" && session.round_phase !== "reveal") return [];
    for (const a of currentAnswers) {
      if (!shuffleKeysRef.current.has(a.id)) shuffleKeysRef.current.set(a.id, Math.random());
    }
    return [...currentAnswers].sort(
      (a, b) => shuffleKeysRef.current.get(a.id)! - shuffleKeysRef.current.get(b.id)!
    );
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

  // Same pattern for voting: if a player picked an answer but the timer
  // ran out before they hit Submit, their selection still counts instead
  // of silently vanishing.
  useEffect(() => {
    if (session.round_phase === "voting" && session.phase_started_at) {
      votingDeadlineRef.current = new Date(session.phase_started_at).getTime() + VOTE_SECONDS * 1000;
    }
  }, [session.round_phase, session.phase_started_at]);

  useEffect(() => {
    if (autoVoteRef.current || myVote || !selectedAnswerId) return;
    if (!votingDeadlineRef.current) return;
    if (now >= votingDeadlineRef.current) {
      autoVoteRef.current = true;
      const target = shuffledAnswers.find((a) => a.id === selectedAnswerId);
      if (target) castVote(target.id, target.player_id);
    }
  }, [now, myVote, selectedAnswerId]);

  async function submitAnswer() {
    if (!myPlayerId || !draft.trim() || myAnswer) return;
    unlockAudio(); // a real tap — cheap belt-and-suspenders in case nothing upstream unlocked it yet
    await supabase.from("mareed_answers").insert({
      session_id: session.id, round_number: session.current_round,
      player_id: myPlayerId, text: draft.trim().slice(0, MAX_CHARS),
    });
  }

  async function castVote(answerId: string, answerPlayerId: string) {
    if (!myPlayerId || myVote) return;
    unlockAudio();
    await supabase.from("mareed_votes").insert({
      session_id: session.id, round_number: session.current_round,
      voter_player_id: myPlayerId, answer_id: answerId,
    });
  }


  const promptText = prompt ? (lang === "ar" ? prompt.text_ar : prompt.text_en) : "";

  // Stable across re-renders (only changes if session.id ever does, which
  // it doesn't for a session's lifetime) — this used to be a fresh arrow
  // function every render, which meant FinalConversation's auto-advance
  // timer (keyed on this callback's identity) got cancelled and restarted
  // on every ~1.2s poll tick and could never survive long enough to fire.
  // See FinalConversation.tsx's comment for the full story.
  const handleFinalConversationDone = useCallback(async () => {
    await supabase.from("mareed_sessions")
      .update({ current_round: TOTAL_ROUNDS + 2 })
      .eq("id", session.id);
  }, [session.id]);

  // Past round 5: round 6 = final conversation, round 7+ = final reveal.
  if (session.current_round === TOTAL_ROUNDS + 1) {
    return (
      <FinalConversation
        session={session}
        isHost={isHost}
        lang={lang}
        onDone={handleFinalConversationDone}
      />
    );
  }

  if (session.current_round > TOTAL_ROUNDS + 1) {
    return <FinalReveal session={session} players={players} myPlayerId={myPlayerId} isHost={isHost} lang={lang} />;
  }

  if (session.round_phase === "countdown") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 60, position: "relative" }}>
        {muteButton}
        <LeaveGameButton lang={lang} />
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

  // The prewarm round (player-voting warm-up before round 1) is rendered by
  // the parent page as its own component (PrewarmRound), not here — this
  // guard just avoids RoundScreen falling through to a nonsensical
  // answering/voting render if it's ever mounted during these phases.
  if (session.round_phase === "prewarm" || session.round_phase === "prewarm_teaser") {
    return null;
  }

  // "reveal" is no longer its own screen — it's a brief inline beat shown
  // at the bottom of the voting screen (below) that immediately shows who
  // wrote what, then auto-advances. If we somehow render while in reveal
  // phase but currentAnswers hasn't loaded yet this tick, just fall through
  // to the voting screen below, which handles the reveal beat itself.

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20, position: "relative" }}>
      {muteButton}
      <LeaveGameButton lang={lang} />
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
                // The box used to be completely blank with no prompt of any
                // kind, which is rough with a 30s timer running. Autofocus
                // saves a tap too — this screen exists only to type in.
                placeholder={lang === "ar" ? "اكتب ردك هنا..." : "Type your answer..."}
                aria-label={lang === "ar" ? "ردك" : "Your answer"}
                maxLength={MAX_CHARS}
                autoFocus
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

      {(session.round_phase === "voting" || session.round_phase === "reveal") && (
        <>
          {session.round_phase === "reveal" ? (
            <p className="font-display pop" style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: ROSE, margin: 0 }}>
              🔒 {lang === "ar" ? "تم قفل التصويت!" : "Vote locked!"}
            </p>
          ) : (
            <p className="font-display" style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: ROSE, margin: 0 }}>
              {t.voteHeader}
            </p>
          )}
          {shuffledAnswers.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--ink-soft)" }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shuffledAnswers.map((a) => {
              const isMine = a.player_id === myPlayerId;
              const isCommitted = myVote?.answer_id === a.id;
              const isSelected = !myVote && selectedAnswerId === a.id;
              // Only de-anonymized once the round is locked (reveal beat) —
              // during active voting, authorship stays hidden except for
              // your own answer, same as before.
              const revealed = session.round_phase === "reveal";
              const author = revealed ? players.find((p) => p.id === a.player_id) : undefined;
              return (
                <button
                  key={a.id}
                  onClick={() => !myVote && setSelectedAnswerId(a.id)}
                  disabled={!!myVote || revealed}
                  className="card"
                  style={{
                    padding: 16, textAlign: lang === "ar" ? "right" : "left", fontSize: 15,
                    border: (isSelected || isCommitted) ? `3px solid ${ROSE}` : "3px solid transparent",
                    opacity: 1,
                    cursor: !myVote && !revealed ? "pointer" : "default",
                  }}
                >
                  {a.text}
                  {revealed && author && (
                    <span
                      className="font-body pop"
                      style={{
                        fontSize: 11, fontWeight: 700, color: ROSE, display: "flex", alignItems: "center", gap: 4,
                        marginTop: 6, justifyContent: lang === "ar" ? "flex-end" : "flex-start",
                      }}
                    >
                      {author.avatar_emoji} {author.nickname}
                    </span>
                  )}
                  {isMine && !revealed && (
                    <span className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", display: "block", marginTop: 4 }}>
                      {lang === "ar" ? "✍️ إجابتك" : "✍️ your answer"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {session.round_phase === "voting" && !myVote && (
            <button
              onClick={() => selectedAnswerId && castVote(selectedAnswerId, shuffledAnswers.find((a) => a.id === selectedAnswerId)?.player_id || "")}
              disabled={!selectedAnswerId}
              className="font-display"
              style={{
                padding: 14, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                background: selectedAnswerId ? `linear-gradient(135deg, ${ROSE}, ${WINE})` : "var(--ring)",
                opacity: selectedAnswerId ? 1 : 0.6,
              }}
            >
              {lang === "ar" ? "تأكيد التصويت" : "Submit Vote"}
            </button>
          )}
          {session.round_phase === "voting" && (
            <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
              {currentVotes.length}/{players.length} {lang === "ar" ? "صوّتوا" : "voted"}
            </p>
          )}
          {scoringError && (
            <p className="font-body" style={{ fontSize: 12, color: ROSE, textAlign: "center" }}>{scoringError}</p>
          )}
        </>
      )}
    </div>
  );
}
