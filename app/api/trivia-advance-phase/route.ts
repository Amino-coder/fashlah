import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const REVEAL_PAUSE_SECONDS = 5;

/**
 * Advances the game from whichever phase it's currently in — answering
 * to reveal (once everyone's answered, or time's up), or reveal to the
 * next question (or to completed, if that was the last one). One
 * endpoint that inspects current state and does the right next step,
 * rather than two separate endpoints the client has to choose between.
 *
 * Every transition here can be triggered two ways: a manual host click
 * (always honored immediately) or an automatic timeout check (verified
 * server-side against the real elapsed time before acting). That
 * distinction — and the server-side re-verification for the timeout
 * path specifically — exists because a client-side-only timer trigger
 * turned out to be genuinely unreliable in earlier games in this app
 * (المحتال's turn timer had exactly this class of bug: one device's
 * stale local clock double-advancing a state another device had
 * already correctly moved past). Routing this through the server and
 * re-checking elapsed time here, rather than trusting whichever
 * client's timer fires first, is what actually fixes that.
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, isManualClick } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const admin = getSupabaseAdmin();
    const [{ data: session, error: sessErr }, { data: players, error: playersErr }] = await Promise.all([
      admin.from("trivia_sessions").select("*").eq("id", sessionId).maybeSingle(),
      admin.from("trivia_players").select("id").eq("session_id", sessionId),
    ]);
    if (sessErr) throw sessErr;
    if (playersErr) throw playersErr;
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status !== "in_progress") return NextResponse.json({ ok: true, skipped: "not in progress" });

    const elapsed = session.phase_started_at ? (Date.now() - new Date(session.phase_started_at).getTime()) / 1000 : Infinity;

    if (session.phase === "answering") {
      const { count: answeredCount } = await admin
        .from("trivia_answers")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId)
        .eq("question_index", session.current_question_index);

      const everyoneAnswered = (answeredCount ?? 0) >= (players?.length ?? 0) && (players?.length ?? 0) > 0;
      const timedOut = elapsed >= session.question_time_limit_seconds;

      if (!isManualClick && !everyoneAnswered && !timedOut) {
        return NextResponse.json({ ok: true, skipped: "still answering" });
      }

      const { error: updErr } = await admin
        .from("trivia_sessions")
        .update({ phase: "reveal", phase_started_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("phase", "answering");
      if (updErr) throw updErr;
      return NextResponse.json({ ok: true, newPhase: "reveal" });
    }

    // phase === 'reveal'
    if (!isManualClick && elapsed < REVEAL_PAUSE_SECONDS) {
      return NextResponse.json({ ok: true, skipped: "reveal still showing" });
    }

    const isLastQuestion = session.current_question_index >= (session.question_ids?.length ?? 0) - 1;

    if (isLastQuestion) {
      const { error: updErr } = await admin
        .from("trivia_sessions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("phase", "reveal");
      if (updErr) throw updErr;
      return NextResponse.json({ ok: true, completed: true });
    }

    const { error: updErr } = await admin
      .from("trivia_sessions")
      .update({
        current_question_index: session.current_question_index + 1,
        phase: "answering",
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("phase", "reveal");
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, newPhase: "answering", nextIndex: session.current_question_index + 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
