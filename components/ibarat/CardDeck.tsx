"use client";

import Image from "next/image";
import { useMemo } from "react";
import { BACK_IMAGES } from "@/lib/ibarat-card";

/**
 * The deck on the home screen — stacked layers of the uploaded back
 * artwork, fanned and shuffled on tap (same animation classes as before;
 * only what's drawn on each layer changed, from a flat gradient to the
 * real card-back images).
 */
type Layer = { r0: string; rf: string; fx: string; fy: string };

const LAYERS: Layer[] = [
  { r0: "-9deg", rf: "-21deg", fx: "-26px", fy: "10px" },
  { r0: "-4deg", rf: "-11deg", fx: "-13px", fy: "5px" },
  { r0: "1deg", rf: "3deg", fx: "4px", fy: "-2px" },
  { r0: "5deg", rf: "13deg", fx: "16px", fy: "4px" },
  { r0: "0deg", rf: "0deg", fx: "0px", fy: "0px" },
];

export default function CardDeck({
  shuffling, onDraw, width = 208,
}: {
  shuffling: boolean;
  onDraw: () => void;
  width?: number;
}) {
  const height = Math.round((width * 16) / 9);
  // Stable for the component's lifetime so the deck doesn't visibly swap
  // images between renders — only which back shows on each layer.
  const layerImages = useMemo(
    () => LAYERS.map((_, i) => BACK_IMAGES[i % BACK_IMAGES.length]),
    []
  );

  return (
    <button
      onClick={onDraw}
      disabled={shuffling}
      aria-label="اسحب بطاقة"
      className={`ibarat-deck ${shuffling ? "is-shuffling" : ""}`}
      style={{ position: "relative", width, height, background: "none", border: "none", padding: 0, perspective: 1200 }}
    >
      {LAYERS.map((layer, i) => {
        const isTop = i === LAYERS.length - 1;
        return (
          <div
            key={i}
            className={`ibarat-deck-card ${isTop ? "is-top" : ""}`}
            style={{
              position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
              transform: `rotate(${layer.r0})`,
              ["--r0" as string]: layer.r0, ["--rf" as string]: layer.rf,
              ["--fx" as string]: layer.fx, ["--fy" as string]: layer.fy,
              animationDelay: `${i * 42}ms`,
            }}
          >
            <Image src={layerImages[i]} alt="" fill sizes="220px" style={{ objectFit: "cover" }} />
          </div>
        );
      })}
    </button>
  );
}
