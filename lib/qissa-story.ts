import { supabase } from "@/lib/supabase";
import type { QissaSessionRow } from "@/lib/qissa-types";

/**
 * The entire "telephone" mechanic reduces to one formula. Story indices
 * and player turn_orders both run 0..N-1. In round R (1-indexed), the
 * player who originally started story `i` is N-1 turns removed by now —
 * concretely, story `i` sits with whoever has turn_order
 * `(i + R - 1) mod N` that round. Nothing needs to be persisted to track
 * "where" a story currently is; it's always derivable from (story_index,
 * round, playerCount) alone.
 */
export function authorTurnOrderForStory(storyIndex: number, round: number, n: number): number {
  return ((storyIndex + (round - 1)) % n + n) % n;
}

/** Inverse of the above: which story does this turn_order write in this round? */
export function storyIndexForTurnOrder(turnOrder: number, round: number, n: number): number {
  return ((turnOrder - (round - 1)) % n + n) % n;
}

/**
 * The story circulates around the table TWICE — every player contributes
 * to every story exactly twice, once per lap — so the round count scales
 * with the player count rather than being a fixed number. The passing
 * math above needs no changes for this: it's plain modular arithmetic,
 * so it already works correctly for any round number, not just 1..n.
 */
export function totalRoundsFor(playerCount: number): number {
  return playerCount * 2;
}

export type QissaStory = {
  storyIndex: number;
  sentences: string[]; // exactly 3, in round order
  authorNames: string[]; // exactly 3, in round order
};

/**
 * Pulls every submitted sentence for the session and groups it back into
 * complete stories. Used only by the final reveal — during play, a player
 * only ever fetches their own single previous sentence (see
 * fetchPreviousSentence below), never this.
 */
export async function fetchAllStories(session: QissaSessionRow, playerCount: number): Promise<QissaStory[]> {
  const { data: answers } = await supabase
    .from("qissa_answers")
    .select("round_number, story_index, sentence, qissa_players(nickname)")
    .eq("session_id", session.id)
    .order("story_index")
    .order("round_number");

  const stories: QissaStory[] = Array.from({ length: playerCount }, (_, i) => ({
    storyIndex: i,
    sentences: [],
    authorNames: [],
  }));

  for (const row of answers || []) {
    const story = stories[row.story_index];
    if (!story) continue;
    story.sentences.push(row.sentence);
    story.authorNames.push((row as any).qissa_players?.nickname ?? "");
  }

  return stories;
}

/** Same as fetchAllStories, but retries if some answers (in particular the
 * last round's backfilled stragglers) haven't landed yet. */
export async function fetchAllStoriesWithRetry(
  session: QissaSessionRow,
  playerCount: number,
  opts: { maxAttempts?: number; delayMs?: number } = {}
): Promise<QissaStory[]> {
  const maxAttempts = opts.maxAttempts ?? 6;
  const delayMs = opts.delayMs ?? 700;
  const expectedTotal = playerCount * totalRoundsFor(playerCount);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const stories = await fetchAllStories(session, playerCount);
    const total = stories.reduce((sum, s) => sum + s.sentences.length, 0);
    if (total >= expectedTotal || attempt === maxAttempts - 1) return stories;
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return fetchAllStories(session, playerCount);
}

/**
 * What the current player should see while writing round `round`: just
 * the single sentence handed to them (or null in round 1, when they're
 * starting a fresh story — nothing to receive yet).
 */
export async function fetchPreviousSentence(
  sessionId: string,
  myTurnOrder: number,
  round: number,
  playerCount: number
): Promise<string | null> {
  if (round <= 1) return null;
  const storyIndex = storyIndexForTurnOrder(myTurnOrder, round, playerCount);
  const { data } = await supabase
    .from("qissa_answers")
    .select("sentence")
    .eq("session_id", sessionId)
    .eq("round_number", round - 1)
    .eq("story_index", storyIndex)
    .maybeSingle();
  return data?.sentence ?? null;
}
