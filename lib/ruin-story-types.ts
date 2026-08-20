export type RuinStorySessionStatus = "waiting" | "in_progress" | "completed" | "cancelled";
export type RuinStoryPhase = "answering" | "judging" | "reveal";

export interface RuinStorySessionRow {
  id: string;
  code: string;
  host_user_id: string;
  lang: "ar" | "en";
  status: RuinStorySessionStatus;
  round_number: number;
  phase: RuinStoryPhase;
  judge_player_id: string | null;
  black_card_id: string | null;
  used_black_card_ids: string[];
  adult_mode: boolean;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface RuinStoryPlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  score: number;
  joined_at: string;
}

export interface RuinStoryBlackCardRow {
  id: string;
  text: string;
  active: boolean;
}

export interface RuinStoryWhiteCardRow {
  id: string;
  text: string;
  category: string | null;
  adult_only: boolean;
  active: boolean;
}

export interface RuinStoryHandRow {
  id: string;
  session_id: string;
  player_id: string;
  card_id: string;
  used: boolean;
  dealt_at: string;
}

export interface RuinStoryAnswerPublicRow {
  id: string;
  session_id: string;
  round_number: number;
  card_id: string;
}

export interface RuinStoryRoundResultRow {
  id: string;
  session_id: string;
  round_number: number;
  judge_player_id: string;
  black_card_id: string;
  winning_player_id: string;
  winning_card_id: string;
  created_at: string;
}
