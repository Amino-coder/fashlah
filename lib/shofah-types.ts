export type ShofahSessionStatus = "waiting" | "in_progress" | "completed";
export type ShofahCharacter = "girl" | "guy";

export type ShofahRoundPhase = "answering" | "voting";

export interface ShofahSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  character: ShofahCharacter;
  lang: "ar" | "en";
  status: ShofahSessionStatus;
  current_round: number;
  round_phase: ShofahRoundPhase;
  phase_started_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface ShofahPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  total_score: number;
  joined_at: string;
}

export interface ShofahPromptRow {
  id: string;
  category: string;
  text_ar: string;
  text_en: string;
  active: boolean;
}

export interface ShofahRoundPromptRow {
  id: string;
  session_id: string;
  round_number: number;
  prompt_id: string;
}

export interface ShofahAnswerRow {
  id: string;
  session_id: string;
  round_number: number;
  player_id: string;
  text: string;
  submitted_at: string;
}

export interface ShofahVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  answer_id: string;
  created_at: string;
}
