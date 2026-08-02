"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { JOB_STR, JobLang } from "@/lib/job-i18n";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import SuitGuy from "@/components/job/SuitGuy";
import RoundScreen from "@/components/job/RoundScreen";
import PrewarmRound from "@/components/job/PrewarmRound";
import { HelpButton } from "@/components/HowToPlay";
import ShareInvite from "@/components/ShareInvite";
import type { JobSessionRow, JobPlayerRow } from "@/lib/job-types";

const BLUE = "#3B82F6";
const NAVY = "#1E40AF";

export default function JobWaitingRoom() {
  const { code } = useParams<{ code: string }>();
  const { lang, dark, ready } = usePrefs();
  const t = JOB_STR[lang as JobLang];

  const [session, setSession] = useState<JobSessionRow | null>(null);
  const [players, setPlayers] = useState<JobPlayerRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const isHost = !!(session && userId && session.host_user_id === userId);

  // Initial load
  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: sess, error: sessErr } = await supabase
        .from("job_sessions").select("*").eq("code", code.toString().toUpperCase()).single();
      if (sessErr || !sess) { setError(t.errorNotFound); return; }
      setSession(sess as JobSessionRow);

      const { data: pl } = await supabase
        .from("job_players").select("*").eq("session_id", sess.id).order("joined_at", { ascending: true });
      setPlayers((pl as JobPlayerRow[]) || []);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      setUserId(authSession?.user.id ?? null);
    })();
  }, [code]);

  // Realtime subscription for players + session status
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`job-session-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_players", filter: `session_id=eq.${session.id}` },
        async () => {
          const { data: pl } = await supabase
            .from("job_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
          setPlayers((pl as JobPlayerRow[]) || []);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "job_sessions", filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as JobSessionRow))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  // Polling fallback — self-heals if a realtime broadcast is ever missed,
  // so the lobby/round flow never gets permanently stuck waiting on a
  // manual refresh. Runs continuously (not just in the waiting room) since
  // round-phase transitions matter just as much once gameplay starts.
  useEffect(() => {
    if (!session?.id) return;
    const id = setInterval(async () => {
      const { data: pl } = await supabase
        .from("job_players").select("*").eq("session_id", session.id).order("joined_at", { ascending: true });
      if (pl) setPlayers(pl as JobPlayerRow[]);
      const { data: sess } = await supabase.from("job_sessions").select("*").eq("id", session.id).single();
      if (sess) setSession(sess as JobSessionRow);
    }, 1200);
    return () => clearInterval(id);
  }, [session?.id]);

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
        .from("job_round_prompts").select("id").eq("session_id", session.id).limit(1);

      if (!existingRounds || existingRounds.length === 0) {
        const { data: allPrompts, error: promptsErr } = await supabase
          .from("job_prompts").select("id")
          .eq("active", true);
        if (promptsErr) throw promptsErr;
        if (!allPrompts || allPrompts.length < 5) {
          throw new Error(
            `Only ${allPrompts?.length ?? 0} prompts available — need at least 5. Did job_schema.sql get run?`
          );
        }

        const shuffled = [...allPrompts].sort(() => Math.random() - 0.5).slice(0, 5);
        const rows = shuffled.map((p, i) => ({ session_id: session.id, round_number: i + 1, prompt_id: p.id }));
        const { error: rpErr } = await supabase.from("job_round_prompts").insert(rows);
        if (rpErr) throw rpErr;
      }

      // Same draw-and-persist pattern for the prewarm warm-up round's 5
      // (of 8) prompts — done once at game start so a reload mid-round
      // shows the same 5 questions instead of reshuffling.
      const { data: existingPrewarmRounds } = await supabase
        .from("job_prewarm_round_prompts").select("id").eq("session_id", session.id).limit(1);

      if (!existingPrewarmRounds || existingPrewarmRounds.length === 0) {
        const { data: allPrewarmPrompts, error: prewarmPromptsErr } = await supabase
          .from("job_prewarm_prompts").select("id")
          .eq("active", true);
        if (prewarmPromptsErr) throw prewarmPromptsErr;
        if (!allPrewarmPrompts || allPrewarmPrompts.length < 5) {
          throw new Error(
            `Only ${allPrewarmPrompts?.length ?? 0} prewarm prompts available — need at least 5. Did job_migration_007 get run?`
          );
        }
        const shuffledPrewarm = [...allPrewarmPrompts].sort(() => Math.random() - 0.5).slice(0, 5);
        const prewarmRows = shuffledPrewarm.map((p, i) => ({ session_id: session.id, round_number: i + 1, prompt_id: p.id }));
        const { error: prwErr } = await supabase.from("job_prewarm_round_prompts").insert(prewarmRows);
        if (prwErr) throw prwErr;
      }

      const nowIso = new Date().toISOString();
      const { data: updated, error: updateErr } = await supabase
        .from("job_sessions")
        .update({ status: "in_progress", current_round: 0, round_phase: "countdown", phase_started_at: nowIso, started_at: nowIso })
        .eq("id", session.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      // Don't wait on the realtime broadcast for the host's own action —
      // apply it locally right away as a fallback in case realtime isn't
      // configured for this table yet.
      if (updated) setSession(updated as JobSessionRow);
    } catch (e: any) {
      setStartError(e.message || "Something went wrong starting the game.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {(error || !session || session.status === "waiting") && <HomeButton label={t.backHome} href="/job" />}
      {/* Rules stay reachable from the lobby — that's the moment the group
          is actually gathered around asking how this works. Hidden once
          play starts so it can't distract mid-round. */}
      {session && session.status === "waiting" && (
        <div style={{ position: "absolute", top: 24, insetInlineEnd: 24, zIndex: 2 }}>
          <HelpButton game="job" lang={lang} autoOpenFirstVisit={false} />
        </div>
      )}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {error && <p style={{ color: BLUE, fontWeight: 700, marginTop: 40 }}>{error}</p>}

        {session && session.status !== "waiting" && (
          session.round_phase === "prewarm" || session.round_phase === "prewarm_teaser" ? (
            <PrewarmRound
              session={session}
              players={players}
              myPlayerId={players.find((p) => p.user_id === userId)?.id ?? null}
              isHost={isHost}
              lang={lang as JobLang}
            />
          ) : (
            <RoundScreen
              session={session}
              players={players}
              myPlayerId={players.find((p) => p.user_id === userId)?.id ?? null}
              isHost={isHost}
              lang={lang as JobLang}
            />
          )
        )}

        {session && session.status === "waiting" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20, marginTop: 40 }}>
              <SuitGuy size={90} />
            </div>

            <ShareInvite
              code={session.code}
              joinPath="/job/join"
              lang={lang}
              accent={`linear-gradient(135deg, ${BLUE}, ${NAVY})`}
              label={t.roomCode}
              emoji={"\u{1F4BC}\u{1F602}"} // 💼😂
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
                  <p className="font-body" style={{ color: BLUE, fontWeight: 700, fontSize: 13, marginBottom: 10, textAlign: "center" }}>
                    {startError}
                  </p>
                )}
                <button
                  disabled={players.length < 2 || starting}
                  onClick={startGame}
                  className="font-display"
                  style={{
                    padding: 18, fontSize: 17, width: "100%", borderRadius: 999, border: "none", color: "#fff",
                    background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`,
                    opacity: players.length < 2 || starting ? 0.5 : 1,
                  }}
                >
                  {starting ? t.loading : t.startGame}
                </button>

                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <p className="font-body" style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600, margin: "0 0 4px" }}>
                    محد ينضم؟
                  </p>
                  <Link
                    href="/job/demo"
                    className="font-body"
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "underline" }}
                  >
                    ▶ جرّب وضع التجربة
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
