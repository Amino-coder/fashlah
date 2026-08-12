"use client";

import { useEffect, useState } from "react";
import { trackPageView } from "@/lib/trackPageView";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import DemoEndScreen from "@/components/demo/DemoEndScreen";
import { DEMO_BOT_NAMES, FASHLAH_TRAITS, FASHLAH_OPEN_TEXT_ANSWERS, pickTwoDistinct, pickOne } from "@/lib/demo/demoContent";

const PINK = "#FF2E93";
const PURPLE = "#7C3AED";

/**
 * فشلة isn't one round loop like the other four games' demos — it's four
 * genuinely different mechanics back to back (solo trait quiz, "who's
 * most likely" player voting, agree/disagree hot takes, would-you-rather
 * + fill-in-the-blank). So unlike useDemoRoundGame (built for the shared
 * write→vote loop), this is a bespoke, self-contained implementation —
 * still zero Supabase writes, still isolated from the real multiplayer
 * flow (doesn't import from components/rounds/ or app/fashlah/session/).
 *
 * No countdown timer here, matching the real Round1-4 components exactly
 * — they're self-paced (advance on selection, no timer pressure), so the
 * demo follows suit rather than inventing pressure that isn't in the
 * actual game.
 *
 * The one read-only exception: fetches real questions from `questions`
 * (public SELECT, pack slug "friends" — the same pack every real game
 * uses) for all 4 rounds, so the human plays the actual game's content.
 * The two bots get predetermined answers — fixed personality traits for
 * Round 1, random-but-independent picks for Rounds 2-4 (never reactive to
 * the human's own answers) — and everything is shown together in a
 * results summary at the end, per how this was scoped.
 */

type Option = { id: string; emoji?: string; text_ar?: string; trait_weights?: Record<string, number> };
type Question = { id: string; round: number; question_type: string; text_ar: string; options: Option[] };

type Stage = "loading" | "error" | "round1" | "round2" | "round3" | "round4" | "results";

type Round2Result = { question: Question; votes: Record<string, string> }; // playerId -> votedForPlayerId
type Round3Result = { question: Question; stances: Record<string, "agree" | "disagree"> };
type Round4Choice = { question: Question; type: "this_or_that"; picks: Record<string, string> };
type Round4Text = { question: Question; type: "open_text"; texts: Record<string, string> };

export default function FashlahDemoPage() {
  useEffect(() => { trackPageView("fashlah_demo"); }, []);
  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState<string | null>(null);

  const [bot1] = useState(() => pickTwoDistinct(DEMO_BOT_NAMES)[0]);
  const [bot2] = useState(() => pickTwoDistinct(DEMO_BOT_NAMES)[1]);
  const players = { human: "أنت", "bot-a": bot1, "bot-b": bot2 };

  const [q1, setQ1] = useState<Question[]>([]);
  const [q2, setQ2] = useState<Question[]>([]);
  const [q3, setQ3] = useState<Question[]>([]);
  const [q4, setQ4] = useState<Question[]>([]);

  // Round 1 (solo trait quiz)
  const [r1Idx, setR1Idx] = useState(0);
  const [r1Selected, setR1Selected] = useState<string | null>(null);
  const [humanTraitTally, setHumanTraitTally] = useState<Record<string, number>>({});
  const [botTraits] = useState(() => pickTwoDistinct(FASHLAH_TRAITS));

  // Round 2 ("who's most likely")
  const [r2Idx, setR2Idx] = useState(0);
  const [r2Selected, setR2Selected] = useState<string | null>(null);
  const [r2Results, setR2Results] = useState<Round2Result[]>([]);

  // Round 3 (hot takes)
  const [r3Idx, setR3Idx] = useState(0);
  const [r3Selected, setR3Selected] = useState<"agree" | "disagree" | null>(null);
  const [r3Results, setR3Results] = useState<Round3Result[]>([]);

  // Round 4 (WYR + open text)
  const [r4Idx, setR4Idx] = useState(0);
  const [r4Selected, setR4Selected] = useState<string | null>(null);
  const [r4Text, setR4Text] = useState("");
  const [r4Results, setR4Results] = useState<(Round4Choice | Round4Text)[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: pack, error: packErr } = await supabase.from("question_packs").select("id").eq("slug", "friends").single();
        if (packErr || !pack) throw packErr || new Error("no pack");

        const fetchRound = async (round: number) => {
          const { data, error } = await supabase.from("questions").select("id, round, question_type, text_ar, options").eq("pack_id", pack.id).eq("round", round).eq("enabled", true);
          if (error || !data) throw error || new Error(`no questions for round ${round}`);
          return data as Question[];
        };

        const [round1All, round2All, round3All, round4All] = await Promise.all([1, 2, 3, 4].map(fetchRound));

        setQ1([...round1All].sort(() => Math.random() - 0.5).slice(0, 5));
        setQ2([...round2All].sort(() => Math.random() - 0.5).slice(0, 6));
        setQ3([...round3All].sort(() => Math.random() - 0.5).slice(0, 3));

        const wyr = round4All.filter((q) => q.question_type === "this_or_that").sort(() => Math.random() - 0.5).slice(0, 4);
        const text = round4All.filter((q) => q.question_type === "open_text").sort(() => Math.random() - 0.5).slice(0, 3);
        setQ4([...wyr, ...text]);

        setStage("round1");
      } catch {
        setError("تعذّر تحميل الأسئلة، حاول مرة ثانية");
        setStage("error");
      }
    })();
  }, []);

  // ---- Round 1 ----
  function pickR1(option: Option) {
    if (r1Selected) return;
    setR1Selected(option.id);
    const nextTally = { ...humanTraitTally };
    if (option.trait_weights) {
      for (const [trait, weight] of Object.entries(option.trait_weights)) nextTally[trait] = (nextTally[trait] || 0) + weight;
    }
    setHumanTraitTally(nextTally);
    setTimeout(() => {
      if (r1Idx + 1 < q1.length) { setR1Idx((i) => i + 1); setR1Selected(null); }
      else setStage("round2");
    }, 380);
  }

  // ---- Round 2 ----
  function pickR2(votedForId: string) {
    if (r2Selected) return;
    setR2Selected(votedForId);
    const botVotes: Record<string, string> = {
      "bot-a": pickOne(["human", "bot-a", "bot-b"]),
      "bot-b": pickOne(["human", "bot-a", "bot-b"]),
    };
    const question = q2[r2Idx];
    setR2Results((prev) => [...prev, { question, votes: { human: votedForId, ...botVotes } }]);
    setTimeout(() => {
      if (r2Idx + 1 < q2.length) { setR2Idx((i) => i + 1); setR2Selected(null); }
      else setStage("round3");
    }, 380);
  }

  // ---- Round 3 ----
  function pickR3(stance: "agree" | "disagree") {
    if (r3Selected) return;
    setR3Selected(stance);
    const question = q3[r3Idx];
    setR3Results((prev) => [...prev, { question, stances: { human: stance, "bot-a": pickOne(["agree", "disagree"]), "bot-b": pickOne(["agree", "disagree"]) } }]);
    setTimeout(() => {
      if (r3Idx + 1 < q3.length) { setR3Idx((i) => i + 1); setR3Selected(null); }
      else setStage("round4");
    }, 380);
  }

  // ---- Round 4 ----
  function goNextR4() {
    setTimeout(() => {
      if (r4Idx + 1 < q4.length) { setR4Idx((i) => i + 1); setR4Selected(null); setR4Text(""); }
      else setStage("results");
    }, 380);
  }
  function pickR4Choice(optionId: string) {
    if (r4Selected) return;
    setR4Selected(optionId);
    const question = q4[r4Idx];
    const [ida, idb] = question.options.map((o) => o.id);
    setR4Results((prev) => [...prev, { question, type: "this_or_that", picks: { human: optionId, "bot-a": pickOne([ida, idb]), "bot-b": pickOne([ida, idb]) } }]);
    goNextR4();
  }
  function submitR4Text() {
    if (!r4Text.trim()) return;
    const question = q4[r4Idx];
    const [botAns1, botAns2] = pickTwoDistinct(FASHLAH_OPEN_TEXT_ANSWERS);
    setR4Results((prev) => [...prev, { question, type: "open_text", texts: { human: r4Text.trim(), "bot-a": botAns1, "bot-b": botAns2 } }]);
    goNextR4();
  }

  const progressCard = (idx: number, total: number, title: string) => (
    <>
      <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>{title}</p>
      <div className="progress-track" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${Math.round((idx / total) * 100)}%` }} />
      </div>
    </>
  );

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      {stage !== "results" && <HomeButton label="الصفحة الرئيسية" />}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {stage !== "results" && (
          <p className="font-body" style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: PINK, letterSpacing: "0.08em", marginTop: 40, marginBottom: 12, textTransform: "uppercase" }}>
            وضع التجربة
          </p>
        )}

        {stage === "loading" && (
          <div style={{ textAlign: "center", marginTop: 100, color: PINK }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        )}

        {stage === "error" && (
          <p style={{ color: PINK, fontWeight: 700, textAlign: "center", marginTop: 60 }}>{error}</p>
        )}

        {stage === "round1" && q1[r1Idx] && (
          <div className="screen-enter">
            {progressCard(r1Idx + (r1Selected ? 1 : 0), q1.length, "الجولة ١: عنك")}
            <div className="card pop" style={{ padding: 26, textAlign: "center" }}>
              <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{r1Idx + 1} / {q1.length}</p>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 22px" }}>{q1[r1Idx].text_ar}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {q1[r1Idx].options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => pickR1(o)}
                    disabled={!!r1Selected}
                    style={{
                      padding: "18px 8px", borderRadius: 18, border: "2px solid var(--ring)",
                      background: r1Selected === o.id ? `linear-gradient(135deg, ${PINK}, ${PURPLE})` : "var(--card)",
                      color: r1Selected === o.id ? "#fff" : "var(--ink)",
                      display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
                      opacity: r1Selected && r1Selected !== o.id ? 0.5 : 1,
                    }}
                  >
                    {o.emoji && <span style={{ fontSize: 26 }}>{o.emoji}</span>}
                    <span className="font-body" style={{ fontWeight: 700, fontSize: 12.5 }}>{o.text_ar}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {stage === "round2" && q2[r2Idx] && (
          <div className="screen-enter">
            {progressCard(r2Idx + (r2Selected ? 1 : 0), q2.length, "الجولة ٢: صوّتوا لأصحابكم")}
            <div className="card pop" style={{ padding: 26, textAlign: "center" }}>
              <p className="font-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13 }}>مين الأغلب يسوي كذا؟</p>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: "8px 0 22px" }}>{q2[r2Idx].text_ar}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {(["human", "bot-a", "bot-b"] as const).map((pid) => (
                  <button
                    key={pid}
                    onClick={() => pickR2(pid)}
                    disabled={!!r2Selected}
                    style={{
                      padding: "14px 6px", borderRadius: 16, border: "2px solid var(--ring)",
                      background: r2Selected === pid ? `linear-gradient(135deg, ${PINK}, ${PURPLE})` : "var(--card)",
                      color: r2Selected === pid ? "#fff" : "var(--ink)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      opacity: r2Selected && r2Selected !== pid ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{pid === "human" ? "😎" : "🧔🏻"}</span>
                    <span className="font-body" style={{ fontSize: 11, fontWeight: 700 }}>{pid === "human" ? "أنت" : players[pid]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {stage === "round3" && q3[r3Idx] && (
          <div className="screen-enter">
            {progressCard(r3Idx + (r3Selected ? 1 : 0), q3.length, "الجولة ٣: آراء جريئة")}
            <div className="card pop" style={{ padding: 26, textAlign: "center" }}>
              {q3[r3Idx].options[0]?.emoji && <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>{q3[r3Idx].options[0].emoji}</span>}
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 24px" }}>{q3[r3Idx].text_ar}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button onClick={() => pickR3("agree")} disabled={!!r3Selected} className="font-display" style={{ padding: "18px 8px", borderRadius: 18, border: "2px solid var(--ring)", background: r3Selected === "agree" ? "linear-gradient(135deg, #2EE6A6, #7C3AED)" : "var(--card)", color: r3Selected === "agree" ? "#fff" : "var(--ink)", fontWeight: 800, opacity: r3Selected && r3Selected !== "agree" ? 0.5 : 1 }}>
                  👍 أوافق
                </button>
                <button onClick={() => pickR3("disagree")} disabled={!!r3Selected} className="font-display" style={{ padding: "18px 8px", borderRadius: 18, border: "2px solid var(--ring)", background: r3Selected === "disagree" ? `linear-gradient(135deg, ${PINK}, ${PURPLE})` : "var(--card)", color: r3Selected === "disagree" ? "#fff" : "var(--ink)", fontWeight: 800, opacity: r3Selected && r3Selected !== "disagree" ? 0.5 : 1 }}>
                  👎 ما أوافق
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "round4" && q4[r4Idx] && (
          <div className="screen-enter">
            {progressCard(r4Idx + (r4Selected ? 1 : 0), q4.length, "الجولة ٤: مفاجآت")}
            <div className="card pop" style={{ padding: 26, textAlign: "center" }}>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 22px" }}>{q4[r4Idx].text_ar}</h3>
              {q4[r4Idx].question_type === "this_or_that" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {q4[r4Idx].options.map((o) => (
                    <button key={o.id} onClick={() => pickR4Choice(o.id)} disabled={!!r4Selected} style={{ padding: "18px 8px", borderRadius: 18, border: "2px solid var(--ring)", background: r4Selected === o.id ? `linear-gradient(135deg, ${PINK}, ${PURPLE})` : "var(--card)", color: r4Selected === o.id ? "#fff" : "var(--ink)", display: "flex", flexDirection: "column", gap: 6, alignItems: "center", opacity: r4Selected && r4Selected !== o.id ? 0.5 : 1 }}>
                      {o.emoji && <span style={{ fontSize: 26 }}>{o.emoji}</span>}
                      <span className="font-body" style={{ fontWeight: 700, fontSize: 12.5 }}>{o.text_ar}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea
                    value={r4Text}
                    onChange={(e) => setR4Text(e.target.value.slice(0, 200))}
                    rows={2}
                    dir="rtl"
                    autoFocus
                    className="font-quote"
                    style={{ width: "100%", padding: 12, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 16, outline: "none", resize: "none", textAlign: "center", fontFamily: "inherit" }}
                  />
                  <button onClick={submitR4Text} disabled={!r4Text.trim()} className="font-display" style={{ marginTop: 12, padding: "10px 24px", fontSize: 14, borderRadius: 999, border: "none", color: "#fff", background: r4Text.trim() ? `linear-gradient(135deg, ${PINK}, ${PURPLE})` : "var(--ring)" }}>
                    إرسال
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {stage === "results" && (
          <FashlahDemoResults
            humanTraitTally={humanTraitTally}
            botTraits={botTraits}
            botNames={{ "bot-a": bot1, "bot-b": bot2 }}
            r2Results={r2Results}
            r3Results={r3Results}
            r4Results={r4Results}
          />
        )}
      </div>
    </div>
  );
}

function FashlahDemoResults({
  humanTraitTally, botTraits, botNames, r2Results, r3Results, r4Results,
}: {
  humanTraitTally: Record<string, number>;
  botTraits: [typeof FASHLAH_TRAITS[number], typeof FASHLAH_TRAITS[number]];
  botNames: { "bot-a": string; "bot-b": string };
  r2Results: Round2Result[];
  r3Results: Round3Result[];
  r4Results: (Round4Choice | Round4Text)[];
}) {
  const [slide, setSlide] = useState(0);

  let topHumanTrait: string | null = null;
  let topVal = -Infinity;
  for (const [trait, val] of Object.entries(humanTraitTally)) {
    if (val > topVal) { topVal = val; topHumanTrait = trait; }
  }
  const humanTraitLabel = FASHLAH_TRAITS.find((t) => t.key === topHumanTrait);
  const nameFor = (pid: string) => (pid === "human" ? "أنت" : pid === "bot-a" ? botNames["bot-a"] : botNames["bot-b"]);

  const slides: { key: string; render: () => JSX.Element }[] = [];

  slides.push({
    key: "intro",
    render: () => (
      <>
        <p className="font-body" style={{ fontSize: 16, fontWeight: 700, opacity: 0.85 }}>جاهزين؟</p>
        <h2 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: "10px 0" }}>نتائج بقدونس وصلت 🌿✨</h2>
      </>
    ),
  });

  slides.push({
    key: "top-trait",
    render: () => (
      <>
        <DemoConfetti />
        <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85 }}>شخصيتك</p>
        <span style={{ fontSize: 72, display: "block", margin: "16px 0" }}>{humanTraitLabel?.emoji || "✨"}</span>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>{humanTraitLabel?.ar || "غامض شوي"}</h2>
      </>
    ),
  });

  slides.push({
    key: "bot-traits",
    render: () => (
      <>
        <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 16 }}>شخصية البقية</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[{ name: botNames["bot-a"], trait: botTraits[0] }, { name: botNames["bot-b"], trait: botTraits[1] }].map((row, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 18, padding: 14 }}>
              <span style={{ fontSize: 30 }}>{row.trait.emoji}</span>
              <p className="font-body" style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{row.name}</p>
              <p className="font-body" style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{row.trait.ar}</p>
            </div>
          ))}
        </div>
      </>
    ),
  });

  r2Results.forEach((r, i) => {
    const tally: Record<string, number> = {};
    for (const v of Object.values(r.votes)) tally[v] = (tally[v] ?? 0) + 1;
    const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || "human";
    const winnerVotes = tally[winnerId] ?? 0;
    const totalVotes = Object.values(r.votes).length;
    const isUnanimous = winnerVotes === totalVotes && totalVotes > 1;
    slides.push({
      key: `r2-${i}`,
      render: () => (
        <>
          {isUnanimous && <DemoConfetti />}
          <p className="font-body" style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginBottom: 10 }}>الأغلبية قالت...</p>
          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, lineHeight: 1.4 }}>{r.question.text_ar}</h3>
          <span style={{ fontSize: 64, display: "block", marginBottom: 8 }}>{winnerId === "human" ? "😎" : "🧔🏻"}</span>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>{nameFor(winnerId)}</h2>
          <p className="font-mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 6, opacity: 0.9 }}>
            {isUnanimous ? "بالإجماع! 🎉" : `${winnerVotes}/${totalVotes}`}
          </p>
        </>
      ),
    });
  });

  if (r3Results.length > 0) {
    slides.push({
      key: "hot-takes",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 16 }}>آراء القروب الجريئة</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "start", width: "100%" }}>
            {r3Results.map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 14 }}>
                <p className="font-body" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  {r.question.options[0]?.emoji} {r.question.text_ar}
                </p>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <span>👍 {Object.entries(r.stances).filter(([, s]) => s === "agree").map(([pid]) => (pid === "human" ? "😎" : "🧔🏻")).join(" ") || "—"}</span>
                  <span>👎 {Object.entries(r.stances).filter(([, s]) => s === "disagree").map(([pid]) => (pid === "human" ? "😎" : "🧔🏻")).join(" ") || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  const wyrResults = r4Results.filter((r): r is Round4Choice => r.type === "this_or_that");
  if (wyrResults.length > 0) {
    slides.push({
      key: "wyr",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 16 }}>وش اختاروا؟</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "start", width: "100%" }}>
            {wyrResults.map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 14 }}>
                <p className="font-body" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{r.question.text_ar}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                  {Object.entries(r.picks).map(([pid, optId]) => {
                    const opt = r.question.options.find((o) => o.id === optId);
                    return <span key={pid}>{pid === "human" ? "😎" : "🧔🏻"} {nameFor(pid)}: {opt?.emoji} {opt?.text_ar}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  r4Results.filter((r): r is Round4Text => r.type === "open_text").forEach((r, i) => {
    slides.push({
      key: `text-${i}`,
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginBottom: 10 }}>شنو قالوا...</p>
          <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, lineHeight: 1.5 }}>{r.question.text_ar}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", textAlign: "start" }}>
            {Object.entries(r.texts).map(([pid, text]) => (
              <div key={pid} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 14px" }}>
                <span style={{ fontSize: 20 }}>{pid === "human" ? "😎" : "🧔🏻"}</span>
                <div>
                  <p className="font-body" style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{nameFor(pid)}</p>
                  <p className="font-body" style={{ fontSize: 13, fontWeight: 600 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    });
  });

  slides.push({
    key: "share",
    render: () => (
      <>
        <span style={{ fontSize: 56, display: "block", marginBottom: 14 }}>🌿</span>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>خلصنا! شكرًا للعب 🎉</h2>
        <div style={{ position: "relative", zIndex: 3, width: "100%" }} onClick={(e) => e.stopPropagation()}>
          <DemoEndScreen createHref="/fashlah/create" accentFrom={PINK} accentTo={PURPLE} />
        </div>
      </>
    ),
  });

  const total = slides.length;
  const BG_COLORS = ["var(--purple)", "var(--pink)", "var(--yellow)", "var(--mint)"];
  const bg = BG_COLORS[slide % BG_COLORS.length];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: bg, transition: "background .5s ease",
        zIndex: 10, display: "flex", flexDirection: "column", color: "white",
        maxWidth: 480, margin: "0 auto", overflow: "hidden",
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <HomeButton label="الصفحة الرئيسية" />
      </div>

      <div style={{ display: "flex", gap: 6, padding: "16px 16px 0" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="story-seg">
            <div className="story-seg-fill" style={{ width: i <= slide ? "100%" : "0%", transition: "width .3s" }} />
          </div>
        ))}
      </div>

      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const isBack = clickX < rect.width * 0.35;
          setSlide((s) => (isBack ? Math.max(0, s - 1) : Math.min(total - 1, s + 1)));
        }}
        style={{ position: "absolute", inset: 0, top: 30, cursor: "pointer", zIndex: 1 }}
      />

      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 16px", pointerEvents: "none", zIndex: 2 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setSlide((s) => Math.max(0, s - 1)); }}
          disabled={slide === 0}
          style={{ pointerEvents: "auto", width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.2)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", opacity: slide === 0 ? 0.3 : 1 }}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setSlide((s) => Math.min(total - 1, s + 1)); }}
          disabled={slide === total - 1}
          style={{ pointerEvents: "auto", width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.2)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", opacity: slide === total - 1 ? 0.3 : 1 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div
        key={slide}
        className="pop"
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}
      >
        {slides[slide].render()}
      </div>
    </div>
  );
}

function DemoConfetti() {
  const CONFETTI_EMOJI = ["🎉", "✨", "🌿", "🔥", "💫", "🎊"];
  const [pieces] = useState(() =>
    Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 2.5 + Math.random() * 2,
      delay: Math.random() * 0.6,
      emoji: CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)],
    }))
  );
  return (
    <>
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={{ left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}>
          {p.emoji}
        </div>
      ))}
    </>
  );
}
