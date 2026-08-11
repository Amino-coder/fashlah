/**
 * Content + generation logic for بدل الكلمة. No dictionary anywhere in
 * here, deliberately — see the game's own spec: mechanical validation
 * only (does the new word differ from the old one by exactly one letter
 * at the claimed position, and does the player own that letter). Whether
 * the resulting word is a *real* word is left entirely to the players.
 */

// Single source of truth for the solo timer — change this one value, not
// a number scattered through the game.
export const SOLO_TIME_LIMIT_SECONDS = 50;

export const STARTING_WORDS = [
  "قلب", "قلم", "كلب", "باب", "بيت", "بحر", "نهر", "شمس", "قمر", "ليل",
  "نار", "نور", "ورد", "ذهب", "حبل", "جبل", "رجل", "ولد", "بنت", "خبز",
  "لحم", "ملح", "تمر", "زيت", "صوت", "لون", "علم", "حلم", "سلم", "عمل",
];

/** Avoids repeating the same starting word across consecutive games for
 *  the same session/player, per spec — pass the previous word (if any)
 *  and it's excluded from the draw when another option exists. */
export function pickStartingWord(excludeWord?: string | null): string {
  const pool = excludeWord ? STARTING_WORDS.filter((w) => w !== excludeWord) : STARTING_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

const LETTER_WEIGHTS: Record<string, number> = {
  "ا": 10, "ل": 9, "م": 8, "ن": 8, "ر": 8, "ب": 7, "ت": 7, "ك": 6, "و": 8,
  "ي": 7, "ع": 6, "س": 6, "ه": 5, "د": 6, "ج": 5, "ح": 5, "ص": 4, "ق": 6,
  "ف": 5, "ط": 3, "ذ": 2, "ز": 4, "ش": 4, "ض": 2, "غ": 2, "ظ": 1, "خ": 3,
  "ث": 2, "ء": 2,
};

const WEIGHTED_POOL: string[] = Object.entries(LETTER_WEIGHTS).flatMap(([letter, weight]) =>
  Array(weight).fill(letter)
);

/** Draws `count` DISTINCT letters (no repeats within a hand) — weighted
 *  toward common letters via the repeated-entries trick above, but each
 *  letter can only be picked once. Arabic has ~29 letters, comfortably
 *  more than the 15 needed, so this always succeeds without needing to
 *  fall back to the full alphabet. */
export function drawLetters(count = 15): string[] {
  const shuffledPool = [...WEIGHTED_POOL].sort(() => Math.random() - 0.5);
  const hand: string[] = [];
  for (const letter of shuffledPool) {
    if (hand.length >= count) break;
    if (!hand.includes(letter)) hand.push(letter);
  }
  if (hand.length < count) {
    for (const letter of Object.keys(LETTER_WEIGHTS)) {
      if (hand.length >= count) break;
      if (!hand.includes(letter)) hand.push(letter);
    }
  }
  return hand;
}
