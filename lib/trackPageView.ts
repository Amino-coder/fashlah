import { supabase } from "@/lib/supabase";

/**
 * Fire-and-forget access logging for pages that otherwise write nothing
 * to Supabase at all (solo/demo modes, by design — see each page's own
 * comments on why). Deliberately does not await, does not surface
 * errors, and does not block rendering in any way — tracking failing
 * silently is always the right outcome here; it must never be the thing
 * that breaks a page whose whole point was to be simple and isolated.
 */
export function trackPageView(page: string) {
  try {
    supabase.from("page_views").insert({ page }).then(
      () => {},
      () => {}
    );
  } catch {
    // Never let tracking be the reason a page fails.
  }
}
