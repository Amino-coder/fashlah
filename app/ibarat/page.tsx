"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import QuoteCard from "@/components/ibarat/QuoteCard";
import CardDeck from "@/components/ibarat/CardDeck";
import { shareCard } from "@/components/ibarat/exportCard";
import { trackPageView, trackPageComplete, trackPageEvent, newSessionKey } from "@/lib/trackPageView";
import { CARD_W, CARD_H, FRONT_IMAGES } from "@/lib/ibarat-card";
import type { Quote } from "@/lib/ibarat-quotes-types";
import QUOTES_DATA from "@/lib/ibarat-quotes.json";

const QUOTES = QUOTES_DATA as Quote[];

/**
 * عبارات — a quote-card experience, not a game.
 *
 * Deliberately doesn't use the platform's game chrome (no Blobs, no mascot,
 * no language or theme toggles): the brief asks for calm and minimal, and
 * this is Arabic-only by design, so a language switch would be noise. It
 * does keep the platform's back navigation so it sits inside Bagdoonis
 * rather than feeling like a separate site.
 */

const SHUFFLE_MS = 950;

export default function IbaratPage() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [frontIndex, setFrontIndex] = useState(0);
  const [shuffling, setShuffling] = useState(false);
  const [scale, setScale] = useState(0.28);
  const [shareState, setShareState] = useState<"idle" | "working" | "downloaded" | "failed">("idle");
  const [sessionKey] = useState(() => newSessionKey());

  // No other page on this platform was calling any tracking at all for
  // عبارات before this — "view" is the page loading (before anyone's
  // necessarily drawn a card), "complete" is an actual card being
  // revealed, since drawing a card is the entire interaction this page
  // offers. Fired once per draw, same sessionKey — if someone draws
  // several cards in one visit, that's several 'complete' rows against
  // one 'view', which is honest (more engagement, not a bug) rather than
  // something the admin queries need special-casing for: they only ever
  // check whether ANY complete row exists for a session_key, not how many.
  useEffect(() => { trackPageView("ibarat", sessionKey); }, [sessionKey]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The card is laid out at a literal 1080x1920 and scaled to fit whatever
  // room the viewport gives it, which is what keeps it pixel-identical to
  // the exported PNG.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setScale(Math.min(width / CARD_W, height / CARD_H));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [quote]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const pickQuote = useCallback((): Quote => {
    // Never hand back the card that's already showing.
    const pool = QUOTES.length > 1
      ? QUOTES.filter((q) => q.id !== lastIdRef.current)
      : QUOTES;
    const next = pool[Math.floor(Math.random() * pool.length)];
    lastIdRef.current = next.id;
    return next;
  }, []);

  const draw = useCallback(() => {
    if (shuffling) return;
    setShareState("idle");
    setShuffling(true);

    // A single short tick — a confirmation of the tap, not a buzz.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(12); } catch { /* unsupported — no matter */ }
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    timerRef.current = setTimeout(() => {
      setQuote(pickQuote());
      setFrontIndex(Math.floor(Math.random() * FRONT_IMAGES.length));
      setShuffling(false);
      trackPageComplete("ibarat", sessionKey);
    }, reduced ? 0 : SHUFFLE_MS);
  }, [shuffling, pickQuote, sessionKey]);

  async function onShare() {
    if (!quote || shareState === "working") return;
    setShareState("working");
    const result = await shareCard(quote, frontIndex);
    if (result === "shared" || result === "downloaded") trackPageEvent("ibarat", `share_result_${result}`, sessionKey);
    // "shared" and "cancelled" both end silently — the sheet already gave
    // the user feedback, and a toast after they deliberately backed out
    // would be nagging.
    if (result === "downloaded") setShareState("downloaded");
    else if (result === "failed") setShareState("failed");
    else setShareState("idle");
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        color: "var(--ink)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* A single very soft bloom — the only decoration on the page */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)",
          width: 620, height: 620, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 68%)",
        }}
      />

      <Link
        href="/"
        aria-label="الرئيسية"
        className="font-body btn-bag"
        style={{
          position: "absolute", top: 20, insetInlineStart: 20, zIndex: 3,
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 999,
          background: "var(--card)", boxShadow: "0 4px 14px var(--ring)",
          color: "var(--ink-soft)", textDecoration: "none",
          fontSize: 13, fontWeight: 700,
        }}
      >
        <ArrowRight size={15} />
        الرئيسية
      </Link>

      {!quote ? (
        /* ---------------- Home: title + deck, nothing else ---------------- */
        <div
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: "80px 28px 48px", gap: 10,
            position: "relative", zIndex: 1,
          }}
        >
          <h1
            className="ibarat-fade-up"
            style={{
              // Echoes the card artwork: the same El Messiri face used for
              // the quotes, in the deep navy / gold of the ornate borders.
              fontFamily: "'El Messiri', serif",
              fontSize: 58, fontWeight: 700, margin: 0, letterSpacing: "0.01em",
              color: "#1B3A55",
              textShadow: "2px 2px 0 #D9A441, 4px 4px 0 rgba(27,58,85,.28)",
            }}
          >
            عبارات
          </h1>

          <p
            className="ibarat-fade-up font-body"
            style={{ fontSize: 17, fontWeight: 700, margin: "2px 0 0", animationDelay: "80ms" }}
          >
            اختر بطاقة اليوم.
          </p>

          <p
            className="ibarat-fade-up font-body"
            style={{
              fontSize: 13.5, lineHeight: 1.85, color: "var(--ink-soft)",
              margin: "6px 0 0", maxWidth: 320, fontWeight: 500,
              animationDelay: "150ms",
            }}
          >
            كل بطاقة تحمل فكرة قد تلهم يومك… ويمكنك دائمًا سحب بطاقة أخرى.
          </p>

          <div className="ibarat-fade-up" style={{ marginTop: 40, animationDelay: "220ms" }}>
            <CardDeck shuffling={shuffling} onDraw={draw} />
          </div>
        </div>
      ) : (
        /* ---------------- Revealed card ---------------- */
        <div
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", padding: "68px 20px 28px",
            gap: 18, position: "relative", zIndex: 1, minHeight: 0,
          }}
        >
          <div
            ref={stageRef}
            style={{
              flex: 1, width: "100%", minHeight: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div className="ibarat-reveal" key={quote.id} style={{ filter: "drop-shadow(0 22px 48px rgba(0,0,0,0.34))" }}>
              <QuoteCard quote={quote} frontIndex={frontIndex} scale={scale} />
            </div>
          </div>

          <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <button
              onClick={onShare}
              disabled={shareState === "working"}
              className="font-body btn-bag"
              style={{
                width: "100%", padding: 15, fontSize: 15, fontWeight: 800,
                borderRadius: 999, border: "none", color: "#fff",
                background: "linear-gradient(135deg, #FF2E93, #7C3AED)",
                boxShadow: "0 10px 26px rgba(124,58,237,0.32)",
                opacity: shareState === "working" ? 0.75 : 1,
              }}
            >
              {shareState === "working" ? "جاري التجهيز..." : "شارك البطاقة"}
            </button>

            <button
              onClick={draw}
              disabled={shuffling}
              className="font-body btn-bag"
              style={{
                width: "100%", padding: 14, fontSize: 14, fontWeight: 700,
                borderRadius: 999, border: "none",
                background: "var(--card)", color: "var(--ink)",
                boxShadow: "0 4px 16px var(--ring)",
                opacity: shuffling ? 0.6 : 1,
              }}
            >
              بطاقة أخرى
            </button>

            <p
              aria-live="polite"
              className="font-body"
              style={{
                margin: 0, textAlign: "center", fontSize: 12, fontWeight: 600,
                minHeight: 16, color: shareState === "failed" ? "#E63946" : "var(--ink-soft)",
              }}
            >
              {shareState === "downloaded" && "تم حفظ البطاقة في جهازك"}
              {shareState === "failed" && "تعذّر تجهيز الصورة، حاول مرة أخرى"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
