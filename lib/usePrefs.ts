"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

/**
 * Language + dark-mode preference, persisted to localStorage.
 *
 * The initial values here must match what the server rendered ("ar", light)
 * so hydration doesn't mismatch. The real stored values are applied to
 * <html> before first paint by the inline script in app/layout.tsx, so the
 * visitor never sees a white/LTR flash even though React only catches up
 * during this effect.
 */
export function usePrefs() {
  const [lang, setLangState] = useState<Lang>("ar");
  const [dark, setDarkState] = useState(false);
  const [ready, setReady] = useState(false);

  // Mirrors the pre-paint script's logic, so React state agrees with the
  // DOM attributes that script already set.
  useEffect(() => {
    const storedLang = (localStorage.getItem("bagdoonis_lang") as Lang) || "ar";
    const storedDark = localStorage.getItem("bagdoonis_dark");
    const prefersDark =
      storedDark === null
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : storedDark === "1";
    setLangState(storedLang);
    setDarkState(prefersDark);
    setReady(true);
  }, []);

  // Keep <html> authoritative for theme + direction. Putting the class here
  // rather than only on a page wrapper means the background is correct
  // everywhere — including the overscroll/rubber-band area on mobile, which
  // previously stayed white in dark mode.
  useEffect(() => {
    if (!ready) return;
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
    el.classList.toggle("dark", dark);
  }, [lang, dark, ready]);

  // If the visitor has never explicitly chosen a theme, follow the OS as it
  // changes (e.g. scheduled night mode) instead of freezing on whatever it
  // was when the tab opened.
  useEffect(() => {
    if (localStorage.getItem("bagdoonis_dark") !== null) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setDarkState(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("bagdoonis_lang", l);
  };

  const setDark = (d: boolean) => {
    setDarkState(d);
    localStorage.setItem("bagdoonis_dark", d ? "1" : "0");
  };

  return { lang, setLang, dark, setDark, ready };
}
