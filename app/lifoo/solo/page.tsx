"use client";

import { useEffect, useState } from "react";
import { Music, Plus, Share2, Check } from "lucide-react";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import EndGameShare from "@/components/EndGameShare";
import SaveResult from "@/components/auth/SaveResult";
import SongLine from "@/components/lifoo/SongLine";
import { shareSongCard } from "@/components/lifoo/exportSongCard";
import type { SongLine as SongLineType } from "@/lib/lifoo-song";
import { MAX_LINE_CHARS } from "@/lib/lifoo-song";
import { LIFOO_STR, LIFOO_STATIC_OPENINGS, LifooLang, LifooOpeningOption } from "@/lib/lifoo-i18n";
import { usePrefs } from "@/lib/usePrefs";
import { trackPageView, trackPageComplete, newSessionKey } from "@/lib/trackPageView";

const CORAL = "#FF5A5F";
const NAVY = "#1B1030";
const TOTAL_ROUNDS = 4;

/**
 * الِّفوا أغنية solo — fully local, no session/code at all, same pattern
 * as بدل الكلمة and شوفة solo: the ONLY thing that touches Supabase is
 * trackPageView/trackPageComplete (a fire-and-forget row in the existing
 * page_views table), purely so it's possible to see "people are playing
 * this" — never anything gameplay-affecting. The 3 starting verses are
 * the client's own copy (lib/lifoo-i18n.ts: LIFOO_STATIC_OPENINGS) of
 * what's seeded into lifoo_openings for multiplayer, so there's no
 * network round trip needed to show them here either.
 */
type Stage = "select" | "customInput" | "writing" | "results";
type Opening = { line1: string; line2: string | null; poet: string | null; category: string | null; isCustom: boolean };

export default function LifooSoloPage() {
  const { lang, dark, ready } = usePrefs();
  const t = LIFOO_STR[lang as LifooLang];
  const ar = lang === "ar";

  const [sessionKey] = useState(() => newSessionKey());
  useEffect(() => { trackPageView("lifoo_solo", sessionKey); }, [sessionKey]);

  const [stage, setStage] = useState<Stage>("select");
  const [opening, setOpening] = useState<Opening | null>(null);
  const [customLine1, setCustomLine1] = useState("");
  const [round, setRound] = useState(1);
  const [lines, setLines] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [shareState, setShareState] = useState<"idle" | "working" | "shared" | "downloaded" | "failed">("idle");
  const [cardCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());

  if (!ready) return null;

  function chooseFamous(o: LifooOpeningOption) {
    setOpening({ line1: o.line1, line2: o.line2, poet: o.poet, category: o.category, isCustom: false });
    setStage("writing");
  }

  function confirmCustom() {
    if (!customLine1.trim()) return;
    setOpening({
      line1: customLine1.trim().slice(0, MAX_LINE_CHARS),
      line2: null,
      poet: null, category: null, isCustom: true,
    });
    setStage("writing");
  }

  function submitLine() {
    if (!draft.trim()) return;
    const next = [...lines, draft.trim().slice(0, MAX_LINE_CHARS)];
    setLines(next);
    setDraft("");
    if (round < TOTAL_ROUNDS) {
      setRound((r) => r + 1);
    } else {
      trackPageComplete("lifoo_solo", sessionKey);
      setStage("results");
    }
  }

  const song: SongLineType[] = opening
    ? [
        { round: 0, line1: opening.line1, line2: opening.line2, authorName: opening.poet, isOpening: true, isCustomOpening: opening.isCustom, category: opening.category },
        ...lines.map((line, i) => ({ round: i + 1, line1: line, line2: null, authorName: null, isOpening: false, isCustomOpening: false, category: null })),
      ]
    : [];

  async function handleShare() {
    setShareState("working");
    const res = await shareSongCard(song, cardCode, t.finalCheer, t.poemTitle, t.shareCardTitle, []);
    setShareState(res === "failed" ? "failed" : res === "cancelled" ? "idle" : res);
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/lifoo" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>

        {/* ---------------- SELECT ---------------- */}
        {stage === "select" && (
          <div className="screen-enter" style={{ marginTop: 50 }}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 56, height: 56, borderRadius: 999, margin: "0 auto 10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${NAVY}, #0A0616)`,
                  boxShadow: `0 8px 22px ${NAVY}55`,
                }}
              >
                <Music size={24} color={CORAL} />
              </div>
              <p className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                {t.openingSelectTitle}
              </p>
              <p className="font-body" style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 0" }}>
                {t.openingSelectSub}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {LIFOO_STATIC_OPENINGS.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => chooseFamous(o)}
                  className="card pop tile-tap"
                  style={{
                    animationDelay: `${i * 70}ms`,
                    padding: "22px 22px 18px", textAlign: "center",
                    border: "1.5px solid rgba(255,90,95,0.28)", cursor: "pointer",
                  }}
                >
                  <span
                    className="font-body"
                    style={{
                      display: "inline-block", fontSize: 11, fontWeight: 800, letterSpacing: "0.03em",
                      color: CORAL, background: "rgba(255,90,95,0.12)", borderRadius: 999,
                      padding: "4px 12px", marginBottom: 14,
                    }}
                  >
                    {o.category}
                  </span>
                  <SongLine line1={o.line1} line2={o.line2} fontSize={18} />
                  <p className="font-body" style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12, fontWeight: 700 }}>
                    {t.poetLabel}: {o.poet}
                  </p>
                </button>
              ))}

              <button
                onClick={() => setStage("customInput")}
                className="card pop tile-tap"
                style={{
                  animationDelay: `${LIFOO_STATIC_OPENINGS.length * 70}ms`,
                  padding: "26px 22px", textAlign: "center",
                  border: "1.5px dashed rgba(255,90,95,0.45)", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,90,95,0.14)" }}>
                  <Plus size={20} color={CORAL} />
                </div>
                <span className="font-display" style={{ fontSize: 16, fontWeight: 800 }}>
                  {t.customOpeningLabel}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ---------------- CUSTOM STARTING VERSE ---------------- */}
        {stage === "customInput" && (
          <div className="screen-enter" style={{ marginTop: 50 }}>
            <p className="font-display" style={{ textAlign: "center", fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              {t.customOpeningLabel}
            </p>
            <div className="card pop" style={{ padding: 20, border: "1.5px solid rgba(255,90,95,0.3)" }}>
              <label htmlFor="lifoo-solo-line1" className="font-body" style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
                {t.lineLabel}
              </label>
              <textarea
                id="lifoo-solo-line1"
                value={customLine1}
                onChange={(e) => setCustomLine1(e.target.value.slice(0, MAX_LINE_CHARS))}
                placeholder={t.linePh}
                dir="rtl" rows={3} autoFocus
                className="font-quote"
                style={{ width: "100%", padding: 10, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 16, outline: "none", resize: "none", textAlign: "center", fontFamily: "inherit", marginBottom: 14 }}
              />
              <button
                onClick={confirmCustom}
                disabled={!customLine1.trim()}
                className="font-display"
                style={{
                  width: "100%", padding: 14, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                  background: `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
                  opacity: customLine1.trim() ? 1 : 0.5,
                }}
              >
                {t.customOpeningConfirm}
              </button>
            </div>
            <button
              onClick={() => setStage("select")}
              className="font-body"
              style={{ display: "block", margin: "16px auto 0", fontSize: 13, color: "var(--ink-soft)", background: "none", border: "none", textDecoration: "underline" }}
            >
              {ar ? "رجوع" : "Back"}
            </button>
          </div>
        )}

        {/* ---------------- WRITING ---------------- */}
        {stage === "writing" && opening && (
          <div className="screen-enter" style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <span className="font-body" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
                {ar ? `الجولة ${round} من ${TOTAL_ROUNDS}` : `Round ${round} of ${TOTAL_ROUNDS}`}
              </span>
            </div>

            <div className="card" style={{ padding: "18px 20px", maxHeight: 260, overflowY: "auto", border: "1px solid rgba(255,90,95,0.22)" }}>
              <p className="font-body" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: CORAL, margin: "0 0 10px", textAlign: "center" }}>
                {t.poemSoFar.toUpperCase()}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pop" style={{ textAlign: "center" }}>
                  <SongLine line1={opening.line1} line2={opening.line2} fontSize={16} />
                  <p className="font-body" style={{ fontSize: 11, color: "var(--ink-soft)", margin: "4px 0 0", fontWeight: 700 }}>
                    {opening.isCustom ? t.writtenByLabel : `${t.poetLabel}: ${opening.poet}`}
                  </p>
                </div>
                {lines.map((line, i) => (
                  <div key={i} className="pop" style={{ textAlign: "center" }}>
                    <SongLine line1={line} fontSize={15} />
                  </div>
                ))}
              </div>
            </div>

            <p className="font-display" style={{ textAlign: "center", fontSize: 16, fontWeight: 800, margin: 0 }}>
              {t.writeNextLine}
            </p>
            <div className="card" style={{ padding: 16 }}>
              <label htmlFor="lifoo-solo-round-line" className="font-body" style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
                {t.lineLabel}
              </label>
              <textarea
                id="lifoo-solo-round-line"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_LINE_CHARS))}
                rows={3} dir="rtl"
                placeholder={t.linePh}
                maxLength={MAX_LINE_CHARS}
                autoFocus
                className="font-quote"
                style={{ width: "100%", padding: 10, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 16, outline: "none", resize: "none", fontFamily: "inherit", textAlign: "center" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={submitLine}
                  disabled={!draft.trim()}
                  className="font-display"
                  style={{
                    padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff",
                    background: draft.trim() ? `linear-gradient(135deg, ${CORAL}, ${NAVY})` : "var(--ring)",
                    opacity: draft.trim() ? 1 : 0.6,
                  }}
                >
                  {round < TOTAL_ROUNDS ? t.submitLine : (ar ? "خلص الأغنية 🎉" : "Finish the song 🎉")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {stage === "results" && (
          <div className="screen-enter" style={{ marginTop: 30, textAlign: "center", paddingBottom: 30 }}>
            <span className="pop" style={{ fontSize: 50, display: "block", marginBottom: 10 }}>🎶</span>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
              {t.poemTitle}
            </h1>

            <div
              className="card pop"
              style={{ padding: "22px 18px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 18, background: `linear-gradient(135deg, ${CORAL}22, ${NAVY}22)` }}
            >
              {song.map((line, i) => (
                <SongLine key={i} line1={line.line1} line2={line.line2} fontSize={line.isOpening ? 18 : 16} />
              ))}
            </div>

            <SaveResult
              game="lifoo_solo"
              lang={ar ? "ar" : "en"}
              resultSummary={
                ar ? `\u{1F3B6} لفّيت أغنية من ${song.length} أسطر` : `\u{1F3B6} Built a ${song.length}-line song`
              }
            />

            <button
              onClick={handleShare}
              disabled={shareState === "working"}
              className="font-display"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 18, marginBottom: 10,
                padding: 16, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
              }}
            >
              {shareState === "shared" || shareState === "downloaded" ? <Check size={18} /> : <Share2 size={18} />}
              {shareState === "working" ? t.loading : shareState === "shared" ? t.copied : shareState === "downloaded" ? t.savedToDevice : t.shareCardBtn}
            </button>
            {shareState === "failed" && (
              <p className="font-body" style={{ fontSize: 12, color: "#E63946", marginBottom: 10 }}>{t.shareFailed}</p>
            )}

            <EndGameShare game="lifoo" lang={ar ? "ar" : "en"} nextGame="wadak" />
          </div>
        )}
      </div>
    </div>
  );
}
