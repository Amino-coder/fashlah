import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPassword } from "@/lib/adminPassword";
import { signAdminSession, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: admin } = await supabaseAdmin
      .from("admin_users")
      .select("id, password_hash, role")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    // Same generic message whether the email doesn't exist or the
    // password is wrong — not telling an attacker which one it got right.
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const token = await signAdminSession(admin.id, admin.role);
    const res = NextResponse.json({ success: true, role: admin.role });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days, matches signAdminSession's own expiry
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
