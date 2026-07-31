import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Assigning turn_order to every player has to happen server-side: the
// public RLS policy on qissa_players only allows updating your OWN row
// (user_id = auth.uid()), so the host's browser client can never set
// turn_order for anyone but itself — every other player would be left
// with turn_order = null, which silently breaks both submitting an
// answer and fetching the previous sentence (both keyed off turn_order).
// This route uses the service-role key to legitimately bypass that and
// set every player's turn_order in one shot, then flips the session to
// in_progress in the same request so there's no window where the game
// has "started" without turn_order actually being assigned yet.

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: players, error: playersErr } = await supabaseAdmin
      .from("qissa_players")
      .select("id, joined_at")
      .eq("session_id", sessionId)
      .order("joined_at", { ascending: true });
    if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 });
    if (!players || players.length < 2) {
      return NextResponse.json({ error: "Need at least 2 players to start" }, { status: 400 });
    }

    const updates = players.map((p, i) =>
      supabaseAdmin.from("qissa_players").update({ turn_order: i }).eq("id", p.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

    const { error: sessionErr } = await supabaseAdmin
      .from("qissa_sessions")
      .update({
        status: "in_progress", current_round: 0, round_phase: "countdown",
        phase_started_at: new Date().toISOString(), started_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    if (sessionErr) return NextResponse.json({ error: sessionErr.message }, { status: 500 });

    return NextResponse.json({ started: true, playerCount: players.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
