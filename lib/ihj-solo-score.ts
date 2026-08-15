import { ihjNormalize } from "./ihj-normalize";

/**
 * Solo mirrors ihj_score_round's per-answer validity rule exactly (see
 * supabase/ihj_schema.sql: non-empty, correct starting letter, more than
 * one letter long) — the one thing solo drops is the "10 if unique / 5
 * if shared with another player" split, since with one player every
 * valid answer is trivially unique. So: valid → 10, invalid → 0, no SQL
 * round trip needed at all (there's no other player's answer to compare
 * against, which is the entire reason the multiplayer version needs a
 * server-side function in the first place).
 */
export function scoreSoloAnswer(letter: string, answerText: string): number {
  const norm = ihjNormalize(answerText);
  if (!norm || norm.length <= 1) return 0;
  return norm[0] === ihjNormalize(letter)[0] ? 10 : 0;
}
