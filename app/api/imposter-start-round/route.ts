import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Service-role only — imposter_start_round() picks the imposter and word
// (see imposter_schema.sql), neither of which the client should ever be
// trusted to compute itself, since the client belonging to the imposter
// is exactly the one party who must never see how that pick was made.
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const { data, error } = await getSupabaseAdmin().rpc("imposter_start_round", { p_session_id: sessionId });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
