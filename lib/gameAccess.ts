import { supabase } from "@/lib/supabase";

export type GameAccessResult = { allowed: boolean; requiresPlus: boolean };

/**
 * The actual enforcement of an /admin toggle. Two lookups:
 *   1. Does this game currently require Plus at all? (game_access,
 *      public-readable — see supabase/plus_access_schema.sql)
 *   2. If so, is the SIGNED-IN REAL account's plus_expires_at still in
 *      the future? Anonymous play sessions can never pass this — Plus is
 *      only ever attached to a real account (see getRealUser() in
 *      lib/auth.ts for the same is_anonymous distinction used
 *      throughout the account system), since entitlements need to
 *      follow a person across devices, not a random per-browser session.
 */
export async function checkGameAccess(game: string): Promise<GameAccessResult> {
  const { data: access } = await supabase
    .from("game_access")
    .select("requires_plus")
    .eq("game", game)
    .maybeSingle();

  const requiresPlus = access?.requires_plus ?? false;
  if (!requiresPlus) return { allowed: true, requiresPlus: false };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.is_anonymous) return { allowed: false, requiresPlus: true };

  const { data: profile } = await supabase
    .from("users")
    .select("plus_expires_at")
    .eq("id", session.user.id)
    .maybeSingle();

  const allowed = !!profile?.plus_expires_at && new Date(profile.plus_expires_at) > new Date();
  return { allowed, requiresPlus: true };
}
