import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

/**
 * Gates every /admin page except /admin/login and /admin/setup (setup
 * only actually works once anyway — see app/api/admin/bootstrap —  but
 * it still needs to be reachable without a session to get there in the
 * first place). The admin API routes ALSO re-check the session
 * themselves (see app/api/admin/*), so this isn't the only layer — it's
 * what makes an unauthenticated visit to /admin bounce to /admin/login
 * before the page's own JS ever loads, rather than flashing content
 * first.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login" || pathname === "/admin/setup") {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSession(token);

  if (!session) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
