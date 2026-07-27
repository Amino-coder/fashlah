export type JobSessionStatus = "waiting" | "in_progress" | "completed";

export type JobRoundPhase = "countdown" | "prewarm" | "prewarm_teaser" | "answering" | "voting" | "reveal";

export interface JobSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  lang: "ar" | "en";
  status: JobSessionStatus;
  current_round: number;
  round_phase: JobRoundPhase;
  phase_started_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface JobPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  total_score: number;
  joined_at: string;
}

export interface JobPromptRow {
  id: string;
  category: string;
  text_ar: string;
  text_en: string;
  active: boolean;
}

export interface JobRoundPromptRow {
  id: string;
  session_id: string;
  round_number: number;
  prompt_id: string;
}

export interface JobAnswerRow {
  id: string;
  session_id: string;
  round_number: number;
  player_id: string;
  text: string;
  submitted_at: string;
}

export interface JobVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  answer_id: string;
  created_at: string;
}

export interface JobRoundResultRow {
  id: string;
  session_id: string;
  round_number: number;
  winner_answer_id: string;
  winner_player_id: string;
}

// --- Prewarm round (player-voting warm-up before round 1) ---

export interface JobPrewarmPromptRow {
  id: string;
  text_ar: string;
  text_en: string;
  active: boolean;
}

export interface JobPrewarmRoundPromptRow {
  id: string;
  session_id: string;
  round_number: number;
  prompt_id: string;
}

export interface JobPrewarmVoteRow {
  id: string;
  session_id: string;
  round_number: number;
  voter_player_id: string;
  voted_for_player_id: string;
  created_at: string;
}
