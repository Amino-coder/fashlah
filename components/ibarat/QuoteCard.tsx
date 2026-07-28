"use client";

import {
  CARD_W, CARD_H, PAD_X, RADIUS, QR, QR_MATRIX, SIZE, Y,
  BRAND_URL, FONT_QUOTE, FONT_UI, QUOTE_LINE_HEIGHT, quoteFontSize,
  type Palette,
} from "@/lib/ibarat-card";
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
  const modules = QR_MATRIX.length;

  return (
    <div
      style={{
        width: CARD_W * scale,
        height: CARD_H * scale,
        // The card is laid out at full size inside this box; the transform
        // shrinks it to fit without changing any of the internal geometry.
        position: "relative",
      }}
    >
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
          background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: palette.ink,
        }}
      >
        {/* Soft bloom behind the quote — stops the flat gradient looking dead */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(circle at 50% 42%, ${palette.glow}38 0%, transparent 58%)`,
          }}
        />
        {/* Vignette, to settle the edges */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,0.32) 100%)",
          }}
        />

        {/* Card number */}
        <div
          style={{
            position: "absolute", top: Y.cardNumber, left: 0, right: 0,
            textAlign: "center",
            fontFamily: `'${FONT_UI}', sans-serif`,
            fontSize: SIZE.cardNumber, fontWeight: 500,
            letterSpacing: "0.14em",
            color: palette.soft,
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
              fontWeight: 700,
              color: palette.ink,
            }}
          >
            {quote.text}
          </p>

          {quote.author && (
            <p
              style={{
                margin: `${Math.round(qSize * 0.9)}px 0 0`,
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

        {/* Hairline rule with a small diamond — quiet structure above the branding */}
        <div style={{ position: "absolute", top: Y.rule, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <span style={{ display: "block", width: 150, height: 1, background: palette.soft, opacity: 0.4 }} />
          <span style={{ display: "block", width: 9, height: 9, background: palette.soft, opacity: 0.55, transform: "rotate(45deg)" }} />
          <span style={{ display: "block", width: 150, height: 1, background: palette.soft, opacity: 0.4 }} />
        </div>

        {/* QR — dark modules on a light plate so it scans on every palette */}
        <div
          style={{
            position: "absolute", top: Y.qrPlateTop, left: 0, right: 0,
            display: "flex", justifyContent: "center",
          }}
        >
          <div
            style={{
              width: QR.plate, height: QR.plate,
              borderRadius: QR.plateRadius,
              background: QR.light,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg
              width={QR.plate - QR.quiet * 2}
              height={QR.plate - QR.quiet * 2}
              viewBox={`0 0 ${modules} ${modules}`}
              shapeRendering="crispEdges"
              aria-hidden="true"
            >
              {QR_MATRIX.map((row, y) =>
                row.split("").map((cell, x) =>
                  cell === "1" ? (
                    <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={QR.dark} />
                  ) : null
                )
              )}
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            position: "absolute", top: Y.url, left: 0, right: 0,
            textAlign: "center",
            fontFamily: `'${FONT_UI}', sans-serif`,
            fontSize: SIZE.url, fontWeight: 500,
            letterSpacing: "0.16em",
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
