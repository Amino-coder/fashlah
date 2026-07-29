"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";
import { JOB_STR, JOB_AVATARS, JobLang } from "@/lib/job-i18n";
import { usePrefs } from "@/lib/usePrefs";

const BLUE = "#3B82F6";
const NAVY = "#1E40AF";

export default function JobCreatePage() {
  const { lang, dark, ready } = usePrefs();
  const t = JOB_STR[lang as JobLang];
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(() =>
    // Randomised per visit — not persisted, not synced — so two people
    // who both skip picking an avatar don't silently end up identical.
    // A repeat is still fine if it happens by chance, just not guaranteed.
    JOB_AVATARS[Math.floor(Math.random() * JOB_AVATARS.length)]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const userId = await ensureUser(lang);

      let session: { id: string; code: string } | null = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 5 && !session; attempt++) {
        const code = generateRoomCode();
        const { data, error: sessErr } = await supabase
          .from("job_sessions")
          .insert({ code, host_user_id: userId, lang, status: "waiting" })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session code, try again.");

      const { error: playerErr } = await supabase.from("job_players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || t.gameNameArabic,
        avatar_emoji: emoji,
      });
      if (playerErr) throw playerErr;

      router.push(`/job/session/${session.code}`);
    } catch (e: any) {
      setError(e.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={t.dir} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={t.backHome} href="/job" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, marginTop: 40 }}>{t.createBtn}</h1>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="font-body" htmlFor="job-create-nickname" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.nickname}</label>
          <input
            id="job-create-nickname"
            value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 20))} placeholder={t.nicknamePh}
            maxLength={20}
            autoFocus
            enterKeyHint="go"
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleCreate(); }}
            style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
          />
        </div>

        <p className="font-body" style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>
          {lang === "ar" ? "اختر شخصيتك" : "Pick your avatar"}
        </p>
        <div role="radiogroup" aria-label={lang === "ar" ? "اختر شخصيتك" : "Pick your avatar"} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {JOB_AVATARS.map((em) => (
            <button
              key={em} onClick={() => setEmoji(em)}
              role="radio"
              aria-checked={emoji === em}
              aria-label={em}
              className={`chip ${emoji === em ? "active" : ""}`} style={{ fontSize: 18, padding: "8px 12px" }}
            >
              {em}
            </button>
          ))}
        </div>

        {error && <p style={{ color: BLUE, fontWeight: 700, marginBottom: 12 }}>{error}</p>}

        <button
          onClick={handleCreate} disabled={loading}
          className="font-display"
          style={{
            padding: 18, fontSize: 17, width: "100%", borderRadius: 999, border: "none", color: "#fff",
            background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`, boxShadow: `0 10px 30px ${BLUE}55`,
          }}
        >
          {loading ? t.loading : t.createBtn}
        </button>
      </div>
    </div>
  );
}
