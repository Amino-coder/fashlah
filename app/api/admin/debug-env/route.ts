import { NextResponse } from "next/server";

/**
 * TEMPORARY debugging aid — confirms whether the server can see specific
 * env vars at all, without ever revealing their actual values. Delete
 * this route once ADMIN_SESSION_SECRET is confirmed working; it has no
 * ongoing purpose and no reason to stay in a production deployment.
 */
export async function GET() {
  return NextResponse.json({
    adminSessionSecretSet: !!process.env.ADMIN_SESSION_SECRET,
    adminSessionSecretLength: process.env.ADMIN_SESSION_SECRET?.length ?? 0,
    supabaseServiceRoleKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
