export type LifooSessionStatus = "waiting" | "in_progress" | "completed";

// 'opening_select' — host is choosing/writing the starting verse (current_round stays 0)
// 'countdown'      — shared 5-4-3-2-1 before round 1 opens
// 'answering'      — everyone writes the next line
// 'voting'         — everyone votes on their favorite line
// 'reveal'         — brief "locked, here's who wrote what" beat
export type LifooRoundPhase = "opening_select" | "countdown" | "answering" | "voting" | "reveal";

export interface LifooSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  lang: "ar" | "en";
  status: LifooSessionStatus;
  // 0 = lobby + opening selection, 1-4 = writing/voting rounds, 5 = cinematic final reveal
  current_round: number;
  round_phase: LifooRoundPhase;
  phase_started_at: string | null;
  // The starting verse the whole song grows from — denormalized directly
  // onto the session, same reasoning as قصيدة: chosen once, never changes,
  // and a custom one never lived in lifoo_openings to begin with.
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

export interface LifooPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  total_score: number;
  joined_at: string;
}

// Curated bank of starting verses (وردة الجزائرية / محمد عبده / عبدالرحمن
// محمد) — fixed set, not drawn at random, so the cards on the opening
// screen are always the same three plus "ألّف من عندك".
export interface LifooOpeningRow {
  id: string;
  category: string;
  sort_order: number;
  line1: string;
  line2: string;
  poet: string;
  active: boolean;
}

export interface LifooAnswerRow {
  id: string;
  session_id: string;
  round_number: number;
  player_id: string;
  line: string;
  submitted_at: string;
}

export interface LifooVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  answer_id: string;
  created_at: string;
}

export interface LifooRoundResultRow {
  id: string;
  session_id: string;
  round_number: number;
  winner_answer_id: string;
  winner_player_id: string;
}
