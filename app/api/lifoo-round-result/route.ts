import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Same shape as /api/qaseeda-round-result — one service-role RPC call to
// lifoo_compute_round_result (supabase/lifoo_schema.sql), which does the
// entire tally/points/winner/phase-flip sequence in one round trip.

export async function POST(req: NextRequest) {
  try {
    const { sessionId, roundNumber } = await req.json();
    if (!sessionId || !roundNumber) {
      return NextResponse.json({ error: "sessionId and roundNumber are required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.rpc("lifoo_compute_round_result", {
      p_session_id: sessionId,
      p_round_number: roundNumber,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      alreadyComputed: data.already_computed,
      winnerPlayerId: data.winner_player_id,
      winnerLine: data.winner_line,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
