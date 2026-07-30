/**
 * Shared design system for the القصيدة share card.
 *
 * Unlike عبارات (which draws on top of pre-made uploaded artwork), this card
 * has no fixed content shape — a poem can be anywhere from one opening بيت
 * to seven lines plus author credits — so the background is drawn
 * programmatically (a gradient + a thin gold frame) instead of relying on a
 * fixed image. That also means it needs zero new asset uploads.
 *
 * Same fixed 1080x1920 coordinate space as the عبارات card, for the same
 * reason: the story-size export should look like what's on screen.
 */

export const CARD_W = 1080;
export const CARD_H = 1920;
export const RADIUS = 56;

// Safe text area, generous on the sides — Arabic needs the room, and the
// gold frame sits just inside the card edge.
export const PAD_X = Math.round(CARD_W * 0.14);
export const FRAME_INSET = 36;

export type QaseedaPalette = {
  name: string;
  from: string;
  mid: string;
  to: string;
  gold: string;
  ink: string; // main poem text
  soft: string; // author credits / meta
  faint: string; // footer / brand
};

/**
 * A small curated set (not the full عبارات ladder — a poem card wants one
 * consistent "premium gathering" mood, just with a little variety between
 * sessions). Picked deterministically from the room code so the same poem
 * always exports the same look.
 */
export const QASEEDA_PALETTES: QaseedaPalette[] = [
  { name: "midnight", from: "#1B3A55", mid: "#122842", to: "#0A1526", gold: "#D9A441", ink: "#FBF6E9", soft: "rgba(251,246,233,0.66)", faint: "rgba(217,164,65,0.55)" },
  { name: "plum",     from: "#4A1F45", mid: "#33152F", to: "#180A18", gold: "#E3B478", ink: "#FBF4F9", soft: "rgba(251,244,249,0.66)", faint: "rgba(227,180,120,0.55)" },
  { name: "emerald",  from: "#123D2E", mid: "#0C2A20", to: "#061510", gold: "#D9A441", ink: "#F6F8F1", soft: "rgba(246,248,241,0.66)", faint: "rgba(217,164,65,0.55)" },
];

export function paletteForCode(code: string): QaseedaPalette {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return QASEEDA_PALETTES[hash % QASEEDA_PALETTES.length];
}

export const FONT_QUOTE = "El Messiri";
export const FONT_UI = "Tajawal";

export const SIZE = {
  eyebrow: 30,
  title: 62,
  author: 30,
  footerLabel: 26,
  footerNames: 32,
  brand: 24,
};

export const OPENING_LINE_HEIGHT = 1.55;
export const LINE_HEIGHT = 1.5;

export const RULE = {
  lineWidth: 90,
  gap: 14,
  diamond: 6,
};

export const BRAND_URL = "bagdoonis.app";

/**
 * Shared between the on-screen preview and the canvas export so the two
 * never drift. Every poem entry (opening or round) is now rendered as ONE
 * flowing two-hemistich line, so length is just "how many couplets" —
 * from a single opening line up to a full opening + 5 rounds.
 */
export function poemFontSizeFor(lineUnits: number): number {
  if (lineUnits <= 2) return 44;
  if (lineUnits <= 3) return 40;
  if (lineUnits <= 4) return 36;
  if (lineUnits <= 5) return 32;
  return 28;
}

export function lineUnitsFor(poem: { line1: string }[]): number {
  return poem.length;
}
