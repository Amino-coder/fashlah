import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Every game's sessions table has exactly one UPDATE policy, and it's
// host-only (`host_user_id = auth.uid()`) — by design, so a random player
// can't rewrite someone else's round state. That's exactly right for
// round advancement, but it's the wrong shape for "mark the game
// completed": if the host's browser isn't around by the time the reveal
// wraps up (closed early, refreshed, dropped connection), no other
// client's attempt at that same UPDATE can succeed — RLS silently
// rejects it, and the session sits at status='in_progress' until the
// stale-session cleanup job eventually mislabels a genuinely finished
// game as 'cancelled'. This route exists so ANY client that reaches the
// final screen can reliably flip that one flag, via the service role
// (bypassing RLS) rather than by loosening the sessions table's own
// UPDATE policy — which would be harder to scope safely (a broadened
// client-side policy risks letting any player rewrite other fields on a
// session they don't host, not just status/ended_at).

const ALLOWED_TABLES = new Set([
  "sessions",
  "shofah_sessions",
  "job_sessions",
  "qaseeda_sessions",
  "qissa_sessions",
]);

export async function POST(req: NextRequest) {
  try {
    const { table, sessionId } = await req.json();
    if (typeof table !== "string" || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from(table)
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
