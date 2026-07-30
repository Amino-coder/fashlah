"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Feather, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QASEEDA_STR, QaseedaLang } from "@/lib/qaseeda-i18n";
import { playCountdownTick, playCountdownGo, playUrgentTick, unlockAudio } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import { fetchPoemSoFar, type PoemLine } from "@/lib/qaseeda-poem";
import FinalReveal from "./FinalReveal";
import type {
  QaseedaSessionRow, QaseedaPlayerRow, QaseedaAnswerRow, QaseedaVoteRow,
} from "@/lib/qaseeda-types";

const GOLD = "#D9A441";
const NAVY = "#1B3A55";
const ANSWER_SECONDS = 45;
const VOTE_SECONDS = 20;
const COUNTDOWN_SECONDS = 5;
// A brief "vote locked, here's who wrote what" beat shown inline at the
// bottom of the voting screen before auto-advancing — same pattern as
// شوفة, just held a beat longer so the newly-landed poem line can be read.
const REVEAL_SECONDS = 3;
const MAX_CHARS = 100;
const TOTAL_ROUNDS = 5;

export default function RoundScreen({
  session, players, myPlayerId, isHost, lang,
}: {
  session: QaseedaSessionRow;
  players: QaseedaPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: QaseedaLang;
}) {
  const t = QASEEDA_STR[lang];
  const [answers, setAnswers] = useState<QaseedaAnswerRow[]>([]);
  const [votes, setVotes] = useState<QaseedaVoteRow[]>([]);
  const [poemSoFar, setPoemSoFar] = useState<PoemLine[]>([]);
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

  // Filtered by round_number, not just "whatever's in state" — same reason
  // as شوفة: this is what makes the round transition safe against a stale
  // batch of pre-clear rows lingering across an effect boundary.
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

  // Reset per-round local state whenever the round number changes.
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

  // Dismiss any open keyboard and reset scroll on phase change, same as
  // شوفة — otherwise a focused textarea can carry the scroll position over
  // into a shorter screen and push controls below the fold.
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [session.round_phase]);

  // Fetch + subscribe to this round's answers, votes, AND the poem itself
  // (opening + every previous round's winning line). The round_results
  // subscription is what makes the "winning line animates in beneath the
  // poem" moment happen live for everyone the instant scoring lands.
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const [{ data: ans }, { data: vt }, poem] = await Promise.all([
        supabase.from("qaseeda_answers").select("*")
          .eq("session_id", session.id).eq("round_number", session.current_round),
        supabase.from("qaseeda_votes").select("*")
          .eq("session_id", session.id).eq("round_number", session.current_round),
        fetchPoemSoFar(session, session.current_round),
      ]);
      if (cancelled) return;
      setAnswers((ans as QaseedaAnswerRow[]) || []);
      setVotes((vt as QaseedaVoteRow[]) || []);
      setPoemSoFar(poem);
    }
    loadAll();

    const channel = supabase
      .channel(`qaseeda-round-${session.id}-${session.current_round}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "qaseeda_answers", filter: `session_id=eq.${session.id}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "qaseeda_votes", filter: `session_id=eq.${session.id}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "qaseeda_round_results", filter: `session_id=eq.${session.id}` }, loadAll)
      .subscribe();

    // Polling fallback, same reasoning as شوفة: don't let a missed realtime
    // broadcast strand everyone on a dead timer or a poem that never grows.
    const pollId = setInterval(loadAll, 1200);

    return () => { cancelled = true; supabase.removeChannel(channel); clearInterval(pollId); };
  }, [session.id, session.current_round]);

  // A plain ticking clock, same reasoning as شوفة: derive `remaining` fresh
  // every render rather than tracking it as its own lagging state.
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

  // Host-only: countdown -> round 1's answering phase once 5-4-3-2-1 finishes.
  const countdownTransitionedRef = useRef(false);
  const [countdownError, setCountdownError] = useState<string | null>(null);

  async function advancePastCountdown() {
    if (countdownTransitionedRef.current) return;
    countdownTransitionedRef.current = true;
    const { error } = await supabase.from("qaseeda_sessions")
      .update({ current_round: 1, round_phase: "answering", phase_started_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) {
      countdownTransitionedRef.current = false;
      setCountdownError(error.message);
    }
  }

  useEffect(() => {
    if (!isHost || session.round_phase !== "countdown" || countdownTransitionedRef.current) return;
    if (remaining <= 0) advancePastCountdown();
  }, [isHost, session.round_phase, remaining, session.id]);

  // Host-only: advance answering -> voting once time's up or everyone submitted.
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  async function advancePastAnswering() {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    // Nothing to vote on if literally nobody wrote a line — skip voting and
    // go straight to the brief reveal beat, matching شوفة's "no answers"
    // handling instead of a pointless 20s timer over an empty list.
    const nextPhase = currentAnswers.length === 0 ? "reveal" : "voting";
    const { error } = await supabase.from("qaseeda_sessions")
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

  // Host-only: once voting closes, fire scoring in the background
  // (fire-and-forget — needs the service role to update OTHER players'
  // total_score) while showing the brief "locked" beat, same as شوفة.
  const [scoringError, setScoringError] = useState<string | null>(null);

  async function computeRoundResult() {
    try {
      const res = await fetch("/api/qaseeda-round-result", {
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
      if (currentAnswers.length > 0) computeRoundResult();
      supabase.from("qaseeda_sessions")
        .update({ round_phase: "reveal", phase_started_at: new Date().toISOString() })
        .eq("id", session.id)
        .then(({ error }) => {
          if (error) {
            scoringRef.current = false;
            setScoringError(error.message);
          }
        });
    }
  }, [isHost, session.round_phase, remaining, currentVotes.length, currentAnswers.length, players.length, session.id]);

  // Host-only: after the brief reveal beat, move to the next round (or,
  // past round 5, hand off to the cinematic final reveal).
  const advancedPastRevealRef = useRef(false);

  async function advancePastReveal() {
    if (advancedPastRevealRef.current) return;
    advancedPastRevealRef.current = true;
    const { error } = session.current_round >= TOTAL_ROUNDS
      ? await supabase.from("qaseeda_sessions")
          .update({ current_round: TOTAL_ROUNDS + 1 })
          .eq("id", session.id)
      : await supabase.from("qaseeda_sessions")
          .update({ current_round: session.current_round + 1, round_phase: "answering", phase_started_at: new Date().toISOString() })
          .eq("id", session.id);
    if (error) {
      advancedPastRevealRef.current = false;
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

  // Kept alive through "reveal" too, so the reveal beat shows authors in
  // the SAME shuffled order players just voted on.
  const shuffledAnswers = useMemo(() => {
    if (session.round_phase !== "voting" && session.round_phase !== "reveal") return [];
    for (const a of currentAnswers) {
      if (!shuffleKeysRef.current.has(a.id)) shuffleKeysRef.current.set(a.id, Math.random());
    }
    return [...currentAnswers].sort(
      (a, b) => shuffleKeysRef.current.get(a.id)! - shuffleKeysRef.current.get(b.id)!
    );
  }, [session.round_phase, currentAnswers]);

  // Auto-submit whatever's typed when the answering timer runs out — tracks
  // the wall-clock deadline directly (not "is phase still answering") so a
  // late-arriving phase-change broadcast can't silently drop the draft.
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

  // Same pattern for voting.
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
    unlockAudio();
    await supabase.from("qaseeda_answers").insert({
      session_id: session.id, round_number: session.current_round,
      player_id: myPlayerId, text: draft.trim().slice(0, MAX_CHARS),
    });
  }

  async function castVote(answerId: string, answerPlayerId: string) {
    // Self-votes are blocked at the call site (the button is disabled for
    // your own line), but guard here too in case of a stale click.
    if (!myPlayerId || myVote || answerPlayerId === myPlayerId) return;
    unlockAudio();
    await supabase.from("qaseeda_votes").insert({
      session_id: session.id, round_number: session.current_round,
      voter_player_id: myPlayerId, answer_id: answerId,
    });
  }

  // Past round 5: current_round becomes TOTAL_ROUNDS + 1 -> hand off
  // straight to the cinematic reveal (no intermediate chat-recap screen —
  // the poem itself IS the recap here).
  if (session.current_round === TOTAL_ROUNDS + 1) {
    return <FinalReveal session={session} players={players} isHost={isHost} lang={lang} />;
  }

  const PoemSoFarCard = poemSoFar.length > 0 && (
    <div
      className="card"
      style={{
        padding: "18px 20px", maxHeight: 260, overflowY: "auto",
        border: "1px solid rgba(217,164,65,0.22)",
      }}
    >
      <p className="font-body" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: GOLD, margin: "0 0 10px", textAlign: "center" }}>
        {t.poemSoFar.toUpperCase()}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {poemSoFar.map((line) => (
          <div key={line.round} className="pop" dir="rtl" style={{ textAlign: "center" }}>
            <p className="font-quote" style={{ fontSize: line.isOpening ? 18 : 16, fontWeight: 600, lineHeight: 1.7, margin: 0, color: "var(--ink)" }}>
              {line.line1}
            </p>
            {line.line2 && (
              <p className="font-quote" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.7, margin: 0, color: "var(--ink)" }}>
                {line.line2}
              </p>
            )}
            {line.authorName && (
              <p className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", margin: "4px 0 0", fontWeight: 700 }}>
                {line.isOpening
                  ? `${line.isCustomOpening ? t.writtenByLabel : t.poetLabel}: ${line.authorName}`
                  : `${t.writtenBy} ${line.authorName}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (session.round_phase === "countdown") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 40, position: "relative" }}>
        {muteButton}
        {PoemSoFarCard}
        <div
          aria-hidden="true"
          style={{
            width: 90, height: 90, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${NAVY}, #0A1526)`, boxShadow: `0 10px 26px ${NAVY}55`,
          }}
        >
          <Feather size={38} color={GOLD} />
        </div>
        <div
          key={remaining}
          className="font-display pop"
          style={{ fontSize: 70, fontWeight: 800, color: GOLD, lineHeight: 1 }}
        >
          {remaining > 0 ? remaining : (lang === "ar" ? "يلا!" : "Go!")}
        </div>
        {remaining <= 0 && (
          <div style={{ color: GOLD, height: 6 }}>
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
          <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center", maxWidth: 260 }}>
            {countdownError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20, position: "relative" }}>
      {muteButton}
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {session.current_round} / {TOTAL_ROUNDS}
        </span>
      </div>

      {PoemSoFarCard}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="font-display"
          style={{
            width: 48, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#fff",
            background: remaining <= 5 ? "#E63946" : `linear-gradient(135deg, ${GOLD}, ${NAVY})`,
          }}
        >
          {remaining}
        </div>
      </div>

      {session.round_phase === "answering" && (
        <>
          <p className="font-display" style={{ textAlign: "center", fontSize: 16, fontWeight: 800, margin: 0 }}>
            {t.writeNextLine}
          </p>
          {!myAnswer ? (
            <div className="card" style={{ padding: 16 }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                rows={3}
                dir="rtl"
                placeholder={t.yourLinePh}
                aria-label={t.yourLinePh}
                maxLength={MAX_CHARS}
                autoFocus
                className="font-quote"
                style={{
                  width: "100%", padding: 12, borderRadius: 14, border: "2px solid var(--ring)",
                  background: "transparent", color: "var(--ink)", fontSize: 17, outline: "none", resize: "none",
                  fontFamily: "inherit", textAlign: "center",
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
                    background: draft.trim() ? `linear-gradient(135deg, ${GOLD}, ${NAVY})` : "var(--ring)",
                    opacity: draft.trim() ? 1 : 0.6,
                  }}
                >
                  {t.submitLine}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 16, textAlign: "center" }}>
              <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, marginBottom: 8 }}>
                {t.lineSubmitted}
              </p>
              <p className="font-quote" dir="rtl" style={{ fontSize: 16, fontStyle: "italic", opacity: 0.85 }}>
                "{myAnswer.text}"
              </p>
            </div>
          )}
          <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
            {currentAnswers.length}/{players.length} {lang === "ar" ? "كتبوا" : "wrote"}
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
            <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center" }}>{advanceError}</p>
          )}
        </>
      )}

      {(session.round_phase === "voting" || session.round_phase === "reveal") && (
        <>
          {session.round_phase === "reveal" ? (
            <p className="font-display pop" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: GOLD, margin: 0 }}>
              {t.lineLocked}
            </p>
          ) : (
            <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: GOLD, margin: 0 }}>
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
              // Only de-anonymized once the round is locked (reveal beat).
              const revealed = session.round_phase === "reveal";
              const author = revealed ? players.find((p) => p.id === a.player_id) : undefined;
              // Self-votes are blocked outright — your own line is shown
              // but never selectable, so nobody can accidentally vote
              // themselves the winner.
              const disabled = !!myVote || revealed || isMine;
              return (
                <button
                  key={a.id}
                  onClick={() => !disabled && setSelectedAnswerId(a.id)}
                  disabled={disabled}
                  className="card"
                  dir="rtl"
                  style={{
                    padding: 16, textAlign: "center", fontSize: 16,
                    border: (isSelected || isCommitted) ? `3px solid ${GOLD}` : "3px solid transparent",
                    opacity: isMine && !revealed ? 0.75 : 1,
                    cursor: !disabled ? "pointer" : "default",
                  }}
                >
                  <span className="font-quote" style={{ lineHeight: 1.7 }}>{a.text}</span>
                  {revealed && author && (
                    <span
                      className="font-body pop"
                      style={{
                        fontSize: 11, fontWeight: 700, color: GOLD, display: "flex", alignItems: "center", gap: 4,
                        marginTop: 8, justifyContent: "center",
                      }}
                    >
                      {author.avatar_emoji} {author.nickname}
                    </span>
                  )}
                  {isMine && !revealed && (
                    <span className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", display: "block", marginTop: 6 }}>
                      {t.yourLine}
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
                background: selectedAnswerId ? `linear-gradient(135deg, ${GOLD}, ${NAVY})` : "var(--ring)",
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
            <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center" }}>{scoringError}</p>
          )}
        </>
      )}
    </div>
  );
}
