"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_BOT_NAMES, QISSA_DEMO_RESPONSES, pickTwoDistinct, pickOne } from "./demoContent";
import { authorTurnOrderForStory, storyIndexForTurnOrder } from "@/lib/qissa-story";

const N = 3; // human + 2 bots, matching the real game's minimum
const TOTAL_ROUNDS = 6; // same fixed count as the real game, regardless of player count
const COUNTDOWN_SECONDS = 3;
const WRITE_SECONDS = 25;
const PASSING_SECONDS = 2;

type DemoQissaPlayer = { id: string; nickname: string; avatar_emoji: string; isBot: boolean; turnOrder: number };
type DemoQissaAnswer = { round: number; storyIndex: number; playerId: string; sentence: string };
export type DemoQissaPhase = "countdown" | "writing" | "passing" | "done";

export function useDemoQissa(humanNickname: string, humanAvatar: string) {
  const [players] = useState<DemoQissaPlayer[]>(() => {
    const [botA, botB] = pickTwoDistinct(DEMO_BOT_NAMES);
    return [
      { id: "human", nickname: humanNickname, avatar_emoji: humanAvatar, isBot: false, turnOrder: 0 },
      { id: "bot-a", nickname: botA, avatar_emoji: "🧔🏻", isBot: true, turnOrder: 1 },
      { id: "bot-b", nickname: botB, avatar_emoji: "👨🏻", isBot: true, turnOrder: 2 },
    ];
  });

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<DemoQissaPhase>("countdown");
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const [answers, setAnswers] = useState<DemoQissaAnswer[]>([]);
  const usedResponsesRef = useRef<Set<number>>(new Set());

  const humanStoryIndex = storyIndexForTurnOrder(0, round, N);
  const myAnswer = answers.find((a) => a.round === round && a.playerId === "human");
  const previousSentence =
    round <= 1
      ? null
      : answers.find((a) => a.round === round - 1 && a.storyIndex === humanStoryIndex)?.sentence ?? null;

  function pickUnusedResponse(): string {
    const available = QISSA_DEMO_RESPONSES.map((_, i) => i).filter((i) => !usedResponsesRef.current.has(i));
    const pool = available.length > 0 ? available : QISSA_DEMO_RESPONSES.map((_, i) => i);
    const idx = pickOne(pool);
    usedResponsesRef.current.add(idx);
    if (usedResponsesRef.current.size >= QISSA_DEMO_RESPONSES.length) usedResponsesRef.current.clear();
    return QISSA_DEMO_RESPONSES[idx];
  }

  // Clock.
  useEffect(() => {
    if (phase === "done") return;
    const duration = phase === "countdown" ? COUNTDOWN_SECONDS : phase === "writing" ? WRITE_SECONDS : PASSING_SECONDS;
    setRemaining(duration);
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [phase, round]);

  // countdown -> writing
  useEffect(() => {
    if (phase !== "countdown" || remaining > 0) return;
    setPhase("writing");
  }, [phase, remaining]);

  // Bots write for their own assigned story, on a short random delay.
  useEffect(() => {
    if (phase !== "writing") return;
    const timers = [players[1], players[2]].map((bot) =>
      setTimeout(() => {
        const storyIndex = storyIndexForTurnOrder(bot.turnOrder, round, N);
        setAnswers((prev) =>
          prev.some((a) => a.round === round && a.playerId === bot.id)
            ? prev
            : [...prev, { round, storyIndex, playerId: bot.id, sentence: pickUnusedResponse() }]
        );
      }, 2000 + Math.random() * 5000)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  // writing -> passing, once everyone's written or time's up. Timeout
  // always submits — even empty — same "never gets stuck" rule as the
  // real game, just enforced locally instead of via a backfill API call.
  useEffect(() => {
    if (phase !== "writing") return;
    const wroteThisRound = answers.filter((a) => a.round === round).length;
    if (remaining <= 0 || wroteThisRound >= N) {
      if (remaining <= 0 && !answers.some((a) => a.round === round && a.playerId === "human")) {
        setAnswers((prev) => [...prev, { round, storyIndex: humanStoryIndex, playerId: "human", sentence: "" }]);
      }
      setPhase("passing");
    }
  }, [phase, remaining, answers, round, humanStoryIndex]);

  // passing -> next round, or done.
  useEffect(() => {
    if (phase !== "passing" || remaining > 0) return;
    if (round >= TOTAL_ROUNDS) setPhase("done");
    else { setRound((r) => r + 1); setPhase("countdown"); }
  }, [phase, remaining, round]);

  const submitHumanSentence = useCallback((sentence: string) => {
    setAnswers((prev) =>
      prev.some((a) => a.round === round && a.playerId === "human")
        ? prev
        : [...prev, { round, storyIndex: humanStoryIndex, playerId: "human", sentence }]
    );
  }, [round, humanStoryIndex]);

  const wroteCount = answers.filter((a) => a.round === round).length;

  // Reconstruct all 3 stories once done.
  const stories =
    phase === "done"
      ? Array.from({ length: N }, (_, storyIndex) => {
          const lines = Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
            const r = i + 1;
            const authorTurnOrder = authorTurnOrderForStory(storyIndex, r, N);
            const author = players.find((p) => p.turnOrder === authorTurnOrder);
            const answer = answers.find((a) => a.round === r && a.storyIndex === storyIndex);
            return { sentence: answer?.sentence ?? "", author: author?.nickname ?? "" };
          });
          return { storyIndex, lines };
        })
      : [];

  return {
    players, round, totalRounds: TOTAL_ROUNDS, phase, remaining,
    previousSentence, myAnswer, wroteCount, playerCount: N,
    submitHumanSentence, stories,
  };
}
