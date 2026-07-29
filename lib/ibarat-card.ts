/**
 * Shared design system for the عبارات cards.
 *
 * Everything here is expressed in one fixed 1080x1920 coordinate space —
 * the exact Instagram/WhatsApp/Snapchat story size. The on-screen card is
 * rendered at those literal pixel dimensions and then CSS-scaled down to
 * fit the viewport, while the PNG export draws the same coordinates 1:1
 * onto a canvas.
 *
 * That's deliberate: the exported image has to look identical to the card
 * on screen, and the usual approaches (screenshotting the DOM, rasterising
 * an SVG) either pull in a heavy dependency or silently drop the web font,
 * which would wreck the Arabic. Sharing one coordinate system means the two
 * renderers can't drift on layout.
 */

export const CARD_W = 1080;
export const CARD_H = 1920;

/** Horizontal breathing room. Arabic at this size needs a lot of it. */
// 15% of the card width on each side, so the quote never overlaps the
// ornamental border of the uploaded card art.
export const PAD_X = Math.round(1080 * 0.20);

export const RADIUS = 56;

export type Palette = {
  name: string;
  /** Three stops rather than two — a single linear ramp reads flat at this size. */
  from: string;
  mid: string;
  to: string;
  /** Soft bloom behind the quote. */
  glow: string;
  /** Quote text. */
  ink: string;
  /** Author and signature. */
  soft: string;
  /** Card number and divider — deliberately quieter than `soft`. */
  faint: string;
};

/**
 * Deep jewel tones with warm cream text. Lifted noticeably from the first
 * pass, which sat too dark and too flat: each palette now runs light ->
 * mid -> deep so there's an actual sense of light falling across the card
 * rather than one uniform wash.
 *
 * A card's palette is derived from its id, so card #27 always looks exactly
 * the same. That consistency is what makes the set feel collectible.
 */
export const PALETTES: Palette[] = [
  { name: "emerald",    from: "#1B5D46", mid: "#0F3D2E", to: "#08281E", glow: "#4FD3A0", ink: "#FBF8F1", soft: "rgba(251,248,241,0.60)", faint: "rgba(251,248,241,0.34)" },
  { name: "midnight",   from: "#20395F", mid: "#13253F", to: "#0A1526", glow: "#6E9BE0", ink: "#F8F6F1", soft: "rgba(248,246,241,0.60)", faint: "rgba(248,246,241,0.34)" },
  { name: "sand",       from: "#7A5934", mid: "#4E3620", to: "#2B1B0F", glow: "#E3B478", ink: "#FDF7EA", soft: "rgba(253,247,234,0.62)", faint: "rgba(253,247,234,0.36)" },
  { name: "plum",       from: "#54275B", mid: "#341739", to: "#1B0C20", glow: "#C079CC", ink: "#FBF4F9", soft: "rgba(251,244,249,0.60)", faint: "rgba(251,244,249,0.34)" },
  { name: "teal",       from: "#155E68", mid: "#0C3A41", to: "#062429", glow: "#4FC4CE", ink: "#F5FAF9", soft: "rgba(245,250,249,0.60)", faint: "rgba(245,250,249,0.34)" },
  { name: "terracotta", from: "#7A3C28", mid: "#4C2317", to: "#2A130C", glow: "#E4885C", ink: "#FDF4EC", soft: "rgba(253,244,236,0.62)", faint: "rgba(253,244,236,0.36)" },
  { name: "slate",      from: "#3B434F", mid: "#242A33", to: "#12161B", glow: "#93A3B8", ink: "#F5F6F8", soft: "rgba(245,246,248,0.58)", faint: "rgba(245,246,248,0.32)" },
  { name: "burgundy",   from: "#67243E", mid: "#411326", to: "#210813", glow: "#D45C86", ink: "#FDF3F6", soft: "rgba(253,243,246,0.60)", faint: "rgba(253,243,246,0.34)" },
  { name: "olive",      from: "#4C6030", mid: "#2F3B1D", to: "#181D0E", glow: "#A8C168", ink: "#F8F9EF", soft: "rgba(248,249,239,0.60)", faint: "rgba(248,249,239,0.34)" },
  { name: "azure",      from: "#1F4E72", mid: "#123048", to: "#081A26", glow: "#63AEDC", ink: "#F3F8FC", soft: "rgba(243,248,252,0.60)", faint: "rgba(243,248,252,0.34)" },
];

export function paletteFor(id: number): Palette {
  return PALETTES[Math.abs(id) % PALETTES.length];
}

/**
 * El Messiri — modern Arabic with calligraphic bones. Replaces Amiri, which
 * is a lovely face but reads as a classical book type and felt generic here.
 *
 * If you want to try alternates, this is the only line to change (plus the
 * Google Fonts import in globals.css). Two that were close runners-up:
 *   "IBM Plex Sans Arabic" — cleaner, more neutral, slightly corporate
 *   "Reem Kufi"            — geometric kufi, more striking but more stylised
 */
export const FONT_QUOTE = "El Messiri";
export const FONT_UI = "Tajawal";

/**
 * Sizes stepped down ~5% from the first pass, and El Messiri sets about 11%
 * wider than Amiri at the same nominal px, so the quote reads noticeably
 * calmer and has more room around it.
 */
// 20% smaller across the board than the previous ladder.
export function quoteFontSize(text: string): number {
  const n = text.length;
  if (n <= 28) return 76;
  if (n <= 42) return 67;
  if (n <= 58) return 59;
  if (n <= 78) return 54;
  if (n <= 100) return 47;
  return 42;
}

/** Generous, because Arabic diacritics need vertical room to not collide. */
export const QUOTE_LINE_HEIGHT = 1.72;

export const SIZE = {
  cardNumber: 28,
  author: 34,
  url: 26,
};

/**
 * Rebalanced now the QR is gone. The quote sits above the geometric centre
 * of the content, which is where it needs to be to read as centred, and the
 * bottom margin is deliberately deeper than the top — the same convention
 * as the mat on a framed print.
 */
// Vertical centre of the blank writable area inside the uploaded card art.
export const QUOTE_CENTER_Y = 920;

/** Divider: hairline rules flanking a small diamond. */
export const RULE = {
  lineWidth: 104,
  gap: 16,
  diamond: 7,
  lineOpacity: 0.5,
  diamondOpacity: 0.7,
};

export const BRAND_URL = "bagdoonis.app";

/**
 * The uploaded card artwork. Backs are shown on the deck; fronts are the
 * revealed card. Both live in /public and are loaded as plain <img>/canvas
 * sources, so nothing here needs to draw a background — the art already
 * includes the ornamental frame, and "bagdoonis.app" is baked into every
 * front design already, so the app doesn't render its own copy.
 */
export const FRONT_IMAGES = [
  "/ibarat-cards/front-1.jpg",
  "/ibarat-cards/front-2.jpg",
  "/ibarat-cards/front-3.jpg",
  "/ibarat-cards/front-4.jpg",
  "/ibarat-cards/front-6.jpg",
];

// Down to a single back design, repeated across the deck's fanned layers.
// One back design, repeated across every fanned deck layer — the ones
// behind the top card are almost fully occluded, so separate art there
// only cost bundle size.
export const BACK_IMAGES = [
  "/ibarat-cards/back-2.jpg",
];
