"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, ensureUser } from "@/lib/supabase";
import { unlockAudio } from "@/lib/sound-engine";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { QASEEDA_STR, QASEEDA_AVATARS, QaseedaLang } from "@/lib/qaseeda-i18n";
import { usePrefs } from "@/lib/usePrefs";

const GOLD = "#D9A441";
const NAVY = "#1B3A55";

export default function QaseedaJoinPage() {
  return (
    <Suspense fallback={null}>
      <QaseedaJoin />
    </Suspense>
  );
}

function QaseedaJoin() {
  const { lang, dark, ready } = usePrefs();
  const t = QASEEDA_STR[lang as QaseedaLang];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [codeFromLink, setCodeFromLink] = useState(false);
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() =>
    QASEEDA_AVATARS[Math.floor(Math.random() * QASEEDA_AVATARS.length)]
  );
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

  const canJoin = code.trim().length >= 4 && nickname.trim().length > 0 && !loading;
  const missingHint =
    code.trim().length < 4
      ? (lang === "ar" ? "اكتب كود الغرفة عشان تنضم" : "Enter the room code to join")
      : nickname.trim().length === 0
      ? (lang === "ar" ? "اكتب اسمك عشان تنضم" : "Enter your name to join")
      : null;

  async function handleJoin() {
    unlockAudio();
    setLoading(true);
    setError(null);
    setSessionDead(false);
    try {
      const userId = await ensureUser(lang);

      const { data: session, error: sessErr } = await supabase
        .from("qaseeda_sessions")
        .select("id, code, status")
        .eq("code", code.toUpperCase())
        .single();
      if (sessErr || !session) throw new Error(t.errorNotFound);
      if (session.status !== "waiting") {
        setSessionDead(true);
        throw new Error(t.errorSessionStarted);
      }

      const { error: playerErr } = await supabase.from("qaseeda_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || t.gameNameArabic,
        avatar_emoji: emoji,
      });
      if (playerErr) {
        if (playerErr.code === "23505") {
          const { error: updateErr } = await supabase
            .from("qaseeda_players")
            .update({ nickname: nickname || t.gameNameArabic, avatar_emoji: emoji })
            .eq("session_id", session.id)
            .eq("user_id", userId);
          if (updateErr) throw updateErr;
        } else {
          throw playerErr;
        }
      }

      router.push(`/qaseeda/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/qaseeda" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 24px 24px", position: "relative", zIndex: 1 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, marginTop: 40 }}>{t.joinSession}</h1>

        {codeFromLink ? (
          <div className="card" style={{ padding: 20, marginBottom: 16, textAlign: "center" }}>
            <p className="font-body" style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-soft)" }}>{t.joiningSession}</p>
            <p className="font-mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.2em", marginTop: 6 }}>{code}</p>
            <button
              onClick={() => setCodeFromLink(false)}
              className="font-body"
              style={{ marginTop: 10, fontSize: 12, color: "var(--ink-soft)", background: "none", border: "none", textDecoration: "underline" }}
            >
              {t.notThisSession}
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <label className="font-body" htmlFor="qaseeda-join-code" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.codeLabel}</label>
            <input
              id="qaseeda-join-code"
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} placeholder={t.codePh}
              className="font-mono"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              maxLength={6}
              enterKeyHint="next"
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              style={{ width: "100%", marginTop: 8, padding: 14, borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 22, textAlign: "center", letterSpacing: "0.3em", outline: "none" }}
            />
          </div>
        )}

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="font-body" htmlFor="qaseeda-join-nickname" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.nickname}</label>
          <input
            id="qaseeda-join-nickname"
            value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 20))} placeholder={t.nicknamePh}
            maxLength={20}
            autoFocus={codeFromLink}
            enterKeyHint="go"
            onKeyDown={(e) => { if (e.key === "Enter" && canJoin) handleJoin(); }}
            style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
          />
        </div>

        <p className="font-body" style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>
          {lang === "ar" ? "اختر رمزك" : "Pick your avatar"}
        </p>
        <div role="radiogroup" aria-label={lang === "ar" ? "اختر رمزك" : "Pick your avatar"} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {QASEEDA_AVATARS.map((em) => (
            <button
              key={em} onClick={() => setEmoji(em)}
              role="radio"
              aria-checked={emoji === em}
              aria-label={em}
              className={`chip ${emoji === em ? "active" : ""}`} style={{ fontSize: 19, padding: "10px 13px" }}
            >
              {em}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#E63946", fontWeight: 700, marginBottom: sessionDead ? 10 : 0 }}>{error}</p>
            {sessionDead && (
              <Link
                href="/qaseeda/create"
                className="font-display"
                style={{
                  padding: 16, fontSize: 15, textAlign: "center", display: "block", borderRadius: 999,
                  color: "#fff", textDecoration: "none",
                  background: `linear-gradient(135deg, ${GOLD}, ${NAVY})`,
                }}
              >
                {t.startNewGame}
              </Link>
            )}
          </div>
        )}

        {missingHint && !error && (
          <p className="font-body" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600, textAlign: "center", marginBottom: 10 }}>
            {missingHint}
          </p>
        )}

        <button
          onClick={handleJoin} disabled={!canJoin}
          className="font-display"
          style={{
            padding: 18, fontSize: 17, width: "100%", borderRadius: 999, border: "none", color: "#fff",
            background: `linear-gradient(135deg, ${GOLD}, ${NAVY})`, boxShadow: `0 10px 30px ${NAVY}55`,
            opacity: canJoin ? 1 : 0.6,
          }}
        >
          {loading ? t.loading : t.joinBtn}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p className="font-body" style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600, margin: "0 0 4px" }}>
            بس تتفرج؟
          </p>
          <Link
            href="/qaseeda/demo"
            className="font-body"
            style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "underline" }}
          >
            ▶ جرّب وضع التجربة
          </Link>
        </div>
      </div>
    </div>
  );
}
