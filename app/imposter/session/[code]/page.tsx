"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, ensureUser } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import ShareInvite from "@/components/ShareInvite";
import SaveResult from "@/components/auth/SaveResult";
import { IMPOSTER_STR, ImposterLang } from "@/lib/imposter-i18n";
import { usePrefs } from "@/lib/usePrefs";
import type { ImposterSessionRow, ImposterPlayerRow, ImposterWordRow } from "@/lib/imposter-types";

const MAGENTA = "#D6006E";
const PINK = "#FF2E93";
const TURN_SECONDS = 20;
const REVEAL_WORD_SECONDS = 10;

/**
 * المحتال — the one Bagdoonis game built around sequential turn-taking
 * (one active player at a time, everyone else watches) rather than
 * simultaneous answers. Room creation, ShareInvite, the realtime
 * subscription shape, HomeButton/LeaveGameButton all reuse the exact
 * same pieces every other multiplayer game already uses — the results
 * screen's actions are custom-built here rather than through
 * EndGameShare (see RevealAndResults below for why: EndGameShare's own
 * "Play Again" is a hard navigation to a fresh session, which doesn't
 * fit this game's spec-mandated "same room" replay). See
 * supabase/imposter_schema.sql for the RLS reasoning behind why
 * turn-advancement is any-player, not host-only.
 */
export default function ImposterSessionPage() {
  const params = useParams();
  const code = String(params.code).toUpperCase();
  const router = useRouter();
  const { lang, dark, ready } = usePrefs();
  const t = IMPOSTER_STR[lang as ImposterLang];
  const ar = lang === "ar";

  const [session, setSession] = useState<ImposterSessionRow | null>(null);
  const [players, setPlayers] = useState<ImposterPlayerRow[]>([]);
  const [word, setWord] = useState<ImposterWordRow | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const myPlayer = players.find((p) => p.user_id === myUserId) || null;
  const isHost = !!session && !!myUserId && session.host_user_id === myUserId;
  const sortedPlayers = [...players].sort((a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0));
  const isImposter = !!myPlayer && !!session && myPlayer.id === session.imposter_player_id;
  const isMyTurn = !!myPlayer && !!session && myPlayer.id === session.turn_player_id;

  const loadAll = useCallback(async () => {
    const { data: s } = await supabase.from("imposter_sessions").select("*").eq("code", code).maybeSingle();
    if (!s) { setError(t.errorGeneric); return; }
    setSession(s);

    const { data: p } = await supabase.from("imposter_players").select("*").eq("session_id", s.id);
    setPlayers(p || []);

    if (s.word_id) {
      const { data: w } = await supabase.from("imposter_words").select("*").eq("id", s.word_id).maybeSingle();
      setWord(w || null);
    } else {
      setWord(null);
    }

    if (s.phase === "voting" || s.phase === "reveal") {
      const { count } = await supabase
        .from("imposter_votes")
        .select("id", { count: "exact", head: true })
        .eq("session_id", s.id).eq("round_number", s.round_number);
      setVoteCount(count ?? 0);
    }
  }, [code, t.errorGeneric]);

  useEffect(() => {
    (async () => {
      const userId = await ensureUser(lang);
      setMyUserId(userId);
      await loadAll();
    })();
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`imposter-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "imposter_sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "imposter_players" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "imposter_votes" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [code, session?.id, loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- reveal_word (10s) AND clue (20s) both tick the same clock —
  // one shared timestamp column (turn_started_at), two different
  // durations read client-side depending on which phase is active. ----
  useEffect(() => {
    if (session?.status !== "in_progress" || (session?.phase !== "reveal_word" && session?.phase !== "clue")) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session?.status, session?.phase]);

  const phaseDuration = session?.phase === "reveal_word" ? REVEAL_WORD_SECONDS : TURN_SECONDS;
  const remaining = session?.turn_started_at
    ? Math.max(0, Math.ceil(phaseDuration - (now - new Date(session.turn_started_at).getTime()) / 1000))
    : phaseDuration;

  // ---- turn advance (تم button OR timeout) — any connected client can
  // call this, per the RLS reasoning in imposter_schema.sql. The WHERE
  // clause matching the CURRENT turn_player_id is what prevents two
  // clients racing the same timeout from both advancing the turn twice —
  // whichever update lands first changes turn_player_id, so the second
  // one's WHERE clause no longer matches anything and silently no-ops. ----
  const advancingRef = useRef(false);
  const advanceTurn = useCallback(async () => {
    if (!session || advancingRef.current) return;
    advancingRef.current = true;
    try {
      const order = sortedPlayers.map((p) => p.id);
      const idx = order.indexOf(session.turn_player_id || "");
      const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

      if (nextId) {
        await supabase
          .from("imposter_sessions")
          .update({ turn_player_id: nextId, turn_started_at: new Date().toISOString() })
          .eq("id", session.id)
          .eq("turn_player_id", session.turn_player_id);
      } else {
        await supabase
          .from("imposter_sessions")
          .update({ phase: "voting" })
          .eq("id", session.id)
          .eq("turn_player_id", session.turn_player_id);
      }
    } finally {
      advancingRef.current = false;
    }
  }, [session, sortedPlayers]);

  // reveal_word → clue, once the 10s is up. Same any-client-can-advance,
  // same idempotent WHERE-clause guard against a double transition as
  // advanceTurn above — matching phase='reveal_word' specifically means
  // once one client's update lands and flips it to 'clue', every other
  // client's racing attempt at the same transition matches zero rows.
  const revealAdvancingRef = useRef(false);
  useEffect(() => {
    if (session?.status === "in_progress" && session?.phase === "reveal_word" && remaining <= 0 && !revealAdvancingRef.current) {
      revealAdvancingRef.current = true;
      supabase
        .from("imposter_sessions")
        .update({ turn_started_at: new Date().toISOString(), phase: "clue" })
        .eq("id", session.id)
        .eq("phase", "reveal_word")
        .then(() => { revealAdvancingRef.current = false; });
    }
  }, [remaining, session?.status, session?.phase, session?.id]);

  useEffect(() => {
    if (session?.status === "in_progress" && session?.phase === "clue" && remaining <= 0) {
      advanceTurn();
    }
  }, [remaining, session?.status, session?.phase, advanceTurn]);

  async function handleStart() {
    if (!session) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/imposter-start-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorGeneric);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setStarting(false);
    }
  }

  async function handleHostSkipToVoting() {
    if (!session) return;
    await supabase.from("imposter_sessions").update({ phase: "voting" }).eq("id", session.id);
  }

  async function handleVote(votedForId: string) {
    if (!session || !myPlayer || myVote) return;
    setMyVote(votedForId);
    const { error: voteErr } = await supabase.from("imposter_votes").insert({
      session_id: session.id,
      round_number: session.round_number,
      voter_player_id: myPlayer.id,
      voted_for_player_id: votedForId,
    });
    if (voteErr) { setMyVote(null); return; }

    // Once everyone's voted, any client computes the result — same
    // any-client-can-finish pattern as every other game's completion
    // marking, for the same reason (don't depend on one specific
    // person's tab staying open).
    const { count } = await supabase
      .from("imposter_votes")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id).eq("round_number", session.round_number);
    if ((count ?? 0) >= players.length) {
      const res = await fetch("/api/imposter-round-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (res.ok) {
        fetch("/api/mark-session-completed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "imposter_sessions", sessionId: session.id }),
        }).catch(() => {});
      }
    }
  }

  // Reset per-round UI state (my vote, the word, timer clock) when a new
  // round starts on the SAME session — this is the one place Imposter's
  // "Play Again" genuinely differs from every other game: it reuses this
  // exact page/session instead of navigating anywhere, so nothing here
  // gets a natural fresh mount to reset state for it.
  const lastPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (session?.phase === "clue" && lastPhaseRef.current !== "clue") {
      setMyVote(null);
    }
    lastPhaseRef.current = session?.phase || null;
  }, [session?.phase]);

  async function handlePlayAgainSameRoom() {
    if (!session) return;
    await fetch("/api/imposter-start-round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
  }

  if (!ready || !session) {
    return (
      <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
        <Blobs />
        {error && <p style={{ textAlign: "center", paddingTop: 100, color: "#E63946" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {(session.status === "waiting" || session.phase === "reveal") && <HomeButton label={t.backHome} href="/imposter" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {session.status === "in_progress" && session.phase !== "reveal" && <LeaveGameButton lang={lang} />}

        {/* ---------------- LOBBY ---------------- */}
        {session.status === "waiting" && (
          <div className="screen-enter" style={{ marginTop: 50 }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 20 }}>
              {t.gameName}
            </h1>
            <ShareInvite
              code={session.code}
              joinPath="/imposter/join"
              lang={lang}
              accent={`linear-gradient(135deg, ${MAGENTA}, ${PINK})`}
              label={t.roomCode}
              emoji={"\u{1F608}"}
            />
            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 10 }}>
                {players.length} {ar ? "لاعبين" : "players"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {sortedPlayers.map((p) => (
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
                  background: `linear-gradient(135deg, ${MAGENTA}, ${PINK})`, opacity: starting || players.length < 3 ? 0.6 : 1,
                }}
              >
                {starting ? t.loading : players.length < 3 ? (ar ? "بحاجة لـ 3 لاعبين على الأقل" : "Need at least 3 players") : t.startGame}
              </button>
            ) : (
              <p className="font-body" style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--ink-soft)" }}>{t.waitingHost}</p>
            )}
          </div>
        )}

        {/* ---------------- REVEAL WORD (10s, before any turns) ----------------
             Every player sees this at once — their own word, or "أنت
             المحتال" for the imposter — before turn-taking starts, per
             the explicit request that this happen upfront rather than
             only during someone's own turn. */}
        {session.status === "in_progress" && session.phase === "reveal_word" && (
          <div className="screen-enter" style={{ marginTop: 40, textAlign: "center" }}>
            <span className="font-display" style={{ display: "block", fontSize: 40, fontWeight: 800, color: remaining <= 3 ? "#E63946" : MAGENTA, marginBottom: 20 }}>
              {remaining}
            </span>
            <div className="card pop" style={{ padding: 30, background: isImposter ? `linear-gradient(135deg, #17122B, ${MAGENTA})` : `linear-gradient(135deg, ${MAGENTA}, ${PINK})` }}>
              {isImposter ? (
                <p className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>{t.imposterTitle}</p>
              ) : (
                <>
                  <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 8px" }}>{t.theWord}</p>
                  <p className="font-display" style={{ fontSize: 34, fontWeight: 800, color: "#fff", margin: 0 }}>{word?.text}</p>
                </>
              )}
            </div>
            <p className="font-body" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", marginTop: 16 }}>
              {ar ? "تذكروها زين... بعد شوي تبدأ الأدوار 👀" : "Remember it well... turns start in a moment 👀"}
            </p>
          </div>
        )}

        {/* ---------------- CLUE PHASE ---------------- */}
        {session.status === "in_progress" && session.phase === "clue" && (
          <div className="screen-enter" style={{ marginTop: 30 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span className="font-display" style={{ fontSize: 40, fontWeight: 800, color: remaining <= 5 ? "#E63946" : MAGENTA }}>
                {remaining}
              </span>
            </div>

            {/* Persistent — shown to every player throughout the whole
                clue phase, regardless of whose turn it currently is, not
                just during the active player's own turn. This is what
                everyone uses to give (or fake) a good clue and to judge
                everyone else's. */}
            <div
              className="card"
              style={{
                padding: "14px 18px", marginBottom: 14, textAlign: "center",
                background: isImposter ? `linear-gradient(135deg, #17122B, ${MAGENTA})` : "var(--card)",
                border: isImposter ? "none" : `2px solid ${MAGENTA}44`,
              }}
            >
              {isImposter ? (
                <p className="font-display" style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>{t.imposterTitle}</p>
              ) : (
                <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: MAGENTA, margin: 0 }}>{t.theWord} {word?.text}</p>
              )}
            </div>

            {isMyTurn ? (
              <div className="card pop" style={{ padding: 26, textAlign: "center" }}>
                <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>{t.yourTurn}</p>
                <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 22 }}>
                  {isImposter ? t.imposterHint : t.giveClueHint}
                </p>
                <button
                  onClick={advanceTurn}
                  className="font-display"
                  style={{
                    width: "100%", padding: 16, fontSize: 16, borderRadius: 999, border: "none",
                    color: "#fff", background: `linear-gradient(135deg, ${MAGENTA}, ${PINK})`,
                  }}
                >
                  {t.done}
                </button>
              </div>
            ) : (
              <div className="card" style={{ padding: 26, textAlign: "center" }}>
                <p className="font-display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                  {ar ? `دور ${players.find((p) => p.id === session.turn_player_id)?.nickname || ""} \u{1F3A4}` : `${players.find((p) => p.id === session.turn_player_id)?.nickname || ""}${t.othersTurnSuffix}`}
                </p>
                <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>{t.givingClue}</p>
              </div>
            )}

            {isHost && (
              <button
                onClick={handleHostSkipToVoting}
                className="font-body"
                style={{
                  display: "block", width: "100%", marginTop: 18, padding: 13, fontSize: 13, fontWeight: 800,
                  borderRadius: 999, border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)",
                }}
              >
                {"\u{1F5F3}\uFE0F"} {t.hostMoveToVoting}
              </button>
            )}
          </div>
        )}

        {/* ---------------- VOTING ---------------- */}
        {session.status === "in_progress" && session.phase === "voting" && (
          <div className="screen-enter" style={{ marginTop: 30, textAlign: "center" }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{t.votingTitle}</h1>
            <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 22 }}>{t.votingSub}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {sortedPlayers.filter((p) => p.id !== myPlayer?.id).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleVote(p.id)}
                  disabled={!!myVote}
                  className="card"
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
                    border: myVote === p.id ? `3px solid ${MAGENTA}` : "2px solid var(--ring)",
                    background: myVote === p.id ? `${MAGENTA}18` : "var(--card)",
                    opacity: myVote && myVote !== p.id ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{p.avatar_emoji}</span>
                  <span className="font-body" style={{ fontSize: 15, fontWeight: 700 }}>{p.nickname}</span>
                </button>
              ))}
            </div>

            <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
              {voteCount}/{players.length} {ar ? "صوّتوا" : "voted"}
            </p>
          </div>
        )}

        {/* ---------------- REVEAL + RESULTS ---------------- */}
        {session.phase === "reveal" && (
          <RevealAndResults
            session={session}
            players={sortedPlayers}
            word={word}
            lang={lang}
            onPlayAgainSameRoom={handlePlayAgainSameRoom}
          />
        )}
      </div>
    </div>
  );
}

function RevealAndResults({
  session, players, word, lang, onPlayAgainSameRoom,
}: {
  session: ImposterSessionRow;
  players: ImposterPlayerRow[];
  word: ImposterWordRow | null;
  lang: string;
  onPlayAgainSameRoom: () => void;
}) {
  const ar = lang === "ar";
  const t = IMPOSTER_STR[lang as ImposterLang];
  const [result, setResult] = useState<{ voted_for_player_id: string | null; correct: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("imposter_round_results")
        .select("voted_for_player_id, correct")
        .eq("session_id", session.id).eq("round_number", session.round_number)
        .maybeSingle();
      if (data) setResult(data);
    })();
  }, [session.id, session.round_number]);

  if (!result) {
    return <div style={{ textAlign: "center", marginTop: 100, color: MAGENTA }}><span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" /></div>;
  }

  const imposterPlayer = players.find((p) => p.id === session.imposter_player_id);
  const votedPlayer = players.find((p) => p.id === result.voted_for_player_id);

  const resultLine = result.correct
    ? (ar ? `\u{1F389} لقينا المحتال: ${imposterPlayer?.nickname}!` : `\u{1F389} We found the Imposter: ${imposterPlayer?.nickname}!`)
    : (ar ? `\u{1F608} المحتال ${imposterPlayer?.nickname} نجا منا!` : `\u{1F608} The Imposter ${imposterPlayer?.nickname} got away!`);

  return (
    <div className="screen-enter" style={{ marginTop: 30, textAlign: "center", paddingBottom: 30 }}>
      <div className="card pop" style={{ padding: 28, marginBottom: 20, background: result.correct ? `linear-gradient(135deg, #14B8A6, ${MAGENTA})` : `linear-gradient(135deg, #17122B, ${MAGENTA})` }}>
        <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>
          {result.correct ? t.correctTitle : t.wrongTitle}
        </p>
        {!result.correct && (
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "0 0 16px" }}>{t.wrongSub}</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: ar ? "right" : "left" }}>
          <p className="font-body" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>
            {"\u{1F3AD}"} {t.theImposterWas}: <strong>{imposterPlayer?.nickname}</strong>
          </p>
          <p className="font-body" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>
            {"\u{1F50E}"} {t.theWordWas}: <strong>{word?.text}</strong>
          </p>
          {votedPlayer && (
            <p className="font-body" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>
              {"\u{1F5F3}\uFE0F"} {t.votedFor}: <strong>{votedPlayer.nickname}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Line 1 — شارك النتيجة, primary. Built directly here rather than
          via EndGameShare: that component's own "Play Again" is a hard
          navigation to a fresh session, which doesn't apply to this game
          at all (the spec requires reusing the SAME room) — mounting it
          anyway is exactly what produced two different "play again"
          buttons on screen, one correct and one not. Simpler and
          correct to just own this game's own 3-action layout directly. */}
      <button
        onClick={async () => {
          const text = [resultLine, "\u25AC".repeat(10), ar ? "جربوها مع شلتكم \u{1F447}" : "Try it with your friends \u{1F447}", window.location.origin].join("\n");
          if (typeof navigator !== "undefined" && navigator.share) {
            try { await navigator.share({ text }); return; } catch { return; }
          }
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        }}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          padding: "14px 20px", borderRadius: 999, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${MAGENTA}, ${PINK})`, color: "#fff", fontWeight: 800, fontSize: 15,
          boxShadow: "0 10px 26px rgba(0,0,0,0.2)", marginBottom: 12,
        }}
      >
        {"\u{1F4E4}"} {ar ? "شارك النتيجة" : "Share your results"}
      </button>

      {/* Line 2 — العب مرة ثانية (same room, the button that actually
          restarts) + العب وش شخصيتك (a different game entirely), equal
          pair, matching the site-wide results-screen convention. */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          onClick={onPlayAgainSameRoom}
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "11px 10px", borderRadius: 999, border: "none", cursor: "pointer",
            color: "#fff", background: `linear-gradient(135deg, ${MAGENTA}, ${PINK})`, fontWeight: 800, fontSize: 13,
          }}
        >
          {t.playAgainRoom}
        </button>
        <a
          href="/wadak"
          className="font-body"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "11px 10px", borderRadius: 999, textDecoration: "none",
            border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)", fontWeight: 800, fontSize: 13, textAlign: "center",
          }}
        >
          {"\u{1F3AD}"} {ar ? "وش شخصيتك" : "What's Your Personality"}
        </a>
      </div>

      {/* Line 3 — احفظ النتيجة, quiet */}
      <SaveResult game="imposter" lang={ar ? "ar" : "en"} resultSummary={resultLine} sessionCode={session.code} />
    </div>
  );
}
