"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QISSA_STR, QissaLang } from "@/lib/qissa-i18n";
import { playCelebration } from "@/lib/sound-engine";
import { useSoundPref } from "@/lib/useSoundPref";
import { fetchAllStoriesWithRetry, type QissaStory } from "@/lib/qissa-story";
import EndGameShare from "@/components/EndGameShare";
import HomeButton from "@/components/HomeButton";
import type { QissaSessionRow, QissaPlayerRow } from "@/lib/qissa-types";

const ORANGE = "#FF8A3D";
const DEEP = "#E0409A";

export default function FinalReveal({
  session, players, isHost, lang,
}: {
  session: QissaSessionRow;
  players: QissaPlayerRow[];
  isHost: boolean;
  lang: QissaLang;
}) {
  const t = QISSA_STR[lang];
  // 0 = backdrop, 1 = cheer, 2 = story carousel, 3 = done / share screen
  const [stage, setStage] = useState(0);
  const [stories, setStories] = useState<QissaStory[] | null>(null);
  const [storyIdx, setStoryIdx] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [authorsShown, setAuthorsShown] = useState(false);

  const fetchedRef = useRef(false);
  const completedRef = useRef(false);
  const celebrationPlayedRef = useRef(false);
  const { enabled: soundOn } = useSoundPref();

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      const result = await fetchAllStoriesWithRetry(session, players.length);
      setStories(result);
    })();
  }, [session.id, players.length]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage < 2 || celebrationPlayedRef.current || !soundOn) return;
    celebrationPlayedRef.current = true;
    playCelebration();
  }, [stage, soundOn]);

  const totalStories = stories?.length ?? 0;
  const currentStory = stories?.[storyIdx];

  // Auto-pace within a story: reveal one more sentence every beat, then
  // the authors — but never auto-advance to the NEXT story, that always
  // needs a deliberate tap/swipe/button, so a big group's reveal doesn't
  // blow past a story before anyone's finished laughing at it.
  useEffect(() => {
    if (stage !== 2 || !currentStory) return;
    if (revealedCount < currentStory.sentences.length) {
      const id = setTimeout(() => setRevealedCount((v) => v + 1), 1600);
      return () => clearTimeout(id);
    }
    if (!authorsShown) {
      const id = setTimeout(() => setAuthorsShown(true), 1200);
      return () => clearTimeout(id);
    }
  }, [stage, currentStory, revealedCount, authorsShown]);

  function advance() {
    if (stage !== 2 || !currentStory) return;
    if (revealedCount < currentStory.sentences.length) { setRevealedCount((v) => v + 1); return; }
    if (!authorsShown) { setAuthorsShown(true); return; }
    goNextStory();
  }

  function goNextStory() {
    if (storyIdx + 1 >= totalStories) { setStage(3); return; }
    setStoryIdx((i) => i + 1);
    setRevealedCount(0);
    setAuthorsShown(false);
  }

  // Any client reaching this stage marks the session completed — not
  // host-only. See شوفة's FinalReveal.tsx for the full reasoning.
  useEffect(() => {
    if (stage < 3 || completedRef.current) return;
    completedRef.current = true;
    supabase.from("qissa_sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", session.id);
  }, [stage, session.id]);

  return (
    <div
      onClick={stage === 2 ? advance : undefined}
      className="screen-enter"
      style={{
        position: "fixed", inset: 0, zIndex: 40, overflowY: "auto",
        background: `linear-gradient(160deg, ${DEEP} 0%, #7C2D6B 55%, #2B0F26 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "64px 20px 40px", cursor: stage === 2 ? "pointer" : "default",
        color: "#FFF6EE",
      }}
    >
      {stage >= 3 && <HomeButton label={t.backHome} />}

      {stage < 2 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          {stage >= 1 ? (
            <p className="font-display pop" style={{ fontSize: 26, fontWeight: 800, margin: 0, textAlign: "center", maxWidth: 300 }}>
              {t.finalCheer} 📖
            </p>
          ) : (
            <div style={{ color: ORANGE }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          )}
        </div>
      )}

      {stage === 2 && (
        <div style={{ width: "100%", maxWidth: 480 }}>
          {!stories ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 100, color: ORANGE }}>
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                {stories.map((_, i) => (
                  <div key={i} className="story-seg">
                    <div className="story-seg-fill" style={{ width: i <= storyIdx ? "100%" : "0%", transition: "width .3s" }} />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <div key={storyIdx} className="pop" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen size={20} color={ORANGE} />
                  <p className="font-quote" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: ORANGE }}>
                    {t.storyLabel} {toArabicOrdinal(storyIdx + 1, lang)}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
                  {currentStory?.sentences.slice(0, revealedCount).map((sentence, i) => (
                    <div key={i} className="pop">
                      <p
                        className="font-quote"
                        dir="rtl"
                        style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.75, margin: 0, textAlign: "center" }}
                      >
                        {sentence || (lang === "ar" ? "( … )" : "( … )")}
                      </p>
                      {authorsShown && currentStory.authorNames[i] && (
                        <p
                          className="font-body pop"
                          style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.55, margin: "4px 0 0", textAlign: "center" }}
                        >
                          {t.writtenByLabel}: {currentStory.authorNames[i]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>


                {authorsShown && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goNextStory(); }}
                    className="font-display pop"
                    style={{
                      display: "flex", alignItems: "center", gap: 6, marginTop: 10,
                      padding: "10px 22px", fontSize: 13, fontWeight: 800, borderRadius: 999, border: "none",
                      color: DEEP, background: ORANGE,
                    }}
                  >
                    {storyIdx + 1 >= totalStories ? t.finishedAllStories : t.nextStory}
                    <ChevronLeft size={15} style={{ transform: lang === "ar" ? "none" : "rotate(180deg)" }} />
                  </button>
                )}

                {!(revealedCount >= (currentStory?.sentences.length ?? 0) && authorsShown) && (
                  <p className="font-body" style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{t.tapToContinue}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {stage >= 3 && (
        <div className="screen-enter" style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 40 }}>
          <span style={{ fontSize: 48 }}>🎉</span>
          <p className="font-display" style={{ fontSize: 20, fontWeight: 800, textAlign: "center", margin: 0 }}>
            {t.finishedAllStories}
          </p>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
            <EndGameShare game="qissa" lang={lang} nextGame="shofah" />
          </div>
        </div>
      )}
    </div>
  );
}

function toArabicOrdinal(n: number, lang: QissaLang): string {
  if (lang !== "ar") return String(n);
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).split("").map((d) => digits[Number(d)]).join("");
}
