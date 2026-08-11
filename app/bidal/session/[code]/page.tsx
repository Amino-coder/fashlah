"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shuffle, Undo2, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import HexTile from "@/components/bidal/HexTile";
import { BIDAL_STR, BidalLang } from "@/lib/bidal-i18n";
import { usePrefs } from "@/lib/usePrefs";
import type { BidalSessionRow, BidalPlayerRow } from "@/lib/bidal-types";

const TEAL = "#14B8A6";
const CORAL = "#FF5A5F";
const INK = "#17122B";

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
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Selection (tap-to-select) and drag state for the honeycomb.
  const [selected, setSelected] = useState<{ letter: string; index: number } | null>(null);
  const [drag, setDrag] = useState<{ letter: string; index: number; x: number; y: number } | null>(null);
  const dragMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const wordRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const myPlayer = players.find((p) => p.user_id === myUserId) || null;
  const isHost = !!session && !!myUserId && session.host_user_id === myUserId;
  const isSolo = session?.mode === "solo";

  // ---- fetch + realtime + poll fallback (same pattern as every other game) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!cancelled) setMyUserId(authSession?.user.id || null);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadAll = useCallback(async () => {
    const { data: s } = await supabase.from("bidal_sessions").select("*").eq("code", code).maybeSingle();
    if (!s) { setError(t.errorGeneric); return; }
    setSession(s as BidalSessionRow);
    const { data: p } = await supabase.from("bidal_players").select("*").eq("session_id", s.id).order("joined_at");
    setPlayers((p as BidalPlayerRow[]) || []);
  }, [code, t.errorGeneric]);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel(`bidal-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bidal_sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "bidal_players" }, loadAll)
      .subscribe();
    const poll = setInterval(loadAll, 1200);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [code, loadAll]);

  // ---- host: start game ----
  async function handleStart() {
    if (!session) return;
    setStarting(true);
    try {
      await fetch("/api/bidal-start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
    } finally {
      setStarting(false);
    }
  }

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
    setSession((s) => (s ? { ...s, current_word: newWord } : s));
    setPlayers((ps) => ps.map((p) => (p.id === myPlayer.id ? { ...p, letters: removeOne(p.letters, letter) } : p)));

    await fetch("/api/bidal-move", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id, playerId: myPlayer.id,
        expectedWord: session.current_word, newWord, position, letter,
      }),
    }).catch(() => {});
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

  // ---- host undo ----
  async function handleUndo() {
    if (!session || !myUserId) return;
    await fetch("/api/bidal-undo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, hostUserId: myUserId }),
    }).catch(() => {});
    loadAll();
  }

  // ---- shuffle ----
  async function handleShuffle() {
    if (!session || !myUserId) return;
    await fetch("/api/bidal-shuffle", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, requesterUserId: myUserId, isSolo }),
    }).catch(() => {});
    loadAll();
  }

  // ---- solo timer ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (session?.status !== "in_progress" || !isSolo) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session?.status, isSolo]);

  const soloRemaining = useMemo(() => {
    if (!session?.started_at) return session?.time_limit_seconds ?? 90;
    const elapsed = (now - new Date(session.started_at).getTime()) / 1000;
    return Math.max(0, Math.ceil((session.time_limit_seconds || 90) - elapsed));
  }, [session, now]);

  // Solo timeout — client-detected and written directly (RLS already
  // permits this: in solo mode the lone player IS the host).
  useEffect(() => {
    if (!isSolo || session?.status !== "in_progress" || soloRemaining > 0) return;
    supabase.from("bidal_sessions").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", session!.id).then(() => loadAll());
  }, [isSolo, session, soloRemaining, loadAll]);

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error || !session) {
    return (
      <div dir={t.dir} style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Blobs />
        <HomeButton label={t.backHome} href="/bidal" />
      </div>
    );
  }

  const winner = session.winner_player_id ? players.find((p) => p.id === session.winner_player_id) : null;

  return (
    <div dir={t.dir} className="" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {session.status === "waiting" && <HomeButton label={t.backHome} href="/bidal" />}
      {session.status === "completed" && <HomeButton label={t.backHome} href="/bidal" />}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {session.status === "in_progress" && <LeaveGameButton lang={lang} />}

        {/* ---------------- LOBBY ---------------- */}
        {session.status === "waiting" && (
          <div className="screen-enter" style={{ marginTop: 40 }}>
            <p className="font-body" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{t.roomCode}</p>
            <button
              onClick={copyCode}
              className="font-mono"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "8px auto 28px",
                fontSize: 34, fontWeight: 800, letterSpacing: "0.2em", background: "none", border: "none", color: TEAL,
              }}
            >
              {code} {copied ? <Check size={22} /> : <Copy size={20} />}
            </button>

            <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 10 }}>
              {t.players} ({players.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {players.map((p) => (
                <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                  <span style={{ fontSize: 20 }}>{p.avatar_emoji}</span>
                  <span className="font-body" style={{ fontWeight: 700, fontSize: 14 }}>{p.nickname}</span>
                  {p.user_id === session.host_user_id && (
                    <span className="font-body" style={{ marginInlineStart: "auto", fontSize: 10, fontWeight: 800, color: TEAL }}>HOST</span>
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
                  background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, opacity: players.length < 2 || starting ? 0.5 : 1,
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

        {/* ---------------- RACING ---------------- */}
        {session.status === "in_progress" && session.current_word && myPlayer && (
          <div className="screen-enter" style={{ marginTop: 10 }}>
            {isSolo && (
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 30, fontWeight: 800, color: soloRemaining <= 10 ? CORAL : TEAL }}>
                  {soloRemaining}
                </span>
              </div>
            )}

            {!isSolo && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {players.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, background: "var(--card)", border: "1.5px solid var(--ring)" }}>
                    <span style={{ fontSize: 14 }}>{p.avatar_emoji}</span>
                    <span className="font-mono" style={{ fontSize: 12, fontWeight: 700 }}>{p.letters.length}</span>
                  </div>
                ))}
              </div>
            )}

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
              {isHost && !isSolo && (
                <button onClick={handleUndo} className="font-body" style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 999, border: "1.5px solid var(--ring)", background: "var(--card)", color: "var(--ink-soft)", fontSize: 11, fontWeight: 700 }}>
                  <Undo2 size={13} /> {t.undo}
                </button>
              )}
              {(isSolo || isHost) && (
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
              )}
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
        {session.status === "completed" && (
          <div className="screen-enter" style={{ marginTop: 90, textAlign: "center" }}>
            {isSolo ? (
              <SoloResult session={session} player={myPlayer} lang={lang} />
            ) : (
              <>
                <span className="pop" style={{ fontSize: 64, display: "block", marginBottom: 10 }}>🎉</span>
                <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
                  {winner ? `${winner.nickname} ${t.winnerAnnounce}` : t.winnerAnnounce}
                </h1>
              </>
            )}
            <Link
              href="/bidal"
              className="font-display"
              style={{
                display: "inline-block", marginTop: 26, padding: "15px 36px", fontSize: 15, borderRadius: 999, border: "none",
                color: "#fff", background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
              }}
            >
              {t.playAgain}
            </Link>
          </div>
        )}
      </div>
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

function SoloResult({ session, player, lang }: { session: BidalSessionRow; player: BidalPlayerRow | null; lang: string }) {
  const ar = lang === "ar";
  const won = !!player && player.letters.length === 0;
  const used = player ? 15 - player.letters.length : 0;
  const timeTaken = session.started_at && session.ended_at
    ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000)
    : null;

  return (
    <>
      <span className="pop" style={{ fontSize: 64, display: "block", marginBottom: 10 }}>{won ? "🏆" : "⏱️"}</span>
      <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        {won ? (ar ? "فزت! 🎉" : "You win! 🎉") : (ar ? "خلص الوقت!" : "Time's up!")}
      </h1>
      <div className="card pop" style={{ marginTop: 20, padding: 20, textAlign: "start" }}>
        <p className="font-body" style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 8px" }}>
          {ar ? `${used} حرف استخدمته من ١٥` : `${used} of 15 letters used`}
        </p>
        {won && timeTaken !== null && (
          <p className="font-body" style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>
            {ar ? `الوقت: ${timeTaken} ثانية` : `Time: ${timeTaken}s`}
          </p>
        )}
      </div>
    </>
  );
}
