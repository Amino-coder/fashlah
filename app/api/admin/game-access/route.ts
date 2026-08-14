import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

/**
 * Re-verifies the admin session independently of middleware.ts. Belt and
 * suspenders: middleware protects the /admin *pages*, but this route
 * could in principle be hit directly, so it checks for itself rather
 * than trusting that a request only ever arrives via the page.
 */
async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSession(token);
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from("game_access")
    .select("game, requires_plus, updated_at")
    .order("game");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ games: data });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  // 'viewer' role can look but not touch — same admin_users.role column
  // schema.sql already defined, just enforced here for the first time.
  if (session.role === "viewer") {
    return NextResponse.json({ error: "Your admin role doesn't allow making changes." }, { status: 403 });
  }

  try {
    const { game, requiresPlus } = await req.json();
    if (!game || typeof requiresPlus !== "boolean") {
      return NextResponse.json({ error: "game and requiresPlus (boolean) are required." }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from("game_access")
      .update({ requires_plus: requiresPlus, updated_at: new Date().toISOString() })
      .eq("game", game);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
