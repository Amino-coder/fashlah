import { supabase } from "@/lib/supabase";

/**
 * Fire-and-forget access logging for pages that otherwise write nothing
 * to Supabase at all (solo/demo modes, by design — see each page's own
 * comments on why). Deliberately does not await, does not surface
 * errors, and does not block rendering in any way — tracking failing
 * silently is always the right outcome here; it must never be the thing
 * that breaks a page whose whole point was to be simple and isolated.
 *
 * `sessionKey` is a random id generated once per page load and passed to
 * both the initial view and (if the player finishes) the completion
 * event, so SQL can tell "opened it and left" apart from "opened it and
 * actually finished" for the exact same playthrough — see
 * page_views_migration_001_completion.sql.
 */
export function trackPageView(page: string, sessionKey?: string) {
  try {
    supabase.from("page_views").insert({ page, event: "view", session_key: sessionKey ?? null }).then(
      () => {},
      () => {}
    );
  } catch {
    // Never let tracking be the reason a page fails.
  }
}

export function trackPageComplete(page: string, sessionKey?: string) {
  try {
    supabase.from("page_views").insert({ page, event: "complete", session_key: sessionKey ?? null }).then(
      () => {},
      () => {}
    );
  } catch {
    // Never let tracking be the reason a page fails.
  }
}

/** One random id per page load, to correlate a view with its (maybe
 *  never-fired) completion event. Not persisted anywhere beyond the
 *  two page_views rows it tags. */
export function newSessionKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
