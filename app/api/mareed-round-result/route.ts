import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Runs once per round, when a player's client detects voting has finished
// (timer hit 0 or everyone voted). Uses the service-role key because it
// needs to update OTHER players' total_score — something the public RLS
// policies deliberately don't allow from the browser.
//
// The entire tally-votes / assign-points / update-scores / record-winner /
// flip-to-reveal sequence happens inside a single Postgres function
// (mareed_compute_round_result — see mareed_migration_006_fast_scoring.sql),
// so this route makes exactly ONE database round-trip instead of several.
// Idempotency (safe to call twice for the same round) is handled inside
// that function.

export async function POST(req: NextRequest) {
  try {
    const { sessionId, roundNumber } = await req.json();
    if (!sessionId || !roundNumber) {
      return NextResponse.json({ error: "sessionId and roundNumber are required" }, { status: 400 });
    }

    // Built here rather than at module scope so a missing service-role key
    // fails this one request cleanly instead of breaking `next build`.
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.rpc("mareed_compute_round_result", {
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
      winnerAnswerText: data.winner_answer_text,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
