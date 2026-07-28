"use client";

import { useEffect, useState } from "react";
import {
  CARD_W, CARD_H, PAD_X, RADIUS, SIZE, Y, RULE,
  BRAND_URL, FONT_QUOTE, FONT_UI, QUOTE_LINE_HEIGHT, quoteFontSize,
  type Palette,
} from "@/lib/ibarat-card";
import { getTextureUrl, TEXTURE_TILE } from "@/lib/ibarat-texture";
import type { Quote } from "@/lib/ibarat-quotes-types";

/**
 * The card, drawn at its true 1080x1920 export size and then scaled down by
 * the caller with a CSS transform. Laying it out at final size (rather than
 * in responsive units) is what lets the PNG export reuse the exact same
 * numbers and come out identical.
 */
export default function QuoteCard({
  quote, palette, scale,
}: {
  quote: Quote;
  palette: Palette;
  scale: number;
}) {
  const qSize = quoteFontSize(quote.text);

  // Generated in the browser, so it can't be read during SSR. Applied after
  // mount; the card is perfectly presentable in the frame before it lands.
  const [texture, setTexture] = useState<string | null>(null);
  useEffect(() => { setTexture(getTextureUrl()); }, []);

  return (
    <div style={{ width: CARD_W * scale, height: CARD_H * scale, position: "relative" }}>
      <div
        dir="rtl"
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${scale})`,
          transformOrigin: "top right",
          position: "absolute",
          top: 0,
          right: 0,
          borderRadius: RADIUS,
          overflow: "hidden",
          background: `linear-gradient(158deg, ${palette.from} 0%, ${palette.mid} 52%, ${palette.to} 100%)`,
          color: palette.ink,
        }}
      >
        {/* Light falling from upper-left — gives the flat gradient a direction */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse 78% 52% at 28% 8%, rgba(255,255,255,0.10) 0%, transparent 62%)`,
          }}
        />
        {/* Bloom behind the quote */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(circle at 50% 40%, ${palette.glow}22 0%, transparent 56%)`,
          }}
        />
        {/* Paper grain + faint lattice, well under 5% opacity */}
        {texture && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: `url(${texture})`,
              backgroundRepeat: "repeat",
              backgroundSize: `${TEXTURE_TILE}px ${TEXTURE_TILE}px`,
            }}
          />
        )}
        {/* Vignette, to settle the edges */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(circle at 50% 44%, transparent 56%, rgba(0,0,0,0.26) 100%)",
          }}
        />

        {/* Card number — understated on purpose */}
        <div
          style={{
            position: "absolute", top: Y.cardNumber, left: 0, right: 0,
            textAlign: "center",
            fontFamily: `'${FONT_UI}', sans-serif`,
            fontSize: SIZE.cardNumber, fontWeight: 500,
            letterSpacing: "0.16em",
            color: palette.faint,
          }}
        >
          {`بطاقة #${quote.id}`}
        </div>

        {/* Quote block, optically centred */}
        <div
          style={{
            position: "absolute",
            left: PAD_X, right: PAD_X,
            top: Y.quoteCenter,
            transform: "translateY(-50%)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: `'${FONT_QUOTE}', serif`,
              fontSize: qSize,
              lineHeight: QUOTE_LINE_HEIGHT,
              fontWeight: 600,
              color: palette.ink,
            }}
          >
            {quote.text}
          </p>

          {quote.author && (
            <p
              style={{
                margin: `${Math.round(qSize * 0.85)}px 0 0`,
                fontFamily: `'${FONT_UI}', sans-serif`,
                fontSize: SIZE.author,
                // Pinned (not inherited) so the exported canvas can reproduce
                // this block's height with the same arithmetic.
                lineHeight: 1.4,
                fontWeight: 400,
                color: palette.soft,
              }}
            >
              {`— ${quote.author}`}
            </p>
          )}
        </div>

        {/* Divider — hairlines either side of a small diamond */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: Y.rule, left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: RULE.gap,
          }}
        >
          <span style={{ display: "block", width: RULE.lineWidth, height: 1, background: palette.faint, opacity: RULE.lineOpacity }} />
          <span style={{ display: "block", width: RULE.diamond, height: RULE.diamond, background: palette.faint, opacity: RULE.diamondOpacity, transform: "rotate(45deg)" }} />
          <span style={{ display: "block", width: RULE.lineWidth, height: 1, background: palette.faint, opacity: RULE.lineOpacity }} />
        </div>

        {/* Signature */}
        <div
          style={{
            position: "absolute", top: Y.url, left: 0, right: 0,
            textAlign: "center",
            fontFamily: `'${FONT_UI}', sans-serif`,
            fontSize: SIZE.url, fontWeight: 400,
            letterSpacing: "0.2em",
            color: palette.soft,
            direction: "ltr",
          }}
        >
          {BRAND_URL}
        </div>
      </div>
    </div>
  );
}
