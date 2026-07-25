import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Runs once per round, server-side, when a player's client detects voting
// has finished (timer hit 0 or everyone voted). Uses the service-role key
// because it needs to update OTHER players' total_score — something the
// public RLS policies deliberately don't allow from the browser.
//
// Idempotent: relies on the unique (session_id, round_number) constraint on
// shofah_round_results. If a result already exists (e.g. two clients both
// detected "voting done" and both called this), the second call just
// returns the existing result instead of re-scoring.

type AnswerRow = { id: string; player_id: string; text: string };
type VoteRow = { answer_id: string };
type RankedEntry = { answerId: string; playerId: string; text: string; votes: number; points: number };

const POINTS_BY_RANK = [5, 3, 2]; // 4th place and beyond all get 1

export async function POST(req: NextRequest) {
  try {
    const { sessionId, roundNumber } = await req.json();
    if (!sessionId || !roundNumber) {
      return NextResponse.json({ error: "sessionId and roundNumber are required" }, { status: 400 });
    }

    // Idempotency check
    const { data: existing } = await supabaseAdmin
      .from("shofah_round_results")
      .select("*, shofah_answers(text)")
      .eq("session_id", sessionId)
      .eq("round_number", roundNumber)
      .maybeSingle();

    if (existing) {
      // Make sure the session reflects the reveal phase even if an earlier
      // attempt's session-update step got interrupted.
      await supabaseAdmin
        .from("shofah_sessions")
        .update({ round_phase: "reveal", phase_started_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("round_phase", "voting"); // no-op if it's already past voting
      return NextResponse.json({
        alreadyComputed: true,
        winnerPlayerId: existing.winner_player_id,
        winnerAnswerText: (existing as any).shofah_answers?.text ?? "",
      });
    }

    const { data: answers } = await supabaseAdmin
      .from("shofah_answers").select("id, player_id, text")
      .eq("session_id", sessionId).eq("round_number", roundNumber);
    const { data: votes } = await supabaseAdmin
      .from("shofah_votes").select("answer_id")
      .eq("session_id", sessionId).eq("round_number", roundNumber);

    const answerRows = (answers as AnswerRow[]) || [];
    const voteRows = (votes as VoteRow[]) || [];

    if (answerRows.length === 0) {
      return NextResponse.json({ error: "No answers found for this round" }, { status: 400 });
    }

    const tally = new Map<string, number>();
    for (const v of voteRows) tally.set(v.answer_id, (tally.get(v.answer_id) || 0) + 1);

    const ranked: RankedEntry[] = answerRows
      .map((a) => ({ answerId: a.id, playerId: a.player_id, text: a.text, votes: tally.get(a.id) || 0, points: 0 }))
      .sort((a, b) => b.votes - a.votes)
      .map((entry, i) => ({ ...entry, points: POINTS_BY_RANK[i] ?? 1 }));

    // Apply score increments
    for (const entry of ranked) {
      const { data: player } = await supabaseAdmin
        .from("shofah_players").select("total_score").eq("id", entry.playerId).single();
      const current = player?.total_score ?? 0;
      await supabaseAdmin
        .from("shofah_players").update({ total_score: current + entry.points }).eq("id", entry.playerId);
    }

    const winner = ranked[0];
    const { error: insertErr } = await supabaseAdmin.from("shofah_round_results").insert({
      session_id: sessionId, round_number: roundNumber,
      winner_answer_id: winner.answerId, winner_player_id: winner.playerId,
    });
    // A duplicate-key error here just means another request beat us to it —
    // that's fine, not a real failure.
    if (insertErr && insertErr.code !== "23505") {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("shofah_sessions")
      .update({ round_phase: "reveal", phase_started_at: new Date().toISOString() })
      .eq("id", sessionId);

    return NextResponse.json({
      alreadyComputed: false,
      winnerPlayerId: winner.playerId,
      winnerAnswerText: winner.text,
      ranked,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
