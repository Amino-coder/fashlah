export type ShofahSessionStatus = "waiting" | "in_progress" | "completed";
export type ShofahCharacter = "girl" | "guy";

export interface ShofahSessionRow {
  id: string;
  code: string;
  host_user_id: string;
  character: ShofahCharacter;
  lang: "ar" | "en";
  status: ShofahSessionStatus;
  current_round: number;
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
