import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TRIVIA_QUESTIONS } from "@/lib/trivia-questions";
import { computeTriviaPoints } from "@/lib/trivia-engine";

/**
 * Records one player's answer to the current question. Runs entirely
 * server-side and authoritatively — correctness and the speed bonus are
 * both computed here against the server's own clock, never trusted from
 * the client, since a client could otherwise self-report "I got it
 * right, instantly" regardless of what actually happened. Used for solo
 * too, so there's exactly one scoring implementation, not a duplicated
 * client-side copy for solo and a server copy for multiplayer that could
 * quietly drift apart.
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, playerId, selectedOptionId } = await req.json();
    if (!sessionId || !playerId || !selectedOptionId) {
      return NextResponse.json({ error: "sessionId, playerId, and selectedOptionId are required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: session, error: sessErr } = await admin
      .from("trivia_sessions")
      .select("question_ids, current_question_index, phase, phase_started_at, question_time_limit_seconds, status")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessErr) throw sessErr;
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status !== "in_progress" || session.phase !== "answering") {
      return NextResponse.json({ error: "Not accepting answers right now" }, { status: 409 });
    }

    const questionId = session.question_ids[session.current_question_index];
    const question = TRIVIA_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 500 });

    const isCorrect = selectedOptionId === question.correctAnswerId;
    const elapsedSeconds = (Date.now() - new Date(session.phase_started_at).getTime()) / 1000;
    const points = computeTriviaPoints(isCorrect, elapsedSeconds, session.question_time_limit_seconds);

    const { error: insErr } = await admin.from("trivia_answers").insert({
      session_id: sessionId,
      question_index: session.current_question_index,
      player_id: playerId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      points_awarded: points,
    });
    if (insErr) {
      // Unique constraint (session_id, question_index, player_id) means
      // this is almost certainly a duplicate submission — treat it as a
      // no-op rather than a hard failure, since a network retry
      // shouldn't be able to double-score a player.
      if (insErr.code === "23505") return NextResponse.json({ ok: true, alreadyAnswered: true });
      throw insErr;
    }

    if (points > 0) {
      const { data: player } = await admin.from("trivia_players").select("score").eq("id", playerId).maybeSingle();
      await admin.from("trivia_players").update({ score: (player?.score ?? 0) + points }).eq("id", playerId);
    }

    // Any client (including this one) picks this up via the answering→
    // reveal transition check once everyone's in — see
    // trivia-advance-phase, not duplicated here.
    return NextResponse.json({ ok: true, isCorrect, pointsAwarded: points });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
