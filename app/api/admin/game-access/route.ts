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
    .select("game, requires_plus, hidden, display_order, updated_at")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("game", { ascending: true });
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
    // A batch of {game, requiresPlus?, hidden?, displayOrder?} — every
    // field optional, so one shape covers a single Plus/hide toggle
    // (a 1-item batch) AND a reorder swap (a 2-item batch, since
    // swapping two games' positions needs both rows updated together).
    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates (non-empty array) is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    for (const u of updates) {
      if (!u.game) return NextResponse.json({ error: "Each update needs a game." }, { status: 400 });
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof u.requiresPlus === "boolean") patch.requires_plus = u.requiresPlus;
      if (typeof u.hidden === "boolean") patch.hidden = u.hidden;
      if (typeof u.displayOrder === "number") patch.display_order = u.displayOrder;

      const { error } = await admin.from("game_access").update(patch).eq("game", u.game);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
