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
 * Sends the email. Whether this creates a new user or signs into an
 * existing one is entirely Supabase's own behavior for signInWithOtp —
 * nothing here branches on new-vs-existing, which is exactly the "one
 * entry point handles both" requirement.
 *
 * shouldCreateUser is explicit (Supabase defaults to true anyway) so this
 * reads clearly next to the intent described above.
 */
export async function sendLoginCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/**
 * Verifies the 6-digit code from that same email, right in the same tab
 * — no redirect, no new page, no hash fragment to parse. This is the
 * actual sign-in step; a successful call here establishes the session
 * immediately and synchronously, which is what makes this so much more
 * robust than the clickable-link flow: there's no gap in time or place
 * where an email scanner, a wrong browser, or a client-init timing race
 * can interfere, because nothing ever leaves this page.
 */
export async function verifyLoginCode(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "email",
  });
  if (error) throw error;

  // `users` rows are otherwise only ever created by ensureUser() in
  // lib/supabase.ts — but that only runs for ANONYMOUS sign-ins
  // (signInAnonymously), never for this real-account path. Without this,
  // a brand-new magic-link/OTP account authenticates successfully at the
  // Supabase auth level but has no matching row here, so getRealUser()'s
  // select() finds nothing and returns null — which silently looks like
  // "not signed in" everywhere else (LoginButton/SaveResult just close
  // quietly instead of erroring, since a missing profile and "nothing to
  // do" look identical from their point of view). device_id is required
  // NOT NULL on this table; reusing the auth id itself as device_id
  // mirrors exactly what ensureUser() does for anonymous rows.
  if (data.user) {
    await supabase.from("users").upsert(
      { id: data.user.id, device_id: data.user.id, email: data.user.email },
      { onConflict: "id" }
    );
  }

  return data;
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
