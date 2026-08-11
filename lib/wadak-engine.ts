import { ARCHETYPES, type Dimension, type Question, type Archetype } from "./wadak-content";

const ALL_DIMENSIONS: Dimension[] = ["spontaneity", "overthinking", "comfort", "recklessness", "drama", "control"];

/**
 * Computed from whichever questions were actually asked this playthrough,
 * not a fixed pool — rounds 1/3/4 shuffle-and-pick a subset each time, so
 * the normalization denominator has to reflect what was actually shown,
 * or percentages would be unfairly skewed by which random subset landed.
 */
function computeMaxPossible(askedQuestions: Question[]): Record<Dimension, number> {
  const max: Record<Dimension, number> = { spontaneity: 0, overthinking: 0, comfort: 0, recklessness: 0, drama: 0, control: 0 };
  for (const q of askedQuestions) {
    const bestPerDim: Record<Dimension, number> = { spontaneity: 0, overthinking: 0, comfort: 0, recklessness: 0, drama: 0, control: 0 };
    for (const opt of q.options) {
      for (const dim of ALL_DIMENSIONS) {
        const w = opt.weights[dim] ?? 0;
        if (w > bestPerDim[dim]) bestPerDim[dim] = w;
      }
    }
    for (const dim of ALL_DIMENSIONS) max[dim] += bestPerDim[dim];
  }
  return max;
}

export type ScoreResult = {
  raw: Record<Dimension, number>;
  percentages: Record<Dimension, number>;
  ranked: { dimension: Dimension; percentage: number }[];
  archetype: Archetype;
};

/** `askedQuestions` is every question actually shown this playthrough
 *  (all 4 rounds, in order); `selections` is one option id per question,
 *  same order. */
export function scoreAnswers(askedQuestions: Question[], selections: { questionId: string; optionId: string }[]): ScoreResult {
  const raw: Record<Dimension, number> = { spontaneity: 0, overthinking: 0, comfort: 0, recklessness: 0, drama: 0, control: 0 };

  for (const sel of selections) {
    const question = askedQuestions.find((q) => q.id === sel.questionId);
    const option = question?.options.find((o) => o.id === sel.optionId);
    if (!option) continue;
    for (const [dim, weight] of Object.entries(option.weights) as [Dimension, number][]) {
      raw[dim] += weight;
    }
  }

  const maxPossible = computeMaxPossible(askedQuestions);
  const percentages: Record<Dimension, number> = { ...raw };
  for (const dim of ALL_DIMENSIONS) {
    const max = maxPossible[dim] || 1;
    // Floor of 15% — a "0%" stat reads as a bug, not a personality trait.
    percentages[dim] = Math.max(15, Math.min(100, Math.round((raw[dim] / max) * 100)));
  }

  const ranked = ALL_DIMENSIONS
    .map((dimension) => ({ dimension, percentage: percentages[dimension] }))
    .sort((a, b) => b.percentage - a.percentage);

  const archetype = matchArchetype(ranked);

  return { raw, percentages, ranked, archetype };
}

function matchArchetype(ranked: { dimension: Dimension; percentage: number }[]): Archetype {
  const top = ranked[0].dimension;
  const second = ranked[1].dimension;

  const candidates = ARCHETYPES.filter((a) => a.primary === top);
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    const withSecondaryMatch = candidates.find((a) => a.secondary === second);
    if (withSecondaryMatch) return withSecondaryMatch;
    return candidates[0];
  }

  const bySecondary = ARCHETYPES.find((a) => a.secondary === top);
  return bySecondary ?? ARCHETYPES[0];
}

/** Fisher-Yates, used for shuffling round 1/3/4 pools before slicing. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
