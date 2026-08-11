export type IhjStatus = "waiting" | "in_progress" | "completed" | "cancelled";
export type IhjRoundPhase = "answering" | "reveal" | "round_score";
export type IhjCategory = "human" | "animal" | "object" | "plant" | "country";

export type IhjSessionRow = {
  id: string;
  code: string;
  host_user_id: string;
  status: IhjStatus;
  total_rounds: number;
  current_round: number;
  current_letter: string | null;
  used_letters: string[];
  round_phase: IhjRoundPhase;
  phase_started_at: string | null;
  time_limit_seconds: number;
  lang: "ar" | "en";
  started_at: string | null;
  ended_at: string | null;
};

export type IhjPlayerRow = {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  total_score: number;
  joined_at: string;
};

export type IhjAnswerRow = {
  id: string;
  session_id: string;
  round_number: number;
  player_id: string;
  category: IhjCategory;
  answer_text: string;
  normalized_answer: string;
  points: number | null;
  submitted_at: string;
};
