export type MareedSessionStatus = "waiting" | "in_progress" | "completed";
export type MareedCharacter = "girl" | "guy";

export type MareedRoundPhase = "countdown" | "prewarm" | "prewarm_teaser" | "answering" | "voting" | "reveal";

export interface MareedSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  character: MareedCharacter;
  lang: "ar" | "en";
  status: MareedSessionStatus;
  current_round: number;
  round_phase: MareedRoundPhase;
  phase_started_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface MareedPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  total_score: number;
  joined_at: string;
}

export interface MareedPromptRow {
  id: string;
  category: string;
  text_ar: string;
  text_en: string;
  active: boolean;
  audience: "girl" | "guy" | null;
}

export interface MareedRoundPromptRow {
  id: string;
  session_id: string;
  round_number: number;
  prompt_id: string;
}

export interface MareedAnswerRow {
  id: string;
  session_id: string;
  round_number: number;
  player_id: string;
  text: string;
  submitted_at: string;
}

export interface MareedVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  answer_id: string;
  created_at: string;
}

export interface MareedRoundResultRow {
  id: string;
  session_id: string;
  round_number: number;
  winner_answer_id: string;
  winner_player_id: string;
}

// --- Prewarm round (player-voting warm-up before round 1) ---

export interface MareedPrewarmPromptRow {
  id: string;
  text_ar: string;
  text_en: string;
  active: boolean;
}

export interface MareedPrewarmRoundPromptRow {
  id: string;
  session_id: string;
  round_number: number;
  prompt_id: string;
}

export interface MareedPrewarmVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  voted_for_player_id: string;
  created_at: string;
}
