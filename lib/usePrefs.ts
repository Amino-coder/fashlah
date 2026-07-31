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
 *
 * Dark is the default for anyone who hasn't explicitly chosen a theme —
 * deliberately not tied to the OS colour scheme, so it doesn't matter
 * whether a first-time visitor's phone is set to light or dark mode.
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
    const prefersDark = storedDark === null ? true : storedDark === "1";
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
