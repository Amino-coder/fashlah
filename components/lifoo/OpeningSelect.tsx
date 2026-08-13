"use client";

import { useEffect, useState } from "react";
import { Music, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LIFOO_STR, LifooLang } from "@/lib/lifoo-i18n";
import { MAX_LINE_CHARS } from "@/lib/lifoo-song";
import LeaveGameButton from "@/components/LeaveGameButton";
import SongLine from "./SongLine";
import type { LifooSessionRow, LifooOpeningRow } from "@/lib/lifoo-types";

const CORAL = "#FF5A5F";
const NAVY = "#1B1030";

export default function OpeningSelect({
  session, isHost, myPlayerId, lang,
}: {
  session: LifooSessionRow;
  isHost: boolean;
  myPlayerId: string | null;
  lang: LifooLang;
}) {
  const t = LIFOO_STR[lang];
  const [openings, setOpenings] = useState<LifooOpeningRow[] | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [line1, setLine1] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("lifoo_openings")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      setOpenings((data as LifooOpeningRow[]) || []);
    })();
  }, []);

  async function chooseFamous(o: LifooOpeningRow) {
    if (!isHost || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase
      .from("lifoo_sessions")
      .update({
        opening_line1: o.line1,
        opening_line2: o.line2,
        opening_poet: o.poet,
        opening_category: o.category,
        opening_is_custom: false,
        opening_author_player_id: null,
        round_phase: "countdown",
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", session.id);
    if (err) { setError(err.message); setSubmitting(false); }
  }

  async function confirmCustom() {
    if (!isHost || submitting || !line1.trim() || !myPlayerId) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase
      .from("lifoo_sessions")
      .update({
        opening_line1: line1.trim().slice(0, MAX_LINE_CHARS),
        opening_line2: null,
        opening_poet: null,
        opening_category: null,
        opening_is_custom: true,
        opening_author_player_id: myPlayerId,
        round_phase: "countdown",
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", session.id);
    if (err) { setError(err.message); setSubmitting(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20, position: "relative" }}>
      <LeaveGameButton lang={lang} />
      <div className="screen-enter" style={{ textAlign: "center", marginBottom: 4 }}>
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

      {!isHost && (
        <div
          className="card pop"
          style={{ padding: 14, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}
        >
          {t.openingSelectWaitingHost}
        </div>
      )}

      {openings === null && (
        <div style={{ textAlign: "center", color: "var(--ink-soft)", marginTop: 20 }}>
          <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {openings?.map((o, i) => (
          <button
            key={o.id}
            onClick={() => chooseFamous(o)}
            disabled={!isHost || submitting}
            className="card pop tile-tap"
            style={{
              animationDelay: `${i * 70}ms`,
              padding: "22px 22px 18px",
              textAlign: "center",
              border: "1.5px solid rgba(255,90,95,0.28)",
              cursor: isHost && !submitting ? "pointer" : "default",
              opacity: submitting ? 0.6 : 1,
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

        {/* Custom opening card */}
        {!customOpen ? (
          <button
            onClick={() => isHost && setCustomOpen(true)}
            disabled={!isHost || submitting}
            className="card pop tile-tap"
            style={{
              animationDelay: `${(openings?.length ?? 0) * 70}ms`,
              padding: "26px 22px", textAlign: "center",
              border: "1.5px dashed rgba(255,90,95,0.45)",
              cursor: isHost && !submitting ? "pointer" : "default",
              opacity: submitting ? 0.6 : 1,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 999, display: "flex", alignItems: "center",
              justifyContent: "center", background: "rgba(255,90,95,0.14)",
            }}>
              <Plus size={20} color={CORAL} />
            </div>
            <span className="font-display" style={{ fontSize: 16, fontWeight: 800 }}>
              {t.customOpeningLabel}
            </span>
          </button>
        ) : (
          <div className="card pop" style={{ padding: 20, border: "1.5px solid rgba(255,90,95,0.3)" }}>
            <label
              htmlFor="lifoo-opening-line1"
              className="font-body"
              style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}
            >
              {t.lineLabel}
            </label>
            <textarea
              id="lifoo-opening-line1"
              value={line1}
              onChange={(e) => setLine1(e.target.value.slice(0, MAX_LINE_CHARS))}
              placeholder={t.linePh}
              dir="rtl"
              rows={3}
              autoFocus
              className="font-quote"
              style={{
                width: "100%", padding: 10, borderRadius: 14, border: "2px solid var(--ring)",
                background: "transparent", color: "var(--ink)", fontSize: 16, outline: "none",
                resize: "none", textAlign: "center", fontFamily: "inherit", marginBottom: 14,
              }}
            />
            <button
              onClick={confirmCustom}
              disabled={!line1.trim() || submitting}
              className="font-display"
              style={{
                width: "100%", padding: 14, fontSize: 15, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
                opacity: line1.trim() ? 1 : 0.5,
              }}
            >
              {t.customOpeningConfirm}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="font-body" style={{ color: "#E63946", fontSize: 12, textAlign: "center" }}>{error}</p>
      )}
    </div>
  );
}
