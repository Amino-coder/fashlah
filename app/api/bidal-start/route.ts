import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { pickStartingWord, drawLetters } from "@/lib/bidal-letters";

// Deals fresh letters to every player in the session and picks the
// starting word — needs service-role because it writes every player's
// row, not just the host's own (the same reason /api/qissa-start-game
// exists: RLS's self_update policy would otherwise block a host from
// setting up anyone else's hand).
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ success: false, reason: "missing_params" }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();

    const { data: players, error: playersErr } = await supabaseAdmin
      .from("bidal_players")
      .select("id")
      .eq("session_id", sessionId);
    if (playersErr) throw playersErr;
    if (!players || players.length === 0) {
      return NextResponse.json({ success: false, reason: "no_players" }, { status: 400 });
    }

    for (const p of players) {
      const { error } = await supabaseAdmin
        .from("bidal_players")
        .update({ letters: drawLetters(15), finished: false })
        .eq("id", p.id);
      if (error) throw error;
    }

    const startingWord = pickStartingWord();
    const { error: sessionErr } = await supabaseAdmin
      .from("bidal_sessions")
      .update({
        current_word: startingWord,
        starting_word: startingWord,
        status: "in_progress",
        started_at: new Date().toISOString(),
        move_index: 0,
        shuffle_used: false,
        winner_player_id: null,
        ended_at: null,
      })
      .eq("id", sessionId);
    if (sessionErr) throw sessionErr;

    return NextResponse.json({ success: true, current_word: startingWord });
  } catch (e: any) {
    return NextResponse.json({ success: false, reason: e.message || "unknown_error" }, { status: 500 });
  }
}
