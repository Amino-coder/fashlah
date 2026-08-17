"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";
import { needsProfileSetup, getRealUser } from "@/lib/auth";
import EmailCaptureForm from "@/components/auth/EmailCaptureForm";
import ProfileSetupModal from "@/components/auth/ProfileSetupModal";

const PINK = "#FF2E93";

/**
 * The heart in each game card's top-left corner. Two states drive this
 * from the home page (app/page.tsx), which owns the actual favorites
 * data — this component never fetches or mutates favorites.game state
 * itself:
 *
 *  - `favorited`: whether THIS game is currently starred, purely visual.
 *  - `pending`: true while a toggle request for THIS specific game is
 *    in flight — disables the button so a rapid double-tap can't fire
 *    two overlapping requests for the same game (the actual race-
 *    condition guard lives here, at the one place a tap can originate).
 *
 * Signed-out tap: opens a small self-contained sign-in prompt (same
 * email → code flow as LoginButton/SaveResult, not a second auth
 * system) explaining specifically why — "sign in to save favorites",
 * not a generic login wall. On success, calls onSignedInFavorite()
 * so the PAGE can immediately favorite the game that was originally
 * tapped, rather than the person having to find and tap the heart
 * again after signing in.
 */
export default function FavoriteButton({
  game, favorited, pending, lang, onToggle, onSignedInFavorite,
}: {
  game: string;
  favorited: boolean;
  pending: boolean;
  lang: "ar" | "en";
  onToggle: () => void;
  onSignedInFavorite: () => void;
}) {
  const ar = lang === "ar";
  const [promptOpen, setPromptOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    // Both stopPropagation AND preventDefault: this button sits inside
    // the card's own <Link>, and without stopping propagation a tap here
    // would also trigger the Link's navigation and launch the game —
    // exactly the "must not accidentally launch the game" requirement.
    e.stopPropagation();
    e.preventDefault();
    if (pending) return;

    const user = await getRealUser();
    if (!user) {
      setPromptOpen(true);
      return;
    }
    onToggle();
  }

  async function handleVerified() {
    const profile = await getRealUser();
    if (needsProfileSetup(profile)) {
      setNeedsSetup(true);
    } else {
      setPromptOpen(false);
      onSignedInFavorite();
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={pending}
        aria-label={ar ? (favorited ? "إزالة من المفضلة" : "إضافة للمفضلة") : (favorited ? "Remove from favorites" : "Add to favorites")}
        aria-pressed={favorited}
        style={{
          position: "absolute", top: -8, left: -8, zIndex: 3,
          width: 34, height: 34, borderRadius: 999, border: "2px solid var(--icon-outline)",
          background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "2px 2px 0 var(--icon-outline)", opacity: pending ? 0.6 : 1,
        }}
      >
        <Heart size={16} fill={favorited ? PINK : "none"} color={favorited ? PINK : "var(--ink-soft)"} strokeWidth={2.4} />
      </button>

      {promptOpen && !needsSetup && (
        <div
          role="dialog"
          aria-modal="true"
          dir={ar ? "rtl" : "ltr"}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPromptOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(10, 6, 25, 0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="card screen-enter"
            style={{ width: "100%", maxWidth: 380, padding: "28px 24px", textAlign: "center", position: "relative" }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPromptOpen(false); }}
              aria-label={ar ? "إغلاق" : "Close"}
              style={{
                position: "absolute", top: 14, insetInlineEnd: 14, width: 28, height: 28, borderRadius: 999,
                border: "none", background: "var(--ring)", color: "var(--ink)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
            <Heart size={30} fill={PINK} color={PINK} style={{ marginBottom: 10 }} />
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>
              {ar ? "سجل دخولك عشان تحفظ مفضلتك" : "Sign in to save your favorites"}
            </h2>
            <p className="font-body" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600, margin: "0 0 20px" }}>
              {ar ? "تحتاج حساب عشان ألعابك المفضلة تبقى محفوظة" : "You need an account so your favorite games are saved"}
            </p>
            <EmailCaptureForm
              lang={lang}
              buttonLabel={ar ? "أرسل الرمز" : "Send Code"}
              onVerified={handleVerified}
            />
          </div>
        </div>
      )}

      {needsSetup && (
        <ProfileSetupModal
          lang={lang}
          onDone={() => {
            setNeedsSetup(false);
            setPromptOpen(false);
            onSignedInFavorite();
          }}
        />
      )}
    </>
  );
}
