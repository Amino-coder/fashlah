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
const POINTS_BY_RANK = [5, 3, 2, 1]; // same as the real games' scoring

function durationFor(phase: DemoPhase): number {
  return phase === "countdown" ? COUNTDOWN_SECONDS
    : phase === "writing" ? ANSWER_SECONDS
    : phase === "voting" ? VOTE_SECONDS
    : REVEAL_SECONDS;
}

/**
 * Drives the "everyone writes something → vote on the best one → reveal →
 * next round" loop entirely client-side.
 *
 * `remaining` is derived from a phase-start timestamp + a ticking clock
 * rather than tracked as its own resettable counter — see the git history
 * / DEMO_MODE.md for why (a stale-read race that skipped the writing
 * phase entirely).
 *
 * Bot answers come from `getBotAnswers(round)`, supplied by the caller —
 * who knows which specific prompt is showing that round — rather than a
 * flat randomly-sampled bank, so bot answers actually respond to the
 * question asked instead of being generically funny but unrelated.
 *
 * Tracks total score (5/3/2/1 by rank, same as the real games) across all
 * rounds, exposed as `scores` and `overallWinnerId` once the game ends,
 * so callers can show a results/reveal screen instead of jumping straight
 * to the "come play for real" screen.
 */
export function useDemoRoundGame<T>(opts: {
  totalRounds: number;
  getBotAnswers: (round: number) => [T, T];
  humanNickname: string;
  humanAvatar: string;
  onRoundWon?: (round: number, result: DemoRoundResult<T>) => void;
}) {
  const { totalRounds, getBotAnswers, humanNickname, humanAvatar, onRoundWon } = opts;

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
  const [scores, setScores] = useState<Record<string, number>>({});

  const myAnswer = answers.find((a) => a.playerId === "human");
  const myVote = votes.find((v) => v.voterId === "human");

  const remaining = phase === "done" ? 0 : Math.max(0, durationFor(phase) - Math.floor((now - phaseStartedAt) / 1000));

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

  // The clock — purely for triggering re-renders every tick. Never resets
  // anything itself.
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

  // Bots answer with the round-specific answer supplied by the caller, on
  // their own short random delay.
  useEffect(() => {
    if (phase !== "writing") return;
    const [answerA, answerB] = getBotAnswers(round);
    const timers = [
      { bot: bots[0], value: answerA },
      { bot: bots[1], value: answerB },
    ].map(({ bot, value }) =>
      setTimeout(() => {
        setAnswers((prev) => (prev.some((a) => a.playerId === bot.id) ? prev : [...prev, { playerId: bot.id, value }]));
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

  // voting -> reveal, once everyone's voted or time's up. Ranks by vote
  // count, awards 5/3/2/1 points, accumulates into `scores`.
  useEffect(() => {
    if (phase !== "voting") return;
    if (remaining > 0 && votes.length < players.length) return;

    const tally = new Map<string, number>();
    for (const a of answers) tally.set(a.playerId, 0);
    for (const v of votes) tally.set(v.answerPlayerId, (tally.get(v.answerPlayerId) ?? 0) + 1);

    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    setScores((prev) => {
      const next = { ...prev };
      ranked.forEach(([playerId], i) => {
        const points = POINTS_BY_RANK[Math.min(i, POINTS_BY_RANK.length - 1)];
        next[playerId] = (next[playerId] ?? 0) + points;
      });
      return next;
    });

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

  const overallWinnerId = useMemo(() => {
    if (phase !== "done") return null;
    let top: string | null = null;
    let topScore = -1;
    for (const p of players) {
      const s = scores[p.id] ?? 0;
      if (s > topScore) { topScore = s; top = p.id; }
    }
    return top;
  }, [phase, scores, players]);

  return {
    players, round, totalRounds, phase, remaining,
    answers, votes, shuffledAnswers, myAnswer, myVote, lastResult,
    scores, overallWinnerId,
    submitHumanAnswer, submitHumanVote,
  };
}
