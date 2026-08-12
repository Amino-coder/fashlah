"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import ShareInvite from "@/components/ShareInvite";
import { IHJ_STR, IhjLang } from "@/lib/ihj-i18n";
import { usePrefs } from "@/lib/usePrefs";
import { IHJ_CATEGORIES } from "@/lib/ihj-categories";
import { pickNextLetter } from "@/lib/ihj-letters";
import { ihjNormalize } from "@/lib/ihj-normalize";
import type { IhjSessionRow, IhjPlayerRow, IhjAnswerRow, IhjCategory } from "@/lib/ihj-types";
import { shareIhjResultCard } from "@/components/ihj/exportResultCard";

const PURPLE = "#7C3AED";
const PINK = "#FF2E93";
const MINT = "#2EE6A6";

export default function IhjSessionPage() {
  const params = useParams();
  const code = String(params.code).toUpperCase();
  const { lang } = usePrefs();
  const t = IHJ_STR[lang as IhjLang];
  const ar = lang === "ar";

  const [session, setSession] = useState<IhjSessionRow | null>(null);
  const [players, setPlayers] = useState<IhjPlayerRow[]>([]);
  const [answers, setAnswers] = useState<IhjAnswerRow[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const myPlayer = players.find((p) => p.user_id === myUserId) || null;
  const isHost = !!session && !!myUserId && session.host_user_id === myUserId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!cancelled) setMyUserId(authSession?.user.id || null);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadAll = useCallback(async () => {
    const { data: s } = await supabase.from("ihj_sessions").select("*").eq("code", code).maybeSingle();
    if (!s) { setError(t.errorGeneric); return; }
    setSession(s as IhjSessionRow);
    const { data: p } = await supabase.from("ihj_players").select("*").eq("session_id", s.id).order("joined_at");
    setPlayers((p as IhjPlayerRow[]) || []);
    if (s.current_round > 0) {
      const { data: a } = await supabase.from("ihj_answers").select("*").eq("session_id", s.id).eq("round_number", s.current_round);
      setAnswers((a as IhjAnswerRow[]) || []);
    }
  }, [code, t.errorGeneric]);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel(`ihj-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ihj_sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "ihj_players" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "ihj_answers" }, loadAll)
      .subscribe();
    const poll = setInterval(loadAll, 1500);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [code, loadAll]);

  useEffect(() => {
    if (session?.status !== "in_progress" || session.round_phase !== "answering") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session?.status, session?.round_phase]);

  const remaining = useMemo(() => {
    if (!session?.phase_started_at) return session?.time_limit_seconds ?? 60;
    const elapsed = (now - new Date(session.phase_started_at).getTime()) / 1000;
    return Math.max(0, Math.ceil((session.time_limit_seconds || 60) - elapsed));
  }, [session, now]);

  const currentRoundAnswers = answers.filter((a) => a.round_number === session?.current_round);
  const mySubmittedCount = currentRoundAnswers.filter((a) => a.player_id === myPlayer?.id).length;
  const mySubmitted = mySubmittedCount >= IHJ_CATEGORIES.length;
  const submittedPlayerIds = new Set(currentRoundAnswers.map((a) => a.player_id));
  const allSubmitted = players.length > 0 && players.every((p) => submittedPlayerIds.has(p.id));

  // Host: once everyone's submitted (or time's up), score the round.
  useEffect(() => {
    if (!isHost || !session || session.round_phase !== "answering") return;
    if (allSubmitted || remaining <= 0) {
      fetch("/api/ihj-score-round", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, roundNumber: session.current_round }),
      }).then(() => loadAll()).catch(() => {});
    }
  }, [isHost, session, allSubmitted, remaining, loadAll]);

  async function handleStart() {
    if (!session) return;
    setStarting(true);
    try {
      const letter = pickNextLetter([]);
      await supabase.from("ihj_sessions").update({
        status: "in_progress", current_round: 1, current_letter: letter, used_letters: [letter],
        round_phase: "answering", phase_started_at: new Date().toISOString(), started_at: new Date().toISOString(),
      }).eq("id", session.id);
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit(draft: Record<IhjCategory, string>) {
    if (!session || !myPlayer || mySubmitted) return;
    const rows = IHJ_CATEGORIES.map((c) => ({
      session_id: session.id, round_number: session.current_round, player_id: myPlayer.id,
      category: c.key, answer_text: (draft[c.key] || "").trim(),
    }));
    await supabase.from("ihj_answers").insert(rows).select();
    loadAll();
  }

  async function handleNextRound() {
    if (!session || !isHost) return;
    if (session.current_round >= session.total_rounds) {
      await supabase.from("ihj_sessions").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", session.id);
      return;
    }
    const letter = pickNextLetter(session.used_letters);
    await supabase.from("ihj_sessions").update({
      current_round: session.current_round + 1, current_letter: letter,
      used_letters: [...session.used_letters, letter], round_phase: "answering", phase_started_at: new Date().toISOString(),
    }).eq("id", session.id);
  }

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error || !session) {
    return (
      <div dir={t.dir} style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Blobs />
        <HomeButton label={t.backHome} href="/ihj" />
      </div>
    );
  }

  return (
    <div dir={t.dir} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {(session.status === "waiting" || session.status === "completed") && <HomeButton label={t.backHome} href="/ihj" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {session.status === "in_progress" && <LeaveGameButton lang={lang} />}

        {/* ---------------- LOBBY ---------------- */}
        {session.status === "waiting" && (
          <div className="screen-enter" style={{ marginTop: 30 }}>
            <p className="font-body" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{t.roomCode}</p>
            <button
              onClick={copyCode}
              className="font-mono"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "8px auto 20px",
                fontSize: 34, fontWeight: 800, letterSpacing: "0.2em", background: "none", border: "none", color: PURPLE,
              }}
            >
              {code} {copied ? <Check size={22} /> : <Copy size={20} />}
            </button>

            <div style={{ marginBottom: 20 }}>
              <ShareInvite
                code={code}
                joinPath="/ihj/join"
                lang={lang}
                accent={`linear-gradient(135deg, ${PURPLE}, ${PINK})`}
                label={t.roomCode}
                emoji={"\u{1F9E0}\u{1F602}"}
              />
            </div>

            <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 4, textAlign: "center" }}>
              {t.numRounds}: {session.total_rounds}
            </p>

            <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", margin: "18px 0 10px" }}>
              {t.players} ({players.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {players.map((p) => (
                <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                  <span style={{ fontSize: 20 }}>{p.avatar_emoji}</span>
                  <span className="font-body" style={{ fontWeight: 700, fontSize: 14 }}>{p.nickname}</span>
                  {p.user_id === session.host_user_id && (
                    <span className="font-body" style={{ marginInlineStart: "auto", fontSize: 10, fontWeight: 800, color: PURPLE }}>HOST</span>
                  )}
                </div>
              ))}
            </div>

            {isHost ? (
              <button
                onClick={handleStart}
                disabled={players.length < 2 || starting}
                className="font-display"
                style={{
                  display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
                  background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`, opacity: players.length < 2 || starting ? 0.5 : 1,
                }}
              >
                {starting ? t.loading : t.startGame}
              </button>
            ) : (
              <p className="font-body" style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>
                {t.waitingHost}
              </p>
            )}
          </div>
        )}

        {/* ---------------- ANSWERING ---------------- */}
        {session.status === "in_progress" && session.round_phase === "answering" && myPlayer && (
          <AnsweringScreen
            session={session} myPlayer={myPlayer} mySubmitted={mySubmitted} remaining={remaining}
            submittedCount={submittedPlayerIds.size} totalPlayers={players.length}
            onSubmit={handleSubmit} t={t} ar={ar}
          />
        )}

        {/* ---------------- REVEAL + LEADERBOARD ---------------- */}
        {session.status === "in_progress" && session.round_phase === "reveal" && (
          <RevealScreen
            session={session} players={players} answers={currentRoundAnswers} isHost={isHost}
            onNextRound={handleNextRound} t={t} ar={ar}
          />
        )}

        {/* ---------------- FINAL RESULTS ---------------- */}
        {session.status === "completed" && (
          <FinalResults players={players} myPlayerId={myPlayer?.id} t={t} ar={ar} />
        )}
      </div>
    </div>
  );
}

function AnsweringScreen({
  session, myPlayer, mySubmitted, remaining, submittedCount, totalPlayers, onSubmit, t, ar,
}: {
  session: IhjSessionRow; myPlayer: IhjPlayerRow; mySubmitted: boolean; remaining: number;
  submittedCount: number; totalPlayers: number;
  onSubmit: (draft: Record<IhjCategory, string>) => void; t: any; ar: boolean;
}) {
  const [draft, setDraft] = useState<Record<IhjCategory, string>>({ human: "", animal: "", object: "", plant: "", country: "" });
  const [submittedLocally, setSubmittedLocally] = useState(false);

  useEffect(() => { setDraft({ human: "", animal: "", object: "", plant: "", country: "" }); setSubmittedLocally(false); }, [session.current_round]);

  useEffect(() => {
    if (remaining <= 0 && !mySubmitted && !submittedLocally) {
      setSubmittedLocally(true);
      onSubmit(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, mySubmitted, submittedLocally]);

  function handleSubmitClick() {
    setSubmittedLocally(true);
    onSubmit(draft);
  }

  const letter = session.current_letter || "";
  const locked = mySubmitted || submittedLocally;

  return (
    <div className="screen-enter" style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          {t.roundOf} {session.current_round}/{session.total_rounds}
        </span>
        <span className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: remaining <= 10 ? "#E63946" : PURPLE }}>
          {remaining}
        </span>
      </div>

      <div className="card pop" style={{ padding: "18px 20px", textAlign: "center", marginBottom: 18, background: `linear-gradient(135deg, ${PURPLE}, ${PINK})` }}>
        <p className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 4px" }}>{t.roundLetter}</p>
        <p className="font-display" style={{ fontSize: 52, fontWeight: 800, color: "#fff", margin: 0 }}>{letter}</p>
      </div>

      {locked ? (
        <div className="card pop" style={{ padding: 30, textAlign: "center" }}>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{t.submitted}</p>
          <p className="font-body" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700, marginBottom: 14 }}>{t.waitingOthers}</p>
          <p className="font-mono" style={{ fontSize: 13, color: MINT, fontWeight: 800 }}>{submittedCount}/{totalPlayers}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
            {IHJ_CATEGORIES.map((c) => {
              const value = draft[c.key];
              const normalizedOk = !value || ihjNormalize(value)[0] === ihjNormalize(letter)[0];
              return (
                <div key={c.key} className="card" style={{ padding: 14 }}>
                  <p className="font-body" style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{c.emoji}</span> {c.label}
                  </p>
                  <input
                    value={value}
                    onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                    placeholder={c.prompt(letter)}
                    dir="rtl"
                    className="font-body"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                      border: value && !normalizedOk ? "2px solid #FFB020" : "2px solid var(--ring)",
                      background: "var(--bg)", color: "var(--ink)", outline: "none",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSubmitClick}
            className="font-display"
            style={{
              display: "block", width: "100%", padding: 17, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
            }}
          >
            {t.submit}
          </button>
        </>
      )}
    </div>
  );
}

function RevealScreen({
  session, players, answers, isHost, onNextRound, t, ar,
}: {
  session: IhjSessionRow; players: IhjPlayerRow[]; answers: IhjAnswerRow[]; isHost: boolean;
  onNextRound: () => void; t: any; ar: boolean;
}) {
  function nameFor(playerId: string) { return players.find((p) => p.id === playerId)?.nickname || "?"; }

  const roundPoints: Record<string, number> = {};
  for (const p of players) roundPoints[p.id] = 0;
  for (const a of answers) if (a.points) roundPoints[a.player_id] = (roundPoints[a.player_id] || 0) + a.points;

  const rankedByRound = [...players].sort((a, b) => (roundPoints[b.id] || 0) - (roundPoints[a.id] || 0));
  const rankedByTotal = [...players].sort((a, b) => b.total_score - a.total_score);
  const isLastRound = session.current_round >= session.total_rounds;

  return (
    <div className="screen-enter" style={{ marginTop: 10, paddingBottom: 20 }}>
      <p className="font-body" style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 16 }}>
        {t.roundOf} {session.current_round}/{session.total_rounds} — {t.reveal}
      </p>

      {/* All 5 categories, every answer with its points, grouped by match */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 26 }}>
        {IHJ_CATEGORIES.map((cat) => {
          const catAnswers = answers.filter((a) => a.category === cat.key);
          const groups = new Map<string, IhjAnswerRow[]>();
          for (const a of catAnswers) {
            const key = a.normalized_answer || "";
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(a);
          }
          const sortedGroups = [...groups.entries()].sort((a, b) => (b[1][0]?.points || 0) - (a[1][0]?.points || 0));

          return (
            <div key={cat.key}>
              <p className="font-body" style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>{cat.emoji}</span> {cat.label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sortedGroups.map(([key, group], gi) => (
                  <div key={gi} className="card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="font-display" style={{ fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                      {key ? group[0].answer_text : (ar ? "بدون إجابة" : "No answer")}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "flex-end", flex: 1 }}>
                      {group.map((a) => (
                        <span key={a.id} className="font-body" style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "var(--ring)", whiteSpace: "nowrap" }}>
                          {nameFor(a.player_id)} +{a.points ?? 0}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {catAnswers.length === 0 && (
                  <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: "var(--ring)", margin: "0 0 22px" }} />

      <p className="font-display" style={{ fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 14 }}>{t.roundScore}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
        {rankedByRound.map((p, i) => (
          <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][i] || "🎮"}</span>
            <span style={{ fontSize: 18 }}>{p.avatar_emoji}</span>
            <span className="font-body" style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{p.nickname}</span>
            <span className="font-display" style={{ fontWeight: 800, color: MINT, fontSize: 14 }}>+{roundPoints[p.id] || 0}</span>
          </div>
        ))}
      </div>

      <p className="font-display" style={{ fontSize: 16, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>{t.leaderboard}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {rankedByTotal.map((p, i) => (
          <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][i] || "🎮"}</span>
            <span style={{ fontSize: 18 }}>{p.avatar_emoji}</span>
            <span className="font-body" style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{p.nickname}</span>
            <span className="font-body" style={{ fontSize: 11, color: MINT, fontWeight: 700 }}>+{roundPoints[p.id] || 0} {t.thisRound}</span>
            <span className="font-display" style={{ fontWeight: 800, fontSize: 15 }}>{p.total_score}</span>
          </div>
        ))}
      </div>

      {isHost && (
        <button
          onClick={onNextRound}
          className="font-display"
          style={{ display: "block", width: "100%", padding: 17, fontSize: 16, borderRadius: 999, border: "none", color: "#fff", background: `linear-gradient(135deg, ${PURPLE}, ${PINK})` }}
        >
          {isLastRound ? t.gameOver : t.nextRound}
        </button>
      )}
    </div>
  );
}

function FinalResults({ players, myPlayerId, t, ar }: { players: IhjPlayerRow[]; myPlayerId?: string; t: any; ar: boolean }) {
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");

  async function handleShare() {
    setShareState("working");
    const res = await shareIhjResultCard(players, myPlayerId);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  const sorted = [...players].sort((a, b) => b.total_score - a.total_score);
  // Ties share a position — no tiebreak rules invented, per spec.
  const positions: number[] = [];
  sorted.forEach((p, i) => {
    positions.push(i === 0 ? 1 : (sorted[i - 1].total_score === p.total_score ? positions[i - 1] : i + 1));
  });
  const ranked = sorted.map((player, i) => ({ player, position: positions[i] }));
  const winner = ranked.find((r) => r.position === 1);
  const others = ranked.filter((r) => r.position !== 1);

  return (
    <div className="screen-enter" style={{ marginTop: 60, textAlign: "center" }}>
      <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>{t.gameOver}</h1>

      {winner && (
        <div className="card pop" style={{ padding: 30, marginBottom: 20, background: `linear-gradient(135deg, ${PURPLE}, ${PINK})` }}>
          <span style={{ fontSize: 56, display: "block", marginBottom: 8 }}>🥇</span>
          <p className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{winner.player.nickname}</p>
          <p className="font-body" style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>
            {winner.player.total_score} {ar ? "نقطة" : "pts"}
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {others.map(({ player, position }) => (
          <div key={player.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 16 }}>{position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "🎮"}</span>
            <span style={{ fontSize: 18 }}>{player.avatar_emoji}</span>
            <span className="font-body" style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{player.nickname}</span>
            <span className="font-display" style={{ fontWeight: 800 }}>{player.total_score}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleShare}
        disabled={shareState === "working"}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 12,
          padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
          background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
        }}
      >
        {shareState === "working" ? "..." : shareState === "shared" ? "تم!" : shareState === "downloaded" ? "انحفظت الصورة!" : (ar ? "شارك نتيجتك" : "Share Results")}
      </button>

      <Link
        href="/ihj"
        className="font-display"
        style={{
          display: "inline-block", padding: "13px 36px", fontSize: 14, borderRadius: 999,
          border: "2px solid var(--ring)", color: "var(--ink)", background: "transparent",
        }}
      >
        {t.playAgain}
      </Link>
    </div>
  );
}
