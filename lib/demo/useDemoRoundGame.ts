"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEMO_BOT_NAMES, pickTwoDistinct, pickOne } from "./demoContent";

export type DemoPhase = "countdown" | "writing" | "voting" | "reveal" | "done";

export type DemoPlayer = { id: string; nickname: string; avatar_emoji: string; isBot: boolean };

export type DemoAnswer<T> = { playerId: string; value: T };
export type DemoVote = { voterId: string; answerPlayerId: string };

export type DemoRoundResult<T> = { winnerPlayerId: string; winnerValue: T; winnerNickname: string; winnerAvatar: string };

const BOT_AVATARS = ["🧔🏻", "👨🏻", "🧑🏻", "👨🏽", "🧑🏽"];
const COUNTDOWN_SECONDS = 3;
const ANSWER_SECONDS = 30;
const VOTE_SECONDS = 15;
const REVEAL_SECONDS = 3;

function durationFor(phase: DemoPhase): number {
  return phase === "countdown" ? COUNTDOWN_SECONDS
    : phase === "writing" ? ANSWER_SECONDS
    : phase === "voting" ? VOTE_SECONDS
    : REVEAL_SECONDS;
}

/**
 * Drives the "everyone writes something → vote on the best one → reveal →
 * next round" loop entirely client-side. The two bots answer and vote on
 * their own timers (short random delays, so it doesn't feel instant/fake),
 * the human drives their own turn through the returned actions.
 *
 * `remaining` is DERIVED from a phase-start timestamp + a ticking clock,
 * deliberately not tracked as its own resettable counter — an earlier
 * version reset it via a separate effect keyed on `phase`, which raced
 * against the phase-transition effects that also read `remaining`: on the
 * same render where phase flips from countdown to writing, the reset
 * hadn't been applied yet, so "remaining <= 0" was still true from the
 * countdown's final tick and writing got skipped immediately with zero
 * answers submitted. Deriving it from a timestamp instead (the same
 * approach the real multiplayer games use with phase_started_at) makes
 * that class of race impossible — there's nothing to "reset", so nothing
 * to read before the reset lands.
 */
export function useDemoRoundGame<T>(opts: {
  totalRounds: number;
  responseBank: T[];
  humanNickname: string;
  humanAvatar: string;
  onRoundWon?: (round: number, result: DemoRoundResult<T>) => void;
}) {
  const { totalRounds, responseBank, humanNickname, humanAvatar, onRoundWon } = opts;

  const players = useMemo<DemoPlayer[]>(() => {
    const [botA, botB] = pickTwoDistinct(DEMO_BOT_NAMES);
    const [avatarA, avatarB] = pickTwoDistinct(BOT_AVATARS);
    return [
      { id: "human", nickname: humanNickname, avatar_emoji: humanAvatar, isBot: false },
      { id: "bot-a", nickname: botA, avatar_emoji: avatarA, isBot: true },
      { id: "bot-b", nickname: botB, avatar_emoji: avatarB, isBot: true },
    ];
    // Picked once for the whole demo — deliberately no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bots = players.filter((p) => p.isBot);

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<DemoPhase>("countdown");
  const [phaseStartedAt, setPhaseStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [answers, setAnswers] = useState<DemoAnswer<T>[]>([]);
  const [votes, setVotes] = useState<DemoVote[]>([]);
  const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<DemoRoundResult<T> | null>(null);

  const usedResponsesRef = useRef<Set<number>>(new Set());

  const myAnswer = answers.find((a) => a.playerId === "human");
  const myVote = votes.find((v) => v.voterId === "human");

  const remaining = phase === "done" ? 0 : Math.max(0, durationFor(phase) - Math.floor((now - phaseStartedAt) / 1000));

  function pickUnusedResponse(): T {
    const available = responseBank
      .map((_, i) => i)
      .filter((i) => !usedResponsesRef.current.has(i));
    const pool = available.length > 0 ? available : responseBank.map((_, i) => i);
    const idx = pickOne(pool);
    usedResponsesRef.current.add(idx);
    if (usedResponsesRef.current.size >= responseBank.length) usedResponsesRef.current.clear();
    return responseBank[idx];
  }

  /** The one place phase ever changes — always stamps the new start time
   *  in the same call, so remaining is correct from the very next tick. */
  const goToPhase = useCallback((next: DemoPhase) => {
    setPhase(next);
    setPhaseStartedAt(Date.now());
  }, []);

  // Reset per-round state.
  useEffect(() => {
    setAnswers([]);
    setVotes([]);
    setShuffledOrder([]);
    setLastResult(null);
  }, [round]);

  // The clock — purely for triggering re-renders every second so
  // `remaining` (derived above) gets recomputed. Never resets anything.
  useEffect(() => {
    if (phase === "done") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase]);

  // countdown -> writing
  useEffect(() => {
    if (phase !== "countdown" || remaining > 0) return;
    goToPhase("writing");
  }, [phase, remaining, goToPhase]);

  // Bots answer on their own short random delay after writing begins.
  useEffect(() => {
    if (phase !== "writing") return;
    const timers = bots.map((bot) =>
      setTimeout(() => {
        setAnswers((prev) => (prev.some((a) => a.playerId === bot.id) ? prev : [...prev, { playerId: bot.id, value: pickUnusedResponse() }]));
      }, 2500 + Math.random() * 6000)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  // writing -> voting, once everyone's answered or time's up.
  useEffect(() => {
    if (phase !== "writing") return;
    if (remaining <= 0 || answers.length >= players.length) {
      setShuffledOrder([...players.map((p) => p.id)].sort(() => Math.random() - 0.5));
      goToPhase("voting");
    }
  }, [phase, remaining, answers.length, players.length, players, goToPhase]);

  // Bots vote on their own short random delay — randomly, never for
  // themselves, matching "no complicated AI voting logic" from the spec.
  useEffect(() => {
    if (phase !== "voting") return;
    const timers = bots.map((bot) =>
      setTimeout(() => {
        setVotes((prev) => {
          if (prev.some((v) => v.voterId === bot.id)) return prev;
          const choices = answers.filter((a) => a.playerId !== bot.id);
          if (choices.length === 0) return prev;
          return [...prev, { voterId: bot.id, answerPlayerId: pickOne(choices).playerId }];
        });
      }, 1500 + Math.random() * 4000)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, answers]);

  // voting -> reveal, once everyone's voted or time's up. Computes the
  // winner (most votes; ties broken randomly, same spirit as the real
  // games' submission-order tiebreak).
  useEffect(() => {
    if (phase !== "voting") return;
    if (remaining > 0 && votes.length < players.length) return;

    const tally = new Map<string, number>();
    for (const a of answers) tally.set(a.playerId, 0);
    for (const v of votes) tally.set(v.answerPlayerId, (tally.get(v.answerPlayerId) ?? 0) + 1);
    let top = -1;
    let winners: string[] = [];
    for (const [playerId, count] of tally) {
      if (count > top) { top = count; winners = [playerId]; }
      else if (count === top) winners.push(playerId);
    }
    const winnerPlayerId = winners.length > 0 ? pickOne(winners) : answers[0]?.playerId;
    const winnerAnswer = answers.find((a) => a.playerId === winnerPlayerId);
    const winnerPlayer = players.find((p) => p.id === winnerPlayerId);
    if (winnerAnswer && winnerPlayer) {
      const result = {
        winnerPlayerId, winnerValue: winnerAnswer.value,
        winnerNickname: winnerPlayer.nickname, winnerAvatar: winnerPlayer.avatar_emoji,
      };
      setLastResult(result);
      onRoundWon?.(round, result);
    }
    goToPhase("reveal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remaining, votes.length, players.length, goToPhase]);

  // reveal -> next round, or done.
  useEffect(() => {
    if (phase !== "reveal" || remaining > 0) return;
    if (round >= totalRounds) setPhase("done");
    else { setRound((r) => r + 1); goToPhase("countdown"); }
  }, [phase, remaining, round, totalRounds, goToPhase]);

  const submitHumanAnswer = useCallback((value: T) => {
    setAnswers((prev) => (prev.some((a) => a.playerId === "human") ? prev : [...prev, { playerId: "human", value }]));
  }, []);

  const submitHumanVote = useCallback((answerPlayerId: string) => {
    if (answerPlayerId === "human") return; // can't vote for yourself
    setVotes((prev) => (prev.some((v) => v.voterId === "human") ? prev : [...prev, { voterId: "human", answerPlayerId }]));
  }, []);

  const shuffledAnswers = shuffledOrder
    .map((id) => answers.find((a) => a.playerId === id))
    .filter((a): a is DemoAnswer<T> => !!a);

  return {
    players, round, totalRounds, phase, remaining,
    answers, votes, shuffledAnswers, myAnswer, myVote, lastResult,
    submitHumanAnswer, submitHumanVote,
  };
}
