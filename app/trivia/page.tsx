"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Zap } from "lucide-react";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { HelpButton } from "@/components/HowToPlay";
import PlusGate from "@/components/PlusGate";
import { TRIVIA_STR, TRIVIA_AVATARS, TRIVIA_CATEGORY_LABELS_EN, TRIVIA_CATEGORY_META, TriviaLang } from "@/lib/trivia-i18n";
import { TRIVIA_CATEGORIES } from "@/lib/trivia-questions";
import { usePrefs } from "@/lib/usePrefs";

const INDIGO = "#3B82F6";
const GOLD = "#FFD400";

export default function TriviaPage() {
  const { lang, ready } = usePrefs();
  if (!ready) return null;
  return (
    <PlusGate game="trivia" lang={(lang as TriviaLang) === "en" ? "en" : "ar"}>
      <TriviaSetupContent />
    </PlusGate>
  );
}

function TriviaSetupContent() {
  const { lang, dark, ready } = usePrefs();
  const t = TRIVIA_STR[lang as TriviaLang];
  const ar = lang === "ar";
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() => TRIVIA_AVATARS[Math.floor(Math.random() * TRIVIA_AVATARS.length)]);
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [category, setCategory] = useState<string>(TRIVIA_CATEGORIES[0]);
  const [loading, setLoading] = useState<"group" | "solo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  async function createSession(mode: "group" | "solo") {
    setLoading(mode);
    setError(null);
    try {
      const userId = await ensureUser(lang);
      const finalNickname = nickname || (ar ? "اللاعب 1" : "Player 1");

      let session: { id: string; code: string } | null = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 5 && !session; attempt++) {
        const code = generateRoomCode();
        const { data, error: sessErr } = await supabase
          .from("trivia_sessions")
          .insert({
            code, host_user_id: userId, lang,
            question_count: questionCount, difficulty, categories: [category],
            status: "waiting",
          })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error(t.errorGeneric);

      const { error: playerErr } = await supabase.from("trivia_players").insert({
        session_id: session.id, user_id: userId, nickname: finalNickname, avatar_emoji: emoji,
      });
      if (playerErr) throw playerErr;

      if (mode === "solo") {
        // Skip the waiting room entirely — immediately lock in the
        // question set and move to in_progress, same server-side
        // selection every multiplayer game uses, just never paused on
        // a lobby screen since there's no one else to wait for.
        const res = await fetch("/api/trivia-start-game", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || t.errorGeneric); }
      }

      router.push(`/trivia/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
      setLoading(null);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/" />
      <div style={{ position: "fixed", top: 24, insetInlineEnd: 24, zIndex: 45 }}>
        <HelpButton game="trivia" lang={lang} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ marginTop: 50 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>{t.gameName}</h1>
          <p className="font-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", textAlign: "center", marginBottom: 26 }}>{t.tagline}</p>

          {/* اسمك */}
          <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 8 }}>{t.yourName}</p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            {TRIVIA_AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setEmoji(a)}
                style={{
                  width: 44, height: 44, borderRadius: 999, fontSize: 20, border: emoji === a ? `3px solid ${INDIGO}` : "2px solid var(--ring)",
                  background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            placeholder={t.namePh}
            dir="rtl"
            className="font-body"
            style={{
              width: "100%", padding: "13px 18px", borderRadius: 999, border: "2px solid var(--ring)",
              background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, textAlign: "center", outline: "none", marginBottom: 26,
            }}
          />

          {/* عدد الأسئلة */}
          <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 8 }}>{t.numQuestions}</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {([5, 10, 15] as const).map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className="font-body"
                style={{
                  flex: 1, padding: "12px 8px", borderRadius: 14, fontSize: 13, fontWeight: 800,
                  border: questionCount === n ? `2.5px solid ${INDIGO}` : "2px solid var(--ring)",
                  background: questionCount === n ? `${INDIGO}18` : "var(--card)", color: questionCount === n ? INDIGO : "var(--ink)",
                }}
              >
                {n === 5 ? t.q5 : n === 10 ? t.q10 : t.q15}
              </button>
            ))}
          </div>

          {/* المستوى */}
          <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 8 }}>{t.difficulty}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
            {(["easy", "medium", "hard", "mixed"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="font-body"
                style={{
                  position: "relative", padding: "12px 8px", borderRadius: 14, fontSize: 13, fontWeight: 800,
                  border: difficulty === d ? `2.5px solid ${INDIGO}` : "2px solid var(--ring)",
                  background: difficulty === d ? `${INDIGO}18` : "var(--card)", color: difficulty === d ? INDIGO : "var(--ink)",
                }}
              >
                {t[d]}
                {d === "mixed" && (
                  <span
                    className="font-body"
                    style={{
                      position: "absolute", top: -8, insetInlineEnd: -6, fontSize: 8.5, fontWeight: 800,
                      background: GOLD, color: "#17122B", padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap",
                    }}
                  >
                    {t.recommended}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* الفئات */}
          <p className="font-body" style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 8 }}>{t.categories}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {TRIVIA_CATEGORIES.map((cat) => {
              const selected = category === cat;
              const meta = TRIVIA_CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="font-body"
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14, fontSize: 13.5, fontWeight: 700, textAlign: ar ? "right" : "left",
                    border: selected ? `2.5px solid ${meta.color}` : "2px solid var(--ring)",
                    background: selected ? `${meta.color}18` : "var(--card)", color: selected ? meta.color : "var(--ink)",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                  <span>{ar ? cat : TRIVIA_CATEGORY_LABELS_EN[cat] || cat}</span>
                </button>
              );
            })}
          </div>

          {error && <p className="font-body" style={{ color: "#E63946", fontSize: 13, textAlign: "center", marginBottom: 14 }}>{error}</p>}

          {/* العب مع قروب / العب لحالك */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => createSession("group")}
              disabled={loading !== null}
              className="font-display"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: 17, fontSize: 15.5, borderRadius: 999, border: "none", color: "#fff",
                background: `linear-gradient(135deg, ${INDIGO}, #1E40AF)`, boxShadow: `0 10px 24px ${INDIGO}33`,
                opacity: loading !== null ? 0.7 : 1,
              }}
            >
              <Users size={18} /> {loading === "group" ? t.loading : t.playGroup}
            </button>
            <button
              onClick={() => createSession("solo")}
              disabled={loading !== null}
              className="font-body"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: 15, fontSize: 14, fontWeight: 700, borderRadius: 999,
                border: "2px solid var(--ring)", color: "var(--ink)", background: "var(--card)",
                opacity: loading !== null ? 0.7 : 1,
              }}
            >
              <Zap size={16} /> {loading === "solo" ? t.loading : t.playSolo}
            </button>
          </div>

          <Link
            href="/trivia/join"
            className="font-body"
            style={{ display: "block", textAlign: "center", marginTop: 16, padding: 10, fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "underline" }}
          >
            {ar ? "عندك كود؟ انضم لغرفة" : "Have a code? Join a room"}
          </Link>
        </div>
      </div>
    </div>
  );
}
