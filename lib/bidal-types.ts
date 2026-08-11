export type BidalMode = "multiplayer" | "solo";
export type BidalStatus = "waiting" | "in_progress" | "completed" | "cancelled";

export type BidalSessionRow = {
  id: string;
  code: string;
  host_user_id: string;
  mode: BidalMode;
  status: BidalStatus;
  current_word: string | null;
  move_index: number;
  shuffle_used: boolean;
  time_limit_seconds: number;
  started_at: string | null;
  ended_at: string | null;
  winner_player_id: string | null;
  lang: "ar" | "en";
};

export type BidalPlayerRow = {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  letters: string[];
  finished: boolean;
  joined_at: string;
};
