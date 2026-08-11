import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Thin wrapper around ihj_score_round — service-role because scoring
// writes every player's total_score, not just the host's own row, which
// the host-only RLS policy on ihj_sessions doesn't cover (and ihj_players
// has no self-update policy for total_score at all, deliberately, so a
// player can never inflate their own score from the client).
export async function POST(req: NextRequest) {
  try {
    const { sessionId, roundNumber } = await req.json();
    if (!sessionId || !roundNumber) {
      return NextResponse.json({ success: false, reason: "missing_params" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("ihj_score_round", {
      p_session_id: sessionId,
      p_round_number: roundNumber,
    });

    if (error) return NextResponse.json({ success: false, reason: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ success: false, reason: e.message || "unknown_error" }, { status: 500 });
  }
}
