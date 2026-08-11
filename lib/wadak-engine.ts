import { QUESTIONS, ARCHETYPES, type Dimension, type Option, type Archetype } from "./wadak-content";

const ALL_DIMENSIONS: Dimension[] = ["spontaneity", "overthinking", "comfort", "recklessness", "drama", "control"];

/**
 * The maximum a dimension could possibly reach if every single answer had
 * maximized it — computed from the actual question data rather than
 * hand-calculated, so it can never drift out of sync if a question ever
 * changes. Each dimension naturally has a different ceiling depending on
 * how many questions touch it and how heavily, which is fine — each
 * dimension is normalized against its own ceiling, not a shared one.
 */
function computeMaxPossible(): Record<Dimension, number> {
  const max: Record<Dimension, number> = {
    spontaneity: 0, overthinking: 0, comfort: 0, recklessness: 0, drama: 0, control: 0,
  };
  for (const q of QUESTIONS) {
    const bestPerDim: Record<Dimension, number> = { ...max };
    for (const dim of ALL_DIMENSIONS) bestPerDim[dim] = 0;
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

export const MAX_POSSIBLE = computeMaxPossible();

export type ScoreResult = {
  raw: Record<Dimension, number>;
  percentages: Record<Dimension, number>;
  ranked: { dimension: Dimension; percentage: number }[]; // highest first
  archetype: Archetype;
};

/** `selections` is one option id per question, in question order. */
export function scoreAnswers(selections: { questionId: string; optionId: string }[]): ScoreResult {
  const raw: Record<Dimension, number> = {
    spontaneity: 0, overthinking: 0, comfort: 0, recklessness: 0, drama: 0, control: 0,
  };

  for (const sel of selections) {
    const question = QUESTIONS.find((q) => q.id === sel.questionId);
    const option = question?.options.find((o) => o.id === sel.optionId);
    if (!option) continue;
    for (const [dim, weight] of Object.entries(option.weights) as [Dimension, number][]) {
      raw[dim] += weight;
    }
  }

  const percentages: Record<Dimension, number> = { ...raw };
  for (const dim of ALL_DIMENSIONS) {
    const max = MAX_POSSIBLE[dim] || 1;
    // Floor of 15% — a "0%" stat reads as a bug, not a personality trait.
    percentages[dim] = Math.max(15, Math.min(100, Math.round((raw[dim] / max) * 100)));
  }

  const ranked = ALL_DIMENSIONS
    .map((dimension) => ({ dimension, percentage: percentages[dimension] }))
    .sort((a, b) => b.percentage - a.percentage);

  const archetype = matchArchetype(ranked);

  return { raw, percentages, ranked, archetype };
}

/**
 * Primary-dimension match matters most; secondary is a tiebreaker among
 * archetypes that share the same primary. If nothing matches cleanly
 * (shouldn't happen given every dimension has at least one archetype
 * keyed to it as primary), falls back to whichever archetype's primary
 * is closest to the player's top dimension in the ranked list.
 */
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

  // No archetype has `top` as primary (shouldn't happen with the current
  // content, but stay safe against future edits) — fall back to matching
  // on secondary instead.
  const bySecondary = ARCHETYPES.find((a) => a.secondary === top);
  return bySecondary ?? ARCHETYPES[0];
}
