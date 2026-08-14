"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getRealUser, signOut } from "@/lib/auth";
import { usePrefs } from "@/lib/usePrefs";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";

const CORAL = "#FF5A5F";
const NAVY = "#1B1030";

// Friendly display names for the game keys saved into saved_results.game
// (see the various SaveResult call sites — game="bidal_solo" etc.).
// Falls back to the raw key for any game not listed here, so this never
// needs to be perfectly exhaustive to stay useful.
const GAME_NAMES: Record<string, { ar: string; en: string }> = {
  fashlah: { ar: "فشلة", en: "Fashlah" },
  shofah: { ar: "أبي أتزوج", en: "Marry Me!" },
  shofah_solo: { ar: "أبي أتزوج (لحالك)", en: "Marry Me! (Solo)" },
  job: { ar: "مين بيتوظف", en: "Job Interview!" },
  qaseeda: { ar: "كمل القصيدة", en: "Complete the Poem" },
  qissa: { ar: "كمل القصة", en: "Complete the Story" },
  lifoo: { ar: "الِّفوا أغنية", en: "Build a Song" },
  lifoo_solo: { ar: "الِّفوا أغنية (لحالك)", en: "Build a Song (Solo)" },
  bidal_solo: { ar: "بدل الكلمة", en: "Word Swap" },
  wadak: { ar: "وش شخصيتك", en: "What's Your Personality" },
  ihj: { ar: "إنسان حيوان جماد", en: "Categories" },
};

type Profile = { id: string; email: string | null; display_name: string | null; phone: string | null };
type SavedResult = { id: string; game: string; result_summary: string; session_code: string | null; created_at: string };

export default function AccountPage() {
  const { lang, dark, ready } = usePrefs();
  const ar = (lang || "ar") === "ar";
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined); // undefined = still checking
  const [results, setResults] = useState<SavedResult[] | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getRealUser();
      setProfile(p);
      if (!p) return;
      const { data } = await supabase
        .from("saved_results")
        .select("id, game, result_summary, session_code, created_at")
        .order("created_at", { ascending: false });
      setResults((data as SavedResult[]) || []);
    })();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (!ready || profile === undefined) return null;

  return (
    <div dir={ar ? "rtl" : "ltr"} className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={ar ? "الصفحة الرئيسية" : "Home"} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        {!profile ? (
          // Not signed in — no account to show. Doesn't auto-redirect;
          // just explains and points back to a normal way in, since
          // landing here directly (bookmark, back button) shouldn't feel
          // like an error.
          <div className="screen-enter" style={{ marginTop: 80, textAlign: "center" }}>
            <p className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 16 }}>
              {ar ? "لازم تسجل دخولك عشان تشوف حسابك" : "You need to log in to see your account"}
            </p>
            <a href="/" className="font-display" style={{ padding: "12px 28px", borderRadius: 999, background: "var(--card)", border: "2px solid var(--ring)", color: "var(--ink)", textDecoration: "none", fontSize: 14 }}>
              {ar ? "الصفحة الرئيسية" : "Home"}
            </a>
          </div>
        ) : (
          <div className="screen-enter" style={{ marginTop: 50 }}>
            {/* Profile summary */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 64, height: 64, borderRadius: 999, margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
                }}
              >
                <User size={26} color="#fff" />
              </div>
              <p className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                {profile.display_name || (ar ? "بدون اسم" : "No name")}
              </p>
              <p className="font-body" style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>
                {profile.email}
              </p>
              <button
                onClick={handleSignOut}
                className="font-body"
                style={{ marginTop: 12, fontSize: 12, color: "var(--ink-soft)", background: "none", border: "none", textDecoration: "underline" }}
              >
                {ar ? "تسجيل الخروج" : "Sign out"}
              </button>
            </div>

            {/* Game history */}
            <p className="font-body" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: CORAL, marginBottom: 12, textAlign: ar ? "right" : "left" }}>
              {(ar ? "سجل ألعابك" : "Your Game History").toUpperCase()}
            </p>

            {results === null && (
              <div style={{ textAlign: "center", color: CORAL, marginTop: 30 }}>
                <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
              </div>
            )}

            {results !== null && results.length === 0 && (
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <p className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", margin: 0 }}>
                  {ar ? "ما حفظت أي نتيجة لحد الحين — العب لعبة واضغط احفظ نتيجتك 🎮" : "No saved results yet — play a game and tap Save your result 🎮"}
                </p>
              </div>
            )}

            {results !== null && results.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.map((r) => {
                  const name = GAME_NAMES[r.game];
                  const date = new Date(r.created_at).toLocaleDateString(ar ? "ar-SA" : "en-US", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <div key={r.id} className="card pop" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <p className="font-display" style={{ fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>
                            {name ? (ar ? name.ar : name.en) : r.game}
                          </p>
                          <p className="font-body" style={{ fontSize: 12.5, color: "var(--ink)", margin: 0 }}>
                            {r.result_summary}
                          </p>
                        </div>
                        <span className="font-body" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--ink-soft)", whiteSpace: "nowrap", flexShrink: 0 }}>
                          <Calendar size={11} /> {date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
