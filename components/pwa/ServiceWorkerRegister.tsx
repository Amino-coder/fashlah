"use client";

import { useEffect } from "react";

/**
 * Renders nothing — just registers public/sw.js on mount. Lives at the
 * root layout so it's registered regardless of which page someone lands
 * on first, which is what the install button (see InstallBagdoonisButton)
 * relies on for installability on Chromium/Android. See public/sw.js for
 * why the worker itself is deliberately minimal.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing (unsupported browser, blocked, etc.) should
      // never surface as an app error — installability is purely optional.
    });
  }, []);

  return null;
}
