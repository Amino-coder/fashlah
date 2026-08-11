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

/** Draws `count` letters independently at random from the weighted pool
 *  (with replacement, so duplicates within a hand are expected and fine —
 *  real Arabic words repeat letters constantly). Called once per player,
 *  so different players naturally end up with different hands. */
export function drawLetters(count = 15): string[] {
  const hand: string[] = [];
  for (let i = 0; i < count; i++) {
    hand.push(WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)]);
  }
  return hand;
}
