import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { authorTurnOrderForStory } from "@/lib/qissa-story";

// Called by the host once a writing round's timer hits zero. Every
// player's OWN client is responsible for submitting (or auto-submitting
// on timeout) their own sentence — this route is purely a safety net for
// the pathological case where a client never manages to submit at all
// (closed tab, dead connection, etc.). Without it, that story would be
// missing a sentence for this round forever, and the final reconstruction
// would have a hole in it. Uses the service-role key because inserting a
// row "on behalf of" another player isn't something the public RLS
// policies allow from the browser — for good reason.

export async function POST(req: NextRequest) {
  try {
    const { sessionId, roundNumber } = await req.json();
    if (!sessionId || !roundNumber) {
      return NextResponse.json({ error: "sessionId and roundNumber are required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: players, error: playersErr }, { data: existing, error: existingErr }] = await Promise.all([
      supabaseAdmin.from("qissa_players").select("id, turn_order").eq("session_id", sessionId),
      supabaseAdmin.from("qissa_answers").select("story_index").eq("session_id", sessionId).eq("round_number", roundNumber),
    ]);
    if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 });
    if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

    const n = players?.length ?? 0;
    if (n === 0) return NextResponse.json({ error: "No players in this session" }, { status: 400 });

    const byTurnOrder = new Map<number, string>();
    for (const p of players!) byTurnOrder.set(p.turn_order, p.id);

    const present = new Set((existing || []).map((r) => r.story_index));
    const missing: { session_id: string; round_number: number; story_index: number; author_player_id: string; sentence: string }[] = [];

    for (let storyIndex = 0; storyIndex < n; storyIndex++) {
      if (present.has(storyIndex)) continue;
      const turnOrder = authorTurnOrderForStory(storyIndex, roundNumber, n);
      const authorId = byTurnOrder.get(turnOrder);
      if (!authorId) continue; // shouldn't happen, but don't crash the round over it
      missing.push({
        session_id: sessionId, round_number: roundNumber, story_index: storyIndex,
        author_player_id: authorId, sentence: "",
      });
    }

    if (missing.length > 0) {
      const { error: insertErr } = await supabaseAdmin.from("qissa_answers").insert(missing);
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("qissa_sessions")
      .update({ round_phase: "passing", phase_started_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ backfilled: missing.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
