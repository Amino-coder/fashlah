import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, requesterUserId, isSolo } = await req.json();
    if (!sessionId || !requesterUserId) {
      return NextResponse.json({ success: false, reason: "missing_params" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("bidal_shuffle_word", {
      p_session_id: sessionId,
      p_requester_user_id: requesterUserId,
      p_is_solo: !!isSolo,
    });

    if (error) return NextResponse.json({ success: false, reason: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ success: false, reason: e.message || "unknown_error" }, { status: 500 });
  }
}
