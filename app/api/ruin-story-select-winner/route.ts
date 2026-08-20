import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Service-role only, deliberately — this is the one place the actual
// author of an anonymous submission gets looked up at all. The judge's
// client only ever sends a card_id (see ruin_story_answers_public in
// the schema, which never exposes player_id) — this function is what
// resolves that card_id back to a real player, server-side, after the
// judge has already committed to picking it blind.
export async function POST(req: NextRequest) {
  try {
    const { sessionId, cardId } = await req.json();
    if (!sessionId || !cardId) return NextResponse.json({ error: "sessionId and cardId are required" }, { status: 400 });

    const { data, error } = await getSupabaseAdmin().rpc("ruin_story_select_winner", { p_session_id: sessionId, p_card_id: cardId });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
