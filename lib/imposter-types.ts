export type ImposterSessionStatus = "waiting" | "in_progress" | "completed" | "cancelled";
export type ImposterPhase = "clue" | "voting" | "reveal";

export interface ImposterSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  lang: "ar" | "en";
  status: ImposterSessionStatus;
  round_number: number;
  phase: ImposterPhase;
  word_id: string | null;
  imposter_player_id: string | null;
  turn_player_id: string | null;
  turn_started_at: string | null;
  used_word_ids: string[];
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface ImposterPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  turn_order: number | null;
  imposter_count: number;
  joined_at: string;
}

export interface ImposterWordRow {
  id: string;
  text: string;
  active: boolean;
}

export interface ImposterVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  voted_for_player_id: string;
  created_at: string;
}

export interface ImposterRoundResultRow {
  id: string;
  session_id: string;
  round_number: number;
  imposter_player_id: string;
  word_id: string;
  voted_for_player_id: string | null;
  correct: boolean;
  created_at: string;
}
