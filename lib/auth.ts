import { supabase } from "@/lib/supabase";

/**
 * A "real" account is any Supabase auth user that is NOT anonymous —
 * i.e. one created/signed-into via magic link. `is_anonymous` is a real
 * field on the supabase-js User object (not something we're inferring).
 */
export async function getRealUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.is_anonymous) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, display_name, phone")
    .eq("id", session.user.id)
    .maybeSingle();

  return profile;
}

/** A first-time account is one with no name/phone yet — the exact two
 *  fields collected during "خل تجربتك في بقدونس أحلى". */
export function needsProfileSetup(profile: { display_name: string | null; phone: string | null } | null): boolean {
  if (!profile) return false;
  return !profile.display_name || !profile.phone;
}

/**
 * Sends the magic link. Whether this creates a new user or signs into an
 * existing one is entirely Supabase's own behavior for signInWithOtp —
 * nothing here branches on new-vs-existing, which is exactly the "one
 * entry point handles both" requirement.
 */
export async function sendMagicLink(email: string) {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

export async function completeProfileSetup(name: string, phone: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("users")
    .update({ display_name: name.trim(), phone: phone.trim() })
    .eq("id", session.user.id);
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
  // Falls back to a fresh anonymous session on next ensureUser() call —
  // signing out of a real account should never leave someone unable to
  // keep playing.
}

// ----------------------------------------------------------------------------
// PENDING RESULT — a result someone tried to save while still anonymous.
// Magic link means leaving the tab (or app) to check email, so React
// state can't carry this across that gap — it has to survive in
// localStorage until /auth/callback runs after they click the link.
// ----------------------------------------------------------------------------
const PENDING_KEY = "bagdoonis_pending_result";

export type PendingResult = {
  game: string;
  resultSummary: string;
  resultDetail?: Record<string, unknown>;
  sessionCode?: string;
};

export function stashPendingResult(result: PendingResult) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(result));
  } catch {
    // Private browsing / storage disabled — the save just won't survive
    // the redirect. Not fatal; the person can try again after login.
  }
}

export function readPendingResult(): PendingResult | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingResult() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch { /* nothing to clean up if storage isn't available */ }
}

/** The actual "احفظ نتيجتك" write — used both for the direct (already
 *  logged in) path and for finishing a pending save after /auth/callback. */
export async function saveResult(result: PendingResult) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.is_anonymous) throw new Error("Not signed in.");
  const { error } = await supabase.from("saved_results").insert({
    user_id: session.user.id,
    game: result.game,
    result_summary: result.resultSummary,
    result_detail: result.resultDetail ?? null,
    session_code: result.sessionCode ?? null,
  });
  if (error) throw error;
}
