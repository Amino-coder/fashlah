"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

export function usePrefs() {
  const [lang, setLangState] = useState<Lang>("ar");
  const [dark, setDarkState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedLang = (localStorage.getItem("bagdoonis_lang") as Lang) || "ar";
    const storedDark = localStorage.getItem("bagdoonis_dark") === "1";
    setLangState(storedLang);
    setDarkState(storedDark);
    setReady(true);
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
