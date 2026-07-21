"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/i18n";
import Mascot from "@/components/Mascot";
import Results from "@/components/results/Results";
import type { PlayerRow, SessionRow } from "@/lib/types";

export default function WaitingForResults({
  session,
  player,
  players,
  lang,
}: {
  session: SessionRow;
  player: PlayerRow;
  players: PlayerRow[];
  lang: Lang;
}) {
  const [summary, setSummary] = useState<any | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [stuck, setStuck] = useState(false);

  const everyoneDone = players.length > 0 && players.every((p) => p.current_round >= 4);

  function log(line: string) {
    setDebug((d) => [...d, line]);
  }

  async function tryFetchResults() {
    setBusy(true);
    setAttempted(true);
    setStuck(false);
    try {
      const { data: existing, error: existingErr } = await supabase
        .from("game_history")
        .select("summary")
        .eq("session_id", session.id)
        .order("played_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingErr) log(`Read error: ${existingErr.message} (code ${existingErr.code})`);

      if (existing?.summary) {
        setSummary(existing.summary);
        setBusy(false);
        return;
      }

      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.id }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        log(`Scoring engine error: ${res.status} ${JSON.stringify(body)}`);
        setStuck(true);
        setBusy(false);
        return;
      }

      for (let attempt = 0; attempt < 8; attempt++) {
        const { data, error } = await supabase
          .from("game_history")
          .select("summary")
          .eq("session_id", session.id)
          .order("played_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) log(`Poll ${attempt + 1} error: ${error.message}`);
        if (data?.summary) {
          setSummary(data.summary);
          setBusy(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 600));
      }
      log("No results after polling — scoring may have failed silently.");
      setStuck(true);
    } catch (e: any) {
      log(`Unexpected error: ${e?.message || String(e)}`);
      setStuck(true);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (everyoneDone && !attempted && !busy) {
      tryFetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyoneDone]);

  if (summary) {
    return <Results summary={summary} session={session} player={player} lang={lang} />;
  }

  const doneCount = players.filter((p) => p.current_round >= 4).length;

  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <Mascot mood="wink" size={70} className="bounce" />
      <p className="font-body" style={{ marginTop: 14, fontWeight: 700, color: "var(--ink-soft)" }}>
        {lang === "ar" ? "بانتظار البقية يخلصون... 🌿" : "Waiting for the rest of the group... 🌿"}
      </p>
      <p className="font-body" style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>
        {doneCount} / {players.length} {lang === "ar" ? "خلصوا" : "finished"}
      </p>

      {stuck && (
        <>
          <p style={{ color: "#FF2E93", fontWeight: 700, marginTop: 16, fontSize: 13 }}>
            {lang === "ar" ? "صار خطأ، جرب مرة ثانية" : "Something went wrong — try again"}
          </p>
          <button
            onClick={tryFetchResults}
            disabled={busy}
            className="btn-primary font-display"
            style={{ padding: "12px 24px", fontSize: 14, marginTop: 12 }}
          >
            {busy ? (lang === "ar" ? "جاري التحقق..." : "Checking...") : (lang === "ar" ? "حاول مرة ثانية" : "Try again")}
          </button>
          {debug.length > 0 && (
            <div
              className="font-mono"
              style={{
                marginTop: 20, textAlign: "start", fontSize: 11, background: "var(--card)",
                border: "1px solid var(--ring)", borderRadius: 12, padding: 12, color: "var(--ink-soft)",
                maxHeight: 200, overflowY: "auto",
              }}
            >
              {debug.map((line, i) => (
                <div key={i} style={{ marginBottom: 4 }}>{line}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
