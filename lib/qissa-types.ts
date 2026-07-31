export type QissaSessionStatus = "waiting" | "in_progress" | "completed";

// 'countdown' — shared 5-4-3-2-1 before round 1 opens
// 'writing'   — everyone writes one sentence for their currently-assigned story
// 'passing'   — brief, content-free "stories are moving along" transition beat
export type QissaRoundPhase = "countdown" | "writing" | "passing";

export interface QissaSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  lang: "ar" | "en";
  status: QissaSessionStatus;
  // 0 = lobby, 1-3 = writing rounds, 4 = final reveal
  current_round: number;
  round_phase: QissaRoundPhase;
  phase_started_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface QissaPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  // Assigned once, when the host starts the game (sequential by join
  // order). This — combined with the round number — is what determines
  // which story a player is handed each round; see lib/qissa-story.ts.
  turn_order: number;
  joined_at: string;
}

export interface QissaAnswerRow {
  id: string;
  session_id: string;
  round_number: number; // 1-3
  story_index: number; // 0..N-1
  author_player_id: string;
  sentence: string;
  submitted_at: string;
}
