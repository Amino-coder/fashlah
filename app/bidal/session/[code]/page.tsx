"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shuffle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import HexTile from "@/components/bidal/HexTile";
import { BIDAL_STR, BidalLang } from "@/lib/bidal-i18n";
import { usePrefs } from "@/lib/usePrefs";
import type { BidalSessionRow, BidalPlayerRow } from "@/lib/bidal-types";
import { computeBidalResult, formatDuration, type BidalMoveRow } from "@/lib/bidal-results";
import { shareBidalResultCard } from "@/components/bidal/exportResultCard";

const TEAL = "#14B8A6";
const CORAL = "#FF5A5F";

// بدل الكلمة is solo-only — every session created here is mode: "solo"
// (see app/bidal/solo/page.tsx) and starts at status "in_progress"
// directly, so this page never needs to render a multiplayer lobby,
// host controls, or another player's letter count. Supabase is still
// used underneath for move validation (bidal_attempt_move is the
// server-authoritative source of truth, so the client can't just fake
// a finish) and so results survive a refresh — removing it entirely
// would mean rebuilding that anti-cheat/persistence layer client-side,
// which is a bigger separate change.
export default function BidalSessionPage() {
  const params = useParams();
  const code = String(params.code).toUpperCase();
  const { lang } = usePrefs();
  const t = BIDAL_STR[lang as BidalLang];
  const ar = lang === "ar";

  const [session, setSession] = useState<BidalSessionRow | null>(null);
  const [players, setPlayers] = useState<BidalPlayerRow[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moves, setMoves] = useState<BidalMoveRow[]>([]);
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");

  // Selection (tap-to-select) and drag state for the honeycomb.
  const [selected, setSelected] = useState<{ letter: string; index: number } | null>(null);
  const [drag, setDrag] = useState<{ letter: string; index: number; x: number; y: number } | null>(null);
  const dragMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const wordRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const myPlayer = players.find((p) => p.user_id === myUserId) || null;

  // ---- fetch + poll (no realtime channel needed — solo means no other
  // player's write can ever land, so a shared postgres_changes
  // subscription would only ever be reconciling this same client's own
  // in-flight moves, which loadAll() already does right after each
  // move settles). ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!cancelled) setMyUserId(authSession?.user.id || null);
    })();
    return () => { cancelled = true; };
  }, []);

  // While a move is in flight, loadAll() bails out instead of refreshing —
  // otherwise a poll tick (every 1200ms) can land between the optimistic
  // update below and the server actually processing the move, fetching
  // the still-old current_word and snapping the UI back to it for a
  // moment before the real result arrives. That round-trip (new → old →
  // new again) is the flashing.
  const pendingMoveRef = useRef(false);

  const loadAll = useCallback(async () => {
    if (pendingMoveRef.current) return;
    const { data: s } = await supabase.from("bidal_sessions").select("*").eq("code", code).maybeSingle();
    if (!s) { setError(t.errorGeneric); return; }
    setSession(s as BidalSessionRow);
    const { data: p } = await supabase.from("bidal_players").select("*").eq("session_id", s.id).order("joined_at");
    setPlayers((p as BidalPlayerRow[]) || []);
  }, [code, t.errorGeneric]);

  useEffect(() => {
    loadAll();
    const poll = setInterval(loadAll, 1200);
    return () => clearInterval(poll);
  }, [code, loadAll]);

  // ---- attempt a move (shared by tap and drag paths) ----
  const attemptMove = useCallback(async (letter: string, position: number) => {
    if (!session || !myPlayer || !session.current_word) return;
    if (session.current_word[position] === letter) return; // no-op guard
    const chars = session.current_word.split("");
    chars[position] = letter;
    const newWord = chars.join("");

    // Optimistic local update — instant feedback; realtime/poll will
    // reconcile shortly after regardless of whether this specific
    // request wins the race.
    pendingMoveRef.current = true;
    setSession((s) => (s ? { ...s, current_word: newWord } : s));
    setPlayers((ps) => ps.map((p) => (p.id === myPlayer.id ? { ...p, letters: removeOne(p.letters, letter) } : p)));

    await fetch("/api/bidal-move", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id, playerId: myPlayer.id,
        expectedWord: session.current_word, newWord, position, letter,
      }),
    }).catch(() => {});
    pendingMoveRef.current = false;
    // Whether this specific attempt won or lost the race, the next
    // realtime/poll tick brings everyone back in sync with the server's
    // actual current_word — no special handling needed for the losing
    // case beyond that reconciliation.
    loadAll();
  }, [session, myPlayer, loadAll]);

  function handleLetterTap(letter: string, index: number) {
    if (selected?.index === index) { setSelected(null); return; }
    setSelected({ letter, index });
  }
  function handleWordTap(position: number) {
    if (!selected) return;
    attemptMove(selected.letter, position);
    setSelected(null);
  }

  // ---- drag (pointer events — works for touch and mouse alike) ----
  function handlePointerDown(e: React.PointerEvent, letter: string, index: number) {
    e.preventDefault();
    dragMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ letter, index, x: e.clientX, y: e.clientY });
    setSelected(null);

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - dragStart.current.x, dy = ev.clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) > 8) dragMoved.current = true;
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (dragMoved.current) {
        for (let pos = 0; pos < 3; pos++) {
          const el = wordRefs[pos].current;
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
            attemptMove(letter, pos);
            break;
          }
        }
      } else {
        handleLetterTap(letter, index);
      }
      setDrag(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  // ---- shuffle ----
  async function handleShuffle() {
    if (!session || !myUserId) return;
    await fetch("/api/bidal-shuffle", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, requesterUserId: myUserId, isSolo: true }),
    }).catch(() => {});
    loadAll();
  }

  // ---- timer ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (session?.status !== "in_progress") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session?.status]);

  const soloRemaining = useMemo(() => {
    if (!session?.started_at) return session?.time_limit_seconds ?? 50;
    const elapsed = (now - new Date(session.started_at).getTime()) / 1000;
    return Math.max(0, Math.ceil((session.time_limit_seconds || 50) - elapsed));
  }, [session, now]);

  // Timeout — client-detected and written directly (RLS already permits
  // this: the lone player IS the host).
  useEffect(() => {
    if (session?.status !== "in_progress" || soloRemaining > 0) return;
    supabase.from("bidal_sessions").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", session!.id).then(() => loadAll());
  }, [session, soloRemaining, loadAll]);

  useEffect(() => {
    if (session?.status !== "completed" || !session.id) return;
    supabase
      .from("bidal_moves")
      .select("move_index, player_id, prev_word, new_word, move_type, undone")
      .eq("session_id", session.id)
      .then(({ data }) => setMoves((data as BidalMoveRow[]) || []));
  }, [session?.status, session?.id]);

  async function handleShare(result: ReturnType<typeof computeBidalResult>) {
    setShareState("working");
    const res = await shareBidalResultCard(result, myPlayer?.nickname);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  if (error || !session) {
    return (
      <div dir={t.dir} style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Blobs />
        <HomeButton label={t.backHome} href="/bidal" />
      </div>
    );
  }

  return (
    <div dir={t.dir} className="" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {session.status === "completed" && <HomeButton label={t.backHome} href="/bidal" />}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {session.status === "in_progress" && <LeaveGameButton lang={lang} />}

        {/* ---------------- RACING ---------------- */}
        {session.status === "in_progress" && session.current_word && myPlayer && (
          <div className="screen-enter" style={{ marginTop: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span className="font-mono" style={{ fontSize: 30, fontWeight: 800, color: soloRemaining <= 10 ? CORAL : TEAL }}>
                {soloRemaining}
              </span>
            </div>


            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30 }}>
              {[0, 1, 2].map((pos) => (
                <div
                  key={pos}
                  ref={wordRefs[pos]}
                  onClick={() => handleWordTap(pos)}
                  className="pop"
                  style={{
                    width: 78, height: 90, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    background: selected ? `linear-gradient(135deg, ${TEAL}22, ${CORAL}22)` : "var(--card)",
                    border: selected ? `3px solid ${TEAL}` : "3px solid var(--ring)",
                    cursor: "pointer", transition: "border .12s, background .12s",
                  }}
                >
                  <span className="font-display" style={{ fontSize: 40, fontWeight: 800 }}>{session.current_word![pos]}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 22 }}>
              <button
                onClick={handleShuffle}
                disabled={session.shuffle_used}
                className="font-body"
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 999,
                  border: "1.5px solid var(--ring)", background: "var(--card)", color: "var(--ink-soft)", fontSize: 11, fontWeight: 700,
                  opacity: session.shuffle_used ? 0.4 : 1,
                }}
              >
                <Shuffle size={13} /> {t.shuffleLabel} ({session.shuffle_used ? 0 : 1})
              </button>
            </div>

            <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 14 }}>
              {t.yourLetters} — {myPlayer.letters.length} {t.remaining}
            </p>

            <Honeycomb
              letters={myPlayer.letters}
              selectedIndex={selected?.index ?? null}
              dragIndex={drag?.index ?? null}
              onPointerDown={handlePointerDown}
            />

            {drag && (
              <div style={{ position: "fixed", left: drag.x - 29, top: drag.y - 26, zIndex: 50, pointerEvents: "none" }}>
                <HexTile letter={drag.letter} size={58} bg={`linear-gradient(135deg, #FFD400, #FF8A3D)`} selected />
              </div>
            )}
          </div>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {session.status === "completed" && myPlayer && (
          <ResultsView
            session={session}
            myPlayer={myPlayer}
            players={players}
            moves={moves}
            shareState={shareState}
            onShare={handleShare}
            ar={ar}
          />
        )}
      </div>
    </div>
  );
}

function ResultsView({
  session, myPlayer, players, moves, shareState, onShare, ar,
}: {
  session: BidalSessionRow;
  myPlayer: BidalPlayerRow;
  players: BidalPlayerRow[];
  moves: BidalMoveRow[];
  shareState: "idle" | "working" | "shared" | "downloaded" | "failed";
  onShare: (result: ReturnType<typeof computeBidalResult>) => void;
  ar: boolean;
}) {
  const result = computeBidalResult(session, myPlayer, players, moves);

  return (
    <div className="screen-enter" style={{ marginTop: 40, textAlign: "center" }}>
      <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>بدل الكلمة</p>

      <div
        className="card pop"
        style={{
          marginTop: 14, padding: "32px 22px", borderRadius: 32, color: "#fff",
          background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
        }}
      >
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 20px" }}>
          {result.finished ? "🏆 خلصتها!" : `${result.lettersUsed}/${result.totalLetters} حروف`}
        </h1>

        {/* Word flow — the signature visual, right-to-left, wraps naturally */}
        <div dir="rtl" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 10px", marginBottom: 22 }}>
          {result.wordFlow.map((word, i) => (
            <span key={i} className="font-display" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, fontWeight: 800 }}>
              {word}
              {i < result.wordFlow.length - 1 && <span style={{ fontSize: 16, opacity: 0.7 }}>←</span>}
            </span>
          ))}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.25)", margin: "0 20px 18px" }} />

        {result.finished && result.completionSeconds !== null ? (
          <p className="font-body" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            {`انتهيت في ${formatDuration(result.completionSeconds)}`}
          </p>
        ) : (
          <>
            <p className="font-body" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>
              {`استخدمت ${result.lettersUsed}/${result.totalLetters} حرف`}
            </p>
            {result.remainingLetters.length > 0 && (
              <p className="font-display" style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                {`باقي لي: ${result.remainingLetters.join(" ")}`}
              </p>
            )}
          </>
        )}
      </div>

      <button
        onClick={() => onShare(result)}
        disabled={shareState === "working"}
        className="font-display"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 18,
          padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
          background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
        }}
      >
        {shareState === "working" ? "..." : shareState === "shared" ? "تم!" : shareState === "downloaded" ? "انحفظت الصورة!" : "شارك نتيجتك"}
      </button>

      <Link
        href="/bidal"
        className="font-display"
        style={{
          display: "inline-block", marginTop: 12, padding: "13px 36px", fontSize: 14, borderRadius: 999,
          border: "2px solid var(--ring)", color: "var(--ink)", background: "transparent",
        }}
      >
        {ar ? "العب مرة ثانية" : "Play Again"}
      </Link>
    </div>
  );
}

function removeOne(arr: string[], letter: string): string[] {
  const idx = arr.indexOf(letter);
  if (idx === -1) return arr;
  const copy = [...arr];
  copy.splice(idx, 1);
  return copy;
}

function Honeycomb({
  letters, selectedIndex, dragIndex, onPointerDown,
}: {
  letters: string[];
  selectedIndex: number | null;
  dragIndex: number | null;
  onPointerDown: (e: React.PointerEvent, letter: string, index: number) => void;
}) {
  const rowSize = 4;
  const rows: { letter: string; index: number }[][] = [];
  for (let i = 0; i < letters.length; i += rowSize) {
    rows.push(letters.slice(i, i + rowSize).map((letter, j) => ({ letter, index: i + j })));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: 6, marginTop: ri === 0 ? 0 : -12, marginInlineStart: ri % 2 === 1 ? 30 : 0 }}>
          {row.map(({ letter, index }) => (
            <HexTile
              key={index}
              letter={letter}
              size={58}
              selected={selectedIndex === index}
              dragging={dragIndex === index}
              onPointerDown={(e) => onPointerDown(e, letter, index)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
