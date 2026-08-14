"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { checkGameAccess } from "@/lib/gameAccess";
import LoginButton from "@/components/auth/LoginButton";
import Blobs from "@/components/Blobs";
import HomeButton from "@/components/HomeButton";

/**
 * Wraps a game's landing page content. Checks game_access + the signed-
 * in account's plus_expires_at (see lib/gameAccess.ts) and either
 * renders the game normally or a paywall screen in its place — nothing
 * downstream of this (create/join/solo flows) needs its own check, since
 * none of them are reachable without going through this wrapper first.
 *
 * No purchase button here on purpose — there's no checkout to send
 * anyone to yet (payments aren't live). Once they are, the CTA below
 * swaps from "coming soon" to an actual buy flow — this component is the
 * one place that'll need updating when that happens, not every game's
 * landing page individually.
 */
export default function PlusGate({
  game, lang, children,
}: {
  game: string;
  lang: "ar" | "en";
  children: React.ReactNode;
}) {
  const ar = lang === "ar";
  const [state, setState] = useState<"checking" | "allowed" | "blocked">("checking");

  useEffect(() => {
    let cancelled = false;
    checkGameAccess(game).then((result) => {
      if (!cancelled) setState(result.allowed ? "allowed" : "blocked");
    });
    return () => { cancelled = true; };
  }, [game]);

  if (state === "checking") return null;
  if (state === "allowed") return <>{children}</>;

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <Blobs />
      <HomeButton label={ar ? "الصفحة الرئيسية" : "Home"} />
      <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, position: "relative", zIndex: 1 }}>
        <div
          aria-hidden="true"
          style={{
            width: 72, height: 72, borderRadius: 999, marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #FFD400, #FF8A3D)",
          }}
        >
          <Lock size={30} color="#17122B" />
        </div>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>
          {ar ? "بقدونس بلس 💎" : "Bagdoonis Plus 💎"}
        </h1>
        <p className="font-body" style={{ fontSize: 14.5, color: "var(--ink-soft)", fontWeight: 600, lineHeight: 1.7, marginBottom: 24 }}>
          {ar
            ? "هذي اللعبة حصرية لمشتركي بقدونس بلس. الاشتراك قريباً — ترقبونا!"
            : "This game is exclusive to Bagdoonis Plus subscribers. Subscriptions are coming soon — stay tuned!"}
        </p>
        <LoginButton lang={lang} />
      </div>
    </div>
  );
}
