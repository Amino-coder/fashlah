"use client";

import HexTile from "./HexTile";

export type BidalSlot = { letter: string; used: boolean };

/**
 * Real hex-grid packing, not an approximation. HexTile is a flat-top
 * hexagon (flat horizontal edges, pointed left/right — see its clip-path),
 * and the standard way those interlock without gaps is COLUMNS: tiles in
 * the same column stack with full-height spacing, and each column is
 * offset horizontally by 3/4 of the tile width from its neighbor, with
 * odd columns additionally pushed down by half a tile height. That's
 * exactly what colGap/rowGap/the (col % 2) offset below compute — every
 * tile's (x, y) is derived from that formula, not eyeballed pixel values.
 *
 * 15 letters lay out as a clean 5-column × 3-row honeycomb (5×3 = 15
 * exactly, matching drawLetters(15) in lib/bidal-letters.ts) — a
 * self-contained cluster rather than a long strip.
 *
 * Positions are absolute and keyed by a fixed slot index (0–14) for the
 * whole game. A used letter's tile switches to HexTile's `used` (gap)
 * state in place — nothing about any other tile's position ever changes,
 * so the hand never reflows or rearranges as it empties.
 */
const COLS = 5;
const ROWS = 3;

export function honeycombGeometry(tileSize: number) {
  const tileW = tileSize;
  const tileH = tileSize * 0.88;
  const colGap = tileW * 0.75;
  const rowGap = tileH;
  const width = (COLS - 1) * colGap + tileW;
  const height = (ROWS - 1) * rowGap + rowGap / 2 + tileH;
  return { tileW, tileH, colGap, rowGap, width, height };
}

export function honeycombSlotPosition(index: number, tileSize: number) {
  const { colGap, rowGap } = honeycombGeometry(tileSize);
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = col * colGap;
  const y = row * rowGap + (col % 2 === 1 ? rowGap / 2 : 0);
  return { x, y };
}

export default function Honeycomb({
  slots, tileSize = 62, selectedIndex, dragIndex, onPointerDown,
}: {
  slots: BidalSlot[];
  tileSize?: number;
  selectedIndex: number | null;
  dragIndex: number | null;
  onPointerDown: (e: React.PointerEvent, index: number) => void;
}) {
  const { tileW, tileH, width, height } = honeycombGeometry(tileSize);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width, height }}>
        {slots.map((slot, index) => {
          const { x, y } = honeycombSlotPosition(index, tileSize);
          return (
            <HexTile
              key={index}
              letter={slot.letter}
              used={slot.used}
              size={tileSize}
              selected={selectedIndex === index}
              dragging={dragIndex === index}
              onPointerDown={slot.used ? undefined : (e) => onPointerDown(e, index)}
              style={{ position: "absolute", left: x, top: y, width: tileW, height: tileH }}
            />
          );
        })}
      </div>
    </div>
  );
}
