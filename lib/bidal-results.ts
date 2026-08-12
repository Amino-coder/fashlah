import type { BidalSessionRow, BidalPlayerRow } from "./bidal-types";

export type BidalMoveRow = {
  move_index: number;
  player_id: string | null;
  prev_word: string;
  new_word: string;
  move_type: "replace" | "shuffle";
  undone: boolean;
};

/** Reconstructs the sequence of words the game passed through, from the
 *  captured starting word through every accepted (non-undone) move —
 *  shuffles included, since they did change the shared word even though
 *  they're not a "move" in the letter-counting sense. The word is shared
 *  in multiplayer, so this is necessarily the whole game's flow, not a
 *  strictly private-to-one-player path — every player watched this same
 *  sequence unfold, which is what "the words that occurred during their
 *  game" means here. */
export function buildWordFlow(startingWord: string | null, moves: BidalMoveRow[]): string[] {
  const flow = startingWord ? [startingWord] : [];
  const ordered = [...moves].filter((m) => !m.undone).sort((a, b) => a.move_index - b.move_index);
  for (const m of ordered) flow.push(m.new_word);
  return flow;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} ثانية`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

export type BidalResult = {
  finished: boolean;
  isSolo: boolean;
  position: number | null;       // null for solo (position isn't meaningful with one player)
  totalPlayers: number;
  lettersUsed: number;
  totalLetters: number;
  remainingLetters: string[];
  completionSeconds: number | null;
  wordFlow: string[];
};

/**
 * بدل الكلمة is solo-only now — position/multiplayer ranking was already
 * a known rough edge (see the note below about the "ends on first
 * finisher" tension) and is now moot since there's only ever one player.
 * Kept as a field on BidalResult (always null) so callers/types don't
 * need to change if multiplayer ever comes back.
 */
export function computeBidalResult(
  session: BidalSessionRow,
  myPlayer: BidalPlayerRow,
  allPlayers: BidalPlayerRow[],
  moves: BidalMoveRow[]
): BidalResult {
  const isSolo = true;
  const finished = myPlayer.letters.length === 0;
  const totalLetters = 15; // matches drawLetters(15) in bidal-letters.ts
  const lettersUsed = totalLetters - myPlayer.letters.length;
  const wordFlow = buildWordFlow(session.starting_word, moves);

  let completionSeconds: number | null = null;
  if (finished && session.started_at && session.ended_at) {
    completionSeconds = (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000;
  }

  return {
    finished, isSolo, position: null, totalPlayers: allPlayers.length,
    lettersUsed, totalLetters, remainingLetters: myPlayer.letters, completionSeconds, wordFlow,
  };
}
