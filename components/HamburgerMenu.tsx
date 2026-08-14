"use client";

import { useState } from "react";
import { Menu, Sun, Moon } from "lucide-react";
import type { Lang } from "@/lib/i18n";

/**
 * Replaces the home header's separate always-visible dark-mode and
 * language buttons with one small icon button that opens a short
 * settings popover — same functionality (usePrefs' setDark/setLang),
 * just not permanently taking up header space. Deliberately NOT in a
 * pill like the other header buttons — a plain icon button, since this
 * is explicitly the "utility" tier of the header's hierarchy, not
 * something meant to compete visually with بقدونس Plus/profile/install.
 */
export default function HamburgerMenu({
  lang, setLang, dark, setDark,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
}) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={ar ? "القائمة" : "Menu"}
        aria-expanded={open}
        style={{
          width: 36, height: 36, borderRadius: 10, background: "transparent",
          color: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Menu size={20} />
      </button>

      {open && (
        <>
          {/* Full-screen invisible layer, closes the menu on any outside tap
              — same pattern as LoginButton's own dropdown. */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
          <div
            className="card pop"
            role="menu"
            style={{
              position: "absolute", top: "calc(100% + 8px)", insetInlineStart: 0, zIndex: 40,
              minWidth: 190, padding: 8,
            }}
          >
            {/* الوضع — same setDark call the old standalone button used */}
            <div style={{ padding: "8px 10px 4px", fontSize: 10.5, fontWeight: 800, color: "var(--ink-soft)", letterSpacing: "0.04em" }}>
              {ar ? "☀️ الوضع" : "☀️ Theme"}
            </div>
            <div style={{ display: "flex", gap: 6, padding: "0 6px 10px" }}>
              <button
                onClick={() => setDark(false)}
                aria-pressed={!dark}
                className="font-body"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "8px 6px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: !dark ? "1.5px solid var(--purple)" : "1.5px solid var(--ring)",
                  background: !dark ? "rgba(124,58,237,0.08)" : "transparent", color: "var(--ink)",
                }}
              >
                <Sun size={13} /> {ar ? "فاتح" : "Light"}
              </button>
              <button
                onClick={() => setDark(true)}
                aria-pressed={dark}
                className="font-body"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "8px 6px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: dark ? "1.5px solid var(--purple)" : "1.5px solid var(--ring)",
                  background: dark ? "rgba(124,58,237,0.08)" : "transparent", color: "var(--ink)",
                }}
              >
                <Moon size={13} /> {ar ? "داكن" : "Dark"}
              </button>
            </div>

            <div style={{ height: 1, background: "var(--ring)", margin: "2px 6px 8px" }} />

            {/* اللغة — same setLang call the old standalone EN/AR button used */}
            <div style={{ padding: "0 10px 4px", fontSize: 10.5, fontWeight: 800, color: "var(--ink-soft)", letterSpacing: "0.04em" }}>
              {ar ? "🌐 اللغة" : "🌐 Language"}
            </div>
            <div style={{ display: "flex", gap: 6, padding: "0 6px 6px" }}>
              <button
                onClick={() => setLang("ar")}
                aria-pressed={ar}
                className="font-body"
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: ar ? "1.5px solid var(--purple)" : "1.5px solid var(--ring)",
                  background: ar ? "rgba(124,58,237,0.08)" : "transparent", color: "var(--ink)",
                }}
              >
                العربية
              </button>
              <button
                onClick={() => setLang("en")}
                aria-pressed={!ar}
                className="font-body"
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: !ar ? "1.5px solid var(--purple)" : "1.5px solid var(--ring)",
                  background: !ar ? "rgba(124,58,237,0.08)" : "transparent", color: "var(--ink)",
                }}
              >
                English
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
