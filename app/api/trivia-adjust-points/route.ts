import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Lets the host manually adjust a player's score (+1 / -1) — for
 * correcting a mistake, awarding a bonus, or penalizing someone,
 * additive on top of normal automatic scoring, never replacing it.
 *
 * Host-only enforcement happens SERVER-SIDE here, not just hidden in
 * the UI the way some other games' host-only buttons work (e.g.
 * المحتال's "انتقل للتصويت" is UI-gated only, since getting that wrong
 * just skips a clue turn early). Arbitrary score manipulation is a
 * more consequential integrity concern for a competitive trivia game —
 * worth the extra real check that requestingUserId actually matches
 * this session's host_user_id before touching anyone's score.
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, playerId, delta, requestingUserId } = await req.json();
    if (!sessionId || !playerId || !requestingUserId || (delta !== 1 && delta !== -1)) {
      return NextResponse.json({ error: "sessionId, playerId, requestingUserId, and delta (1 or -1) are required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: session, error: sessErr } = await admin
      .from("trivia_sessions")
      .select("host_user_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr) throw sessErr;
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.host_user_id !== requestingUserId) {
      return NextResponse.json({ error: "Only the host can adjust points" }, { status: 403 });
    }

    const { data: player, error: playerErr } = await admin
      .from("trivia_players")
      .select("score")
      .eq("id", playerId)
      .eq("session_id", sessionId)
      .maybeSingle();
    if (playerErr) throw playerErr;
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const newScore = Math.max(0, player.score + delta);
    const { error: updErr } = await admin.from("trivia_players").update({ score: newScore }).eq("id", playerId);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, newScore });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
