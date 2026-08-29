"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GAME_LABELS: Record<string, string> = {
  fashlah: "فشلة",
  shofah: "أبي أتزوج",
  job: "مين بيتوظف",
  qaseeda: "كمل القصيدة",
  qissa: "كمل القصة",
  lifoo: "الِّفوا أغنية",
  ihj: "إنسان حيوان جماد",
  bidal: "بدل الكلمة",
  wadak: "وش شخصيتك",
  ibarat: "عبارات",
  imposter: "المحتال",
  ruin_story: "خرب السالفة",
  trivia: "سؤال وجواب",
};

type GameRow = { game: string; requires_plus: boolean; hidden: boolean; display_order: number | null; updated_at: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [games, setGames] = useState<GameRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingGame, setSavingGame] = useState<string | null>(null);

  const [grantEmail, setGrantEmail] = useState("");
  const [grantDays, setGrantDays] = useState("30");
  const [grantStatus, setGrantStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [grantMessage, setGrantMessage] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    const res = await fetch("/api/admin/game-access");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setGames(data.games);
  }

  async function sendUpdates(updates: { game: string; requiresPlus?: boolean; hidden?: boolean; displayOrder?: number }[]) {
    const res = await fetch("/api/admin/game-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Save failed");
    }
  }

  async function toggleGame(game: string, current: boolean) {
    setSavingGame(game);
    setError(null);
    // Optimistic — the toggle should feel instant, this is exactly the
    // "no deploy, just flip it" experience the admin panel exists for.
    setGames((gs) => gs?.map((g) => (g.game === game ? { ...g, requires_plus: !current } : g)) ?? gs);
    try {
      await sendUpdates([{ game, requiresPlus: !current }]);
    } catch (e: any) {
      setError(e.message);
      // Revert on failure
      setGames((gs) => gs?.map((g) => (g.game === game ? { ...g, requires_plus: current } : g)) ?? gs);
    }
    setSavingGame(null);
  }

  async function toggleHidden(game: string, current: boolean) {
    setSavingGame(game);
    setError(null);
    setGames((gs) => gs?.map((g) => (g.game === game ? { ...g, hidden: !current } : g)) ?? gs);
    try {
      await sendUpdates([{ game, hidden: !current }]);
    } catch (e: any) {
      setError(e.message);
      setGames((gs) => gs?.map((g) => (g.game === game ? { ...g, hidden: current } : g)) ?? gs);
    }
    setSavingGame(null);
  }

  // Swaps this game's display_order with whichever game is immediately
  // adjacent to it in the CURRENT rendered (already sorted) list — not
  // with some fixed "index ± 1" that could be wrong once a game or two
  // has null display_order sitting between real values.
  async function moveGame(index: number, direction: "up" | "down") {
    if (!games) return;
    const otherIndex = direction === "up" ? index - 1 : index + 1;
    if (otherIndex < 0 || otherIndex >= games.length) return;

    const a = games[index];
    const b = games[otherIndex];
    // Both need a real, distinct order value to swap — if either is
    // null (never explicitly ordered), fall back to its current
    // position in the list so the swap always has something concrete
    // to exchange, matching what the admin is actually looking at.
    const aOrder = a.display_order ?? index;
    const bOrder = b.display_order ?? otherIndex;

    setSavingGame(a.game);
    setError(null);
    setGames((gs) => {
      if (!gs) return gs;
      const next = [...gs];
      next[index] = { ...a, display_order: bOrder };
      next[otherIndex] = { ...b, display_order: aOrder };
      next.sort((x, y) => (x.display_order ?? 0) - (y.display_order ?? 0));
      return next;
    });
    try {
      await sendUpdates([
        { game: a.game, displayOrder: bOrder },
        { game: b.game, displayOrder: aOrder },
      ]);
    } catch (e: any) {
      setError(e.message);
      await loadGames(); // simplest reliable recovery from a partial-failure swap
    }
    setSavingGame(null);
  }

  async function handleGrantPlus() {
    setGrantStatus("working");
    setGrantMessage(null);
    try {
      const res = await fetch("/api/admin/grant-plus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: grantEmail.trim(), days: Number(grantDays) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGrantStatus("done");
      setGrantMessage(`Plus granted until ${new Date(data.plusExpiresAt).toLocaleString()}`);
      setGrantEmail("");
    } catch (e: any) {
      setGrantStatus("error");
      setGrantMessage(e.message);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F0B1A", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>بقدونس Admin</h1>
          <button
            onClick={handleLogout}
            style={{ fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "7px 14px", borderRadius: 999 }}
          >
            Log out
          </button>
        </div>

        <section style={{ background: "#1B1030", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Bagdoonis Plus — per-game access</h2>
          <p style={{ fontSize: 12.5, opacity: 0.6, margin: "0 0 20px", lineHeight: 1.6 }}>
            Toggle a game to Plus-only, and it immediately requires an active Plus
            subscription to play — no deploy needed. Right now, since no payment
            flow is live, every account's Plus is inactive by default, so toggling
            a game on blocks everyone until real subscribers exist (or you grant
            Plus manually below).
          </p>

          {error && <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          {games === null && !error && <p style={{ opacity: 0.6, fontSize: 13 }}>Loading...</p>}

          {games && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {games.map((g, i) => (
                <div
                  key={g.game}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                    padding: "12px 4px", borderBottom: "1px solid rgba(255,255,255,0.08)",
                    opacity: g.hidden ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Reorder — plain up/down buttons rather than drag
                        handles: far more reliable on a touch admin
                        panel, and just as fast for a list this short. */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <button
                        onClick={() => moveGame(i, "up")}
                        disabled={i === 0 || savingGame === g.game}
                        aria-label="Move up"
                        style={{
                          width: 20, height: 16, background: "none", border: "none", color: "#fff",
                          opacity: i === 0 ? 0.25 : 0.7, cursor: i === 0 ? "default" : "pointer", fontSize: 11, lineHeight: 1,
                        }}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveGame(i, "down")}
                        disabled={i === games.length - 1 || savingGame === g.game}
                        aria-label="Move down"
                        style={{
                          width: 20, height: 16, background: "none", border: "none", color: "#fff",
                          opacity: i === games.length - 1 ? 0.25 : 0.7, cursor: i === games.length - 1 ? "default" : "pointer", fontSize: 11, lineHeight: 1,
                        }}
                      >
                        ▼
                      </button>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{GAME_LABELS[g.game] || g.game}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Hidden — pulled off the home page entirely, not
                        just visually de-emphasized, matching exactly
                        what "hide" implies. Separate from the Plus
                        toggle below: a game can be hidden AND free, or
                        visible AND Plus-only — the two are independent. */}
                    <button
                      onClick={() => toggleHidden(g.game, g.hidden)}
                      disabled={savingGame === g.game}
                      title={g.hidden ? "Hidden from home page — click to show" : "Visible on home page — click to hide"}
                      style={{
                        fontSize: 11, fontWeight: 700, background: "none", border: "1px solid rgba(255,255,255,0.25)",
                        color: "#fff", padding: "5px 10px", borderRadius: 999, opacity: savingGame === g.game ? 0.5 : 1,
                      }}
                    >
                      {g.hidden ? "Hidden" : "Visible"}
                    </button>

                    <button
                      onClick={() => toggleGame(g.game, g.requires_plus)}
                      disabled={savingGame === g.game}
                      aria-pressed={g.requires_plus}
                      style={{
                        width: 46, height: 26, borderRadius: 999, border: "none", position: "relative",
                        background: g.requires_plus ? "#FF5A5F" : "rgba(255,255,255,0.15)",
                        opacity: savingGame === g.game ? 0.5 : 1, cursor: "pointer", transition: "background .15s",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute", top: 3, insetInlineStart: g.requires_plus ? 23 : 3,
                          width: 20, height: 20, borderRadius: 999, background: "#fff", transition: "inset-inline-start .15s",
                        }}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ background: "#1B1030", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Manually grant Plus</h2>
          <p style={{ fontSize: 12.5, opacity: 0.6, margin: "0 0 18px", lineHeight: 1.6 }}>
            For testing the gate, or comping a friend/tester — before real payments
            exist, this is the only way anyone gets Plus. The account must already
            exist (they've signed up via تسجيل الدخول at least once).
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="email"
              placeholder="email@example.com"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              style={{ flex: 2, padding: 11, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", fontSize: 13 }}
            />
            <input
              type="number"
              min={1}
              value={grantDays}
              onChange={(e) => setGrantDays(e.target.value)}
              style={{ width: 70, padding: 11, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", fontSize: 13 }}
            />
          </div>
          <p style={{ fontSize: 11, opacity: 0.5, margin: "0 0 14px" }}>days of access (e.g. 7 for weekly, 30 for monthly)</p>

          <button
            onClick={handleGrantPlus}
            disabled={grantStatus === "working" || !grantEmail.trim() || !grantDays}
            style={{
              padding: "11px 20px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13,
              background: "#14B8A6", color: "#fff",
              opacity: grantStatus === "working" || !grantEmail.trim() || !grantDays ? 0.5 : 1,
            }}
          >
            {grantStatus === "working" ? "..." : "Grant Plus"}
          </button>

          {grantMessage && (
            <p style={{ fontSize: 12.5, marginTop: 12, color: grantStatus === "error" ? "#FF6B6B" : "#7FE0C8" }}>
              {grantMessage}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
