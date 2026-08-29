import { TRIVIA_QUESTIONS, TriviaQuestion, TriviaDifficulty, TriviaOption } from "./trivia-questions";

export type TriviaDifficultyChoice = TriviaDifficulty | "mixed";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * "متنوع" difficulty split — roughly equal thirds (matching the spec's
 * own canonical examples: 5→2/2/1, 10→3/4/3, 15→5/5/5), but not
 * literally the same numbers every single game. Starts from the
 * balanced base, distributes any remainder across buckets in random
 * order, then — for larger counts — has a chance to nudge one point
 * from one bucket to another, so consecutive مين games don't always
 * produce the identical split while staying genuinely balanced rather
 * than lopsided.
 */
export function pickMixedDistribution(count: number): Record<TriviaDifficulty, number> {
  const base = Math.floor(count / 3);
  let remainder = count - base * 3;
  const dist: Record<TriviaDifficulty, number> = { easy: base, medium: base, hard: base };

  const order = shuffle<TriviaDifficulty>(["easy", "medium", "hard"]);
  for (let i = 0; i < remainder; i++) dist[order[i]] += 1;

  if (count >= 6 && Math.random() < 0.5) {
    const from = order[Math.floor(Math.random() * 3)];
    const to = order[Math.floor(Math.random() * 3)];
    if (from !== to && dist[from] > 1) {
      dist[from] -= 1;
      dist[to] += 1;
    }
  }
  return dist;
}

/**
 * Splits a total count across N groups (categories) as evenly as
 * possible, with the remainder randomly distributed rather than always
 * landing on the same group — e.g. 10 across 3 categories might be
 * 4/3/3 one game and 3/4/3 the next.
 */
function splitAcrossGroups(total: number, groups: string[]): Record<string, number> {
  const base = Math.floor(total / groups.length);
  let remainder = total - base * groups.length;
  const result: Record<string, number> = {};
  for (const g of groups) result[g] = base;
  const order = shuffle(groups);
  for (let i = 0; i < remainder; i++) result[order[i % order.length]] += 1;
  return result;
}

/**
 * The main selection function — given the setup screen's choices,
 * returns a fully randomized, shuffled, difficulty-and-category-aware
 * set of questions ready to play.
 *
 * Graceful degradation, per the spec: if a specific (category,
 * difficulty) combination doesn't have enough questions left to fill
 * its target (rare given 20/20/10 per category, but possible with
 * unlucky combinations of a narrow category selection + a high
 * question count), this pulls the shortfall from elsewhere — first
 * other difficulties within the same category, then the same
 * difficulty in other selected categories, then anywhere still
 * available — rather than ever erroring or returning fewer questions
 * than the bank can actually provide.
 */
export function selectTriviaQuestions(
  count: number,
  difficulty: TriviaDifficultyChoice,
  categories: string[]
): TriviaQuestion[] {
  const cats = categories.length > 0 ? categories : Array.from(new Set(TRIVIA_QUESTIONS.map((q) => q.category)));

  // Target count per difficulty bucket.
  const diffTargets: Record<TriviaDifficulty, number> =
    difficulty === "mixed"
      ? pickMixedDistribution(count)
      : ({ easy: 0, medium: 0, hard: 0, [difficulty]: count } as Record<TriviaDifficulty, number>);

  const usedIds = new Set<string>();
  const selected: TriviaQuestion[] = [];

  function pool(cat: string, diff: TriviaDifficulty): TriviaQuestion[] {
    return TRIVIA_QUESTIONS.filter((q) => q.category === cat && q.difficulty === diff && !usedIds.has(q.id));
  }

  function takeFrom(candidates: TriviaQuestion[], n: number): TriviaQuestion[] {
    const picked = shuffle(candidates).slice(0, n);
    for (const q of picked) { usedIds.add(q.id); selected.push(q); }
    return picked;
  }

  (Object.keys(diffTargets) as TriviaDifficulty[]).forEach((diff) => {
    const target = diffTargets[diff];
    if (target <= 0) return;

    const perCategory = splitAcrossGroups(target, cats);
    let stillNeeded = 0;

    for (const cat of cats) {
      const want = perCategory[cat];
      if (want <= 0) continue;
      const got = takeFrom(pool(cat, diff), want);
      stillNeeded += want - got.length;
    }

    // Graceful fallback #1: same difficulty, any selected category,
    // for whatever the per-category split couldn't fill.
    if (stillNeeded > 0) {
      const anyCatPool = cats.flatMap((c) => pool(c, diff));
      const got = takeFrom(anyCatPool, stillNeeded);
      stillNeeded -= got.length;
    }

    // Graceful fallback #2: any difficulty, selected categories — only
    // reached if a narrow category+difficulty combination genuinely
    // doesn't have enough questions in the whole bank.
    if (stillNeeded > 0) {
      const anyDiffPool = cats.flatMap((c) =>
        (["easy", "medium", "hard"] as TriviaDifficulty[]).flatMap((d) => pool(c, d))
      );
      takeFrom(anyDiffPool, stillNeeded);
    }
  });

  // Order of the selected questions is a separate shuffle from which
  // ones were picked — per the spec's explicit "randomize both"
  // requirement.
  return shuffle(selected);
}

/** Shuffles a question's answer options for display — purely cosmetic
 *  per viewer, never touches correctAnswerId, so correctness tracking
 *  survives regardless of what order any given player happens to see
 *  the four choices in. */
export function shuffleTriviaOptions(options: TriviaOption[]): TriviaOption[] {
  return shuffle(options);
}

/** Speed-aware scoring: a flat base for any correct answer, plus a
 *  bonus that scales smoothly with how much time was left when the
 *  player answered — full bonus for an instant answer, tapering to
 *  zero right at the time limit, matching "reward speed" without
 *  making it all-or-nothing. Wrong answers always score 0. Computed
 *  server-side only (see /api/trivia-submit-answer) using the
 *  server's own clock against phase_started_at, since a client can't
 *  be trusted to self-report either correctness or its own speed. */
export function computeTriviaPoints(isCorrect: boolean, elapsedSeconds: number, timeLimitSeconds: number): number {
  if (!isCorrect) return 0;
  const BASE = 5;
  const BONUS_MAX = 5;
  const fractionRemaining = Math.max(0, Math.min(1, 1 - elapsedSeconds / timeLimitSeconds));
  return Math.round(BASE + BONUS_MAX * fractionRemaining);
}
