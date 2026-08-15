export type IhjSoloTier = "elite" | "great" | "ok" | "low";

const TITLES: Record<IhjSoloTier, { emoji: string; ar: string; en: string }[]> = {
  elite: [
    { emoji: "👑", ar: "ملك الحروف", en: "King of Letters" },
    { emoji: "🔥", ar: "ما شاء الله عليك", en: "Wow, look at you" },
    { emoji: "🧠", ar: "قاموس يمشي على رجلين", en: "A walking dictionary" },
  ],
  great: [
    { emoji: "⚡", ar: "أسرع من الحرف", en: "Faster than the letter" },
    { emoji: "😎", ar: "واضح إنك تعرف تلعب", en: "You clearly know how to play" },
  ],
  ok: [
    { emoji: "👀", ar: "مو بطّال", en: "Not bad at all" },
    { emoji: "😂", ar: "الحرف قاوم شوي", en: "The letter put up a fight" },
  ],
  low: [
    { emoji: "🥲", ar: "الحرف كان أقوى منك", en: "The letter won this one" },
    { emoji: "💀", ar: "30 ثانية ظلمتنا", en: "The clock wasn't on your side" },
  ],
};

/** Tiers are based on % correct, not raw score — a 3-round game and a
 *  10-round game shouldn't need different absolute thresholds to land
 *  the same title. Deliberately never harsh at the bottom tier, per spec
 *  ("don't make low scores genuinely insulting") — "the letter won" and
 *  "the clock wasn't on your side" put the loss on the challenge, not
 *  the player. */
export function ihjSoloTier(pctCorrect: number): IhjSoloTier {
  if (pctCorrect >= 0.85) return "elite";
  if (pctCorrect >= 0.6) return "great";
  if (pctCorrect >= 0.35) return "ok";
  return "low";
}

/** Picked once when results are computed, not on every render — same
 *  title should stay stable for the whole time someone's looking at
 *  their own results screen. */
export function pickIhjSoloTitle(pctCorrect: number) {
  const options = TITLES[ihjSoloTier(pctCorrect)];
  return options[Math.floor(Math.random() * options.length)];
}
