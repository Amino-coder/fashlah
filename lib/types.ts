export type SessionStatus = "waiting" | "in_progress" | "completed" | "cancelled";

export interface SessionRow {
  id: string;
  code: string;
  group_id: string | null;
  host_user_id: string;
  pack_id: string;
  difficulty: "funny" | "chaotic" | "deep" | "mixed";
  max_players: number;
  status: SessionStatus;
  current_round: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface PlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  is_host: boolean;
  connected: boolean;
  current_round: number;
  joined_at: string;
  last_seen_at: string;
}

export type QuestionType =
  | "self"
  | "friend_vote"
  | "this_or_that"
  | "emoji"
  | "ranking"
  | "scale"
  | "yes_no"
  | "multiple_choice"
  | "randomizer"
  | "guess_percentage";

export interface QuestionOption {
  id: string;
  emoji?: string;
  text_ar: string;
  text_en: string;
  trait_weights?: Record<string, number>;
}

export interface QuestionRow {
  id: string;
  pack_id: string;
  round: 1 | 2 | 3;
  question_type: QuestionType;
  category: string | null;
  difficulty: "funny" | "chaotic" | "deep" | "mixed";
  text_ar: string;
  text_en: string;
  options: QuestionOption[];
  weight: number;
  enabled: boolean;
}

export interface AnswerRow {
  id: string;
  session_id: string;
  player_id: string;
  question_id: string;
  selected_option_id: string | null;
  raw_value: unknown;
  answered_at: string;
}

export interface QuestionPackRow {
  id: string;
  slug: string;
  icon: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
}
