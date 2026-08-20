import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Service-role only, and per the schema's own comment, only ever used
// for round 1 — ruin_story_select_winner sets up every round after
// that itself, so the client never calls this again mid-game.
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const { data, error } = await getSupabaseAdmin().rpc("ruin_story_start_round", { p_session_id: sessionId });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
