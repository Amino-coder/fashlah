import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Thin wrapper around the atomic bidal_attempt_move Postgres function —
// service-role because a winning move can come from ANY player, not just
// the session host, so this can't be gated by the host-only RLS policy on
// bidal_sessions. All the actual race-safety logic lives in the SQL
// function itself (see supabase/bidal_schema.sql); this route just calls
// it and passes the result through.
export async function POST(req: NextRequest) {
  try {
    const { sessionId, playerId, expectedWord, newWord, position, letter } = await req.json();
    if (!sessionId || !playerId || !expectedWord || !newWord || position === undefined || !letter) {
      return NextResponse.json({ success: false, reason: "missing_params" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("bidal_attempt_move", {
      p_session_id: sessionId,
      p_player_id: playerId,
      p_expected_word: expectedWord,
      p_new_word: newWord,
      p_position: position,
      p_letter: letter,
    });

    if (error) return NextResponse.json({ success: false, reason: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ success: false, reason: e.message || "unknown_error" }, { status: 500 });
  }
}
