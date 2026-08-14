import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword } from "@/lib/adminPassword";

/**
 * Creates the FIRST admin account, then permanently refuses to run again
 * once admin_users has any row at all — so there's no ongoing "create
 * admin" endpoint sitting around as an attack surface after initial
 * setup. This exists so setting up the admin panel doesn't require
 * manually generating a password hash and hand-writing a SQL insert —
 * just visit /admin/setup once.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Email and a password (8+ characters) are required." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { count, error: countErr } = await supabaseAdmin
      .from("admin_users")
      .select("id", { count: "exact", head: true });
    if (countErr) throw countErr;

    if (count && count > 0) {
      return NextResponse.json({ error: "An admin account already exists. Use /admin/login instead." }, { status: 403 });
    }

    const { error: insertErr } = await supabaseAdmin.from("admin_users").insert({
      email: email.trim().toLowerCase(),
      password_hash: hashPassword(password),
      role: "owner",
    });
    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
