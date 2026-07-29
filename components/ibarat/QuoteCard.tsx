"use client";

import Image from "next/image";
import {
  CARD_W, CARD_H, PAD_X, RADIUS, SIZE, QUOTE_CENTER_Y,
  FONT_QUOTE, FONT_UI, QUOTE_LINE_HEIGHT, quoteFontSize, FRONT_IMAGES,
} from "@/lib/ibarat-card";
import type { Quote } from "@/lib/ibarat-quotes-types";

/**
 * The card. The uploaded artwork IS the background — it already includes
 * the ornamental frame and the "bagdoonis.app" signature, so this only
 * overlays the quote text, centred in the blank writable area of the art
 * with a 15%-per-side margin so it can never collide with the border.
 */
export default function QuoteCard({
  quote, frontIndex, scale,
}: {
  quote: Quote;
  frontIndex: number;
  scale: number;
}) {
  const qSize = quoteFontSize(quote.text);
  const src = FRONT_IMAGES[frontIndex % FRONT_IMAGES.length];

  return (
    <div style={{ width: CARD_W * scale, height: CARD_H * scale, position: "relative" }}>
      <div
        dir="rtl"
        style={{
          width: CARD_W, height: CARD_H,
          transform: `scale(${scale})`, transformOrigin: "top right",
          position: "absolute", top: 0, right: 0,
          borderRadius: RADIUS, overflow: "hidden",
        }}
      >
        <Image src={src} alt="" fill priority sizes="400px" style={{ objectFit: "cover" }} />

        <div
          style={{
            position: "absolute", left: PAD_X, right: PAD_X, top: QUOTE_CENTER_Y,
            transform: "translateY(-50%)", textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0, fontFamily: `'${FONT_QUOTE}', serif`, fontSize: qSize,
              lineHeight: QUOTE_LINE_HEIGHT, fontWeight: 600, color: "#241539",
            }}
          >
            {quote.text}
          </p>
          {quote.author && (
            <p
              style={{
                margin: `${Math.round(qSize * 0.85)}px 0 0`,
                fontFamily: `'${FONT_UI}', sans-serif`, fontSize: SIZE.author,
                lineHeight: 1.4, fontWeight: 500, color: "#5c5045",
              }}
            >
              {`— ${quote.author}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
