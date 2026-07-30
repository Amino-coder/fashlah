export type QaseedaSessionStatus = "waiting" | "in_progress" | "completed";

// 'opening_select' — host is choosing/writing the seed بيت (current_round stays 0)
// 'countdown'      — shared 5-4-3-2-1 before round 1 opens
// 'answering'      — everyone writes the next line
// 'voting'         — everyone votes on their favorite submission
// 'reveal'         — brief "locked, here's who wrote what" beat
export type QaseedaRoundPhase = "opening_select" | "countdown" | "answering" | "voting" | "reveal";

export interface QaseedaSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  lang: "ar" | "en";
  status: QaseedaSessionStatus;
  // 0 = lobby + opening selection, 1-5 = writing/voting rounds, 6 = cinematic final reveal
  current_round: number;
  round_phase: QaseedaRoundPhase;
  phase_started_at: string | null;
  // The seed بيت the whole poem grows from — denormalized directly onto the
  // session (not a foreign key into qaseeda_openings) since it's chosen once
  // and never changes, and a custom one never existed in that table at all.
  opening_line1: string | null;
  opening_line2: string | null;
  opening_poet: string | null;
  opening_category: string | null;
  opening_is_custom: boolean;
  opening_author_player_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface QaseedaPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  total_score: number;
  joined_at: string;
}

// Master bank of famous opening أبيات — curated, not drawn at random, so the
// five cards shown before the game starts are always the same well-known set.
export interface QaseedaOpeningRow {
  id: string;
  category: string;
  sort_order: number;
  line1: string;
  line2: string;
  poet: string;
  active: boolean;
}

export interface QaseedaAnswerRow {
  id: string;
  session_id: string;
  round_number: number;
  player_id: string;
  text: string;
  submitted_at: string;
}

export interface QaseedaVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  answer_id: string;
  created_at: string;
}

export interface QaseedaRoundResultRow {
  id: string;
  session_id: string;
  round_number: number;
  winner_answer_id: string;
  winner_player_id: string;
}
