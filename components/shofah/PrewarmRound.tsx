"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SHOFAH_STR, ShofahLang } from "@/lib/shofah-i18n";
import LeaveGameButton from "@/components/LeaveGameButton";
import type { ShofahSessionRow, ShofahPlayerRow, ShofahPrewarmVoteRow } from "@/lib/shofah-types";

// A warm-up round that runs once, after the countdown and before question
// round 1: 5 prompts, but instead of writing/voting-on text answers (like
// the scored rounds), players vote directly on EACH OTHER — mirroring
// Fashlah's Round 2 ("Vote for Friends") pattern. Purely for momentum: it
// never touches shofah_answers / shofah_votes / shofah_round_results, so it
// can't affect scoring or the final winner in any way.
//
// Unlike Fashlah's version (private per-player teaser, advance whenever
// YOU finish), this is a shared/group experience: everyone answers all 5
// questions, waits for the whole group to finish, then sees ONE combined
// teaser built from everyone's votes across all 5 questions together.

type PromptRow = { round_number: number; text_ar: string; text_en: string };

export default function PrewarmRound({
  session, players, myPlayerId, isHost, lang,
}: {
  session: ShofahSessionRow;
  players: ShofahPlayerRow[];
  myPlayerId: string | null;
  isHost: boolean;
  lang: ShofahLang;
}) {
  const t = SHOFAH_STR[lang];
  const TOTAL_PREWARM_ROUNDS = 5;

  const [prompts, setPrompts] = useState<PromptRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [votes, setVotes] = useState<ShofahPrewarmVoteRow[]>([]);

  // Load this session's 5 drawn prewarm prompts once (they're persisted by
  // the host at game-start time, same pattern as the real round prompts —
  // see startGame in the session page).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from("shofah_prewarm_round_prompts")
        .select("round_number, shofah_prewarm_prompts(text_ar, text_en)")
        .eq("session_id", session.id)
        .order("round_number");
      if (cancelled) return;
      if (err || !data || data.length === 0) {
        setError(lang === "ar" ? "ما لقينا أسئلة لهالجولة" : "Couldn't load this round's questions");
        setLoading(false);
        return;
      }
      const rows: PromptRow[] = data.map((r: any) => ({
        round_number: r.round_number,
        text_ar: r.shofah_prewarm_prompts?.text_ar ?? "",
        text_en: r.shofah_prewarm_prompts?.text_en ?? "",
      }));
      setPrompts(rows);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session.id, lang]);

  // Fetch + subscribe to ALL prewarm votes for this session (every round at
  // once, not just the current one) — needed both to know when everyone's
  // finished the current question and to build the final combined teaser
  // across all 5 rounds at the end.
  async function refetchVotes() {
    const { data } = await supabase
      .from("shofah_prewarm_votes")
      .select("*")
      .eq("session_id", session.id);
    setVotes((data as ShofahPrewarmVoteRow[]) || []);
  }

  useEffect(() => {
    refetchVotes();
    const channel = supabase
      .channel(`shofah-prewarm-${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shofah_prewarm_votes", filter: `session_id=eq.${session.id}` },
        () => refetchVotes())
      .subscribe();
    // Polling fallback, matching the rest of Shofah's realtime-with-backup pattern.
    const poll = setInterval(refetchVotes, 1200);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [session.id]);

  const myVoteThisRound = useMemo(
    () => votes.find((v) => v.round_number === idx + 1 && v.voter_player_id === myPlayerId),
    [votes, idx, myPlayerId]
  );
  const votesThisRound = useMemo(
    () => votes.filter((v) => v.round_number === idx + 1),
    [votes, idx]
  );
  const everyoneVotedThisRound = players.length > 0 && votesThisRound.length >= players.length;

  // Keep `selected` in sync with an already-cast vote for the current
  // question (covers reload mid-round, and also the moment our own insert
  // round-trips back through the subscription).
  useEffect(() => {
    setSelected(myVoteThisRound ? myVoteThisRound.voted_for_player_id : null);
  }, [myVoteThisRound]);

  async function pick(votedForPlayerId: string) {
    if (!myPlayerId || myVoteThisRound) return;
    setSelected(votedForPlayerId); // optimistic — feels instant even before the round-trip
    const { error: insertErr } = await supabase.from("shofah_prewarm_votes").insert({
      session_id: session.id,
      round_number: idx + 1,
      voter_player_id: myPlayerId,
      voted_for_player_id: votedForPlayerId,
    });
    if (insertErr) {
      setSelected(null);
      setError(insertErr.message);
      return;
    }
    refetchVotes();
  }

  // Host-only: once everyone's voted on the current question, move to the
  // next one — or, after question 5, into the shared teaser phase.
  // Advancing to the next question is derived purely from shared vote data
  // (everyoneVotedThisRound), so every client — not just the host — can
  // independently move its own local `idx` forward in lockstep, with no
  // risk of divergence. The ONLY host-only part is the final write to
  // round_phase once question 5 is done, since that's session state that
  // needs a single source of truth.
  const advancingRef = useRef(false);
  useEffect(() => {
    advancingRef.current = false;
  }, [idx]);

  useEffect(() => {
    if (!everyoneVotedThisRound || advancingRef.current) return;
    advancingRef.current = true;
    const timer = setTimeout(() => {
      if (idx + 1 < TOTAL_PREWARM_ROUNDS) {
        setIdx((i) => i + 1);
      } else if (isHost) {
        supabase.from("shofah_sessions")
          .update({ round_phase: "prewarm_teaser", phase_started_at: new Date().toISOString() })
          .eq("id", session.id)
          .then(({ error }) => {
            // Must clear the guard on failure — otherwise this is stuck
            // forever with nothing left to retry the transition.
            if (error) {
              advancingRef.current = false;
              setError(error.message);
            }
          });
      }
    }, 550); // small beat so the "locked in" state is visible before advancing
    return () => clearTimeout(timer);
  }, [everyoneVotedThisRound, idx, isHost, session.id]);

  if (loading) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t.loading}</p>
      </div>
    );
  }

  if (error && !prompts) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ color: "#E63946", fontWeight: 700 }}>{error}</p>
      </div>
    );
  }

  // ---- Shared teaser screen (after all 5 questions) ----
  if (session.round_phase === "prewarm_teaser") {
    return <PrewarmTeaser session={session} players={players} votes={votes} isHost={isHost} lang={lang} />;
  }

  if (!prompts) return null;
  const q = prompts[idx];
  const progressPct = Math.round(((idx + (myVoteThisRound ? 1 : 0)) / TOTAL_PREWARM_ROUNDS) * 100);

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px", display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
      <LeaveGameButton lang={lang} />
      <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textAlign: "center" }}>
        {lang === "ar" ? "🔥 جولة تسخين" : "🔥 Warm-up round"}
      </p>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #E63946, #C2185B)" }} />
      </div>

      <div className="card pop" style={{ padding: 26, textAlign: "center" }} key={idx}>
        <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13 }}>
          {idx + 1} / {TOTAL_PREWARM_ROUNDS}
        </p>
        <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 24px" }}>
          {(lang === "ar" ? q.text_ar : q.text_en) || q.text_ar}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {players.map((p) => {
            const isSelected = selected === p.id;
            const isMe = p.id === myPlayerId;
            return (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                disabled={!!myVoteThisRound}
                className="wiggle"
                style={{
                  padding: "14px 6px",
                  borderRadius: 18,
                  border: "2px solid var(--ring)",
                  background: isSelected ? "linear-gradient(135deg, #E63946, #C2185B)" : "var(--card)",
                  color: isSelected ? "white" : "var(--ink)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  opacity: myVoteThisRound && !isSelected ? 0.5 : 1,
                  transition: "opacity .2s ease, background .2s ease, color .2s ease",
                }}
              >
                <span style={{ fontSize: 24 }}>{p.avatar_emoji}</span>
                <span className="font-body" style={{ fontSize: 11, fontWeight: 700 }}>
                  {isMe ? (lang === "ar" ? "أنت" : "You") : p.nickname}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="font-body" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>
        {myVoteThisRound
          ? (lang === "ar" ? `بانتظار البقية... (${votesThisRound.length}/${players.length})` : `Waiting for everyone else... (${votesThisRound.length}/${players.length})`)
          : `${votesThisRound.length}/${players.length} ${lang === "ar" ? "صوّتوا" : "voted"}`}
      </p>

      {error && (
        <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center" }}>{error}</p>
      )}
    </div>
  );
}

// ---- Shared/group teaser, shown once to everyone after all 5 prewarm
// questions are done. Built purely from combined vote tallies — the player
// with the most total votes across all 5 rounds gets the callout. This has
// zero effect on scoring; it's just momentum.
function PrewarmTeaser({
  session, players, votes, isHost, lang,
}: {
  session: ShofahSessionRow;
  players: ShofahPlayerRow[];
  votes: ShofahPrewarmVoteRow[];
  isHost: boolean;
  lang: ShofahLang;
}) {
  const advancingRef = useRef(false);

  const tally = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of votes) counts[v.voted_for_player_id] = (counts[v.voted_for_player_id] || 0) + 1;
    return counts;
  }, [votes]);

  const { topPlayer, topCount, isTie } = useMemo(() => {
    let top: ShofahPlayerRow | null = null;
    let count = 0;
    let tieCount = 0; // how many players share the top count
    for (const p of players) {
      const c = tally[p.id] || 0;
      if (c > count) { count = c; top = p; tieCount = 1; }
      else if (c === count && c > 0) { tieCount += 1; }
    }
    return { topPlayer: top, topCount: count, isTie: tieCount > 1 };
  }, [players, tally]);

  const [error, setError] = useState<string | null>(null);

  async function advanceToRound1() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    const { error: err } = await supabase.from("shofah_sessions")
      .update({ current_round: 1, round_phase: "answering", phase_started_at: new Date().toISOString() })
      .eq("id", session.id);
    if (err) {
      advancingRef.current = false; // allow retry instead of stalling forever
      setError(err.message);
    }
  }

  // Auto-advance after a beat so this doesn't need a tap on every device —
  // matches the "don't kill momentum" spirit of the rest of the game.
  // Retries a couple times if the write fails, since nothing else will
  // ever call this again once the initial timer has fired.
  useEffect(() => {
    if (!isHost) return;
    const timer = setTimeout(() => { advanceToRound1(); }, 3200);
    return () => clearTimeout(timer);
  }, [isHost]);

  useEffect(() => {
    if (!isHost || !error) return;
    const retry = setTimeout(() => { advanceToRound1(); }, 1500);
    return () => clearTimeout(retry);
  }, [isHost, error]);

  return (
    <div className="screen-enter pop" style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative" }}>
      <LeaveGameButton lang={lang} />
      <span style={{ fontSize: 56 }}>{topPlayer && !isTie ? "💀" : "🔥"}</span>
      {topPlayer && !isTie && topCount >= 2 ? (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)" }}>
            {lang === "ar" ? "لاحظنا شي..." : "We noticed something..."}
          </p>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.5 }}>
            {lang === "ar"
              ? `يبدون الكل مركزين على ${topPlayer.nickname} 💀`
              : `Looks like everyone's really targeting ${topPlayer.nickname} 💀`}
          </h2>
        </>
      ) : (
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.5 }}>
          {lang === "ar" ? "الأصوات متوزعة بالتساوي 👀" : "Votes are pretty spread out 👀"}
        </h2>
      )}
      <div style={{ color: "var(--ink-soft)", height: 6, marginTop: 8 }}>
        <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
      </div>
      {error && (
        <p className="font-body" style={{ fontSize: 12, color: "#E63946", textAlign: "center" }}>{error}</p>
      )}
    </div>
  );
}
