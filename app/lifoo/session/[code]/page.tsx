"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, Music } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { unlockAudio } from "@/lib/sound-engine";
import { LIFOO_STR, LifooLang } from "@/lib/lifoo-i18n";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import OpeningSelect from "@/components/lifoo/OpeningSelect";
import RoundScreen from "@/components/lifoo/RoundScreen";
import { HelpButton } from "@/components/HowToPlay";
import ShareInvite from "@/components/ShareInvite";
import type { LifooSessionRow, LifooPlayerRow } from "@/lib/lifoo-types";

const CORAL = "#FF5A5F";
const NAVY = "#1B1030";

export default function LifooWaitingRoom() {
  const { code } = useParams<{ code: string }>();
  const { lang, dark, ready } = usePrefs();
  const t = LIFOO_STR[lang as LifooLang];

  const [session, setSession] = useState<LifooSessionRow | null>(null);
  const [players, setPlayers] = useState<LifooPlayerRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const isHost = !!(session && userId && session.host_user_id === userId);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: sess, error: sessErr } = await supabase
        .from("lifoo_sessions").select("*").eq("code", code.toString().toUpperCase()).single();
      if (sessErr || !sess) { setError(t.errorNotFound); return; }
      setSession(sess as LifooSessionRow);

      const { data: pl } = await supabase
        .from("lifoo_players").select("*").eq("session_id", sess.id).order("joined_at", { ascending: true });
      setPlayers((pl as LifooPlayerRow[]) || []);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      setUserId(authSession?.user.id ?? null);
    })();
  }, [code]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`lifoo-session-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lifoo_players", filter: `session_id=eq.${session.id}` },
        async () => {
          const { data: pl } = await supabase
            .from("lifoo_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
          setPlayers((pl as LifooPlayerRow[]) || []);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lifoo_sessions", filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as LifooSessionRow))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  useEffect(() => {
    if (!session?.id) return;
    const id = setInterval(async () => {
      const { data: pl } = await supabase
        .from("lifoo_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
      if (pl) setPlayers(pl as LifooPlayerRow[]);
      const { data: sess } = await supabase.from("lifoo_sessions").select("*").eq("id", session.id).single();
      if (sess) setSession(sess as LifooSessionRow);
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
    unlockAudio();
    setStarting(true);
    setStartError(null);
    try {
      const { error: updateErr } = await supabase
        .from("lifoo_sessions")
        .update({ status: "in_progress", current_round: 0, round_phase: "opening_select", started_at: new Date().toISOString() })
        .eq("id", session.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      setSession({ ...session, status: "in_progress", current_round: 0, round_phase: "opening_select" });
    } catch (e: any) {
      setStartError(e.message || "Something went wrong starting the game.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {(error || !session || session.status === "waiting") && <HomeButton label={t.backHome} href="/lifoo" />}
      {session && session.status === "waiting" && (
        <div style={{ position: "absolute", top: 24, insetInlineEnd: 24, zIndex: 2 }}>
          <HelpButton game="lifoo" lang={lang} autoOpenFirstVisit={false} />
        </div>
      )}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {error && <p style={{ color: "#E63946", fontWeight: 700, marginTop: 40 }}>{error}</p>}

        {session && session.status !== "waiting" && (
          session.round_phase === "opening_select" ? (
            <OpeningSelect
              session={session}
              isHost={isHost}
              myPlayerId={players.find((p) => p.user_id === userId)?.id ?? null}
              lang={lang as LifooLang}
            />
          ) : (
            <RoundScreen
              session={session}
              players={players}
              myPlayerId={players.find((p) => p.user_id === userId)?.id ?? null}
              isHost={isHost}
              lang={lang as LifooLang}
            />
          )
        )}

        {session && session.status === "waiting" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20, marginTop: 40 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 90, height: 90, borderRadius: 999, margin: "0 auto",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${NAVY}, #0A0616)`,
                  boxShadow: `0 10px 26px ${NAVY}55`,
                }}
              >
                <Music size={36} color={CORAL} />
              </div>
            </div>

            <ShareInvite
              code={session.code}
              joinPath="/lifoo/join"
              lang={lang}
              accent={`linear-gradient(135deg, ${CORAL}, ${NAVY})`}
              label={t.roomCode}
              emoji={"\u{1F3B6}"}
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
                  disabled={players.length < 1 || starting}
                  onClick={startGame}
                  className="font-display"
                  style={{
                    padding: 18, fontSize: 17, width: "100%", borderRadius: 999, border: "none", color: "#fff",
                    background: `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
                    opacity: players.length < 1 || starting ? 0.5 : 1,
                  }}
                >
                  {starting ? t.loading : t.startGame}
                </button>

                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Link
                    href="/lifoo/solo"
                    className="font-body"
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "underline" }}
                  >
                    {lang === "ar" ? "ودك تلعب لحالك بدل؟" : "Rather play solo?"}
                  </Link>
                </div>
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
