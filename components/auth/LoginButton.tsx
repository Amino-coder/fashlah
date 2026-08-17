"use client";

import { useEffect, useState } from "react";
import { User, X, LogOut, History } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getRealUser, needsProfileSetup, signOut } from "@/lib/auth";
import EmailCaptureForm from "./EmailCaptureForm";
import ProfileSetupModal from "./ProfileSetupModal";

const CORAL = "#FF5A5F";

type RealUser = { id: string; email: string | null; display_name: string | null; phone: string | null };

/**
 * Small, unobtrusive top-of-app button. تسجيل الدخول when nobody's
 * signed into a real account (anonymous play doesn't count — see
 * getRealUser()'s is_anonymous check), otherwise a compact chip with
 * their name and a sign-out affordance. Never blocks or interrupts the
 * game underneath it — this is a modal layered on top, not a route.
 *
 * Sign-in itself (email → 6-digit code, see EmailCaptureForm) finishes
 * entirely inside this modal — no redirect, no /auth/callback round
 * trip. If the code verifies into a brand-new account, this shows
 * ProfileSetupModal right here before closing.
 */
export default function LoginButton({ lang }: { lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const [user, setUser] = useState<RealUser | null | undefined>(undefined); // undefined = still checking
  const [modalOpen, setModalOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getRealUser().then(setUser);
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      getRealUser().then(setUser);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleVerified() {
    const profile = await getRealUser();
    setUser(profile);
    if (needsProfileSetup(profile)) {
      setNeedsSetup(true);
    } else {
      setModalOpen(false);
    }
  }

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    setUser(null);
  }

  if (user === undefined) return null; // avoid a flash of "تسجيل الدخول" before we know

  return (
    <>
      {user ? (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="font-body"
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 999,
              fontSize: 12, fontWeight: 800, background: "var(--card)", color: "var(--ink)",
              border: "1.5px solid rgba(217,164,65,.5)", whiteSpace: "nowrap",
            }}
          >
            <User size={13} />
            <span className="header-profile-name">{user.display_name || (ar ? "حسابي" : "Account")}</span>
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
              <div
                className="card pop"
                style={{
                  // insetInlineStart (not End) is deliberate: this button
                  // now sits at the header's true RIGHT edge (see
                  // app/page.tsx's DOM ordering), and under RTL "start"
                  // resolves to physical right — so this aligns the
                  // dropdown's RIGHT edge with the button's RIGHT edge,
                  // extending leftward/inward toward the rest of the
                  // header instead of pushing further right, off-screen.
                  position: "absolute", top: "calc(100% + 8px)", insetInlineStart: 0, zIndex: 40,
                  minWidth: 160, padding: 8,
                }}
              >
                <a
                  href="/account"
                  className="font-body"
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
                    borderRadius: 10, background: "transparent", color: "var(--ink)",
                    fontSize: 13, fontWeight: 700, textAlign: ar ? "right" : "left", textDecoration: "none",
                  }}
                >
                  <History size={14} />
                  {ar ? "حسابي وسجل ألعابي" : "My account & history"}
                </a>
                <button
                  onClick={handleSignOut}
                  className="font-body"
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
                    borderRadius: 10, border: "none", background: "transparent", color: "var(--ink)",
                    fontSize: 13, fontWeight: 700, textAlign: ar ? "right" : "left",
                  }}
                >
                  <LogOut size={14} />
                  {ar ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => setModalOpen(true)}
            className="font-body"
            style={{
              padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800,
              background: "var(--card)", color: "var(--ink)", border: "1.5px solid rgba(217,164,65,.5)",
            }}
          >
            {ar ? "تسجيل الدخول" : "Log in"}
          </button>

          {modalOpen && !needsSetup && (
            <div
              role="dialog"
              aria-modal="true"
              dir={ar ? "rtl" : "ltr"}
              onClick={() => setModalOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 60,
                background: "rgba(10, 6, 25, 0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="card screen-enter"
                style={{ width: "100%", maxWidth: 380, padding: "28px 24px", textAlign: "center", position: "relative" }}
              >
                <button
                  onClick={() => setModalOpen(false)}
                  aria-label={ar ? "إغلاق" : "Close"}
                  style={{
                    position: "absolute", top: 14, insetInlineEnd: 14, width: 28, height: 28, borderRadius: 999,
                    border: "none", background: "var(--ring)", color: "var(--ink)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={14} />
                </button>
                <h2 className="font-display" style={{ fontSize: 19, fontWeight: 800, margin: "6px 0 20px" }}>
                  {ar ? "تسجيل الدخول إلى بقدونس" : "Log in to Bagdoonis"}
                </h2>
                <EmailCaptureForm
                  lang={lang}
                  buttonLabel={ar ? "أرسل الرمز" : "Send Code"}
                  onVerified={handleVerified}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Deliberately OUTSIDE the user/not-user branch above — handleVerified
          sets `user` the moment sign-in succeeds (even for a brand-new
          account with no name/phone yet), which would otherwise make the
          "signed in" branch's early return skip straight past this and
          never show the setup modal at all. Rendering it here means it
          shows regardless of which branch is currently active. */}
      {needsSetup && (
        <ProfileSetupModal
          lang={lang}
          onDone={async () => {
            const profile = await getRealUser();
            setUser(profile);
            setNeedsSetup(false);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}
