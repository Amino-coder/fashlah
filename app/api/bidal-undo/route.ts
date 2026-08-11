import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, hostUserId } = await req.json();
    if (!sessionId || !hostUserId) {
      return NextResponse.json({ success: false, reason: "missing_params" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("bidal_undo_last_move", {
      p_session_id: sessionId,
      p_host_user_id: hostUserId,
    });

    if (error) return NextResponse.json({ success: false, reason: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ success: false, reason: e.message || "unknown_error" }, { status: 500 });
  }
}
