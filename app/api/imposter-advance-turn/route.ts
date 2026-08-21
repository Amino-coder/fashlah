import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Advances the clue-phase turn to the next player (or into voting if
 * the current player was last), or verifies+advances a timeout.
 *
 * Runs via the service-role client, deliberately — this used to be a
 * direct client-side update gated by imposter_sessions' player-update
 * RLS policy, and non-host players reported it silently not working
 * even though the policy is written to allow any player in the
 * session, not just the host. Rather than keep guessing at an exact
 * RLS nuance, this removes RLS from the equation entirely: the same
 * approach already used for imposter_start_round and
 * imposter_compute_result, both of which never had this problem.
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, isManualClick } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const admin = getSupabaseAdmin();

    // Fetched together rather than one-after-the-other — players only
    // depends on sessionId, not on anything the session row itself
    // returns, so there's no real reason to wait for the first query to
    // finish before starting the second. This is the actual speed-up:
    // one network round-trip removed from the critical path for the
    // common case (a normal manual click), not just the RLS change.
    const [{ data: session, error: sessErr }, { data: players, error: playersErr }] = await Promise.all([
      admin.from("imposter_sessions").select("turn_player_id, turn_started_at, status, phase").eq("id", sessionId).maybeSingle(),
      admin.from("imposter_players").select("id, turn_order").eq("session_id", sessionId).order("turn_order", { ascending: true }),
    ]);
    if (sessErr) throw sessErr;
    if (playersErr) throw playersErr;
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status !== "in_progress" || session.phase !== "clue") {
      return NextResponse.json({ ok: true, skipped: "not in clue phase" });
    }

    // Same verification as before: a timeout-triggered call must
    // confirm the CURRENT turn has actually run the full duration
    // before advancing it — this is what stops one device's late/stale
    // clock from double-advancing a turn another device already moved
    // on correctly, which was skipping players. A manual تم click is
    // always honored immediately regardless of elapsed time.
    const TURN_SECONDS = 20;
    if (!isManualClick) {
      const elapsed = (Date.now() - new Date(session.turn_started_at).getTime()) / 1000;
      if (elapsed < TURN_SECONDS - 0.5) {
        return NextResponse.json({ ok: true, skipped: "turn not actually expired yet" });
      }
    }

    const order = (players || []).map((p) => p.id);
    const idx = order.indexOf(session.turn_player_id || "");
    const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

    if (nextId) {
      const { error: updErr } = await admin
        .from("imposter_sessions")
        .update({ turn_player_id: nextId, turn_started_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("turn_player_id", session.turn_player_id);
      if (updErr) throw updErr;
    } else {
      const { error: updErr } = await admin
        .from("imposter_sessions")
        .update({ phase: "voting" })
        .eq("id", sessionId)
        .eq("turn_player_id", session.turn_player_id);
      if (updErr) throw updErr;
    }

    return NextResponse.json({ ok: true, next_player_id: nextId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
