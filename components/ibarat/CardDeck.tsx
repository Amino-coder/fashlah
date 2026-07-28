"use client";

import { PALETTES } from "@/lib/ibarat-card";

/**
 * The deck on the home screen. Five stacked card backs at slight angles,
 * which fan out and settle when tapped while the top card lifts away.
 *
 * The backs borrow the palette colours so the deck reads as the same object
 * family as the card that comes out of it, without previewing any specific
 * card.
 */

type Layer = {
  /** Resting angle. */
  r0: string;
  /** Where it travels mid-shuffle. */
  rf: string;
  fx: string;
  fy: string;
  paletteIndex: number;
};

const LAYERS: Layer[] = [
  { r0: "-9deg", rf: "-21deg", fx: "-26px", fy: "10px", paletteIndex: 6 },
  { r0: "-4deg", rf: "-11deg", fx: "-13px", fy: "5px",  paletteIndex: 4 },
  { r0: "1deg",  rf: "3deg",   fx: "4px",   fy: "-2px", paletteIndex: 1 },
  { r0: "5deg",  rf: "13deg",  fx: "16px",  fy: "4px",  paletteIndex: 3 },
  { r0: "0deg",  rf: "0deg",   fx: "0px",   fy: "0px",  paletteIndex: 0 },
];

export default function CardDeck({
  shuffling, onDraw, width = 208,
}: {
  shuffling: boolean;
  onDraw: () => void;
  width?: number;
}) {
  const height = Math.round((width * 16) / 9);

  return (
    <button
      onClick={onDraw}
      disabled={shuffling}
      aria-label="اسحب بطاقة"
      className={`ibarat-deck ${shuffling ? "is-shuffling" : ""}`}
      style={{
        position: "relative",
        width, height,
        background: "none",
        border: "none",
        padding: 0,
        // Gives the fan a little depth instead of reading as a flat slide.
        perspective: 1200,
      }}
    >
      {LAYERS.map((layer, i) => {
        const p = PALETTES[layer.paletteIndex];
        const isTop = i === LAYERS.length - 1;
        return (
          <div
            key={i}
            className={`ibarat-deck-card ${isTop ? "is-top" : ""}`}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 22,
              background: `linear-gradient(160deg, ${p.from} 0%, ${p.to} 100%)`,
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
              border: "1px solid rgba(255,255,255,0.07)",
              transform: `rotate(${layer.r0})`,
              // Consumed by the ibaratFan/ibaratDraw keyframes.
              ["--r0" as string]: layer.r0,
              ["--rf" as string]: layer.rf,
              ["--fx" as string]: layer.fx,
              ["--fy" as string]: layer.fy,
              animationDelay: `${i * 42}ms`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Only the face-up card gets the emblem; the ones behind stay plain. */}
            {isTop && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.5 }}>
                <span style={{ display: "block", width: 44, height: 1, background: p.ink, opacity: 0.5 }} />
                <span style={{ display: "block", width: 13, height: 13, border: `1.5px solid ${p.ink}`, transform: "rotate(45deg)", opacity: 0.75 }} />
                <span style={{ display: "block", width: 44, height: 1, background: p.ink, opacity: 0.5 }} />
              </div>
            )}
          </div>
        );
      })}
    </button>
  );
}
