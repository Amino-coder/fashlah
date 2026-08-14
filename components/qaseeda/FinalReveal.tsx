"use client";

import { useEffect, useRef, useState } from "react";
import { Feather } from "lucide-react";
import { QASEEDA_STR, QaseedaLang } from "@/lib/qaseeda-i18n";
import { playCelebration } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import { fetchPoemSoFarWithRetry, type PoemLine } from "@/lib/qaseeda-poem";
import ShatrLine from "./ShatrLine";
import PoemShareCard from "./PoemShareCard";
import { sharePoemCard } from "./exportPoemCard";
import { CARD_W, CARD_H } from "@/lib/qaseeda-card";
import EndGameShare from "@/components/EndGameShare";
import SaveResult from "@/components/auth/SaveResult";
import HomeButton from "@/components/HomeButton";
import type { QaseedaSessionRow, QaseedaPlayerRow } from "@/lib/qaseeda-types";

const GOLD = "#D9A441";
const NAVY = "#1B3A55";
const TOTAL_ROUNDS = 5;

export default function FinalReveal({
  session, players, isHost, lang,
}: {
  session: QaseedaSessionRow;
  players: QaseedaPlayerRow[];
  isHost: boolean;
  lang: QaseedaLang;
}) {
  const t = QASEEDA_STR[lang];
  // 0 = backdrop only, 1 = "صح لسانكم", 2/3 = title + poem revealing,
  // 4 = fully revealed + share card
  const [stage, setStage] = useState(0);
  const [poem, setPoem] = useState<PoemLine[] | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const fetchedRef = useRef(false);
  const completedRef = useRef(false);
  const celebrationPlayedRef = useRef(false);
  const { enabled: soundOn } = useSoundPref();

  const [scale, setScale] = useState(0.28);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [shareState, setShareState] = useState<"idle" | "working" | "downloaded" | "failed">("idle");

  // Fetched once, with retry — scoring for the final round is
  // fire-and-forget from RoundScreen, so this screen can mount slightly
  // before that last write lands.
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      const lines = await fetchPoemSoFarWithRetry(session, TOTAL_ROUNDS);
      setPoem(lines);
    })();
  }, [session.id]);

  // Staged intro: backdrop -> cheer -> title (poem reveal begins at stage 3).
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

  const totalLines = poem?.length ?? 0;

  // Auto-advance one poem line at a time; tapping anywhere reveals the
  // next one immediately, same pattern as شوفة's final recap.
  useEffect(() => {
    if (stage !== 3 || !poem || revealedCount >= totalLines) return;
    const id = setTimeout(() => setRevealedCount((v) => Math.min(v + 1, totalLines)), 1700);
    return () => clearTimeout(id);
  }, [stage, poem, revealedCount, totalLines]);

  function revealNext() {
    if (stage !== 3 || !poem) return;
    setRevealedCount((v) => Math.min(v + 1, totalLines));
  }

  // Once every line has shown, pause briefly then present the share card.
  useEffect(() => {
    if (stage !== 3 || !poem || totalLines === 0 || revealedCount < totalLines) return;
    const id = setTimeout(() => setStage(4), 1500);
    return () => clearTimeout(id);
  }, [stage, poem, revealedCount, totalLines]);

  // Host-only: mark the session completed once the share card is showing.
  // Any client reaching this stage marks the session completed — not
  // host-only. See شوفة's FinalReveal.tsx for the full reasoning.
  useEffect(() => {
    if (stage < 4 || completedRef.current) return;
    completedRef.current = true;
    fetch("/api/mark-session-completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "qaseeda_sessions", sessionId: session.id }),
    }).catch(() => {});
  }, [stage, session.id]);

  // Same literal-1080x1920-scaled-to-fit technique as عبارات's card.
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
    if (!poem || shareState === "working") return;
    setShareState("working");
    const result = await sharePoemCard(
      poem, session.code, t.finalCheer, t.poemTitle, t.shareCardTitle,
      players.map((p) => p.nickname)
    );
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
        background: `linear-gradient(160deg, ${NAVY} 0%, #0F1E30 45%, #0A1526 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "64px 20px 40px", cursor: stage === 3 ? "pointer" : "default",
        color: "#FBF6E9",
      }}
    >
      {stage >= 4 && <HomeButton label={t.backHome} />}

      {stage < 2 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          {stage >= 1 ? (
            <p className="font-display pop" style={{ fontSize: 30, fontWeight: 800, margin: 0, textAlign: "center" }}>
              {t.finalCheer} 👏
            </p>
          ) : (
            <div style={{ color: GOLD }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
        </div>
      )}

      {stage >= 2 && stage < 4 && (
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          <div className="pop" style={{ textAlign: "center" }}>
            <Feather size={26} color={GOLD} style={{ marginBottom: 8 }} />
            <p className="font-quote" style={{ fontSize: 30, fontWeight: 700, margin: 0, color: GOLD }}>
              {t.poemTitle}
            </p>
          </div>

          {!poem && (
            <div style={{ color: GOLD }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            {poem?.slice(0, revealedCount).map((line) => (
              <div key={line.round} className="pop" style={{ textAlign: "center" }}>
                <ShatrLine
                  line1={line.line1}
                  line2={line.line2}
                  fontSize={line.isOpening ? 18 : 17}
                  color="#FBF6E9"
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

          {poem && revealedCount < totalLines && (
            <p className="font-body" style={{ fontSize: 11, opacity: 0.55, textAlign: "center" }}>
              {t.tapToContinue}
            </p>
          )}
        </div>
      )}

      {stage >= 4 && poem && (
        <div className="screen-enter" style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div
            ref={stageRef}
            style={{ width: "100%", height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ filter: "drop-shadow(0 22px 48px rgba(0,0,0,0.4))" }}>
              <PoemShareCard
                poem={poem}
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
            game="qaseeda"
            lang={lang === "ar" ? "ar" : "en"}
            sessionCode={session.code}
            resultSummary={
              lang === "ar"
                ? `\u{1FAB6} كتبنا قصيدة من ${poem.length} بيت مع الشلة`
                : `\u{1FAB6} Wrote a ${poem.length}-verse poem with the group`
            }
          />

          <button
            onClick={onShare}
            disabled={shareState === "working"}
            className="font-display"
            style={{
              width: "100%", padding: 16, fontSize: 15, fontWeight: 800, borderRadius: 999,
              border: "none", color: "#fff", background: `linear-gradient(135deg, ${GOLD}, ${NAVY})`,
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
            <EndGameShare game="qaseeda" lang={lang} nextGame="bidal" />
          </div>
        </div>
      )}
    </div>
  );
}
