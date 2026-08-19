"use client";

import { useEffect, useRef, useState } from "react";
import { Music } from "lucide-react";
import { LIFOO_STR, LifooLang } from "@/lib/lifoo-i18n";
import { playCelebration } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import { fetchSongSoFarWithRetry, type SongLine as SongLineType } from "@/lib/lifoo-song";
import SongLine from "./SongLine";
import SongShareCard from "./SongShareCard";
import { shareSongCard } from "./exportSongCard";
import { CARD_W, CARD_H } from "@/lib/lifoo-card";
import EndGameShare from "@/components/EndGameShare";
import SaveResult from "@/components/auth/SaveResult";
import HomeButton from "@/components/HomeButton";
import { trackPageEvent } from "@/lib/trackPageView";
import type { LifooSessionRow, LifooPlayerRow } from "@/lib/lifoo-types";

const CORAL = "#FF5A5F";
const NAVY = "#1B1030";
const TOTAL_ROUNDS = 4;

export default function FinalReveal({
  session, players, isHost, lang,
}: {
  session: LifooSessionRow;
  players: LifooPlayerRow[];
  isHost: boolean;
  lang: LifooLang;
}) {
  const t = LIFOO_STR[lang];
  const [stage, setStage] = useState(0);
  const [song, setSong] = useState<SongLineType[] | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const fetchedRef = useRef(false);
  const completedRef = useRef(false);
  const celebrationPlayedRef = useRef(false);
  const { enabled: soundOn } = useSoundPref();

  const [scale, setScale] = useState(0.28);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [shareState, setShareState] = useState<"idle" | "working" | "downloaded" | "failed">("idle");

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      const lines = await fetchSongSoFarWithRetry(session, TOTAL_ROUNDS);
      setSong(lines);
    })();
  }, [session.id]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 2300),
      setTimeout(() => setStage(3), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage < 3 || celebrationPlayedRef.current || !soundOn) return;
    celebrationPlayedRef.current = true;
    playCelebration();
  }, [stage, soundOn]);

  const totalLines = song?.length ?? 0;

  useEffect(() => {
    if (stage !== 3 || !song || revealedCount >= totalLines) return;
    const id = setTimeout(() => setRevealedCount((v) => Math.min(v + 1, totalLines)), 1700);
    return () => clearTimeout(id);
  }, [stage, song, revealedCount, totalLines]);

  function revealNext() {
    if (stage !== 3 || !song) return;
    setRevealedCount((v) => Math.min(v + 1, totalLines));
  }

  useEffect(() => {
    if (stage !== 3 || !song || totalLines === 0 || revealedCount < totalLines) return;
    const id = setTimeout(() => setStage(4), 1500);
    return () => clearTimeout(id);
  }, [stage, song, revealedCount, totalLines]);

  // Any client reaching this point marks the session completed — not
  // host-only (see شوفة's FinalReveal.tsx for the host-only reasoning).
  // Fires the moment `song` is fetched, NOT gated on stage>=4 anymore —
  // reaching that stage required tapping through every line of the
  // reveal first. Confirmed via شوفة's data that gating this on the
  // reveal finishing causes real completed games to go unmarked.
  useEffect(() => {
    if (!song || completedRef.current) return;
    completedRef.current = true;
    fetch("/api/mark-session-completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "lifoo_sessions", sessionId: session.id }),
    }).catch(() => {});
  }, [song, session.id]);

  useEffect(() => {
    if (stage < 4) return;
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setScale(Math.min(width / CARD_W, height / CARD_H, 0.42));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage]);

  async function onShare() {
    if (!song || shareState === "working") return;
    setShareState("working");
    const result = await shareSongCard(
      song, session.code, t.finalCheer, t.poemTitle, t.shareCardTitle,
      players.map((p) => p.nickname)
    );
    if (result === "shared" || result === "downloaded") trackPageEvent("lifoo", `share_result_${result}`);
    if (result === "downloaded") setShareState("downloaded");
    else if (result === "failed") setShareState("failed");
    else setShareState("idle");
  }

  return (
    <div
      onClick={stage === 3 ? revealNext : undefined}
      className="screen-enter"
      style={{
        position: "fixed", inset: 0, zIndex: 40, overflowY: "auto",
        background: `linear-gradient(160deg, ${NAVY} 0%, #150C24 45%, #0A0616 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "64px 20px 40px", cursor: stage === 3 ? "pointer" : "default",
        color: "#FFF3E8",
      }}
    >
      {stage >= 4 && <HomeButton label={t.backHome} />}

      {stage < 2 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          {stage >= 1 ? (
            <p className="font-display pop" style={{ fontSize: 30, fontWeight: 800, margin: 0, textAlign: "center" }}>
              {t.finalCheer} 🎉
            </p>
          ) : (
            <div style={{ color: CORAL }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
        </div>
      )}

      {stage >= 2 && stage < 4 && (
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          <div className="pop" style={{ textAlign: "center" }}>
            <Music size={26} color={CORAL} style={{ marginBottom: 8 }} />
            <p className="font-quote" style={{ fontSize: 30, fontWeight: 700, margin: 0, color: CORAL }}>
              {t.poemTitle}
            </p>
          </div>

          {!song && (
            <div style={{ color: CORAL }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            {song?.slice(0, revealedCount).map((line) => (
              <div key={line.round} className="pop" style={{ textAlign: "center" }}>
                <SongLine
                  line1={line.line1}
                  line2={line.line2}
                  fontSize={line.isOpening ? 18 : 17}
                  color="#FFF3E8"
                />
                {line.authorName && (
                  <p className="font-body" style={{ fontSize: 12, opacity: 0.75, margin: "6px 0 0", fontWeight: 600 }}>
                    {line.isOpening
                      ? `${line.isCustomOpening ? t.writtenByLabel : t.poetLabel}: ${line.authorName}`
                      : `${t.writtenBy}: ${line.authorName}`}
                  </p>
                )}
              </div>
            ))}
          </div>

          {song && revealedCount < totalLines && (
            <p className="font-body" style={{ fontSize: 11, opacity: 0.55, textAlign: "center" }}>
              {t.tapToContinue}
            </p>
          )}
        </div>
      )}

      {stage >= 4 && song && (
        <div className="screen-enter" style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div
            ref={stageRef}
            style={{ width: "100%", height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ filter: "drop-shadow(0 22px 48px rgba(0,0,0,0.4))" }}>
              <SongShareCard
                song={song}
                code={session.code}
                cheerLabel={t.finalCheer}
                titleLabel={t.poemTitle}
                creditLabel={t.shareCardTitle}
                playerNames={players.map((p) => p.nickname)}
                scale={scale}
              />
            </div>
          </div>

          <SaveResult
            game="lifoo"
            lang={lang === "ar" ? "ar" : "en"}
            sessionCode={session.code}
            resultSummary={
              lang === "ar"
                ? `\u{1F3B6} لفّينا أغنية من ${song.length} أسطر مع الشلة`
                : `\u{1F3B6} Built a ${song.length}-line song with the group`
            }
          />

          <button
            onClick={onShare}
            disabled={shareState === "working"}
            className="font-display"
            style={{
              width: "100%", padding: 16, fontSize: 15, fontWeight: 800, borderRadius: 999,
              border: "none", color: "#fff", background: `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
              boxShadow: `0 10px 26px ${NAVY}55`, opacity: shareState === "working" ? 0.75 : 1,
            }}
          >
            {shareState === "working" ? t.loading : t.shareCardBtn}
          </button>

          <p
            aria-live="polite"
            className="font-body"
            style={{ margin: 0, textAlign: "center", fontSize: 12, fontWeight: 600, minHeight: 16, opacity: 0.8 }}
          >
            {shareState === "downloaded" && t.savedToDevice}
            {shareState === "failed" && t.shareFailed}
          </p>

          <div style={{ marginTop: 6, opacity: 0.9 }}>
            <EndGameShare game="lifoo" lang={lang} nextGame="bidal" playAgainHref="/lifoo/create" />
          </div>
        </div>
      )}
    </div>
  );
}
