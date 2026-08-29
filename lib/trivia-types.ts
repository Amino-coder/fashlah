export type TriviaSessionStatus = "waiting" | "in_progress" | "completed" | "cancelled";
export type TriviaPhase = "answering" | "reveal";

export interface TriviaSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  lang: "ar" | "en";
  status: TriviaSessionStatus;
  question_count: 5 | 10 | 15;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  categories: string[];
  question_ids: string[];
  current_question_index: number;
  phase: TriviaPhase;
  phase_started_at: string | null;
  question_time_limit_seconds: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface TriviaPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  score: number;
  joined_at: string;
}

export interface TriviaAnswerRow {
  id: string;
  session_id: string;
  question_index: number;
  player_id: string;
  selected_option_id: "a" | "b" | "c" | "d";
  is_correct: boolean;
  points_awarded: number;
  answered_at: string;
}
