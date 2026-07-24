"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, ensureUser } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { STR, AVATARS } from "@/lib/i18n";
import { usePrefs } from "@/lib/usePrefs";

export default function JoinSessionPage() {
  // useSearchParams() requires a Suspense boundary in Next's app router.
  return (
    <Suspense fallback={null}>
      <JoinSession />
    </Suspense>
  );
}

function JoinSession() {
  const { lang, dark, ready } = usePrefs();
  const t = STR[lang];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [codeFromLink, setCodeFromLink] = useState(false);
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState("🦊");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDead, setSessionDead] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("code");
    if (fromUrl) {
      setCode(fromUrl.toUpperCase().slice(0, 6));
      setCodeFromLink(true);
    }
  }, [searchParams]);

  if (!ready) return null;

  async function handleJoin() {
    setLoading(true);
    setError(null);
    setSessionDead(false);
    try {
      const userId = await ensureUser(lang);

      const { data: session, error: sessErr } = await supabase
        .from("sessions")
        .select("id, code, status, max_players")
        .eq("code", code.toUpperCase())
        .single();
      if (sessErr || !session) throw new Error(t.errorNotFound);
      if (session.status !== "waiting") {
        // The most common real-world cause: this is an old join link whose
        // session already started (or, once a "completed" status exists,
        // already ended). Either way "change code" doesn't help — the fix
        // is to start a fresh session, so flag it distinctly from a plain
        // error so the UI can offer that path directly.
        setSessionDead(true);
        throw new Error(t.errorSessionStarted);
      }

      const { count } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id);
      if ((count ?? 0) >= session.max_players) throw new Error(t.errorGeneric);

      const { error: playerErr } = await supabase.from("players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || t.appName,
        avatar_emoji: emoji,
        is_host: false,
      });
      if (playerErr) {
        if (playerErr.code === "23505") {
          // Already a member of this session (e.g. rejoining after a reload)
          // — update their nickname/avatar instead of failing. This is a
          // plain UPDATE, not an upsert, so it doesn't hit the same
          // RLS/ON CONFLICT visibility problem a first-time join would.
          const { error: updateErr } = await supabase
            .from("players")
            .update({ nickname: nickname || t.appName, avatar_emoji: emoji })
            .eq("session_id", session.id)
            .eq("user_id", userId);
          if (updateErr) throw updateErr;
        } else {
          throw playerErr;
        }
      }

      router.push(`/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 24px 24px", position: "relative", zIndex: 1 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, marginTop: 40 }}>{t.joinSession}</h1>

        {codeFromLink ? (
          <div className="card" style={{ padding: 20, marginBottom: 16, textAlign: "center" }}>
            <p className="font-body" style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-soft)" }}>
              {lang === "ar" ? "بتنضم لجلسة" : "Joining session"}
            </p>
            <p className="font-mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.2em", marginTop: 6 }}>
              {code}
            </p>
            <button
              onClick={() => setCodeFromLink(false)}
              className="font-body"
              style={{ marginTop: 10, fontSize: 12, color: "var(--ink-soft)", background: "none", border: "none", textDecoration: "underline" }}
            >
              {lang === "ar" ? "مو هالجلسة؟ غيّر الكود" : "Not this session? Change code"}
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <label className="font-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.codeLabel}</label>
            <input
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} placeholder={t.codePh}
              className="font-mono"
              style={{ width: "100%", marginTop: 8, padding: 14, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 22, textAlign: "center", letterSpacing: "0.3em", outline: "none" }}
            />
          </div>
        )}

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="font-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.nickname}</label>
          <input
            value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t.nicknamePh}
            style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {AVATARS.map((em) => (
            <button
              key={em} onClick={() => setEmoji(em)}
              className={`chip ${emoji === em ? "active" : ""}`} style={{ fontSize: 19, padding: "10px 13px" }}
            >
              {em}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#FF2E93", fontWeight: 700, marginBottom: sessionDead ? 10 : 0 }}>{error}</p>
            {sessionDead && (
              <Link
                href="/create"
                className="btn-primary font-display"
                style={{ padding: 16, fontSize: 15, textAlign: "center", display: "block" }}
              >
                {t.startNewGame}
              </Link>
            )}
          </div>
        )}

        <button
          onClick={handleJoin} disabled={loading || code.length < 4 || !nickname}
          className="btn-primary font-display" style={{ padding: 18, fontSize: 17, width: "100%" }}
        >
          {loading ? t.loading : t.joinBtn}
        </button>
      </div>
    </div>
  );
}
