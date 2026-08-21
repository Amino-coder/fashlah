"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, ensureUser } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import ShareInvite from "@/components/ShareInvite";
import SaveResult from "@/components/auth/SaveResult";
import { trackPageEvent } from "@/lib/trackPageView";
import { RUIN_STORY_STR, RuinStoryLang } from "@/lib/ruin-story-i18n";
import { usePrefs } from "@/lib/usePrefs";
import type {
  RuinStorySessionRow, RuinStoryPlayerRow, RuinStoryBlackCardRow, RuinStoryWhiteCardRow,
  RuinStoryHandRow, RuinStoryAnswerPublicRow, RuinStoryRoundResultRow,
} from "@/lib/ruin-story-types";

const CRIMSON = "#9B1C2E";
const GOLD = "#FFD400";
const REVEAL_PAUSE_MS = 4500;

/**
 * خرب السالفة — judge + black-card prompt + anonymous white-card
 * answers, six fixed rounds. Reuses the exact same room/lobby/
 * ShareInvite/LeaveGameButton pieces every other multiplayer game
 * already uses; what's actually new here is hand management (a fixed
 * 6-card hand, replenished automatically) and true answer anonymity
 * (see supabase/ruin_story_schema.sql — the judge's client only ever
 * sees card_id + text via a view that never exposes player_id, not
 * something enforced only by the UI choosing not to show a name).
 *
 * Server-side (security definer) functions own everything that needs
 * to stay authoritative or hidden from the client: ruin_story_start_round
 * (round 1 only), ruin_story_select_winner (every round after that sets
 * itself up as a side effect of resolving the previous one). Everything
 * else — submitting an answer, advancing answering→judging once
 * everyone's in, flipping reveal→answering after the pause — is a
 * plain client-side table write, same any-client-can-advance reasoning
 * as المحتال: normal gameplay must never depend on one specific
 * person's tab being open and responsive.
 */
export default function RuinStorySessionPage() {
  const params = useParams();
  const code = String(params.code).toUpperCase();
  const { lang, dark, ready } = usePrefs();
  const t = RUIN_STORY_STR[lang as RuinStoryLang];
  const ar = lang === "ar";

  const [session, setSession] = useState<RuinStorySessionRow | null>(null);
  const [players, setPlayers] = useState<RuinStoryPlayerRow[]>([]);
  const [blackCard, setBlackCard] = useState<RuinStoryBlackCardRow | null>(null);
  const [myHand, setMyHand] = useState<(RuinStoryHandRow & { card: RuinStoryWhiteCardRow })[]>([]);
  const [myAnswerCardId, setMyAnswerCardId] = useState<string | null>(null);
  const [judgingAnswers, setJudgingAnswers] = useState<(RuinStoryAnswerPublicRow & { card: RuinStoryWhiteCardRow })[]>([]);
  const [roundResult, setRoundResult] = useState<RuinStoryRoundResultRow | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [judging, setJudging] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const introShownRef = useRef(false);

  const myPlayer = players.find((p) => p.user_id === myUserId) || null;
  const isHost = !!session && !!myUserId && session.host_user_id === myUserId;
  const isJudge = !!myPlayer && !!session && myPlayer.id === session.judge_player_id;
  const judgePlayer = players.find((p) => p.id === session?.judge_player_id) || null;

  const loadCore = useCallback(async () => {
    const { data: s } = await supabase.from("ruin_story_sessions").select("*").eq("code", code).maybeSingle();
    if (!s) { setError(t.errorGeneric); return; }
    setSession(s);

    const { data: p } = await supabase.from("ruin_story_players").select("*").eq("session_id", s.id);
    setPlayers(p || []);

    if (s.black_card_id) {
      const { data: bc } = await supabase.from("ruin_story_black_cards").select("*").eq("id", s.black_card_id).maybeSingle();
      setBlackCard(bc || null);
    }

    return s;
  }, [code, t.errorGeneric]);

  const loadMyHand = useCallback(async (sessionId: string, playerId: string) => {
    const { data } = await supabase
      .from("ruin_story_hands")
      .select("*, card:ruin_story_white_cards(*)")
      .eq("session_id", sessionId).eq("player_id", playerId).eq("used", false);
    setMyHand((data as any) || []);
  }, []);

  const loadMyAnswer = useCallback(async (sessionId: string, playerId: string, roundNumber: number) => {
    const { data } = await supabase
      .from("ruin_story_answers")
      .select("card_id")
      .eq("session_id", sessionId).eq("player_id", playerId).eq("round_number", roundNumber).maybeSingle();
    setMyAnswerCardId(data?.card_id ?? null);
  }, []);

  const loadJudgingAnswers = useCallback(async (sessionId: string, roundNumber: number) => {
    const { data } = await supabase
      .from("ruin_story_answers_public")
      .select("*, card:ruin_story_white_cards(*)")
      .eq("session_id", sessionId).eq("round_number", roundNumber);
    // Shuffled client-side each load — the DB order would otherwise
    // leak submission order as a faint anonymity hint.
    setJudgingAnswers(((data as any) || []).sort(() => Math.random() - 0.5));
  }, []);

  const loadRoundResult = useCallback(async (sessionId: string, roundNumber: number) => {
    const { data } = await supabase
      .from("ruin_story_round_results")
      .select("*")
      .eq("session_id", sessionId).eq("round_number", roundNumber).maybeSingle();
    setRoundResult(data || null);
  }, []);

  const loadAll = useCallback(async () => {
    const s = await loadCore();
    if (!s || !myUserId) return;
    const { data: p } = await supabase.from("ruin_story_players").select("*").eq("session_id", s.id).eq("user_id", myUserId).maybeSingle();
    if (!p) return;

    if (s.status === "in_progress" && s.phase === "answering") {
      await Promise.all([loadMyHand(s.id, p.id), loadMyAnswer(s.id, p.id, s.round_number)]);
    } else if (s.phase === "judging") {
      await loadJudgingAnswers(s.id, s.round_number);
    } else if (s.phase === "reveal") {
      const resultRound = s.status === "completed" ? 6 : s.round_number - 1;
      await Promise.all([loadRoundResult(s.id, resultRound), loadMyHand(s.id, p.id)]);
    }
  }, [myUserId, loadCore, loadMyHand, loadMyAnswer, loadJudgingAnswers, loadRoundResult]);

  useEffect(() => {
    (async () => {
      const userId = await ensureUser(lang);
      setMyUserId(userId);
    })();
  }, [lang]);

  useEffect(() => {
    if (myUserId) loadAll();
  }, [myUserId, loadAll]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`ruin-story-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ruin_story_sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "ruin_story_players" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "ruin_story_answers" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "ruin_story_hands" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [code, session?.id, loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedCardId(null);
  }, [session?.round_number]);

  // Every client shows this independently, once, the first time they
  // see round 1 actually begin — not synced tightly across players
  // (a few hundred ms of drift between phones doesn't matter for a
  // flavor moment like this), just triggered once per client rather
  // than re-showing on every subsequent realtime update.
  useEffect(() => {
    if (session?.status === "in_progress" && session?.round_number === 1 && !introShownRef.current) {
      introShownRef.current = true;
      setShowIntro(true);
    }
  }, [session?.status, session?.round_number]);

  async function handleStart() {
    if (!session) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/ruin-story-start-round", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorGeneric);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit() {
    if (!session || !myPlayer || !selectedCardId || myAnswerCardId) return;
    setMyAnswerCardId(selectedCardId); // optimistic — reverted below on failure
    const { data, error: rpcErr } = await supabase.rpc("ruin_story_submit_answer", {
      p_session_id: session.id, p_round_number: session.round_number, p_player_id: myPlayer.id, p_card_id: selectedCardId,
    });
    if (rpcErr || data?.error) setMyAnswerCardId(null);
    // No manual re-count or phase-flip here — see the effect below,
    // which reacts to session.answers_submitted_count once the RPC's
    // own update to that column arrives back over this client's
    // existing session-table realtime subscription. Every connected
    // client runs the same effect, so whichever one's subscription
    // delivers the update first is the one that actually flips the
    // phase — same any-client-can-advance reasoning as everywhere else.
  }

  const [reshuffling, setReshuffling] = useState(false);
  async function handleReshuffle() {
    if (!myPlayer || reshuffling || myAnswerCardId) return;
    setReshuffling(true);
    try {
      const { data } = await supabase.rpc("ruin_story_reshuffle_hand", { p_player_id: myPlayer.id });
      if (data?.ok) {
        setSelectedCardId(null);
        // Hand refreshes via the existing ruin_story_hands realtime
        // subscription — nothing extra to fetch here. reshuffles_used
        // itself comes back through the players-table subscription too.
      }
    } finally {
      setReshuffling(false);
    }
  }

  // answering → judging, once the submitted count reaches
  // everyone-but-the-judge. Realtime-driven (reacts to
  // session.answers_submitted_count changing) PLUS a polling fallback —
  // belt and suspenders: if the realtime event for the final submission
  // is ever delayed or dropped for any client, the poll below still
  // catches it within a couple seconds instead of leaving that client
  // stuck showing a stale count forever. Guarded on phase='answering'
  // either way, so however many clients notice this at once, only one
  // update actually lands.
  const checkAnsweringDone = useCallback(async () => {
    if (!session || session.status !== "in_progress" || session.phase !== "answering") return;
    const nonJudgeCount = players.filter((p) => p.id !== session.judge_player_id).length;
    if (nonJudgeCount > 0 && session.answers_submitted_count >= nonJudgeCount) {
      await supabase.from("ruin_story_sessions").update({ phase: "judging" }).eq("id", session.id).eq("phase", "answering");
    }
  }, [session, players]);

  useEffect(() => { checkAnsweringDone(); }, [checkAnsweringDone]);

  useEffect(() => {
    if (session?.status !== "in_progress" || session?.phase !== "answering") return;
    const id = setInterval(async () => {
      // Re-fetch fresh rather than trusting local state for this one —
      // the whole point of the fallback is to catch cases where local
      // state itself might be the thing that's stale.
      const { data: fresh } = await supabase.from("ruin_story_sessions").select("*").eq("id", session.id).maybeSingle();
      if (!fresh || fresh.phase !== "answering") return;
      const { count } = await supabase.from("ruin_story_players").select("id", { count: "exact", head: true }).eq("session_id", session.id);
      const nonJudge = (count ?? 0) - (fresh.judge_player_id ? 1 : 0);
      if (nonJudge > 0 && fresh.answers_submitted_count >= nonJudge) {
        await supabase.from("ruin_story_sessions").update({ phase: "judging" }).eq("id", session.id).eq("phase", "answering");
      }
    }, 2500);
    return () => clearInterval(id);
  }, [session?.status, session?.phase, session?.id]);

  async function handleJudgePick(cardId: string) {
    if (!session || judging) return;
    setJudging(true);
    try {
      const res = await fetch("/api/ruin-story-select-winner", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, cardId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.errorGeneric); return; }
      if (session.round_number >= 6) {
        fetch("/api/mark-session-completed", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "ruin_story_sessions", sessionId: session.id }),
        }).catch(() => {});
      }
    } finally {
      setJudging(false);
    }
  }

  // reveal → answering, after a brief pause, only if the game isn't
  // actually over. A repeating interval check rather than a single
  // setTimeout — the same "belt and suspenders" reasoning as the
  // answering→judging polling fallback above: a one-shot timer has more
  // ways to silently never fire (a missed cleanup edge case, a tab
  // backgrounding and the browser throttling/dropping the timer, etc.)
  // than a check that just keeps re-verifying every second until it
  // succeeds. Any client can flip this; the guarded WHERE clause
  // (phase='reveal' specifically) keeps a race between multiple
  // clients' checks from double-firing.
  const revealEnteredAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (session?.status === "in_progress" && session?.phase === "reveal") {
      if (revealEnteredAtRef.current === null) revealEnteredAtRef.current = Date.now();
    } else {
      revealEnteredAtRef.current = null;
    }
  }, [session?.status, session?.phase]);

  useEffect(() => {
    if (session?.status !== "in_progress" || session?.phase !== "reveal") return;
    const id = setInterval(() => {
      if (revealEnteredAtRef.current !== null && Date.now() - revealEnteredAtRef.current >= REVEAL_PAUSE_MS) {
        supabase.from("ruin_story_sessions").update({ phase: "answering" }).eq("id", session.id).eq("phase", "reveal");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [session?.status, session?.phase, session?.id]);

  async function handlePlayAgainSameRoom() {
    if (!session) return;
    introShownRef.current = false;
    await supabase.from("ruin_story_players").update({ score: 0 }).eq("session_id", session.id);
    await supabase
      .from("ruin_story_sessions")
      .update({ status: "waiting", round_number: 1, phase: "answering", judge_player_id: null, black_card_id: null, used_black_card_ids: [], ended_at: null })
      .eq("id", session.id);
    // Clear out any leftover hand rows from the previous game so
    // dealing starts clean rather than "topping up" a stale hand.
    await supabase.from("ruin_story_hands").delete().eq("session_id", session.id);
  }

  if (!ready || !session) {
    return (
      <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
        <Blobs />
        {error && <p style={{ textAlign: "center", paddingTop: 100, color: "#E63946" }}>{error}</p>}
      </div>
    );
  }

  const sortedByScore = [...players].sort((a, b) => b.score - a.score);

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {showIntro && <PreGameIntro ar={ar} onDone={() => setShowIntro(false)} />}
      {(session.status === "waiting" || session.status === "completed") && <HomeButton label={t.backHome} href="/ruin_story" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {session.status === "in_progress" && <LeaveGameButton lang={lang} />}

        {/* ---------------- LOBBY ---------------- */}
        {session.status === "waiting" && (
          <div className="screen-enter" style={{ marginTop: 50 }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 20 }}>{t.gameName}</h1>
            <ShareInvite code={session.code} joinPath="/ruin_story/join" lang={lang} accent={`linear-gradient(135deg, ${CRIMSON}, #C9302C)`} label={t.roomCode} emoji={"\u{1F0CF}"} />
            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 10 }}>
                {players.length} {ar ? "لاعبين" : "players"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {players.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "var(--ring)" }}>
                    <span>{p.avatar_emoji}</span>
                    <span className="font-body" style={{ fontSize: 13, fontWeight: 700 }}>{p.nickname}</span>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="font-body" style={{ color: "#E63946", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>}
            {isHost ? (
              <button
                onClick={handleStart}
                disabled={starting || players.length < 3}
                className="font-display"
                style={{
                  display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                  background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)`, opacity: starting || players.length < 3 ? 0.6 : 1,
                }}
              >
                {starting ? t.loading : players.length < 3 ? (ar ? "بحاجة لـ 3 لاعبين على الأقل" : "Need at least 3 players") : t.startGame}
              </button>
            ) : (
              <p className="font-body" style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--ink-soft)" }}>{t.waitingHost}</p>
            )}
          </div>
        )}

        {/* ---------------- ANSWERING ---------------- */}
        {session.status === "in_progress" && session.phase === "answering" && (
          <div className="screen-enter" style={{ marginTop: 20 }}>
            <RoundHeader session={session} t={t} ar={ar} />
            <BlackCardDisplay text={blackCard?.text} />

            {isJudge ? (
              <div className="card" style={{ padding: 24, textAlign: "center", marginTop: 16 }}>
                <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: GOLD, marginBottom: 8 }}>{t.youAreJudge}</p>
                <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
                  {session.answers_submitted_count}/{players.length - 1} {ar ? "جاوبوا" : "answered"}
                </p>
              </div>
            ) : myAnswerCardId ? (
              <div className="card pop" style={{ padding: 24, textAlign: "center", marginTop: 16 }}>
                <p className="font-display" style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{t.submitted}</p>
                <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>{t.waitingOthers}</p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16, marginBottom: 16 }}>
                  {myHand.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedCardId(h.card_id)}
                      className="card"
                      style={{
                        padding: 14, minHeight: 90, textAlign: "start", border: selectedCardId === h.card_id ? `3px solid ${CRIMSON}` : "2px solid var(--ring)",
                        background: selectedCardId === h.card_id ? `${CRIMSON}18` : "var(--card)",
                      }}
                    >
                      <span className="font-body" style={{ fontSize: 13, fontWeight: 700 }}>{h.card.text}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedCardId}
                  className="font-display"
                  style={{
                    display: "block", width: "100%", padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                    background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)`, opacity: selectedCardId ? 1 : 0.5,
                  }}
                >
                  {t.pickThis}
                </button>
                {myPlayer && myPlayer.reshuffles_used < 2 && (
                  <button
                    onClick={handleReshuffle}
                    disabled={reshuffling}
                    className="font-body"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10,
                      padding: 12, fontSize: 12.5, fontWeight: 800, borderRadius: 999, border: "2px solid var(--ring)",
                      color: "var(--ink-soft)", background: "transparent", opacity: reshuffling ? 0.6 : 1,
                    }}
                  >
                    {"\u{1F500}"} {ar ? `بدل الأوراق (باقي ${2 - myPlayer.reshuffles_used})` : `Reshuffle (${2 - myPlayer.reshuffles_used} left)`}
                  </button>
                )}
              </>
            )}

            <PlayerStatusStrip session={session} players={players} t={t} ar={ar} />
          </div>
        )}

        {/* ---------------- JUDGING ---------------- */}
        {session.status === "in_progress" && session.phase === "judging" && (
          <div className="screen-enter" style={{ marginTop: 20 }}>
            <RoundHeader session={session} t={t} ar={ar} />
            <BlackCardDisplay text={blackCard?.text} />

            {isJudge ? (
              <>
                <p className="font-display" style={{ fontSize: 17, fontWeight: 800, textAlign: "center", margin: "16px 0" }}>{t.judgePrompt}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {judgingAnswers.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleJudgePick(a.card_id)}
                      disabled={judging}
                      className="card"
                      style={{ padding: 16, textAlign: "start", border: "2px solid var(--ring)", opacity: judging ? 0.6 : 1 }}
                    >
                      <span className="font-body" style={{ fontSize: 14, fontWeight: 700 }}>{a.card.text}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="card" style={{ padding: 24, textAlign: "center", marginTop: 16, marginBottom: 16 }}>
                  <p className="font-display" style={{ fontSize: 17, fontWeight: 800 }}>
                    {judgePlayer?.nickname || ""} {t.othersJudge}
                  </p>
                </div>
                {/* Same anonymous list the judge sees — no names here
                    either, just for everyone else to follow along while
                    they wait, not to pick from. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {judgingAnswers.map((a) => (
                    <div
                      key={a.id}
                      className="card"
                      style={{ padding: 16, textAlign: "start", border: "2px solid var(--ring)", opacity: 0.75 }}
                    >
                      <span className="font-body" style={{ fontSize: 14, fontWeight: 700 }}>{a.card.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ---------------- REVEAL / FINAL RESULTS ---------------- */}
        {session.phase === "reveal" && roundResult && (
          <RevealScreen
            session={session}
            players={players}
            roundResult={roundResult}
            sortedByScore={sortedByScore}
            t={t}
            ar={ar}
            isHost={isHost}
            onPlayAgainSameRoom={handlePlayAgainSameRoom}
          />
        )}
      </div>
    </div>
  );
}

function RoundHeader({ session, t }: { session: RuinStorySessionRow; t: Record<string, string>; ar: boolean }) {
  return (
    <p className="font-body" style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 10 }}>
      {t.roundLabel} {session.round_number} {t.of6}
    </p>
  );
}

function BlackCardDisplay({ text }: { text?: string }) {
  return (
    <div className="card pop" style={{ padding: 24, background: "#17122B", border: "2px solid #000", minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p className="font-display" style={{ fontSize: 19, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.5, margin: 0 }}>{text}</p>
    </div>
  );
}

function PlayerStatusStrip({ session, players }: { session: RuinStorySessionRow; players: RuinStoryPlayerRow[]; t: Record<string, string>; ar: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18, justifyContent: "center" }}>
      {players.filter((p) => p.id !== session.judge_player_id).map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--ring)" }}>
          <span style={{ fontSize: 14 }}>{p.avatar_emoji}</span>
          <span className="font-body" style={{ fontSize: 11.5, fontWeight: 700 }}>{p.nickname}</span>
        </div>
      ))}
    </div>
  );
}

function RevealScreen({
  session, players, roundResult, sortedByScore, t, ar, isHost, onPlayAgainSameRoom,
}: {
  session: RuinStorySessionRow;
  players: RuinStoryPlayerRow[];
  roundResult: RuinStoryRoundResultRow;
  sortedByScore: RuinStoryPlayerRow[];
  t: Record<string, string>;
  ar: boolean;
  isHost: boolean;
  onPlayAgainSameRoom: () => void;
}) {
  const [cardText, setCardText] = useState<string>("");
  const [advancing, setAdvancing] = useState(false);
  const winner = players.find((p) => p.id === roundResult.winning_player_id);
  const isGameOver = session.status === "completed";

  useEffect(() => {
    supabase.from("ruin_story_white_cards").select("text").eq("id", roundResult.winning_card_id).maybeSingle()
      .then(({ data }) => setCardText(data?.text || ""));
  }, [roundResult.winning_card_id]);

  // Manual fallback for the automatic reveal→answering transition,
  // which has been unreliable — same update the automatic polling
  // already attempts (phase='reveal' guard included), just triggered by
  // a tap instead of waiting on a timer. Host-only, matching the same
  // pattern as the clue-phase "انتقل للتصويت" override in المحتال: a
  // visible, deliberate manual control for exactly the case where
  // normal automatic progression doesn't happen on its own.
  async function handleNextRound() {
    if (advancing) return;
    setAdvancing(true);
    await supabase.from("ruin_story_sessions").update({ phase: "answering" }).eq("id", session.id).eq("phase", "reveal");
    setAdvancing(false);
  }

  if (!isGameOver) {
    return (
      <div className="screen-enter" style={{ marginTop: 30, textAlign: "center" }}>
        <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: GOLD, marginBottom: 14 }}>{t.winnerTitle}</p>
        <div className="card pop" style={{ padding: 24, marginBottom: 14 }}>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{winner?.avatar_emoji} {winner?.nickname}</p>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)" }}>{cardText}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: isHost ? 20 : 0 }}>
          {sortedByScore.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "var(--ring)" }}>
              <span>{p.avatar_emoji}</span>
              <span className="font-body" style={{ fontSize: 12, fontWeight: 800 }}>{p.nickname} · {p.score}</span>
            </div>
          ))}
        </div>
        {isHost && (
          <button
            onClick={handleNextRound}
            disabled={advancing}
            className="font-display"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              padding: 15, fontSize: 14, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)`, opacity: advancing ? 0.6 : 1,
            }}
          >
            {advancing ? t.loading : (ar ? "الجولة التالية \u2192" : "Next Round \u2192")}
          </button>
        )}
      </div>
    );
  }

  const topScore = sortedByScore[0]?.score ?? 0;
  const coWinners = sortedByScore.filter((p) => p.score === topScore);
  const resultLine = coWinners.length > 1
    ? (ar ? `${t.tie} ${coWinners.map((p) => p.nickname).join(" و ")} بـ ${topScore} ${t.points}` : `${t.tie} ${coWinners.map((p) => p.nickname).join(" & ")} with ${topScore} ${t.points}`)
    : (ar ? `\u{1F3C6} ${coWinners[0]?.nickname} فاز بـ ${topScore} ${t.points}!` : `\u{1F3C6} ${coWinners[0]?.nickname} won with ${topScore} ${t.points}!`);

  return (
    <div className="screen-enter" style={{ marginTop: 20, textAlign: "center", paddingBottom: 30 }}>
      <p className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{t.finalResults}</p>
      <div className="card pop" style={{ padding: 26, marginBottom: 20, background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)` }}>
        <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>{t.overallWinner}</p>
        <p className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>
          {coWinners.length > 1 ? t.tie : `${coWinners[0]?.avatar_emoji} ${coWinners[0]?.nickname}`}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {sortedByScore.map((p, i) => (
          <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <span className="font-body" style={{ fontSize: 14, fontWeight: 800 }}>{i + 1}. {p.avatar_emoji} {p.nickname}</span>
            <span className="font-display" style={{ fontSize: 15, fontWeight: 800, color: CRIMSON }}>{p.score} {t.points}</span>
          </div>
        ))}
      </div>

      {/* Share (custom, not a shared multi-purpose component) — same
          lesson as المحتال's results screen: a generic component's own
          "Play Again" assumes a fresh session, which doesn't fit this
          game's same-room replay either, so it's simpler and safer to
          own this game's own action set directly rather than risk a
          repeat of that exact bug. */}
      <button
        onClick={async () => {
          const text = [resultLine, "\u25AC".repeat(10), ar ? "جربوها مع شلتكم \u{1F447}" : "Try it with your friends \u{1F447}", window.location.origin].join("\n");
          if (typeof navigator !== "undefined" && navigator.share) {
            try { await navigator.share({ text }); trackPageEvent("ruin_story", "share_result_native"); return; } catch { return; }
          }
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
          trackPageEvent("ruin_story", "share_result_whatsapp");
        }}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          padding: "14px 20px", borderRadius: 999, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)`, color: "#fff", fontWeight: 800, fontSize: 15,
          boxShadow: "0 10px 26px rgba(0,0,0,0.2)", marginBottom: 12,
        }}
      >
        {"\u{1F4E4}"} {ar ? "شارك النتيجة" : "Share your results"}
      </button>

      <SaveResult game="ruin_story" lang={ar ? "ar" : "en"} resultSummary={resultLine} sessionCode={session.code} />

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={onPlayAgainSameRoom}
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px 10px", borderRadius: 999, border: "none", cursor: "pointer",
            color: "#fff", background: `linear-gradient(135deg, ${CRIMSON}, #C9302C)`, fontWeight: 800, fontSize: 13,
          }}
        >
          {t.playAgainRoom}
        </button>
        <a
          href="/wadak"
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px 10px", borderRadius: 999, textDecoration: "none",
            border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)", fontWeight: 800, fontSize: 13, textAlign: "center",
          }}
        >
          {"\u{1F3AD}"} {ar ? "لعبة ثانية" : "Another game"}
        </a>
      </div>
    </div>
  );
}

/**
 * Rules explainer → جاهزين → 3 → 2 → 1 → يلا, then dismisses itself.
 * A pure client-side overlay, not a session phase — no reason for this
 * to be synced tightly across players or to touch the database at all;
 * every client just runs the same fixed timeline independently.
 */
function PreGameIntro({ ar, onDone }: { ar: boolean; onDone: () => void }) {
  const STAGES = [
    { text: ar ? "بيكون عندك 6 كروت اجوبة غريبة. مهمتك تجاوب على السؤال بأكثر جواب مضحك \u{1F602}" : "You'll have 6 weird answer cards. Your job: answer the prompt with the funniest one \u{1F602}", ms: 3400 },
    { text: ar ? "إذا صوتوا لجوابك تفوز بنقطة \u{1F389}" : "If your answer gets picked, you win a point \u{1F389}", ms: 2600 },
    { text: ar ? "جاهزين" : "Ready", ms: 1000 },
    { text: "3", ms: 700 },
    { text: "2", ms: 700 },
    { text: "1", ms: 700 },
    { text: ar ? "يلا" : "Go!", ms: 900 },
  ];
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stageIndex >= STAGES.length) { onDone(); return; }
    const id = setTimeout(() => setStageIndex((i) => i + 1), STAGES[stageIndex].ms);
    return () => clearTimeout(id);
  }, [stageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (stageIndex >= STAGES.length) return null;
  const stage = STAGES[stageIndex];
  const isCountdown = ["3", "2", "1"].includes(stage.text) || stage.text === (ar ? "يلا" : "Go!");

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        position: "fixed", inset: 0, zIndex: 80, background: "linear-gradient(135deg, #17122B, #9B1C2E)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
      }}
    >
      <p
        key={stageIndex}
        className="font-display pop"
        style={{
          fontSize: isCountdown ? 64 : 22, fontWeight: 800, color: "#fff", textAlign: "center",
          lineHeight: 1.6, maxWidth: 340, margin: 0,
        }}
      >
        {stage.text}
      </p>
    </div>
  );
}
