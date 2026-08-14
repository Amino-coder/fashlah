import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

/**
 * Manual Plus grant — sets plus_expires_at directly, no payment
 * involved. Exists for two reasons: testing the access gate end-to-end
 * before a real payment flow is wired up, and comping specific accounts
 * (friends, testers) whenever needed. Once payments exist, the checkout
 * webhook will set this same column the same way — this route doesn't
 * become obsolete, it just becomes one of two ways plus_expires_at gets
 * written instead of the only one.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (session.role === "viewer") {
    return NextResponse.json({ error: "Your admin role doesn't allow making changes." }, { status: 403 });
  }

  try {
    const { email, days, plan } = await req.json();
    if (!email || !days || typeof days !== "number" || days <= 0) {
      return NextResponse.json({ error: "email and a positive number of days are required." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: user, error: findErr } = await supabaseAdmin
      .from("users")
      .select("id, plus_expires_at")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (findErr) throw findErr;
    if (!user) {
      return NextResponse.json({ error: "No account with that email — they need to sign up first." }, { status: 404 });
    }

    // Extends from whichever is later: now, or their existing expiry if
    // it's still in the future — so granting more days to someone who
    // already has active Plus adds on top instead of cutting them short.
    const base = user.plus_expires_at && new Date(user.plus_expires_at) > new Date()
      ? new Date(user.plus_expires_at)
      : new Date();
    const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    const { error: updateErr } = await supabaseAdmin
      .from("users")
      .update({ plus_expires_at: newExpiry.toISOString(), plus_plan: plan || null })
      .eq("id", user.id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, plusExpiresAt: newExpiry.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
