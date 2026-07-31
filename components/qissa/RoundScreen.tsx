"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QISSA_STR, QissaLang, randomPlaceholder } from "@/lib/qissa-i18n";
import { playCountdownTick, playCountdownGo, playUrgentTick, unlockAudio } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import { storyIndexForTurnOrder, fetchPreviousSentence, totalRoundsFor } from "@/lib/qissa-story";
import FinalReveal from "./FinalReveal";
import type { QissaSessionRow, QissaPlayerRow, QissaAnswerRow } from "@/lib/qissa-types";

const ORANGE = "#FF8A3D";
const DEEP = "#E0409A";
const COUNTDOWN_SECONDS = 5;
const WRITE_SECONDS = 30;
// Purely a transition beat — nothing is revealed here, so it only needs
// to be long enough to read one short line and feel like a deliberate
// pause, not a stall.
const PASSING_SECONDS = 3;
const MAX_CHARS = 120;

export default function RoundScreen({
  session, players, myPlayerId, isHost, lang,
}: {
  session: QissaSessionRow;
  players: QissaPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: QissaLang;
}) {
  const t = QISSA_STR[lang];
  const [answers, setAnswers] = useState<QissaAnswerRow[]>([]);
  const [previousSentence, setPreviousSentence] = useState<string | null>(null);
  const [previousLoaded, setPreviousLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const transitionedRef = useRef(false);
  const advancingRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const writingDeadlineRef = useRef<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const n = players.length;
  // Always 6, regardless of player count — see totalRoundsFor's own doc
  // comment for why. Computed here rather than imported as a constant
  // just to keep the "this is where round count comes from" story in one
  // place if it ever needs to depend on n again.
  const totalRounds = totalRoundsFor(n);
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const myTurnOrder = myPlayer?.turn_order ?? null;

  const currentAnswers = useMemo(
    () => answers.filter((a) => a.round_number === session.current_round),
    [answers, session.current_round]
  );
  const myAnswer = currentAnswers.find((a) => a.author_player_id === myPlayerId);

  // A fresh random placeholder each time a new writing turn begins —
  // stable within the turn (so it doesn't jump around while typing),
  // different next time.
  const placeholder = useMemo(
    () => randomPlaceholder(lang, session.current_round === 1),
    [session.current_round, lang]
  );

  // Reset per-round local state whenever the round changes.
  useEffect(() => {
    transitionedRef.current = false;
    advancingRef.current = false;
    autoSubmitRef.current = false;
    writingDeadlineRef.current = null;
    setDraft("");
    setAnswers([]);
    setPreviousSentence(null);
    setPreviousLoaded(false);
    setSubmitError(null);
  }, [session.current_round]);

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [session.round_phase]);

  // Fetch this round's answer count (for the "X/N wrote" progress line —
  // never the sentences themselves for anyone but their own) and the
  // one sentence this player is allowed to see.
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const { data: ans } = await supabase
        .from("qissa_answers").select("*")
        .eq("session_id", session.id).eq("round_number", session.current_round);
      if (cancelled) return;
      setAnswers((ans as QissaAnswerRow[]) || []);

      if (myTurnOrder !== null && n > 0) {
        const sentence = await fetchPreviousSentence(session.id, myTurnOrder, session.current_round, n);
        if (cancelled) return;
        setPreviousSentence(sentence);
        setPreviousLoaded(true);
      }
    }
    loadAll();

    const channel = supabase
      .channel(`qissa-round-${session.id}-${session.current_round}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "qissa_answers", filter: `session_id=eq.${session.id}` }, loadAll)
      .subscribe();

    const pollId = setInterval(loadAll, 1200);
    return () => { cancelled = true; supabase.removeChannel(channel); clearInterval(pollId); };
  }, [session.id, session.current_round, myTurnOrder, n]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const duration = session.round_phase === "writing" ? WRITE_SECONDS
    : session.round_phase === "passing" ? PASSING_SECONDS
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
      if (remaining > 0) playCountdownTick(); else playCountdownGo();
    } else if (phase === "writing") {
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

  // Host-only: countdown -> round 1's writing phase.
  const [countdownError, setCountdownError] = useState<string | null>(null);
  async function advancePastCountdown() {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    const { error } = await supabase.from("qissa_sessions")
      .update({ current_round: 1, round_phase: "writing", phase_started_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) { transitionedRef.current = false; setCountdownError(error.message); }
  }
  useEffect(() => {
    if (!isHost || session.round_phase !== "countdown" || transitionedRef.current) return;
    if (remaining <= 0) advancePastCountdown();
  }, [isHost, session.round_phase, remaining, session.id]);

  // Host-only: close out the writing round (backfill any missing
  // sentences, then move to the passing beat) once time's up or
  // everyone's submitted.
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  async function closeWritingRound() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      const res = await fetch("/api/qissa-round-advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, roundNumber: session.current_round }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance round");
    } catch (e: any) {
      advancingRef.current = false;
      setAdvanceError(e.message);
    }
  }
  useEffect(() => {
    if (!isHost || session.current_round > totalRounds || session.round_phase !== "writing" || advancingRef.current) return;
    const everyoneWrote = n > 0 && currentAnswers.length >= n;
    if (remaining <= 0 || everyoneWrote) closeWritingRound();
  }, [isHost, session.round_phase, remaining, currentAnswers.length, n, session.id]);

  // Host-only: after the passing beat, move to the next round's writing
  // phase — or, past round 3, hand off to the final reveal.
  const advancedPastPassingRef = useRef(false);
  useEffect(() => { advancedPastPassingRef.current = false; }, [session.current_round]);
  async function advancePastPassing() {
    if (advancedPastPassingRef.current) return;
    advancedPastPassingRef.current = true;
    const { error } = session.current_round >= totalRounds
      ? await supabase.from("qissa_sessions").update({ current_round: totalRounds + 1 }).eq("id", session.id)
      : await supabase.from("qissa_sessions")
          .update({ current_round: session.current_round + 1, round_phase: "writing", phase_started_at: new Date().toISOString() })
          .eq("id", session.id);
    if (error) { advancedPastPassingRef.current = false; setAdvanceError(error.message); }
  }
  useEffect(() => {
    if (!isHost || session.current_round > totalRounds || session.round_phase !== "passing" || advancedPastPassingRef.current) return;
    if (remaining <= 0) advancePastPassing();
  }, [isHost, session.round_phase, remaining, session.id, session.current_round]);

  // Deadline tracked as a wall-clock target, same reasoning as the other
  // games: a late-arriving phase-change broadcast can't silently drop it.
  useEffect(() => {
    if (session.round_phase === "writing" && session.phase_started_at) {
      writingDeadlineRef.current = new Date(session.phase_started_at).getTime() + WRITE_SECONDS * 1000;
    }
  }, [session.round_phase, session.phase_started_at]);

  async function submitSentence() {
    if (!myPlayerId || myTurnOrder === null || myAnswer) return;
    unlockAudio();
    setSubmitError(null);
    const storyIndex = storyIndexForTurnOrder(myTurnOrder, session.current_round, n);
    const { error } = await supabase.from("qissa_answers").insert({
      session_id: session.id, round_number: session.current_round,
      story_index: storyIndex, author_player_id: myPlayerId,
      sentence: draft.trim().slice(0, MAX_CHARS),
    });
    if (error) { autoSubmitRef.current = false; setSubmitError(error.message); }
  }

  // Timeout ALWAYS submits — even an empty sentence — so the game can
  // never stall waiting on one player. This is deliberately different
  // from the other games' answer-timeout handling, which only auto-
  // submits if something was actually typed.
  useEffect(() => {
    if (autoSubmitRef.current || myAnswer || !writingDeadlineRef.current) return;
    if (now >= writingDeadlineRef.current) {
      autoSubmitRef.current = true;
      submitSentence();
    }
  }, [now, myAnswer]);

  if (session.current_round === totalRounds + 1) {
    return <FinalReveal session={session} players={players} isHost={isHost} lang={lang} />;
  }

  if (session.round_phase === "countdown") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 60, position: "relative" }}>
        {muteButton}
        <div
          aria-hidden="true"
          style={{
            width: 90, height: 90, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`, boxShadow: `0 10px 26px ${DEEP}55`,
          }}
        >
          <BookOpen size={38} color="#fff" />
        </div>
        <div key={remaining} className="font-display pop" style={{ fontSize: 70, fontWeight: 800, color: ORANGE, lineHeight: 1 }}>
          {remaining > 0 ? remaining : (lang === "ar" ? "يلا!" : "Go!")}
        </div>
        {remaining <= 0 && (
          <div style={{ color: ORANGE, height: 6 }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}
        {countdownError && (
          <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center", maxWidth: 260 }}>{countdownError}</p>
        )}
      </div>
    );
  }

  if (session.round_phase === "passing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 80, position: "relative" }}>
        {muteButton}
        <div
          aria-hidden="true"
          className="pop"
          style={{
            width: 80, height: 80, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`, fontSize: 34,
          }}
        >
          🔄
        </div>
        <p className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{t.passingTitle}</p>
        <div style={{ color: ORANGE }}>
          <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
        </div>
        {advanceError && (
          <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center", maxWidth: 260 }}>{advanceError}</p>
        )}
      </div>
    );
  }

  // round_phase === "writing"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20, position: "relative" }}>
      {muteButton}
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {session.current_round} / {totalRounds}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="font-display"
          style={{
            width: 48, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#fff",
            background: remaining <= 5 ? "#E63946" : `linear-gradient(135deg, ${ORANGE}, ${DEEP})`,
          }}
        >
          {remaining}
        </div>
      </div>

      {!myAnswer ? (
        <>
          {session.current_round === 1 ? (
            <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: 0 }}>
              {t.startNewStory} ✨
            </p>
          ) : (
            <>
              <p
                className="font-display"
                style={{
                  textAlign: "center", fontSize: 18, fontWeight: 800, margin: 0,
                  color: session.current_round === totalRounds ? "#E63946" : "inherit",
                }}
              >
                {session.current_round === totalRounds ? t.finalRoundWarning : `${t.continueStoryHeading} ✍️`}
              </p>
              {!previousLoaded ? (
                <div style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
                </div>
              ) : (
                // The card itself is shown with no label at all, by
                // design — just the sentence as received. The heading
                // above is a general instruction, not a caption on this
                // specific card.
                <div className="card pop" dir="rtl" style={{ padding: "18px 20px", textAlign: "center", border: `1.5px solid ${ORANGE}44` }}>
                  <p className="font-quote" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.7, margin: 0, color: "var(--ink)" }}>
                    {previousSentence || (lang === "ar" ? "…" : "…")}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="card" style={{ padding: 16 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
              rows={3}
              dir="rtl"
              placeholder={placeholder}
              aria-label={placeholder}
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
                onClick={submitSentence}
                disabled={!draft.trim()}
                className="font-display"
                style={{
                  padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff",
                  background: draft.trim() ? `linear-gradient(135deg, ${ORANGE}, ${DEEP})` : "var(--ring)",
                  opacity: draft.trim() ? 1 : 0.6,
                }}
              >
                {t.submitSentence}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t.sentenceSubmitted}</p>
        </div>
      )}

      <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
        {currentAnswers.length}/{n} {t.wroteCount}
      </p>
      {submitError && (
        <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center" }}>{submitError}</p>
      )}
      {advanceError && (
        <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center" }}>{advanceError}</p>
      )}
    </div>
  );
}
