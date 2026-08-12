"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, ensureUser } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { BIDAL_STR, BIDAL_AVATARS, BidalLang } from "@/lib/bidal-i18n";
import { usePrefs } from "@/lib/usePrefs";

const TEAL = "#14B8A6";
const CORAL = "#FF5A5F";

export default function BidalJoinPage() {
  // useSearchParams() requires a Suspense boundary in Next's app router.
  return (
    <Suspense fallback={null}>
      <BidalJoin />
    </Suspense>
  );
}

function BidalJoin() {
  const { lang, dark, ready } = usePrefs();
  const t = BIDAL_STR[lang as BidalLang];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() => BIDAL_AVATARS[Math.floor(Math.random() * BIDAL_AVATARS.length)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same pattern as the other games' join pages: a shared link carries
  // ?code=XXXX, so pull it in and pre-fill instead of leaving the person
  // to retype a code they already tapped a link for.
  useEffect(() => {
    const fromUrl = searchParams.get("code");
    if (fromUrl) setCode(fromUrl.toUpperCase().slice(0, 6));
  }, [searchParams]);

  if (!ready) return null;

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const userId = await ensureUser(lang);
      const cleanCode = code.trim().toUpperCase();

      const { data: session, error: sessErr } = await supabase
        .from("bidal_sessions")
        .select("id, code, status")
        .eq("code", cleanCode)
        .single();
      if (sessErr || !session) throw new Error(t.errorGeneric);

      const { error: playerErr } = await supabase.from("bidal_players").upsert(
        { session_id: session.id, user_id: userId, nickname: nickname || t.gameNameArabic, avatar_emoji: emoji },
        { onConflict: "session_id,user_id" }
      );
      if (playerErr) throw playerErr;

      router.push(`/bidal/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/bidal" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div className="screen-enter" style={{ marginTop: 60 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 28 }}>
            {t.joinGame}
          </h1>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 6))}
            placeholder={t.enterCode}
            dir="ltr"
            className="font-mono"
            style={{
              width: "100%", padding: "16px 18px", borderRadius: 16, border: "2px solid var(--ring)",
              background: "var(--card)", color: "var(--ink)", fontSize: 22, fontWeight: 700, textAlign: "center",
              letterSpacing: "0.15em", outline: "none", marginBottom: 20, textTransform: "uppercase",
            }}
          />

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            {BIDAL_AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setEmoji(a)}
                style={{
                  width: 48, height: 48, borderRadius: 999, fontSize: 22, border: emoji === a ? `3px solid ${TEAL}` : "2px solid var(--ring)",
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
              width: "100%", padding: "14px 18px", borderRadius: 999, border: "2px solid var(--ring)",
              background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, textAlign: "center", outline: "none", marginBottom: 20,
            }}
          />

          {error && <p className="font-body" style={{ color: "#E63946", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleJoin}
            disabled={loading || code.length < 4}
            className="font-display"
            style={{
              display: "block", width: "100%", padding: 18, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, opacity: loading || code.length < 4 ? 0.6 : 1,
            }}
          >
            {loading ? t.loading : t.joinGame}
          </button>
        </div>
      </div>
    </div>
  );
}
