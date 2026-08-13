"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Music2, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LIFOO_STR, LifooLang } from "@/lib/lifoo-i18n";
import { playCountdownTick, playCountdownGo, playUrgentTick, unlockAudio } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import LeaveGameButton from "@/components/LeaveGameButton";
import { fetchSongSoFar, MAX_LINE_CHARS, type SongLine as SongLineType } from "@/lib/lifoo-song";
import SongLine from "./SongLine";
import FinalReveal from "./FinalReveal";
import type {
  LifooSessionRow, LifooPlayerRow, LifooAnswerRow, LifooVoteRow,
} from "@/lib/lifoo-types";

const CORAL = "#FF5A5F";
const NAVY = "#1B1030";
const ANSWER_SECONDS = 40;
const VOTE_SECONDS = 20;
const COUNTDOWN_SECONDS = 5;
const REVEAL_SECONDS = 3;
const TOTAL_ROUNDS = 4;

export default function RoundScreen({
  session, players, myPlayerId, isHost, lang,
}: {
  session: LifooSessionRow;
  players: LifooPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: LifooLang;
}) {
  const t = LIFOO_STR[lang];
  const [answers, setAnswers] = useState<LifooAnswerRow[]>([]);
  const [votes, setVotes] = useState<LifooVoteRow[]>([]);
  const [songSoFar, setSongSoFar] = useState<SongLineType[]>([]);
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

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [session.round_phase]);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const [{ data: ans }, { data: vt }, song] = await Promise.all([
        supabase.from("lifoo_answers").select("*")
          .eq("session_id", session.id).eq("round_number", session.current_round),
        supabase.from("lifoo_votes").select("*")
          .eq("session_id", session.id).eq("round_number", session.current_round),
        fetchSongSoFar(session, session.current_round),
      ]);
      if (cancelled) return;
      setAnswers((ans as LifooAnswerRow[]) || []);
      setVotes((vt as LifooVoteRow[]) || []);
      setSongSoFar(song);
    }
    loadAll();

    const channel = supabase
      .channel(`lifoo-round-${session.id}-${session.current_round}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lifoo_answers", filter: `session_id=eq.${session.id}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "lifoo_votes", filter: `session_id=eq.${session.id}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "lifoo_round_results", filter: `session_id=eq.${session.id}` }, loadAll)
      .subscribe();

    const pollId = setInterval(loadAll, 1200);

    return () => { cancelled = true; supabase.removeChannel(channel); clearInterval(pollId); };
  }, [session.id, session.current_round]);

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

  const countdownTransitionedRef = useRef(false);
  const [countdownError, setCountdownError] = useState<string | null>(null);

  async function advancePastCountdown() {
    if (countdownTransitionedRef.current) return;
    countdownTransitionedRef.current = true;
    const { error } = await supabase.from("lifoo_sessions")
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

  const [advanceError, setAdvanceError] = useState<string | null>(null);

  async function advancePastAnswering() {
    if (transitionedRef.current) return;
    transitionedRef.current = true;

    let answerCount = currentAnswers.length;
    try {
      const { data, error } = await supabase
        .from("lifoo_answers")
        .select("id")
        .eq("session_id", session.id)
        .eq("round_number", session.current_round);
      if (!error && data) answerCount = data.length;
    } catch {
      // Network hiccup — proceed with the local count rather than stall.
    }

    const skipVoting = answerCount <= 1;
    const nextPhase = skipVoting ? "reveal" : "voting";
    if (answerCount === 1) {
      scoringRef.current = true;
      computeRoundResult();
    }
    const { error } = await supabase.from("lifoo_sessions")
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

  const [scoringError, setScoringError] = useState<string | null>(null);

  async function computeRoundResult() {
    try {
      const res = await fetch("/api/lifoo-round-result", {
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
      supabase.from("lifoo_sessions")
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

  const advancedPastRevealRef = useRef(false);

  async function advancePastReveal() {
    if (advancedPastRevealRef.current) return;
    advancedPastRevealRef.current = true;
    const { error } = session.current_round >= TOTAL_ROUNDS
      ? await supabase.from("lifoo_sessions")
          .update({ current_round: TOTAL_ROUNDS + 1 })
          .eq("id", session.id)
      : await supabase.from("lifoo_sessions")
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

  const shuffledAnswers = useMemo(() => {
    if (session.round_phase !== "voting" && session.round_phase !== "reveal") return [];
    for (const a of currentAnswers) {
      if (!shuffleKeysRef.current.has(a.id)) shuffleKeysRef.current.set(a.id, Math.random());
    }
    return [...currentAnswers].sort(
      (a, b) => shuffleKeysRef.current.get(a.id)! - shuffleKeysRef.current.get(b.id)!
    );
  }, [session.round_phase, currentAnswers]);

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

  // Safety net on top of the deadline check above: that one relies on this
  // tab's own `now` ticking past the computed deadline, which can lag (a
  // backgrounded tab throttles setInterval) or race against the host's
  // independent "time's up" detection. This instead reacts directly to the
  // round actually moving on — the moment round_phase leaves "answering"
  // while there's still unsent text sitting in the box and no answer has
  // been recorded yet, submit it immediately rather than losing it. Draft
  // isn't cleared until the round number itself changes (see the reset
  // effect above), so it's still here to grab even if this fires late.
  useEffect(() => {
    if (session.round_phase === "answering" || myAnswer || autoSubmitRef.current || !draft.trim()) return;
    autoSubmitRef.current = true;
    submitAnswer();
  }, [session.round_phase]);

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
      if (target) castVote(target.id);
    }
  }, [now, myVote, selectedAnswerId]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submitAnswer() {
    if (!myPlayerId || !draft.trim() || myAnswer) return;
    unlockAudio();
    setSubmitError(null);
    const { error } = await supabase.from("lifoo_answers").insert({
      session_id: session.id, round_number: session.current_round,
      player_id: myPlayerId,
      line: draft.trim().slice(0, MAX_LINE_CHARS),
    });
    if (error) {
      autoSubmitRef.current = false;
      setSubmitError(error.message);
    }
  }

  async function castVote(answerId: string) {
    if (!myPlayerId || myVote) return;
    unlockAudio();
    await supabase.from("lifoo_votes").insert({
      session_id: session.id, round_number: session.current_round,
      voter_player_id: myPlayerId, answer_id: answerId,
    });
  }

  // Past round 4: hand off straight to the cinematic reveal.
  if (session.current_round === TOTAL_ROUNDS + 1) {
    return <FinalReveal session={session} players={players} isHost={isHost} lang={lang} />;
  }

  const SongSoFarCard = songSoFar.length > 0 && (
    <div
      className="card"
      style={{
        padding: "18px 20px", maxHeight: 260, overflowY: "auto",
        border: "1px solid rgba(255,90,95,0.22)",
      }}
    >
      <p className="font-body" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: CORAL, margin: "0 0 10px", textAlign: "center" }}>
        {t.poemSoFar.toUpperCase()}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {songSoFar.map((line) => (
          <div key={line.round} className="pop" style={{ textAlign: "center" }}>
            <SongLine line1={line.line1} line2={line.line2} fontSize={line.isOpening ? 16 : 15} />
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
        <LeaveGameButton lang={lang} />
        {SongSoFarCard}
        <div
          aria-hidden="true"
          style={{
            width: 90, height: 90, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${NAVY}, #0A0616)`, boxShadow: `0 10px 26px ${NAVY}55`,
          }}
        >
          <Music2 size={38} color={CORAL} />
        </div>
        <div
          key={remaining}
          className="font-display pop"
          style={{ fontSize: 70, fontWeight: 800, color: CORAL, lineHeight: 1 }}
        >
          {remaining > 0 ? remaining : (lang === "ar" ? "يلا!" : "Go!")}
        </div>
        {remaining <= 0 && (
          <div style={{ color: CORAL, height: 6 }}>
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
      <LeaveGameButton lang={lang} />
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {lang === "ar" ? `الجولة ${session.current_round} من ${TOTAL_ROUNDS}` : `Round ${session.current_round} of ${TOTAL_ROUNDS}`}
        </span>
      </div>

      {SongSoFarCard}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="font-display"
          style={{
            width: 48, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#fff",
            background: remaining <= 5 ? "#E63946" : `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
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
              <label
                htmlFor="lifoo-round-line"
                className="font-body"
                style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}
              >
                {t.lineLabel}
              </label>
              <textarea
                id="lifoo-round-line"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_LINE_CHARS))}
                rows={3}
                dir="rtl"
                placeholder={t.linePh}
                maxLength={MAX_LINE_CHARS}
                autoFocus
                className="font-quote"
                style={{
                  width: "100%", padding: 10, borderRadius: 14, border: "2px solid var(--ring)",
                  background: "transparent", color: "var(--ink)", fontSize: 16, outline: "none", resize: "none",
                  fontFamily: "inherit", textAlign: "center",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={submitAnswer}
                  disabled={!draft.trim()}
                  className="font-display"
                  style={{
                    padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff",
                    background: draft.trim() ? `linear-gradient(135deg, ${CORAL}, ${NAVY})` : "var(--ring)",
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
              <SongLine line1={myAnswer.line} fontSize={15} weight={400} />
            </div>
          )}
          <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
            {currentAnswers.length}/{players.length} {lang === "ar" ? "كتبوا" : "wrote"}
          </p>
          {submitError && (
            <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center" }}>{submitError}</p>
          )}
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
            <p className="font-display pop" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: CORAL, margin: 0 }}>
              {t.lineLocked}
            </p>
          ) : (
            <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: CORAL, margin: 0 }}>
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
              const revealed = session.round_phase === "reveal";
              const author = revealed ? players.find((p) => p.id === a.player_id) : undefined;
              const disabled = !!myVote || revealed;
              return (
                <button
                  key={a.id}
                  onClick={() => !disabled && setSelectedAnswerId(a.id)}
                  disabled={disabled}
                  className="card"
                  style={{
                    padding: 16, textAlign: "center",
                    border: (isSelected || isCommitted) ? `3px solid ${CORAL}` : "3px solid transparent",
                    cursor: !disabled ? "pointer" : "default",
                  }}
                >
                  <SongLine line1={a.line} fontSize={15} />
                  {revealed && author && (
                    <span
                      className="font-body pop"
                      style={{
                        fontSize: 11, fontWeight: 700, color: CORAL, display: "flex", alignItems: "center", gap: 4,
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
              onClick={() => selectedAnswerId && castVote(selectedAnswerId)}
              disabled={!selectedAnswerId}
              className="font-display"
              style={{
                padding: 14, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                background: selectedAnswerId ? `linear-gradient(135deg, ${CORAL}, ${NAVY})` : "var(--ring)",
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
