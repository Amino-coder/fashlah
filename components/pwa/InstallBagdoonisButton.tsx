"use client";

import { useEffect, useState } from "react";
import IOSInstallModal from "./IOSInstallModal";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

/**
 * Fully self-contained: no imports from any game code, no Supabase, no
 * shared state beyond the `lang` it's told to render in. Safe to drop
 * onto any page — currently only the homepage — without touching
 * anything else.
 *
 * Renders nothing (not even a placeholder) until the client-side checks
 * below resolve, and nothing at all if the app is already installed or
 * the browser has no install path to offer, so there's never a broken or
 * pointless button on screen.
 */
export default function InstallBagdoonisButton({ lang }: { lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const [ready, setReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari's own (non-standard) way of reporting the same thing.
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setAlreadyInstalled(standalone);

    const ua = navigator.userAgent;
    const iOS =
      /iphone|ipad|ipod/i.test(ua) ||
      // iPadOS 13+ requests desktop Safari's UA string by default, so it
      // reports as "Mac" — touch support is what actually distinguishes it.
      (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    setIsIOSDevice(iOS);

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setAlreadyInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    setReady(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleClick() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") setAlreadyInstalled(true);
      } catch {
        // The browser's own install flow failing (dismissed, unsupported
        // mid-flight, etc.) isn't an app error — just drop the prompt.
      } finally {
        // A captured beforeinstallprompt event can only be used once.
        setDeferredPrompt(null);
      }
      return;
    }
    if (isIOSDevice) setShowIOSModal(true);
  }

  const canOfferInstall = ready && !alreadyInstalled && (!!deferredPrompt || isIOSDevice);
  if (!canOfferInstall) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className="font-body"
        style={{
          padding: "8px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 800,
          background: "var(--card)", color: "var(--ink)", border: "1.5px solid rgba(217,164,65,.5)",
          display: "flex", alignItems: "center", gap: 6, boxShadow: "0 3px 10px var(--ring)",
          whiteSpace: "nowrap", cursor: "pointer",
        }}
      >
        <span aria-hidden="true">📱</span>
        <span>{ar ? "ثبّت بقدونس" : "Install Bagdoonis"}</span>
      </button>

      {showIOSModal && <IOSInstallModal lang={lang} onClose={() => setShowIOSModal(false)} />}
    </>
  );
}
