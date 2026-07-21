"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureUser, generateRoomCode } from "@/lib/supabase";
import Blobs from "@/components/Blobs";
import { STR } from "@/lib/i18n";
import { usePrefs } from "@/lib/usePrefs";

export default function CreateSession() {
  const { lang, dark, ready } = usePrefs();
  const t = STR[lang];
  const router = useRouter();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🌿");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const userId = await ensureUser(lang);

      const { data: pack, error: packErr } = await supabase
        .from("question_packs")
        .select("id")
        .eq("slug", "friends")
        .single();
      if (packErr || !pack) throw new Error("Friends pack not found — did you run seed.sql?");

      const { data: group, error: groupErr } = await supabase
        .from("groups")
        .insert({ name: name || t.groupNamePh, emoji, created_by: userId })
        .select()
        .single();
      if (groupErr || !group) throw groupErr;

      // Retry a few times in case of a code collision (unique constraint).
      let session = null;
      let lastErr = null;
      for (let attempt = 0; attempt < 5 && !session; attempt++) {
        const code = generateRoomCode();
        const { data, error: sessErr } = await supabase
          .from("sessions")
          .insert({
            code,
            group_id: group.id,
            host_user_id: userId,
            pack_id: pack.id,
            difficulty: "mixed",
            max_players: 8,
            status: "waiting",
          })
          .select()
          .single();
        if (sessErr) { lastErr = sessErr; continue; }
        session = data;
      }
      if (!session) throw lastErr || new Error("Could not create a session code, try again.");

      const { error: playerErr } = await supabase.from("players").insert({
        session_id: session.id,
        user_id: userId,
        nickname: nickname || t.appName,
        avatar_emoji: emoji,
        is_host: true,
      });
      if (playerErr) throw playerErr;

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
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>{t.startSession}</h1>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="font-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.groupName}</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder={t.groupNamePh}
            style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
          />
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="font-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.nickname}</label>
          <input
            value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t.nicknamePh}
            style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["🌿", "🎉", "🔥", "🦄", "🍕", "⚡"].map((em) => (
            <button
              key={em} onClick={() => setEmoji(em)}
              className={`chip ${emoji === em ? "active" : ""}`} style={{ fontSize: 18, padding: "8px 12px" }}
            >
              {em}
            </button>
          ))}
        </div>

        {error && <p style={{ color: "#FF2E93", fontWeight: 700, marginBottom: 12 }}>{error}</p>}

        <button onClick={handleCreate} disabled={loading} className="btn-primary font-display" style={{ padding: 18, fontSize: 17, width: "100%" }}>
          {loading ? t.loading : t.create}
        </button>
      </div>
    </div>
  );
}
