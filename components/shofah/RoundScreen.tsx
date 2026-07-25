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
const MAX_CHARS = 80;

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
  const [remaining, setRemaining] = useState(ANSWER_SECONDS);
  const [votingDone, setVotingDone] = useState(false);
  const shuffledRef = useRef<ShofahAnswerRow[] | null>(null);
  const transitionedRef = useRef(false);

  const myAnswer = answers.find((a) => a.player_id === myPlayerId);
  const myVote = votes.find((v) => v.voter_player_id === myPlayerId);

  // Reset per-round local state whenever the round number changes
  useEffect(() => {
    shuffledRef.current = null;
    transitionedRef.current = false;
    setVotingDone(false);
    setDraft("");
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

  // Countdown, anchored to phase_started_at so every client agrees
  useEffect(() => {
    const duration = session.round_phase === "answering" ? ANSWER_SECONDS
      : session.round_phase === "voting" ? VOTE_SECONDS
      : COUNTDOWN_SECONDS;
    function tick() {
      if (!session.phase_started_at) { setRemaining(duration); return; }
      const elapsed = (Date.now() - new Date(session.phase_started_at as string).getTime()) / 1000;
      setRemaining(Math.max(0, Math.ceil(duration - elapsed)));
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [session.round_phase, session.phase_started_at]);

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
    const everyoneAnswered = players.length > 0 && answers.length >= players.length;
    if (remaining <= 0 || everyoneAnswered) advancePastAnswering();
  }, [isHost, session.round_phase, remaining, answers.length, players.length, session.id]);

  // Voting completion is purely local — reveal/scoring is a later phase.
  useEffect(() => {
    if (session.round_phase !== "voting") return;
    const everyoneVoted = players.length > 0 && votes.length >= players.length;
    if (remaining <= 0 || everyoneVoted) setVotingDone(true);
  }, [session.round_phase, remaining, votes.length, players.length]);

  const shuffledAnswers = useMemo(() => {
    if (session.round_phase !== "voting") return [];
    if (!shuffledRef.current) shuffledRef.current = shuffle(answers);
    return shuffledRef.current;
  }, [session.round_phase, answers]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20 }}>
      <div style={{ textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {session.current_round} / 5
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
            {answers.length}/{players.length} {lang === "ar" ? "جاوبوا" : "answered"}
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

      {session.round_phase === "voting" && !votingDone && (
        <>
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
            {votes.length}/{players.length} {lang === "ar" ? "صوّتوا" : "voted"}
          </p>
        </>
      )}

      {(session.round_phase === "voting" && votingDone) && (
        <p className="font-body" style={{ textAlign: "center", color: "var(--ink-soft)", fontWeight: 700 }}>
          {t.roundsComingSoon}
        </p>
      )}
    </div>
  );
}
