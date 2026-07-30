import { supabase } from "@/lib/supabase";
import type { QaseedaSessionRow } from "@/lib/qaseeda-types";

/**
 * One line of the growing poem, ready to render. round 0 is always the
 * opening (two hemistichs); rounds 1-5 are single community-written lines.
 */
export type PoemLine = {
  round: number;
  line1: string;
  line2: string | null;
  authorName: string | null;
  isOpening: boolean;
  isCustomOpening: boolean;
  category: string | null;
};

function openingLine(session: QaseedaSessionRow, hostNickname: string | null): PoemLine | null {
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
 * Pulls the opening line plus every scored round's winning line, in order,
 * up to (and including) `upToRound`. Skips any round nobody submitted for
 * (no result row = no line for it — same "quietly skip" behaviour as
 * Shofah's FinalConversation).
 */
export async function fetchPoemSoFar(
  session: QaseedaSessionRow,
  upToRound: number
): Promise<PoemLine[]> {
  const lines: PoemLine[] = [];

  let hostNickname: string | null = null;
  if (session.opening_is_custom && session.opening_author_player_id) {
    const { data } = await supabase
      .from("qaseeda_players")
      .select("nickname")
      .eq("id", session.opening_author_player_id)
      .single();
    hostNickname = data?.nickname ?? null;
  }
  const opening = openingLine(session, hostNickname);
  if (opening) lines.push(opening);

  if (upToRound >= 1) {
    const { data: results } = await supabase
      .from("qaseeda_round_results")
      .select("round_number, qaseeda_answers(text), qaseeda_players(nickname)")
      .eq("session_id", session.id)
      .lte("round_number", upToRound)
      .order("round_number");

    for (const r of results || []) {
      const answerRow = (r as any).qaseeda_answers;
      const playerRow = (r as any).qaseeda_players;
      if (!answerRow || !playerRow) continue;
      lines.push({
        round: r.round_number,
        line1: answerRow.text,
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
 * Same as fetchPoemSoFar, but retries a few times if a round's result
 * hasn't landed yet. Scoring is fire-and-forget (RoundScreen advances the
 * round before the scoring API call finishes writing to
 * qaseeda_round_results), which is a real race for the LAST round
 * especially — the final reveal can mount before that write lands.
 */
export async function fetchPoemSoFarWithRetry(
  session: QaseedaSessionRow,
  upToRound: number,
  opts: { maxAttempts?: number; delayMs?: number } = {}
): Promise<PoemLine[]> {
  const maxAttempts = opts.maxAttempts ?? 6;
  const delayMs = opts.delayMs ?? 700;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const lines = await fetchPoemSoFar(session, upToRound);
    // Opening (round 0) + one line per round up to upToRound is "complete".
    const expected = (session.opening_line1 ? 1 : 0) + upToRound;
    if (lines.length >= expected || attempt === maxAttempts - 1) return lines;
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return fetchPoemSoFar(session, upToRound);
}
