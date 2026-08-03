"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

/**
 * Deliberately does nothing to Supabase. Checked first: there's no
 * localStorage/sessionStorage tracking "which session you're in" anywhere
 * in this app (lib/usePrefs.ts only persists language/theme), and every
 * game's session/player/answer state lives in plain React state that's
 * discarded automatically the moment this page unmounts. So "leaving" is
 * just navigation — router.push("/") unmounts the session page (which
 * tears down its realtime subscriptions and polling via their own
 * existing useEffect cleanups, unchanged), and there's nothing left over
 * to block starting a fresh game afterward. No player rows are deleted,
 * no session status is touched, no round/vote/score logic runs — a
 * player leaving looks, from the database's point of view, exactly like
 * a player whose tab lost connection, which every game already handles
 * gracefully via its existing timeout/backfill logic.
 *
 * Placed only on active round-play screens (see each game's RoundScreen/
 * session page for exactly where), never in the lobby or on finished-game
 * screens — those already have a plain HomeButton with no confirmation,
 * since there's no in-progress round to lose there.
 *
 * Deliberately rendered in normal document flow (a real flex row that
 * takes up real height), not as a `position: absolute` overlay. An
 * earlier version floated it absolutely, which reserves no space — so
 * whatever a given screen happened to render first (a round title, a
 * prompt card, anything) would start right where the button was and get
 * covered by it, differently on every screen depending on that screen's
 * own top padding. Taking up real space instead means every screen's
 * content is naturally pushed down to clear it, with no per-screen
 * padding tuning needed anywhere this is dropped in.
 */
export default function LeaveGameButton({ lang }: { lang: "ar" | "en" }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const ar = lang === "ar";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
          aria-label={ar ? "الخروج من اللعبة" : "Leave game"}
          className="font-body"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            background: "var(--card)", color: "var(--ink-soft)", border: "1.5px solid var(--ring)",
            boxShadow: "0 2px 8px var(--ring)", cursor: "pointer",
          }}
        >
          <LogOut size={13} />
          <span>{ar ? "خروج" : "Leave"}</span>
        </button>
      </div>

      {confirming && (
        <div
          onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,7,20,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir={ar ? "rtl" : "ltr"}
            className="card pop"
            style={{ maxWidth: 320, width: "100%", padding: 26, textAlign: "center" }}
          >
            <h3 className="font-display" style={{ fontSize: 19, fontWeight: 800, margin: "0 0 8px" }}>
              {ar ? "تبي تخرج من اللعبة؟" : "Leave game?"}
            </h3>
            <p className="font-body" style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 600, margin: "0 0 22px" }}>
              {ar ? "تقدمك الحالي في اللعبة بيضيع." : "Your current game progress will be lost."}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirming(false)}
                className="font-display"
                style={{ flex: 1, padding: 13, borderRadius: 999, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontWeight: 700, fontSize: 14 }}
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => router.push("/")}
                className="font-display"
                style={{ flex: 1, padding: 13, borderRadius: 999, border: "none", background: "#E63946", color: "#fff", fontWeight: 700, fontSize: 14 }}
              >
                {ar ? "خروج" : "Leave Game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
