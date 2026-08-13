/**
 * بدل الكلمة is fully local now (see app/bidal/solo/page.tsx) — there's
 * no session/player/move rows to reconstruct a result from anymore, so
 * this file only keeps the two pieces still shared with the share-card
 * generator (components/bidal/exportResultCard.ts): the result shape
 * itself, and the duration formatter.
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} ثانية`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

export type BidalResult = {
  finished: boolean;
  lettersUsed: number;
  totalLetters: number;
  remainingLetters: string[];
  completionSeconds: number | null;
  wordFlow: string[];
};
