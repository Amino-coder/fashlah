"use client";

import Link from "next/link";
import { Home } from "lucide-react";

/**
 * Small fixed icon button that always routes back to "/". Uses the logical
 * `insetInlineStart` property (not `left`) so it sits top-left in LTR (EN)
 * and correctly flips to top-right in RTL (AR) instead of overlapping the
 * lang/dark-mode toggles that live on the opposite corner.
 *
 * Intentionally left out of active gameplay (Rounds 1-4, results-wait)
 * so no one accidentally bails out of a game in progress — only shown on
 * pre-game / lobby / error screens where leaving is a safe, expected action.
 */
export default function HomeButton({ label, href = "/" }: { label: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      style={{
        position: "absolute",
        top: 24,
        insetInlineStart: 24,
        zIndex: 2,
        width: 36,
        height: 36,
        borderRadius: 999,
        background: "var(--card)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px var(--ring)",
        textDecoration: "none",
        color: "var(--ink)",
      }}
    >
      <Home size={16} />
    </Link>
  );
}
