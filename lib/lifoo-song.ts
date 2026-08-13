import { supabase } from "@/lib/supabase";
import type { LifooSessionRow } from "@/lib/lifoo-types";

export const MAX_LINE_CHARS = 90;

/**
 * One line of the growing song, ready to render. round 0 is always the
 * starting verse (two hemistichs, line2 set); rounds 1-4 are single
 * community-written lines (line2 always null) — SongLine.tsx already
 * renders line2-optional gracefully, so both shapes share one component.
 */
export type SongLine = {
  round: number;
  line1: string;
  line2: string | null;
  authorName: string | null;
  isOpening: boolean;
  isCustomOpening: boolean;
  category: string | null;
};

function openingLine(session: LifooSessionRow, hostNickname: string | null): SongLine | null {
  if (!session.opening_line1) return null;
  return {
    round: 0,
    line1: session.opening_line1,
    line2: session.opening_line2,
    authorName: session.opening_is_custom ? hostNickname : session.opening_poet,
    isOpening: true,
    isCustomOpening: session.opening_is_custom,
    category: session.opening_category,
  };
}

/**
 * Pulls the starting verse plus every scored round's winning line, in
 * order, up to (and including) `upToRound`. Skips any round nobody
 * submitted for.
 */
export async function fetchSongSoFar(
  session: LifooSessionRow,
  upToRound: number
): Promise<SongLine[]> {
  const lines: SongLine[] = [];

  let hostNickname: string | null = null;
  if (session.opening_is_custom && session.opening_author_player_id) {
    const { data } = await supabase
      .from("lifoo_players")
      .select("nickname")
      .eq("id", session.opening_author_player_id)
      .single();
    hostNickname = data?.nickname ?? null;
  }
  const opening = openingLine(session, hostNickname);
  if (opening) lines.push(opening);

  if (upToRound >= 1) {
    const { data: results } = await supabase
      .from("lifoo_round_results")
      .select("round_number, lifoo_answers(line), lifoo_players(nickname)")
      .eq("session_id", session.id)
      .lte("round_number", upToRound)
      .order("round_number");

    for (const r of results || []) {
      const answerRow = (r as any).lifoo_answers;
      const playerRow = (r as any).lifoo_players;
      if (!answerRow || !playerRow) continue;
      lines.push({
        round: r.round_number,
        line1: answerRow.line,
        line2: null,
        authorName: playerRow.nickname,
        isOpening: false,
        isCustomOpening: false,
        category: null,
      });
    }
  }

  return lines;
}

/**
 * Same as fetchSongSoFar, but retries a few times if a round's result
 * hasn't landed yet — scoring is fire-and-forget, a real race for the
 * LAST round especially (see قصيدة's identical fetchPoemSoFarWithRetry).
 */
export async function fetchSongSoFarWithRetry(
  session: LifooSessionRow,
  upToRound: number,
  opts: { maxAttempts?: number; delayMs?: number } = {}
): Promise<SongLine[]> {
  const maxAttempts = opts.maxAttempts ?? 6;
  const delayMs = opts.delayMs ?? 700;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const lines = await fetchSongSoFar(session, upToRound);
    const expected = (session.opening_line1 ? 1 : 0) + upToRound;
    if (lines.length >= expected || attempt === maxAttempts - 1) return lines;
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return fetchSongSoFar(session, upToRound);
}
