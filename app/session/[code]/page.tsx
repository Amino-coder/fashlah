"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { STR } from "@/lib/i18n";
import { usePrefs } from "@/lib/usePrefs";
import Mascot from "@/components/Mascot";
import Blobs from "@/components/Blobs";
import Round1 from "@/components/rounds/Round1";
import Round2 from "@/components/rounds/Round2";
import Round3 from "@/components/rounds/Round3";
import WaitingForResults from "@/components/results/WaitingForResults";
import type { PlayerRow, SessionRow } from "@/lib/types";

export default function WaitingRoom() {
  const { code } = useParams<{ code: string }>();
  const { lang, dark, ready } = usePrefs();
  const t = STR[lang];

  const [session, setSession] = useState<SessionRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const myPlayer = players.find((p) => p.user_id === userId) || null;
  const isHost = !!(session && userId && session.host_user_id === userId);

  const loadingMsgs = lang === "ar"
    ? ["أكيد فيه واحد للحين يقرأ الرسالة 👀", "وين أكثر واحد يتأخر؟ 😂", "واضح إن واحد للحين نايم 😴"]
    : ["Someone is definitely still reading the invite 👀", "Who's going to be last to join? 😂", "One of you is clearly still asleep 😴"];

  // Initial load
  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: sess, error: sessErr } = await supabase
        .from("sessions").select("*").eq("code", code.toString().toUpperCase()).single();
      if (sessErr || !sess) { setError(t.errorNotFound); return; }
      setSession(sess as SessionRow);

      const { data: pl } = await supabase
        .from("players").select("*").eq("session_id", sess.id).order("joined_at", { ascending: true });
      setPlayers((pl as PlayerRow[]) || []);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      setUserId(authSession?.user.id ?? null);
    })();
  }, [code]);

  // Realtime subscription for players + session status
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`session-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `session_id=eq.${session.id}` },
        async () => {
          const { data: pl } = await supabase
            .from("players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
          setPlayers((pl as PlayerRow[]) || []);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as SessionRow))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  useEffect(() => {
    const iv = setInterval(() => setMsgIdx((i) => (i + 1) % loadingMsgs.length), 2400);
    return () => clearInterval(iv);
  }, [lang]);

  if (!ready) return null;

  async function startGame() {
    if (!session) return;
    await supabase.from("sessions")
      .update({ status: "in_progress", current_round: 1, started_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {error && <p style={{ color: "#FF2E93", fontWeight: 700 }}>{error}</p>}

        {session && session.status !== "waiting" && myPlayer && (
          <>
            {myPlayer.current_round === 1 && (
              <Round1
                session={session}
                player={myPlayer}
                lang={lang}
                onAdvance={() =>
                  setPlayers((prev) =>
                    prev.map((p) => (p.id === myPlayer.id ? { ...p, current_round: 2 } : p))
                  )
                }
              />
            )}
            {myPlayer.current_round === 2 && (
              <Round2
                session={session}
                player={myPlayer}
                players={players}
                lang={lang}
                onAdvance={() =>
                  setPlayers((prev) =>
                    prev.map((p) => (p.id === myPlayer.id ? { ...p, current_round: 3 } : p))
                  )
                }
              />
            )}
            {myPlayer.current_round === 3 && (
              <Round3
                session={session}
                player={myPlayer}
                lang={lang}
                onAdvance={() =>
                  setPlayers((prev) =>
                    prev.map((p) => (p.id === myPlayer.id ? { ...p, current_round: 4 } : p))
                  )
                }
              />
            )}
            {myPlayer.current_round >= 4 && (
              <WaitingForResults session={session} player={myPlayer} players={players} lang={lang} />
            )}
          </>
        )}

        {session && session.status === "waiting" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Mascot mood="wink" size={70} className="bounce" />
              <p className="font-body" style={{ marginTop: 10, color: "var(--ink-soft)", fontWeight: 600 }}>
                {loadingMsgs[msgIdx]}
              </p>
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
                  {copied ? (lang === "ar" ? "✅ انتسخ!" : "✅ Copied!") : `📋 ${lang === "ar" ? "نسخ الكود" : "Copy code"}`}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    lang === "ar"
                      ? `🌿 انضم لجلستي على بقدونس! الكود: ${session.code}\n${typeof window !== "undefined" ? window.location.origin : ""}/join`
                      : `🌿 Join my Bagdoonis session! Code: ${session.code}\n${typeof window !== "undefined" ? window.location.origin : ""}/join`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body"
                  style={{
                    flex: 1, padding: "10px", fontSize: 13, borderRadius: 999, fontWeight: 700,
                    background: "#25D366", color: "white", textAlign: "center", textDecoration: "none",
                  }}
                >
                  💬 {lang === "ar" ? "واتساب" : "WhatsApp"}
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
              <button disabled={players.length < 2} onClick={startGame} className="btn-primary font-display" style={{ padding: 18, fontSize: 17, width: "100%" }}>
                {t.startGame}
              </button>
            ) : (
              <div className="btn-ghost font-display" style={{ padding: 18, fontSize: 15, textAlign: "center", opacity: 0.7 }}>
                {t.waitingHost}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
