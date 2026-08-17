import { supabase } from "@/lib/supabase";
import { getRealUser } from "@/lib/auth";

/**
 * Every function here is a no-op-safe wrapper around a single small
 * table (see supabase/favorites_schema.sql) — nothing here needs to be
 * clever, the actual guarantees (no duplicates, no cross-account leaks)
 * live in the table's own unique constraint and RLS policy, not in this
 * file. This just needs to fail predictably when nobody's signed in,
 * which every caller already checks for via getRealUser() before ever
 * reaching here (same pattern as SaveResult/game_access).
 */

export async function getFavoriteGames(): Promise<Set<string>> {
  const user = await getRealUser();
  if (!user) return new Set();
  const { data, error } = await supabase.from("favorites").select("game").eq("user_id", user.id);
  if (error) return new Set(); // fails open to "no favorites shown" rather than breaking the whole page
  return new Set((data || []).map((r) => r.game as string));
}

export async function addFavorite(game: string): Promise<void> {
  const user = await getRealUser();
  if (!user) throw new Error("Not signed in.");
  const { error } = await supabase.from("favorites").insert({ user_id: user.id, game });
  // 23505 = unique_violation — already favorited (e.g. a double-tap that
  // both fired before either resolved). Not a real error from the
  // caller's point of view: the end state (favorited) is exactly what
  // was asked for either way, so this is treated as success, not failure.
  if (error && error.code !== "23505") throw error;
}

export async function removeFavorite(game: string): Promise<void> {
  const user = await getRealUser();
  if (!user) throw new Error("Not signed in.");
  const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("game", game);
  if (error) throw error;
}
