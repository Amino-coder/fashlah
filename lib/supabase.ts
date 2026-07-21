import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in dev if .env.local wasn't set up — better than a silent
  // "fetch failed" deep inside the Session Engine later.
  console.warn(
    "Supabase env vars are missing. Copy .env.example to .env.local and fill in your project URL/anon key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensures the visitor has a Supabase anonymous auth session AND a matching
 * row in public.users (id = auth.uid()). Call this once, high up in the
 * app, before any session/player writes. Safe to call repeatedly.
 */
export async function ensureUser(preferredLang: "ar" | "en" = "ar") {
  let { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }

  const userId = session?.user.id;
  if (!userId) throw new Error("No authenticated user after anonymous sign-in.");

  // Upsert the matching public.users row. device_id doubles as the auth
  // user id here — swap in a separate device fingerprint later if you want
  // to let one browser hold multiple named profiles.
  const { error: upsertError } = await supabase
    .from("users")
    .upsert(
      { id: userId, device_id: userId, preferred_lang: preferredLang },
      { onConflict: "id" }
    );
  if (upsertError) throw upsertError;

  return userId;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
