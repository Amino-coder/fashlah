"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SHOFAH_STR, ShofahLang } from "@/lib/shofah-i18n";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import NiqabGirl from "@/components/shofah/NiqabGirl";
import ShemaghGuy from "@/components/shofah/ShemaghGuy";
import RoundScreen from "@/components/shofah/RoundScreen";
import type { ShofahSessionRow, ShofahPlayerRow } from "@/lib/shofah-types";

const ROSE = "#E63946";
const WINE = "#C2185B";

export default function ShofahWaitingRoom() {
  const { code } = useParams<{ code: string }>();
  const { lang, dark, ready } = usePrefs();
  const t = SHOFAH_STR[lang as ShofahLang];

  const [session, setSession] = useState<ShofahSessionRow | null>(null);
  const [players, setPlayers] = useState<ShofahPlayerRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const isHost = !!(session && userId && session.host_user_id === userId);

  // Initial load
  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: sess, error: sessErr } = await supabase
        .from("shofah_sessions").select("*").eq("code", code.toString().toUpperCase()).single();
      if (sessErr || !sess) { setError(t.errorNotFound); return; }
      setSession(sess as ShofahSessionRow);

      const { data: pl } = await supabase
        .from("shofah_players").select("*").eq("session_id", sess.id).order("joined_at", { ascending: true });
      setPlayers((pl as ShofahPlayerRow[]) || []);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      setUserId(authSession?.user.id ?? null);
    })();
  }, [code]);

  // Realtime subscription for players + session status
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`shofah-session-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shofah_players", filter: `session_id=eq.${session.id}` },
        async () => {
          const { data: pl } = await supabase
            .from("shofah_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
          setPlayers((pl as ShofahPlayerRow[]) || []);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "shofah_sessions", filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as ShofahSessionRow))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  // Polling fallback (every 4s while waiting) — self-heals if a realtime
  // broadcast is ever missed, so the lobby doesn't get permanently stuck
  // waiting on a page refresh.
  useEffect(() => {
    if (!session?.id || session.status !== "waiting") return;
    const id = setInterval(async () => {
      const { data: pl } = await supabase
        .from("shofah_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
      if (pl) setPlayers(pl as ShofahPlayerRow[]);
      const { data: sess } = await supabase.from("shofah_sessions").select("*").eq("id", session.id).single();
      if (sess) setSession(sess as ShofahSessionRow);
    }, 4000);
    return () => clearInterval(id);
  }, [session?.id, session?.status]);

  // Same back-gesture trap used in Fashlah, so a stray back press doesn't
  // yank someone out of a live session.
  useEffect(() => {
    if (!session?.id) return;
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [session?.id]);

  if (!ready) return null;

  async function startGame() {
    if (!session) return;
    setStarting(true);
    setStartError(null);
    try {
      const { data: existingRounds } = await supabase
        .from("shofah_round_prompts").select("id").eq("session_id", session.id).limit(1);

      if (!existingRounds || existingRounds.length === 0) {
        const { data: allPrompts, error: promptsErr } = await supabase
          .from("shofah_prompts").select("id").eq("active", true);
        if (promptsErr) throw promptsErr;
        if (!allPrompts || allPrompts.length < 5) {
          throw new Error(
            `Only ${allPrompts?.length ?? 0} prompts found in shofah_prompts — need at least 5. Did shofah_seed.sql get run?`
          );
        }

        const shuffled = [...allPrompts].sort(() => Math.random() - 0.5).slice(0, 5);
        const rows = shuffled.map((p, i) => ({ session_id: session.id, round_number: i + 1, prompt_id: p.id }));
        const { error: rpErr } = await supabase.from("shofah_round_prompts").insert(rows);
        if (rpErr) throw rpErr;
      }

      const nowIso = new Date().toISOString();
      const { data: updated, error: updateErr } = await supabase
        .from("shofah_sessions")
        .update({ status: "in_progress", current_round: 1, round_phase: "answering", phase_started_at: nowIso, started_at: nowIso })
        .eq("id", session.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      // Don't wait on the realtime broadcast for the host's own action —
      // apply it locally right away as a fallback in case realtime isn't
      // configured for this table yet.
      if (updated) setSession(updated as ShofahSessionRow);
    } catch (e: any) {
      setStartError(e.message || "Something went wrong starting the game.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {(error || !session || session.status === "waiting") && <HomeButton label={t.backHome} href="/shofah" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {error && <p style={{ color: ROSE, fontWeight: 700, marginTop: 40 }}>{error}</p>}

        {session && session.status !== "waiting" && (
          <RoundScreen
            session={session}
            players={players}
            myPlayerId={players.find((p) => p.user_id === userId)?.id ?? null}
            isHost={isHost}
            lang={lang as ShofahLang}
          />
        )}

        {session && session.status === "waiting" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20, marginTop: 40 }}>
              {session.character === "girl" ? <NiqabGirl size={90} /> : <ShemaghGuy size={90} />}
            </div>

            <div className="card" style={{ padding: 18, marginBottom: 16, textAlign: "center" }}>
              <p className="font-body" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>{t.roomCode}</p>
              <p className="font-mono" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.2em" }}>{session.code}</p>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(session.code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    } catch {}
                  }}
                  className="btn-ghost font-body"
                  style={{ flex: 1, padding: "10px", fontSize: 13 }}
                >
                  {copied ? t.copied : `📋 ${t.copyCode}`}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    lang === "ar"
                      ? `💍 انضم لجلستي على شوفة!\n${typeof window !== "undefined" ? window.location.origin : ""}/shofah/join?code=${session.code}`
                      : `💍 Join my Shofah session!\n${typeof window !== "undefined" ? window.location.origin : ""}/shofah/join?code=${session.code}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body"
                  style={{
                    flex: 1, padding: "10px", fontSize: 13, borderRadius: 999, fontWeight: 700,
                    background: "#25D366", color: "white", textAlign: "center", textDecoration: "none",
                  }}
                >
                  💬 {t.whatsapp}
                </a>
              </div>
            </div>

            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Users size={18} />
                <span className="font-body" style={{ fontWeight: 700 }}>{players.length} {t.playersJoined}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {players.map((p) => (
                  <div key={p.id} className="pop" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 999, background: "var(--ring)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                      {p.avatar_emoji}
                    </div>
                    <span className="font-body" style={{ fontSize: 12, fontWeight: 700 }}>{p.nickname}</span>
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <>
                {startError && (
                  <p className="font-body" style={{ color: ROSE, fontWeight: 700, fontSize: 13, marginBottom: 10, textAlign: "center" }}>
                    {startError}
                  </p>
                )}
                <button
                  disabled={players.length < 2 || starting}
                  onClick={startGame}
                  className="font-display"
                  style={{
                    padding: 18, fontSize: 17, width: "100%", borderRadius: 999, border: "none", color: "#fff",
                    background: `linear-gradient(135deg, ${ROSE}, ${WINE})`,
                    opacity: players.length < 2 || starting ? 0.5 : 1,
                  }}
                >
                  {starting ? t.loading : t.startGame}
                </button>
              </>
            ) : (
              <div className="font-display" style={{ padding: 18, fontSize: 15, textAlign: "center", opacity: 0.7, border: "2px solid var(--ring)", borderRadius: 999 }}>
                {t.waitingHost}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
