"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import LeaveGameButton from "@/components/LeaveGameButton";
import HexTile from "@/components/bidal/HexTile";
import Honeycomb, { type BidalSlot } from "@/components/bidal/Honeycomb";
import { BIDAL_STR, BidalLang } from "@/lib/bidal-i18n";
import { usePrefs } from "@/lib/usePrefs";
import { drawLetters, pickStartingWord, SOLO_TIME_LIMIT_SECONDS } from "@/lib/bidal-letters";
import { formatDuration, type BidalResult } from "@/lib/bidal-results";
import { shareBidalResultCard } from "@/components/bidal/exportResultCard";
import { trackPageView, trackPageComplete, newSessionKey } from "@/lib/trackPageView";

const TEAL = "#14B8A6";
const CORAL = "#FF5A5F";
const TOTAL_LETTERS = 15;

/**
 * بدل الكلمة — fully local now. Everything that makes a "move" (does the
 * new word differ from the old one by exactly one letter, is the letter
 * actually in hand — see lib/bidal-letters.ts's header on why there's no
 * dictionary check at all) used to be re-verified server-side by
 * bidal_attempt_move because a winning move could come from ANY of
 * several concurrent players racing each other. With exactly one player
 * and no shared state to race over, that whole reason for a server round
 * trip is gone — the mechanics are simple enough that the browser is
 * just as authoritative as a server would be, so every move applies
 * directly to React state with no network call, no optimistic-then-
 * reconcile dance, and therefore nothing to flicker between old and new.
 *
 * The ONLY thing that still reaches Supabase is trackPageView/
 * trackPageComplete (lib/trackPageView.ts) — the same fire-and-forget,
 * un-awaited analytics ping وش شخصيتك and شوفة solo already use, writing
 * to the existing page_views table. It's there purely so it's possible
 * to see "people are opening and finishing this game" from the admin
 * side; it never gates or blocks anything the player does.
 */

type GameStatus = "playing" | "won" | "timeout";

type GameState = {
  currentWord: string;
  slots: BidalSlot[];
  wordFlow: string[];
  shuffleUsed: boolean;
  startTime: number;
};

function createGame(): GameState {
  const startingWord = pickStartingWord();
  return {
    currentWord: startingWord,
    slots: drawLetters(TOTAL_LETTERS).map((letter) => ({ letter, used: false })),
    wordFlow: [startingWord],
    shuffleUsed: false,
    startTime: Date.now(),
  };
}

export default function BidalSoloPage() {
  const { lang, dark, ready } = usePrefs();
  const t = BIDAL_STR[lang as BidalLang];
  const ar = lang === "ar";

  const [game, setGame] = useState<GameState>(() => createGame());
  const [status, setStatus] = useState<GameStatus>("playing");
  const [completionSeconds, setCompletionSeconds] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState(() => newSessionKey());
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");
  const completedRef = useRef(false);

  useEffect(() => { trackPageView("bidal_solo", sessionKey); }, [sessionKey]);

  // Selection (tap-to-select) and drag state for the honeycomb — both
  // reference letters by their fixed slot index now, not by letter value.
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ index: number; x: number; y: number } | null>(null);
  const dragMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const wordRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  function endGame(won: boolean) {
    if (completedRef.current) return;
    completedRef.current = true;
    if (won) setCompletionSeconds((Date.now() - game.startTime) / 1000);
    setStatus(won ? "won" : "timeout");
    trackPageComplete("bidal_solo", sessionKey);
  }

  // ---- attempt a move (shared by tap and drag paths) — synchronous, no
  // await anywhere in this path, so the word tile and the honeycomb gap
  // both update in the same render as the tap/drop itself. ----
  const attemptMove = useCallback((slotIndex: number, position: number) => {
    if (status !== "playing") return;
    const slot = game.slots[slotIndex];
    if (!slot || slot.used) return;
    if (game.currentWord[position] === slot.letter) return; // no-op guard: already that letter there

    const chars = game.currentWord.split("");
    chars[position] = slot.letter;
    const newWord = chars.join("");
    const newSlots = game.slots.map((s, i) => (i === slotIndex ? { ...s, used: true } : s));

    setGame((g) => ({ ...g, currentWord: newWord, slots: newSlots, wordFlow: [...g.wordFlow, newWord] }));

    const remaining = newSlots.filter((s) => !s.used).length;
    if (remaining === 0) endGame(true);
  }, [status, game, sessionKey]);

  function handleLetterTap(index: number) {
    if (selected === index) { setSelected(null); return; }
    setSelected(index);
  }
  function handleWordTap(position: number) {
    if (selected === null) return;
    attemptMove(selected, position);
    setSelected(null);
  }

  // ---- drag (pointer events — works for touch and mouse alike) ----
  function handlePointerDown(e: React.PointerEvent, index: number) {
    e.preventDefault();
    dragMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ index, x: e.clientX, y: e.clientY });
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
            attemptMove(index, pos);
            break;
          }
        }
      } else {
        handleLetterTap(index);
      }
      setDrag(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  // ---- shuffle — one-time, rearranges the 3 current letters only ----
  function handleShuffle() {
    if (status !== "playing" || game.shuffleUsed) return;
    const chars = game.currentWord.split("");
    let newWord = game.currentWord;
    for (let i = 0; i < 10 && newWord === game.currentWord; i++) {
      newWord = [...chars].sort(() => Math.random() - 0.5).join("");
    }
    setGame((g) => ({ ...g, currentWord: newWord, shuffleUsed: true, wordFlow: [...g.wordFlow, newWord] }));
  }

  // ---- timer ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [status]);

  const remaining = useMemo(
    () => Math.max(0, Math.ceil(SOLO_TIME_LIMIT_SECONDS - (now - game.startTime) / 1000)),
    [now, game.startTime]
  );

  useEffect(() => {
    if (status === "playing" && remaining <= 0) endGame(false);
  }, [remaining, status]);

  function handlePlayAgain() {
    completedRef.current = false;
    setGame(createGame());
    setStatus("playing");
    setCompletionSeconds(null);
    setShareState("idle");
    setSelected(null);
    setDrag(null);
    setSessionKey(newSessionKey()); // a fresh playthrough is a fresh tracked "view"
  }

  async function handleShare(result: BidalResult) {
    setShareState("working");
    const res = await shareBidalResultCard(result);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  if (!ready) return null;

  const remainingLetters = game.slots.filter((s) => !s.used).map((s) => s.letter);
  const result: BidalResult = {
    finished: status === "won",
    lettersUsed: TOTAL_LETTERS - remainingLetters.length,
    totalLetters: TOTAL_LETTERS,
    remainingLetters,
    completionSeconds,
    wordFlow: game.wordFlow,
    slots: game.slots,
  };

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {status !== "playing" && <HomeButton label={t.backHome} href="/bidal" />}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {status === "playing" && <LeaveGameButton lang={lang} />}

        {/* ---------------- RACING ---------------- */}
        {status === "playing" && (
          <div className="screen-enter" style={{ marginTop: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span className="font-mono" style={{ fontSize: 30, fontWeight: 800, color: remaining <= 10 ? CORAL : TEAL }}>
                {remaining}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 22 }}>
              {[0, 1, 2].map((pos) => (
                <div
                  key={pos}
                  ref={wordRefs[pos]}
                  onClick={() => handleWordTap(pos)}
                  className="pop"
                  style={{
                    width: 78, height: 90, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    background: selected !== null ? `linear-gradient(135deg, ${TEAL}22, ${CORAL}22)` : "var(--card)",
                    border: selected !== null ? `3px solid ${TEAL}` : "3px solid var(--ring)",
                    cursor: "pointer", transition: "border .12s, background .12s",
                  }}
                >
                  <span className="font-display" style={{ fontSize: 40, fontWeight: 800 }}>{game.currentWord[pos]}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 22 }}>
              <button
                onClick={handleShuffle}
                disabled={game.shuffleUsed}
                className="font-body"
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 999,
                  border: "1.5px solid var(--ring)", background: "var(--card)", color: "var(--ink-soft)", fontSize: 11, fontWeight: 700,
                  opacity: game.shuffleUsed ? 0.4 : 1,
                }}
              >
                <Shuffle size={13} /> {t.shuffleLabel} ({game.shuffleUsed ? 0 : 1})
              </button>
            </div>

            <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 14 }}>
              {t.yourLetters} — {remainingLetters.length} {t.remaining}
            </p>

            <Honeycomb
              slots={game.slots}
              selectedIndex={selected}
              dragIndex={drag?.index ?? null}
              onPointerDown={handlePointerDown}
            />

            {drag && (
              <div style={{ position: "fixed", left: drag.x - 29, top: drag.y - 26, zIndex: 50, pointerEvents: "none" }}>
                <HexTile letter={game.slots[drag.index].letter} size={58} bg={`linear-gradient(135deg, #FFD400, #FF8A3D)`} selected />
              </div>
            )}
          </div>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {status !== "playing" && (
          <ResultsView result={result} shareState={shareState} onShare={handleShare} ar={ar} />
        )}
      </div>
    </div>
  );
}

function ResultsView({
  result, shareState, onShare, onPlayAgain, ar,
}: {
  result: BidalResult;
  shareState: "idle" | "working" | "shared" | "downloaded" | "failed";
  onShare: (result: BidalResult) => void;
  onPlayAgain: () => void;
  ar: boolean;
}) {
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

      <SaveResult
        game="bidal_solo"
        lang={ar ? "ar" : "en"}
        resultSummary={
          result.finished && result.completionSeconds !== null
            ? (ar ? `\u{1F3C6} خلصتها في ${formatDuration(result.completionSeconds)}` : `\u{1F3C6} Finished in ${formatDuration(result.completionSeconds)}`)
            : (ar ? `${result.lettersUsed}/${result.totalLetters} حروف` : `${result.lettersUsed}/${result.totalLetters} letters`)
        }
      />

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

      <div style={{ marginTop: 18 }}>
        <EndGameShare game="bidal" lang={ar ? "ar" : "en"} nextGame="shofah" />
      </div>
    </div>
  );
}
