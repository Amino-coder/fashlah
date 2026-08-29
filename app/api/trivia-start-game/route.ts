import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { selectTriviaQuestions } from "@/lib/trivia-engine";

/**
 * Selects and locks in the randomized question set for a session — run
 * once, server-side, so every player in a multiplayer room sees the
 * identical set (a client-side selection would mean each player
 * independently randomizing, which breaks multiplayer sync entirely).
 * Used for solo too, for one canonical selection path rather than
 * duplicating the logic client-side.
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: session, error: sessErr } = await admin
      .from("trivia_sessions")
      .select("question_count, difficulty, categories")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr) throw sessErr;
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const questions = selectTriviaQuestions(session.question_count, session.difficulty as any, session.categories || []);
    const questionIds = questions.map((q) => q.id);

    const { error: updErr } = await admin
      .from("trivia_sessions")
      .update({
        question_ids: questionIds,
        current_question_index: 0,
        phase: "answering",
        phase_started_at: new Date().toISOString(),
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, questionCount: questionIds.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
