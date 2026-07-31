"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { unlockAudio } from "@/lib/sound-engine";
import { QISSA_STR, QissaLang } from "@/lib/qissa-i18n";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import RoundScreen from "@/components/qissa/RoundScreen";
import { HelpButton } from "@/components/HowToPlay";
import ShareInvite from "@/components/ShareInvite";
import type { QissaSessionRow, QissaPlayerRow } from "@/lib/qissa-types";

const ORANGE = "#FF8A3D";
const DEEP = "#6B2A1E";
const MIN_PLAYERS = 2;

export default function QissaWaitingRoom() {
  const { code } = useParams<{ code: string }>();
  const { lang, dark, ready } = usePrefs();
  const t = QISSA_STR[lang as QissaLang];

  const [session, setSession] = useState<QissaSessionRow | null>(null);
  const [players, setPlayers] = useState<QissaPlayerRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const isHost = !!(session && userId && session.host_user_id === userId);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: sess, error: sessErr } = await supabase
        .from("qissa_sessions").select("*").eq("code", code.toString().toUpperCase()).single();
      if (sessErr || !sess) { setError(t.errorNotFound); return; }
      setSession(sess as QissaSessionRow);

      const { data: pl } = await supabase
        .from("qissa_players").select("*").eq("session_id", sess.id).order("joined_at", { ascending: true });
      setPlayers((pl as QissaPlayerRow[]) || []);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      setUserId(authSession?.user.id ?? null);
    })();
  }, [code]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`qissa-session-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "qissa_players", filter: `session_id=eq.${session.id}` },
        async () => {
          const { data: pl } = await supabase
            .from("qissa_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
          setPlayers((pl as QissaPlayerRow[]) || []);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "qissa_sessions", filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as QissaSessionRow))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  useEffect(() => {
    if (!session?.id) return;
    const id = setInterval(async () => {
      const { data: pl } = await supabase
        .from("qissa_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
      if (pl) setPlayers(pl as QissaPlayerRow[]);
      const { data: sess } = await supabase.from("qissa_sessions").select("*").eq("id", session.id).single();
      if (sess) setSession(sess as QissaSessionRow);
    }, 1200);
    return () => clearInterval(id);
  }, [session?.id]);

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
    if (players.length < MIN_PLAYERS) { setStartError(t.errorNeedTwoPlayers); return; }
    unlockAudio();
    setStarting(true);
    setStartError(null);
    try {
      // turn_order is assigned once, here, by join order — this is what
      // the whole circular passing mechanic (lib/qissa-story.ts) is built
      // on, so it has to be settled before the first round opens.
      const ordered = [...players].sort(
        (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      );
      await Promise.all(
        ordered.map((p, i) => supabase.from("qissa_players").update({ turn_order: i }).eq("id", p.id))
      );

      const { error: updateErr } = await supabase
        .from("qissa_sessions")
        .update({ status: "in_progress", current_round: 0, round_phase: "countdown", phase_started_at: new Date().toISOString(), started_at: new Date().toISOString() })
        .eq("id", session.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      setSession({ ...session, status: "in_progress", current_round: 0, round_phase: "countdown" });
    } catch (e: any) {
      setStartError(e.message || "Something went wrong starting the game.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {(error || !session || session.status === "waiting") && <HomeButton label={t.backHome} href="/qissa" />}
      {session && session.status === "completed" && <HomeButton label={t.backHome} />}
      {session && session.status === "waiting" && (
        <div style={{ position: "absolute", top: 24, insetInlineEnd: 24, zIndex: 2 }}>
          <HelpButton game="qissa" lang={lang} autoOpenFirstVisit={false} />
        </div>
      )}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {error && <p style={{ color: "#E63946", fontWeight: 700, marginTop: 40 }}>{error}</p>}

        {session && session.status !== "waiting" && (
          <RoundScreen
            session={session}
            players={players}
            myPlayerId={players.find((p) => p.user_id === userId)?.id ?? null}
            isHost={isHost}
            lang={lang as QissaLang}
          />
        )}

        {session && session.status === "waiting" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20, marginTop: 40 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 90, height: 90, borderRadius: 999, margin: "0 auto",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`,
                  boxShadow: `0 10px 26px ${DEEP}55`,
                }}
              >
                <BookOpen size={36} color="#fff" />
              </div>
            </div>

            <ShareInvite
              code={session.code}
              joinPath="/qissa/join"
              lang={lang}
              accent={`linear-gradient(135deg, ${ORANGE}, ${DEEP})`}
              label={t.roomCode}
              emoji={"\u{1F4D6}\u{1F602}"} // 📖😂
            />

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
                  <p className="font-body" style={{ color: "#E63946", fontWeight: 700, fontSize: 13, marginBottom: 10, textAlign: "center" }}>
                    {startError}
                  </p>
                )}
                <button
                  disabled={players.length < MIN_PLAYERS || starting}
                  onClick={startGame}
                  className="font-display"
                  style={{
                    padding: 18, fontSize: 17, width: "100%", borderRadius: 999, border: "none", color: "#fff",
                    background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`,
                    opacity: players.length < MIN_PLAYERS || starting ? 0.5 : 1,
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
