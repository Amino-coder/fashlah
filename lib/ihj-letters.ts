// Practical, playable Arabic starting letters — deliberately excludes
// letters that rarely start real words (ذ ظ ض غ ث ؤ ئ ء and the like),
// per the spec's "avoid unnecessarily difficult letters" instruction.
export const IHJ_LETTER_POOL = [
  "ا", "ب", "ت", "ج", "ح", "د", "ر", "ز", "س", "ش",
  "ص", "ط", "ع", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي", "خ",
];

/** Avoids repeating a letter within the same game unless every practical
 *  letter has already been used, per spec. */
export function pickNextLetter(usedLetters: string[]): string {
  const remaining = IHJ_LETTER_POOL.filter((l) => !usedLetters.includes(l));
  const pool = remaining.length > 0 ? remaining : IHJ_LETTER_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}
