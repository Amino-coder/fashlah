/**
 * The paper texture: fine grain plus a very faint diamond lattice.
 *
 * Generated once in the browser onto an offscreen canvas and cached, then
 * consumed two ways — as a CSS background-image on the on-screen card, and
 * as a canvas pattern in the PNG export. Both read the exact same tile, so
 * the texture can't drift between what you see and what you share.
 *
 * Doing it at runtime rather than shipping a PNG keeps it out of the bundle
 * entirely (a 256px noise tile compresses badly — tens of KB — for
 * something that's under 5% opacity). The PRNG is seeded, so the "random"
 * grain is identical on every device and every render.
 *
 * The whole thing is built from per-pixel maths on a modulo grid, which
 * makes it seamlessly tileable by construction — no edge matching needed.
 */

const TILE = 256;
/** Lattice cell; divides TILE evenly so the pattern wraps cleanly. */
const CELL = 64;

/** mulberry32 — small, fast, deterministic. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cachedCanvas: HTMLCanvasElement | null = null;
let cachedUrl: string | null = null;

function build(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(TILE, TILE);
  const rnd = seeded(0x0CEA11);

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = (y * TILE + x) * 4;

      // Diamond lattice: L1 distance to the nearest cell centre, kept as a
      // thin outline rather than a filled shape so it reads as a watermark.
      const dx = Math.abs((x % CELL) - CELL / 2);
      const dy = Math.abs((y % CELL) - CELL / 2);
      const ring = Math.abs(dx + dy - CELL * 0.36);
      const lattice = Math.max(0, 1 - ring / 1.6);

      // Grain
      const g = rnd() - 0.5;

      const aLattice = lattice * 11;
      const aGrain = Math.abs(g) * 22;

      let lum: number;
      let alpha: number;
      if (aLattice >= aGrain) {
        lum = 255;
        alpha = aLattice;
      } else {
        lum = g > 0 ? 255 : 0;
        alpha = aGrain;
      }

      img.data[i] = lum;
      img.data[i + 1] = lum;
      img.data[i + 2] = lum;
      // Hard ceiling — this must stay at "only visible if you look for it".
      // Peaks around 4% opacity; below ~3% it stops reading as texture at all.
      img.data[i + 3] = Math.min(16, alpha);
    }
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

/** The tile as a canvas, for ctx.createPattern in the PNG export. */
export function getTextureCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!cachedCanvas) cachedCanvas = build();
  return cachedCanvas;
}

/** The tile as a data URL, for CSS background-image on the live card. */
export function getTextureUrl(): string | null {
  if (typeof document === "undefined") return null;
  if (!cachedUrl) {
    const c = getTextureCanvas();
    cachedUrl = c ? c.toDataURL("image/png") : null;
  }
  return cachedUrl;
}

export const TEXTURE_TILE = TILE;
